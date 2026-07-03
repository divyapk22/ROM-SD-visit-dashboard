/**
 * mapping.js
 * ---------------------------------------------------------------------------
 * MASTER STORE MAPPING CONFIGURATION
 * ---------------------------------------------------------------------------
 * Maintain the ROM (Regional Operations Manager), SD (Store Development /
 * store-in-charge) and store assignment here. This is the single source of
 * truth the dashboard uses to:
 *   - Identify which ROM owns a store
 *   - Identify which SD owns a store
 *   - Compute total stores assigned per ROM / per SD
 *   - Enrich every audit record coming from data.json with rom / sd fields
 *
 * TO ADD / EDIT / REMOVE A STORE:
 *   Add, edit or remove an object in the storeMapping array below.
 *   siteCode must be unique and must match the "Site Code" column used in
 *   the daily Excel audit report (compared as text, e.g. "THD8").
 *
 * No other file needs to change when the store list changes - every chart,
 * KPI, table and filter reads from this array automatically.
 * ---------------------------------------------------------------------------
 */

const storeMapping = [
  { rom: "Chetan", sd: "Subodh", siteCode: "T26L", siteName: "Kopa Pune" },
  { rom: "Chetan", sd: "Subodh", siteCode: "T2UO", siteName: "Wakad PUNE MOM" },
  { rom: "Divya Lakshmi", sd: "Sarath", siteCode: "T2WF", siteName: "Forum Kochi" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "T34O", siteName: "Citadel" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "T3AA", siteName: "Rajkot" },
  { rom: "Divya Lakshmi", sd: "Sarath", siteCode: "T42A", siteName: "Lulu Trivandrum" },
  { rom: "Shirish Mastud", sd: "Nasir Shaikh", siteCode: "T42C", siteName: "Goa Airport" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "T5PF", siteName: "Ahmd T1A" },
  { rom: "Divya Lakshmi", sd: "Damodharan", siteCode: "T61F", siteName: "PMC CHENNAI Play" },
  { rom: "Chetan", sd: "Subodh", siteCode: "T6AA", siteName: "PROZONE" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "T77X", siteName: "Palladium Ahmedabad" },
  { rom: "Divya Lakshmi", sd: "Damodharan", siteCode: "T7UJ", siteName: "Chennai T1A" },
  { rom: "Shirish Mastud", sd: "Sudhir", siteCode: "T7ZN", siteName: "R City Ghatkopar" },
  { rom: "Shirish Mastud", sd: "Almas", siteCode: "T8LI", siteName: "PMCK Kurla" },
  { rom: "Shirish Mastud", sd: "Almas", siteCode: "TB2N", siteName: "Palladium, Mumbai (Relocation)" },
  { rom: "Shirish Mastud", sd: "Almas", siteCode: "TB2O", siteName: "Rise-2, Palladium" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "TBIM", siteName: "Zora Mall" },
  { rom: "Shirish Mastud", sd: "Sudhir", siteCode: "TF5Y", siteName: "Oberoi Borivali" },
  { rom: "Divya Lakshmi", sd: "Divya Lakshmi", siteCode: "THD8", siteName: "Express Avenue Chennai" },
  { rom: "Shirish Mastud", sd: "Almas", siteCode: "THD9", siteName: "Infiniti Malad" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "THE2", siteName: "Alpha One Ahmedabad" },
  { rom: "Chetan", sd: "Subodh", siteCode: "THE4", siteName: "PMC Pune" },
  { rom: "Shirish Mastud", sd: "Sudhir", siteCode: "THE9", siteName: "Viviana Thane" },
  { rom: "Divya Lakshmi", sd: "Damodharan", siteCode: "THF0", siteName: "PMC Chennai" },
  { rom: "Divya Lakshmi", sd: "Damodharan", siteCode: "THF1", siteName: "Brookfields Coimbatore" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "THF4", siteName: "Quest Kolkatta" },
  { rom: "Shirish Mastud", sd: "Nasir Shaikh", siteCode: "THF6", siteName: "Mumbai T2D Airport" },
  { rom: "Divya Lakshmi", sd: "Divya Lakshmi", siteCode: "THG0", siteName: "Lulu Mall" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "THG2", siteName: "Treasure Island Indore" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "THG5", siteName: "Vadodara" },
  { rom: "Divya Lakshmi", sd: "Damodharan", siteCode: "THG7", siteName: "Forum Chennai" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "THG9", siteName: "DB City Bhopal" },
  { rom: "Shirish Mastud", sd: "Sudhir", siteCode: "THH8", siteName: "L&T Seawoods" },
  { rom: "Chetan", sd: "Subodh", siteCode: "THI2", siteName: "ICC Pune" },
  { rom: "Divya Lakshmi", sd: "Damodharan", siteCode: "THI3", siteName: "Prozone Coimbatore" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "THI5", siteName: "Vega Siliguri" },
  { rom: "Shirish Mastud", sd: "Nasir Shaikh", siteCode: "THI8", siteName: "Mumbai Airport T1 Arrival" },
  { rom: "Shirish Mastud", sd: "Sudhir", siteCode: "THI9", siteName: "Xperia Mall, Dombivali" },
  { rom: "Shirish Mastud", sd: "Sudhir", siteCode: "THJ2", siteName: "Oberoi Mall Mumbai" },
  { rom: "Shirish Mastud", sd: "Nasir Shaikh", siteCode: "THJ4", siteName: "Mumbai T2A" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "THK1", siteName: "VR Surat" },
  { rom: "Shirish Mastud", sd: "Nasir Shaikh", siteCode: "THM8", siteName: "Mall De Goa" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "THN2", siteName: "NUCLEUSMALL-JH" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "THN6", siteName: "Utkal Galleria Bhubaneshwar" },
  { rom: "Divya Lakshmi", sd: "Divya Lakshmi", siteCode: "THP1", siteName: "VR Chennai" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "THP2", siteName: "Indore C21" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "THQ0", siteName: "Ambuja Raipur" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "THQ3", siteName: "Forum Esplanadone Bhubn" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "THR3", siteName: "South City Mall" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "THS6", siteName: "Golden Icon" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "THS7", siteName: "City Centre Mall AS" },
  { rom: "Divya Lakshmi", sd: "Damodharan", siteCode: "TL6C", siteName: "Rowan Marina Mall- T4IS" },
  { rom: "Shirish Mastud", sd: "Virendra Rahevar", siteCode: "TL6N", siteName: "Rowan Jamnagar" },
  { rom: "Shirish Mastud", sd: "Sudhir", siteCode: "TLY7", siteName: "JWD Play" },
  { rom: "Shirish Mastud", sd: "Almas", siteCode: "TMA0", siteName: "H N Hospital" },
  { rom: "Divya Lakshmi", sd: "Sarath", siteCode: "TUW4", siteName: "Gokulam" },
  { rom: "Shirish Mastud", sd: "Sudhir", siteCode: "TY4T", siteName: "JWD" },
  { rom: "Divya Lakshmi", sd: "Sarath", siteCode: "TY7V", siteName: "Hilite" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "TZKY", siteName: "Guwahati Airport Arrival" },
  { rom: "Chetan", sd: "Manmohan", siteCode: "TZKZ", siteName: "Guwahati Airport Departure" }
];

// Business rule: total store count is fixed at 60 regardless of how many
// rows exist in the mapping table. Exposed separately so admin-generator.html
// can warn if the mapping table doesn't add up to 60.
const TOTAL_STORES_TARGET = 60;

/**
 * Finds the mapping row for a given site code.
 * @param {string|number} siteCode
 * @returns {object|null}
 */
function getStoreBySiteCode(siteCode) {
  const code = String(siteCode).trim();
  return storeMapping.find(function (s) { return String(s.siteCode).trim() === code; }) || null;
}

/** Returns the ROM name that owns a given site code, or "Unmapped". */
function getRomBySiteCode(siteCode) {
  const store = getStoreBySiteCode(siteCode);
  return store ? store.rom : "Unmapped";
}

/** Returns the SD name that owns a given site code, or "Unmapped". */
function getSdBySiteCode(siteCode) {
  const store = getStoreBySiteCode(siteCode);
  return store ? store.sd : "Unmapped";
}

/** Sorted, de-duplicated list of every ROM name in the mapping. */
function getAllRoms() {
  return Array.from(new Set(storeMapping.map(function (s) { return s.rom; }))).sort();
}

/** Sorted, de-duplicated list of every SD name in the mapping. */
function getAllSds() {
  return Array.from(new Set(storeMapping.map(function (s) { return s.sd; }))).sort();
}

/** Count of stores assigned to a given ROM. */
function countStoresByRom(rom) {
  return storeMapping.filter(function (s) { return s.rom === rom; }).length;
}

/** Count of stores assigned to a given SD. */
function countStoresBySd(sd) {
  return storeMapping.filter(function (s) { return s.sd === sd; }).length;
}

/** All mapping rows belonging to a given ROM. */
function getStoresByRom(rom) {
  return storeMapping.filter(function (s) { return s.rom === rom; });
}

/** All mapping rows belonging to a given SD. */
function getStoresBySd(sd) {
  return storeMapping.filter(function (s) { return s.sd === sd; });
}

// Expose on window for browser use (plain script tags, no bundler/build step).
if (typeof window !== "undefined") {
  window.storeMapping = storeMapping;
  window.TOTAL_STORES_TARGET = TOTAL_STORES_TARGET;
  window.getStoreBySiteCode = getStoreBySiteCode;
  window.getRomBySiteCode = getRomBySiteCode;
  window.getSdBySiteCode = getSdBySiteCode;
  window.getAllRoms = getAllRoms;
  window.getAllSds = getAllSds;
  window.countStoresByRom = countStoresByRom;
  window.countStoresBySd = countStoresBySd;
  window.getStoresByRom = getStoresByRom;
  window.getStoresBySd = getStoresBySd;
}
