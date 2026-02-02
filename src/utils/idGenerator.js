/**
 * LYT Communications - Two-Tier ID Generator
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Generates and converts between internal IDs (database) and 
 * contractor IDs (map/mobile display).
 * 
 * Internal format: {CUSTOMER}-{MARKET}{BUILD}-{TYPE}-{SECTION}-{LOCATION}
 * Example: VXS-SLPH01-006-BOR-A-A01
 * 
 * Contractor format: Simple segment notation matching construction map
 * Example: A→A01
 */

/**
 * Generate an internal project ID from project metadata
 * @param {string} customer - Customer code (VXS, MET, etc.)
 * @param {string} market - Market code (SLPH01, HTLA02, etc.)
 * @param {string} buildNum - Build number (006, 015, etc.)
 * @returns {string} Project ID like VXS-SLPH01-006
 */
export function generateProjectID(customer, market, buildNum) {
  const custCode = customer.toUpperCase().substring(0, 3);
  const mkt = market.toUpperCase();
  const build = String(buildNum).padStart(3, '0');
  return `${custCode}-${mkt}-${build}`;
}

/**
 * Generate an internal segment ID
 * @param {string} projectID - Project ID (VXS-SLPH01-006)
 * @param {string} workType - Work type (BOR, PULL, SPL)
 * @param {string} section - Section letter (A, B, C, etc.)
 * @param {string} location - Location ID (A01, B03, etc.)
 * @returns {string} Segment ID like VXS-SLPH01-006-BOR-A-A01
 */
export function generateSegmentID(projectID, workType, section, location) {
  return `${projectID}-${workType.toUpperCase()}-${section}-${location}`;
}

/**
 * Generate a splice point ID
 * @param {string} projectID - Project ID (VXS-SLPH01-006)
 * @param {string} location - Location ID (A01, F1-ENTRY, etc.)
 * @returns {string} Splice ID like VXS-SLPH01-006-SPL-A01
 */
export function generateSpliceID(projectID, location) {
  return `${projectID}-SPL-${location}`;
}

/**
 * Generate an assignment ID
 * @returns {string} Assignment ID like ASGN-12345
 */
export function generateAssignmentID() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `ASGN-${num}`;
}

/**
 * Convert internal segment ID to contractor-friendly display ID
 * @param {string} internalID - Internal ID (VXS-SLPH01-006-BOR-A-A01)
 * @returns {string} Contractor ID like A→A01
 */
export function toContractorID(internalID) {
  const parts = internalID.split('-');
  if (parts.length < 6) return internalID;
  const section = parts[parts.length - 2];
  const location = parts[parts.length - 1];
  return `${section}→${location}`;
}

/**
 * Convert contractor ID back to internal ID
 * @param {string} contractorID - Contractor display ID (A→A01)
 * @param {string} projectCode - Project code (VXS-SLPH01-006)
 * @param {string} workType - Work type (BOR, PULL, SPL)
 * @returns {string} Internal ID like VXS-SLPH01-006-BOR-A-A01
 */
export function toInternalID(contractorID, projectCode, workType) {
  const parts = contractorID.split('→');
  if (parts.length !== 2) return contractorID;
  const [from, to] = parts;
  return `${projectCode}-${workType}-${from}-${to}`;
}

/**
 * Parse an internal ID into its component parts
 * @param {string} internalID - Any internal ID
 * @returns {object} Parsed components
 */
export function parseInternalID(internalID) {
  const parts = internalID.split('-');
  if (parts.length < 3) return { raw: internalID };
  
  return {
    customer: parts[0],
    market: parts[1],
    build: parts[2],
    projectCode: parts.slice(0, 3).join('-'),
    workType: parts[3] || null,
    section: parts[4] || null,
    location: parts[5] || null,
    raw: internalID,
  };
}

/**
 * Generate a unique work log ID
 * @returns {string} Log ID with timestamp
 */
export function generateLogID() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LOG-${ts}-${rand}`;
}

/**
 * Generate a unique issue ID
 * @returns {string} Issue ID
 */
export function generateIssueID() {
  const ts = Date.now();
  return `ISS-${ts}`;
}

/**
 * Customer code mapping
 */
export const CUSTOMER_CODES = {
  'Vexus Fiber': 'VXS',
  'Vexus': 'VXS',
  'Metronet': 'MET',
  'AT&T': 'ATT',
  'Lumen': 'LMN',
  'Windstream': 'WIN',
};

/**
 * Work type code mapping
 */
export const WORK_TYPE_CODES = {
  boring: 'BOR',
  pulling: 'PULL',
  splicing: 'SPL',
  aerial: 'AER',
};

// v1.0.0
