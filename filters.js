/**
 * filters.js
 * ---------------------------------------------------------------------------
 * Populates and applies the sticky filter bar:
 *   Date, Month, ROM, SD, Site Name, Site Code, Type of Visit, Checklist
 *
 * Selecting any filter instantly re-filters window.DASH.state.allRecords
 * into window.DASH.state.filteredRecords and calls DASH.renderAll(), which
 * refreshes KPIs, all charts and all three tables in one pass.
 * ---------------------------------------------------------------------------
 */

window.DASH = window.DASH || {};

(function (DASH) {
  "use strict";

  DASH.filters = {
    values: {
      date: "",
      month: "",
      rom: "",
      sd: "",
      siteName: "",
      siteCode: "",
      visitType: "",
      checklist: ""
    }
  };

  /**
   * Fills every <select> in the filter bar with the distinct values found
   * in the enriched records (and, for ROM/SD/Site, from the master mapping
   * so that stores with zero visits still appear as filter options).
   */
  DASH.filters.populate = function (records) {
    const roms = (typeof getAllRoms === "function") ? getAllRoms() : uniqueSorted(records, "rom");
    const sds = (typeof getAllSds === "function") ? getAllSds() : uniqueSorted(records, "sd");
    const siteNames = uniqueSorted(storeMapping || [], "siteName");
    const siteCodes = uniqueSorted(storeMapping || [], "siteCode");
    const visitTypes = uniqueSorted(records, "visitType");
    const checklists = uniqueSorted(records, "checklist");

    fillSelect("filter-rom", roms);
    fillSelect("filter-sd", sds);
    fillSelect("filter-site-name", siteNames);
    fillSelect("filter-site-code", siteCodes);
    fillSelect("filter-visit-type", visitTypes);
    fillSelect("filter-checklist", checklists);
  };

  function uniqueSorted(arr, key) {
    return Array.from(new Set(arr.map(o => o[key]).filter(Boolean))).sort();
  }

  function fillSelect(id, options) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    el.innerHTML = '<option value="">All</option>' + options.map(o =>
      `<option value="${escapeAttr(o)}">${escapeAttr(o)}</option>`
    ).join("");
    if (options.includes(current)) el.value = current;
  }

  function escapeAttr(v) {
    return String(v).replace(/"/g, "&quot;");
  }

  /**
   * Reads all filter inputs, applies them to allRecords, stores the result
   * in DASH.state.filteredRecords, and triggers a full re-render.
   */
  DASH.filters.apply = function () {
    const v = DASH.filters.values;
    v.date = getVal("filter-date");
    v.month = getVal("filter-month");
    v.rom = getVal("filter-rom");
    v.sd = getVal("filter-sd");
    v.siteName = getVal("filter-site-name");
    v.siteCode = getVal("filter-site-code");
    v.visitType = getVal("filter-visit-type");
    v.checklist = getVal("filter-checklist");

    let rows = DASH.state.allRecords;

    if (v.date) rows = rows.filter(r => r.visitDate === v.date);
    // Month filter only applies when an exact date isn't already selected.
    if (!v.date && v.month) rows = rows.filter(r => r.month === v.month);
    if (v.rom) rows = rows.filter(r => r.rom === v.rom);
    if (v.sd) rows = rows.filter(r => r.sd === v.sd);
    if (v.siteName) rows = rows.filter(r => r.siteName === v.siteName);
    if (v.siteCode) rows = rows.filter(r => r.siteCode === v.siteCode);
    if (v.visitType) rows = rows.filter(r => r.visitType === v.visitType);
    if (v.checklist) rows = rows.filter(r => r.checklist === v.checklist);

    DASH.state.filteredRecords = rows;
    updateActiveFilterCount();
    DASH.renderAll();
  };

  DASH.filters.reset = function () {
    ["filter-date", "filter-month", "filter-rom", "filter-sd", "filter-site-name",
      "filter-site-code", "filter-visit-type", "filter-checklist"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    DASH.filters.apply();
  };

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  function updateActiveFilterCount() {
    const v = DASH.filters.values;
    const activeCount = Object.values(v).filter(Boolean).length;
    const badge = document.getElementById("active-filter-badge");
    if (badge) {
      badge.textContent = activeCount > 0 ? activeCount + " active" : "No filters applied";
    }
  }

  // Wire up change listeners once DOM is ready.
  document.addEventListener("DOMContentLoaded", function () {
    ["filter-date", "filter-month", "filter-rom", "filter-sd", "filter-site-name",
      "filter-site-code", "filter-visit-type", "filter-checklist"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", DASH.filters.apply);
    });

    const resetBtn = document.getElementById("filter-reset-btn");
    if (resetBtn) resetBtn.addEventListener("click", DASH.filters.reset);
  });
})(window.DASH);
