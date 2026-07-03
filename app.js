/**
 * app.js
 * ---------------------------------------------------------------------------
 * Core application logic for the Live Retail Audit Dashboard (index.html).
 * Responsibilities:
 *   - Load data.json and enrich each record with ROM / SD via mapping.js
 *   - Compute all KPI figures
 *   - Render KPI cards, and the three data tables
 *   - Provide search / sort / export-to-Excel for the tables
 *   - Provide PDF export / print / loading / toast error handling
 *
 * Global namespace: window.DASH
 * charts.js and filters.js both read/write window.DASH.state and call
 * window.DASH.renderAll() to refresh the UI after a filter change.
 * ---------------------------------------------------------------------------
 */

window.DASH = window.DASH || {};

(function (DASH) {
  "use strict";

  const TOTAL_STORES = (typeof TOTAL_STORES_TARGET !== "undefined") ? TOTAL_STORES_TARGET : 60;

  DASH.state = {
    allRecords: [],        // every record from data.json, enriched with rom/sd
    filteredRecords: [],   // records after sidebar/filter-bar filters are applied
    dataMeta: { lastUpdated: null, totalStoresConfigured: TOTAL_STORES },
    tableSearch: "",
    tableSort: { column: "visitDate", dir: "desc" },
    romSort: { column: "completionPct", dir: "desc" },
    sdSort: { column: "completionPct", dir: "desc" }
  };

  /* ---------------------------------------------------------------------
   * Utilities
   * ------------------------------------------------------------------- */
  const utils = {
    escapeHtml(str) {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },
    formatDate(dateStr) {
      if (!dateStr) return "-";
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    },
    formatDateTime(iso) {
      if (!iso) return "-";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
    },
    scoreClass(score) {
      if (score >= 85) return "high";
      if (score >= 70) return "mid";
      return "low";
    },
    round1(n) { return Math.round(n * 10) / 10; },
    debounce(fn, wait) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    },
    downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  };
  DASH.utils = utils;

  /* ---------------------------------------------------------------------
   * Loading overlay / toast / error banner helpers
   * ------------------------------------------------------------------- */
  DASH.setLoading = function (isLoading) {
    const el = document.getElementById("loading-overlay");
    if (!el) return;
    if (isLoading) el.classList.remove("hidden");
    else el.classList.add("hidden");
  };

  DASH.showToast = function (message, type) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast " + (type || "");
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
  };

  DASH.showFatalError = function (message) {
    const el = document.getElementById("fatal-error-banner");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
  };

  /* ---------------------------------------------------------------------
   * Data loading + enrichment
   * ------------------------------------------------------------------- */
  DASH.init = async function () {
    DASH.setLoading(true);
    try {
      // Cache-bust so GitHub Pages / browsers always pick up the latest
      // data.json after the admin replaces it.
      const res = await fetch("data.json?_=" + Date.now());
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();

      if (!json || !Array.isArray(json.records)) {
        throw new Error("data.json is missing a valid 'records' array.");
      }

      DASH.state.dataMeta.lastUpdated = json.lastUpdated || null;
      DASH.state.dataMeta.totalStoresConfigured = json.totalStoresConfigured || TOTAL_STORES;

      DASH.state.allRecords = json.records.map(enrichRecord);
      DASH.state.filteredRecords = DASH.state.allRecords.slice();

      DASH.filters.populate(DASH.state.allRecords);
      renderLastUpdated();
      DASH.renderAll();
    } catch (err) {
      console.error(err);
      DASH.showFatalError(
        "Unable to load data.json. Make sure the file exists in the project root and is valid JSON. (" + err.message + ")"
      );
      DASH.showToast("Failed to load dashboard data.", "error");
    } finally {
      DASH.setLoading(false);
    }
  };

  function enrichRecord(r) {
    const siteCode = String(r.siteCode !== undefined ? r.siteCode : "").trim();
    const mapped = (typeof getStoreBySiteCode === "function") ? getStoreBySiteCode(siteCode) : null;
    return {
      visitId: r.visitId,
      visitDate: r.visitDate || "",
      visitType: r.visitType || "Unspecified",
      siteCode: siteCode,
      siteName: r.siteName || (mapped ? mapped.siteName : "Unknown Site"),
      checklist: r.checklist || "Unspecified",
      visitedBy: r.visitedBy || "Unspecified",
      visitScore: Number(r.visitScore) || 0,
      rom: mapped ? mapped.rom : "Unmapped",
      sd: mapped ? mapped.sd : "Unmapped",
      month: (r.visitDate || "").slice(0, 7) // YYYY-MM
    };
  }

  function renderLastUpdated() {
    const el = document.getElementById("last-updated-text");
    if (!el) return;
    el.textContent = DASH.state.dataMeta.lastUpdated
      ? "Last updated: " + utils.formatDateTime(DASH.state.dataMeta.lastUpdated)
      : "Last updated: unknown";
  }

  /* ---------------------------------------------------------------------
   * KPI computation
   * ------------------------------------------------------------------- */
  DASH.computeKPIs = function (records) {
    const totalStores = TOTAL_STORES;
    const visitedSet = new Set(records.map(r => r.siteCode).filter(Boolean));
    const storesVisited = Math.min(visitedSet.size, totalStores);
    const storesPending = Math.max(totalStores - storesVisited, 0);
    const completionPct = totalStores > 0 ? (storesVisited / totalStores) * 100 : 0;
    const avgScore = records.length
      ? records.reduce((sum, r) => sum + r.visitScore, 0) / records.length
      : 0;
    const totalRoms = (typeof getAllRoms === "function") ? getAllRoms().length : 0;
    const totalSds = (typeof getAllSds === "function") ? getAllSds().length : 0;

    return {
      totalStores,
      storesVisited,
      storesPending,
      completionPct: utils.round1(completionPct),
      avgScore: utils.round1(avgScore),
      totalAudits: records.length,
      totalRoms,
      totalSds
    };
  };

  DASH.renderKPIs = function (kpis) {
    setText("kpi-total-stores", kpis.totalStores);
    setText("kpi-stores-visited", kpis.storesVisited);
    setText("kpi-stores-pending", kpis.storesPending);
    setText("kpi-completion", kpis.completionPct + "%");
    setText("kpi-avg-score", kpis.avgScore + "%");
    setText("kpi-total-audits", kpis.totalAudits);
    setText("kpi-total-roms", kpis.totalRoms);
    setText("kpi-total-sds", kpis.totalSds);
  };

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ---------------------------------------------------------------------
   * ROM / SD performance tables
   * ------------------------------------------------------------------- */
  DASH.computeRomPerformance = function (records) {
    const roms = (typeof getAllRoms === "function") ? getAllRoms() : [];
    return roms.map(rom => {
      const assigned = countStoresByRom(rom);
      const romRecords = records.filter(r => r.rom === rom);
      const visitedSet = new Set(romRecords.map(r => r.siteCode));
      const visited = visitedSet.size;
      const pending = Math.max(assigned - visited, 0);
      const completionPct = assigned > 0 ? (visited / assigned) * 100 : 0;
      const avgScore = romRecords.length
        ? romRecords.reduce((s, r) => s + r.visitScore, 0) / romRecords.length
        : 0;
      return {
        name: rom,
        assigned,
        visited,
        pending,
        completionPct: utils.round1(completionPct),
        avgScore: utils.round1(avgScore)
      };
    });
  };

  DASH.computeSdPerformance = function (records) {
    const sds = (typeof getAllSds === "function") ? getAllSds() : [];
    return sds.map(sd => {
      const assigned = countStoresBySd(sd);
      const sdRecords = records.filter(r => r.sd === sd);
      const visitedSet = new Set(sdRecords.map(r => r.siteCode));
      const visited = visitedSet.size;
      const pending = Math.max(assigned - visited, 0);
      const completionPct = assigned > 0 ? (visited / assigned) * 100 : 0;
      const avgScore = sdRecords.length
        ? sdRecords.reduce((s, r) => s + r.visitScore, 0) / sdRecords.length
        : 0;
      return {
        name: sd,
        assigned,
        visited,
        pending,
        completionPct: utils.round1(completionPct),
        avgScore: utils.round1(avgScore)
      };
    });
  };

  function sortRows(rows, sortState, columnMap) {
    const { column, dir } = sortState;
    const key = columnMap[column] || column;
    const sorted = rows.slice().sort((a, b) => {
      let va = a[key], vb = b[key];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  DASH.renderRomTable = function (records) {
    const rows = sortRows(DASH.computeRomPerformance(records), DASH.state.romSort, {});
    const tbody = document.getElementById("rom-table-body");
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">No ROM data available.</div></td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><strong>${utils.escapeHtml(r.name)}</strong></td>
        <td>${r.assigned}</td>
        <td>${r.visited}</td>
        <td>${r.pending}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="progress-bar" style="width:80px;"><span style="width:${r.completionPct}%;"></span></div>
            <span>${r.completionPct}%</span>
          </div>
        </td>
        <td><span class="score-pill ${utils.scoreClass(r.avgScore)}">${r.avgScore}%</span></td>
      </tr>
    `).join("");
  };

  DASH.renderSdTable = function (records) {
    const rows = sortRows(DASH.computeSdPerformance(records), DASH.state.sdSort, {});
    const tbody = document.getElementById("sd-table-body");
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">No SD data available.</div></td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><strong>${utils.escapeHtml(r.name)}</strong></td>
        <td>${r.assigned}</td>
        <td>${r.visited}</td>
        <td>${r.pending}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="progress-bar" style="width:80px;"><span style="width:${r.completionPct}%;"></span></div>
            <span>${r.completionPct}%</span>
          </div>
        </td>
        <td><span class="score-pill ${utils.scoreClass(r.avgScore)}">${r.avgScore}%</span></td>
      </tr>
    `).join("");
  };

  /* ---------------------------------------------------------------------
   * Store Visit Details table (search + sort + export)
   * ------------------------------------------------------------------- */
  DASH.renderVisitsTable = function (records) {
    let rows = records;
    const q = DASH.state.tableSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter(r =>
        (r.siteName || "").toLowerCase().includes(q) ||
        (r.siteCode || "").toLowerCase().includes(q) ||
        (r.rom || "").toLowerCase().includes(q) ||
        (r.sd || "").toLowerCase().includes(q) ||
        (r.visitType || "").toLowerCase().includes(q) ||
        (r.checklist || "").toLowerCase().includes(q) ||
        (r.visitedBy || "").toLowerCase().includes(q)
      );
    }
    rows = sortRows(rows, DASH.state.tableSort, {});

    const tbody = document.getElementById("visits-table-body");
    const countEl = document.getElementById("visits-table-count");
    if (countEl) countEl.textContent = rows.length + " record(s)";
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state">No visit records match the current filters.</div></td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${utils.formatDate(r.visitDate)}</td>
        <td>${utils.escapeHtml(r.siteCode)}</td>
        <td>${utils.escapeHtml(r.siteName)}</td>
        <td>${utils.escapeHtml(r.rom)}</td>
        <td>${utils.escapeHtml(r.sd)}</td>
        <td>${utils.escapeHtml(r.visitType)}</td>
        <td>${utils.escapeHtml(r.checklist)}</td>
        <td><span class="score-pill ${utils.scoreClass(r.visitScore)}">${r.visitScore}%</span></td>
      </tr>
    `).join("");

    DASH._lastVisitsRows = rows; // cached for export
  };

  /* Sorting handlers wired from index.html via onclick attributes */
  DASH.sortVisitsTable = function (column) {
    const s = DASH.state.tableSort;
    s.dir = (s.column === column && s.dir === "asc") ? "desc" : "asc";
    s.column = column;
    updateSortIndicators("visits-table", column, s.dir);
    DASH.renderVisitsTable(DASH.state.filteredRecords);
  };
  DASH.sortRomTable = function (column) {
    const s = DASH.state.romSort;
    s.dir = (s.column === column && s.dir === "asc") ? "desc" : "asc";
    s.column = column;
    updateSortIndicators("rom-table", column, s.dir);
    DASH.renderRomTable(DASH.state.filteredRecords);
  };
  DASH.sortSdTable = function (column) {
    const s = DASH.state.sdSort;
    s.dir = (s.column === column && s.dir === "asc") ? "desc" : "asc";
    s.column = column;
    updateSortIndicators("sd-table", column, s.dir);
    DASH.renderSdTable(DASH.state.filteredRecords);
  };

  function updateSortIndicators(tableId, column, dir) {
    const table = document.getElementById(tableId);
    if (!table) return;
    table.querySelectorAll("th[data-col]").forEach(th => {
      th.classList.remove("sorted");
      const arrow = th.querySelector(".sort-arrow");
      if (th.getAttribute("data-col") === column) {
        th.classList.add("sorted");
        if (arrow) arrow.textContent = dir === "asc" ? "▲" : "▼";
      } else if (arrow) {
        arrow.textContent = "▲▼";
      }
    });
  }

  DASH.onTableSearch = utils.debounce(function (value) {
    DASH.state.tableSearch = value;
    DASH.renderVisitsTable(DASH.state.filteredRecords);
  }, 200);

  /* ---------------------------------------------------------------------
   * Export helpers (SheetJS)
   * ------------------------------------------------------------------- */
  DASH.exportVisitsToExcel = function () {
    exportRowsToExcel(
      DASH._lastVisitsRows || DASH.state.filteredRecords,
      ["visitDate", "siteCode", "siteName", "rom", "sd", "visitType", "checklist", "visitScore"],
      ["Visit Date", "Site Code", "Site Name", "ROM", "SD", "Visit Type", "Checklist", "Visit Score"],
      "Store_Visit_Details.xlsx"
    );
  };

  DASH.exportRomToExcel = function () {
    exportRowsToExcel(
      DASH.computeRomPerformance(DASH.state.filteredRecords),
      ["name", "assigned", "visited", "pending", "completionPct", "avgScore"],
      ["ROM", "Assigned Stores", "Visited Stores", "Pending Stores", "Completion %", "Average Score"],
      "ROM_Performance.xlsx"
    );
  };

  DASH.exportSdToExcel = function () {
    exportRowsToExcel(
      DASH.computeSdPerformance(DASH.state.filteredRecords),
      ["name", "assigned", "visited", "pending", "completionPct", "avgScore"],
      ["SD", "Assigned Stores", "Visited Stores", "Pending Stores", "Completion %", "Average Score"],
      "SD_Performance.xlsx"
    );
  };

  function exportRowsToExcel(rows, keys, headers, filename) {
    if (typeof XLSX === "undefined") {
      DASH.showToast("Excel export library not available.", "error");
      return;
    }
    try {
      const aoa = [headers].concat(rows.map(r => keys.map(k => r[k])));
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, filename);
      DASH.showToast("Exported " + filename, "success");
    } catch (err) {
      console.error(err);
      DASH.showToast("Export failed: " + err.message, "error");
    }
  }

  /* ---------------------------------------------------------------------
   * PDF export & print
   * ------------------------------------------------------------------- */
  DASH.printDashboard = function () {
    window.print();
  };

  DASH.exportDashboardToPdf = async function () {
    if (typeof html2canvas === "undefined" || typeof window.jspdf === "undefined") {
      DASH.showToast("PDF export library not available. Try Print instead.", "error");
      return;
    }
    DASH.setLoading(true);
    try {
      const target = document.getElementById("dashboard-content");
      const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("Retail_Audit_Dashboard_" + new Date().toISOString().slice(0, 10) + ".pdf");
      DASH.showToast("Dashboard exported to PDF.", "success");
    } catch (err) {
      console.error(err);
      DASH.showToast("PDF export failed: " + err.message, "error");
    } finally {
      DASH.setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------
   * Master render - called by filters.js whenever a filter changes
   * ------------------------------------------------------------------- */
  DASH.renderAll = function () {
    const records = DASH.state.filteredRecords;
    const kpis = DASH.computeKPIs(records);
    DASH.renderKPIs(kpis);
    DASH.renderVisitsTable(records);
    DASH.renderRomTable(records);
    DASH.renderSdTable(records);
    if (DASH.charts && typeof DASH.charts.renderAll === "function") {
      DASH.charts.renderAll(records);
    }
  };

  document.addEventListener("DOMContentLoaded", DASH.init);
})(window.DASH);
