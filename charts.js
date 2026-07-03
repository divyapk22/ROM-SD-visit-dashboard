/**
 * charts.js
 * ---------------------------------------------------------------------------
 * Builds and refreshes all 8 Chart.js visualisations on the live dashboard.
 * Every chart is rebuilt (destroy + recreate) whenever DASH.renderAll() runs,
 * which keeps this module simple and guarantees charts always reflect the
 * current filtered record set with a smooth animated transition.
 *
 * Uses the chartjs-plugin-datalabels plugin (loaded in index.html) so every
 * bar / slice shows its value directly on the chart, not just on hover.
 * ---------------------------------------------------------------------------
 */

window.DASH = window.DASH || {};

(function (DASH) {
  "use strict";

  // Register the data-labels plugin globally once, if it loaded successfully.
  if (typeof Chart !== "undefined" && typeof ChartDataLabels !== "undefined") {
    Chart.register(ChartDataLabels);
  }

  const PALETTE = {
    primary: "#2563eb",
    primaryLight: "#93c5fd",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    grey: "#94a3b8",
    multi: ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#ea580c", "#4f46e5"]
  };

  const registry = {}; // chartId -> Chart instance

  function destroyIfExists(id) {
    if (registry[id]) {
      registry[id].destroy();
      delete registry[id];
    }
  }

  function baseOptions(overrides) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650, easing: "easeOutQuart" },
      layout: { padding: { top: 22 } },
      plugins: {
        legend: { display: true, position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          backgroundColor: "#1f2937",
          padding: 10,
          titleFont: { size: 12, weight: "bold" },
          bodyFont: { size: 12 },
          cornerRadius: 6
        },
        datalabels: { display: false } // opt-in per chart below
      }
    }, overrides || {});
  }

  // Shared datalabel style for vertical bar charts (label above each bar).
  function percentLabelsVertical(color) {
    return {
      display: true,
      anchor: "end",
      align: "top",
      offset: 2,
      color: color || "#1f2937",
      font: { weight: "700", size: 11 },
      formatter: (value) => value + "%"
    };
  }

  // Shared datalabel style for horizontal bar charts (label to the right of each bar).
  function percentLabelsHorizontal(color) {
    return {
      display: true,
      anchor: "end",
      align: "right",
      offset: 4,
      color: color || "#1f2937",
      font: { weight: "700", size: 11 },
      formatter: (value) => value + "%"
    };
  }

  function makeChart(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    destroyIfExists(id);
    registry[id] = new Chart(canvas.getContext("2d"), config);
  }

  function groupBy(arr, keyFn) {
    const map = new Map();
    arr.forEach(item => {
      const k = keyFn(item);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    });
    return map;
  }

  function avg(arr, fn) {
    if (!arr.length) return 0;
    return arr.reduce((s, x) => s + fn(x), 0) / arr.length;
  }

  /* ---------------------------------------------------------------------
   * 1. Overall Visit Completion (doughnut: visited vs pending out of 60)
   * ------------------------------------------------------------------- */
  function renderOverallCompletion(records) {
    const kpis = DASH.computeKPIs(records);
    makeChart("chart-overall-completion", {
      type: "doughnut",
      data: {
        labels: ["Visited", "Pending"],
        datasets: [{
          data: [kpis.storesVisited, kpis.storesPending],
          backgroundColor: [PALETTE.primary, "#e2e8f0"],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: baseOptions({
        cutout: "72%",
        layout: { padding: 8 },
        plugins: {
          legend: { position: "bottom" },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} stores` } },
          datalabels: {
            display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0,
            color: (ctx) => (ctx.dataIndex === 0 ? "#ffffff" : "#1f2937"),
            font: { weight: "700", size: 13 },
            formatter: (value) => value
          }
        }
      })
    });
  }

  /* ---------------------------------------------------------------------
   * 2. ROM-wise Visit Completion (bar %)
   * ------------------------------------------------------------------- */
  function renderRomCompletion(records) {
    const rows = DASH.computeRomPerformance(records);
    makeChart("chart-rom-completion", {
      type: "bar",
      data: {
        labels: rows.map(r => r.name),
        datasets: [{
          label: "Completion %",
          data: rows.map(r => r.completionPct),
          backgroundColor: PALETTE.primary,
          borderRadius: 6,
          maxBarThickness: 34
        }]
      },
      options: baseOptions({
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ctx.raw + "% complete" } },
          datalabels: percentLabelsVertical(PALETTE.primary)
        },
        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" } } }
      })
    });
  }

  /* ---------------------------------------------------------------------
   * 3. SD-wise Visit Completion (bar %)
   * ------------------------------------------------------------------- */
  function renderSdCompletion(records) {
    const rows = DASH.computeSdPerformance(records);
    makeChart("chart-sd-completion", {
      type: "bar",
      data: {
        labels: rows.map(r => r.name),
        datasets: [{
          label: "Completion %",
          data: rows.map(r => r.completionPct),
          backgroundColor: PALETTE.success,
          borderRadius: 6,
          maxBarThickness: 30
        }]
      },
      options: baseOptions({
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ctx.raw + "% complete" } },
          datalabels: percentLabelsVertical(PALETTE.success)
        },
        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" } } }
      })
    });
  }

  /* ---------------------------------------------------------------------
   * 4. Average Visit Score by ROM
   * ------------------------------------------------------------------- */
  function renderRomAvgScore(records) {
    const rows = DASH.computeRomPerformance(records);
    makeChart("chart-rom-avg-score", {
      type: "bar",
      data: {
        labels: rows.map(r => r.name),
        datasets: [{
          label: "Average Score",
          data: rows.map(r => r.avgScore),
          backgroundColor: PALETTE.warning,
          borderRadius: 6,
          maxBarThickness: 34
        }]
      },
      options: baseOptions({
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ctx.raw + "% avg score" } },
          datalabels: percentLabelsVertical(PALETTE.warning)
        },
        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" } } }
      })
    });
  }

  /* ---------------------------------------------------------------------
   * 5. Average Visit Score by SD
   * ------------------------------------------------------------------- */
  function renderSdAvgScore(records) {
    const rows = DASH.computeSdPerformance(records);
    makeChart("chart-sd-avg-score", {
      type: "bar",
      data: {
        labels: rows.map(r => r.name),
        datasets: [{
          label: "Average Score",
          data: rows.map(r => r.avgScore),
          backgroundColor: "#7c3aed",
          borderRadius: 6,
          maxBarThickness: 30
        }]
      },
      options: baseOptions({
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ctx.raw + "% avg score" } },
          datalabels: percentLabelsVertical("#7c3aed")
        },
        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" } } }
      })
    });
  }

  /* ---------------------------------------------------------------------
   * 6. Visit Type Distribution (pie)
   * ------------------------------------------------------------------- */
  function renderVisitTypeDistribution(records) {
    const byType = groupBy(records, r => r.visitType);
    const labels = Array.from(byType.keys());
    makeChart("chart-visit-type", {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data: labels.map(l => byType.get(l).length),
          backgroundColor: PALETTE.multi,
          borderWidth: 1,
          borderColor: "#fff"
        }]
      },
      options: baseOptions({
        layout: { padding: 8 },
        plugins: {
          legend: { position: "bottom" },
          datalabels: {
            display: true,
            color: "#ffffff",
            font: { weight: "700", size: 12 },
            formatter: (value) => value
          }
        }
      })
    });
  }

  /* ---------------------------------------------------------------------
   * 7 & 8. Top 10 Highest / Lowest Scoring Stores
   *   Aggregated by store (average score across all its visits in the
   *   current filtered set).
   * ------------------------------------------------------------------- */
  function storeAverages(records) {
    const byStore = groupBy(records, r => r.siteCode);
    return Array.from(byStore.entries()).map(([siteCode, rows]) => ({
      siteCode,
      siteName: rows[0].siteName,
      avgScore: DASH.utils.round1(avg(rows, r => r.visitScore))
    }));
  }

  function renderTopStores(records) {
    const stores = storeAverages(records).sort((a, b) => b.avgScore - a.avgScore).slice(0, 10);
    makeChart("chart-top-stores", {
      type: "bar",
      data: {
        labels: stores.map(s => s.siteName),
        datasets: [{
          label: "Average Score",
          data: stores.map(s => s.avgScore),
          backgroundColor: PALETTE.success,
          borderRadius: 6,
          maxBarThickness: 22
        }]
      },
      options: baseOptions({
        indexAxis: "y",
        layout: { padding: { top: 8, right: 34 } },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ctx.raw + "% avg score" } },
          datalabels: percentLabelsHorizontal(PALETTE.success)
        },
        scales: { x: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" } } }
      })
    });
  }

  function renderLowStores(records) {
    const stores = storeAverages(records).sort((a, b) => a.avgScore - b.avgScore).slice(0, 10);
    makeChart("chart-low-stores", {
      type: "bar",
      data: {
        labels: stores.map(s => s.siteName),
        datasets: [{
          label: "Average Score",
          data: stores.map(s => s.avgScore),
          backgroundColor: PALETTE.danger,
          borderRadius: 6,
          maxBarThickness: 22
        }]
      },
      options: baseOptions({
        indexAxis: "y",
        layout: { padding: { top: 8, right: 34 } },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ctx.raw + "% avg score" } },
          datalabels: percentLabelsHorizontal(PALETTE.danger)
        },
        scales: { x: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" } } }
      })
    });
  }

  /* ---------------------------------------------------------------------
   * Public entry point - called by DASH.renderAll()
   * ------------------------------------------------------------------- */
  DASH.charts = DASH.charts || {};
  DASH.charts.renderAll = function (records) {
    if (typeof Chart === "undefined") {
      console.warn("Chart.js not loaded; skipping chart rendering.");
      return;
    }
    renderOverallCompletion(records);
    renderRomCompletion(records);
    renderSdCompletion(records);
    renderRomAvgScore(records);
    renderSdAvgScore(records);
    renderVisitTypeDistribution(records);
    renderTopStores(records);
    renderLowStores(records);
  };
})(window.DASH);
