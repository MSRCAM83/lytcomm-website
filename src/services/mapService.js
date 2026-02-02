/**
 * LYT Communications - Map Data Service
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Handles map data processing, segment management,
 * and integration with Google Sheets database via
 * the Claude Gateway Apps Script.
 */

import { STATUS_COLORS } from '../config/mapConfig';

const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbwiq8NzgdUQ6Hu44NHN3ASdAYTd68uK6wGRK_CpJroSoiMuv66aRmPAzDxmtXexl6MK/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';

/**
 * Read data from a Google Sheet via Gateway
 * @param {string} sheetId - Google Sheet ID
 * @param {string} sheetName - Tab/sheet name
 * @param {string} range - Cell range (e.g., 'A1:Z1000')
 * @returns {Promise<any[][]>} 2D array of values
 */
export async function readSheet(sheetId, sheetName, range) {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        sheetId,
        sheetName,
        range,
      }),
    });
    const data = await response.json();
    if (data.success) return data.data || [];
    console.error('Sheet read error:', data.error);
    return [];
  } catch (err) {
    console.error('Sheet read failed:', err);
    return [];
  }
}

/**
 * Write data to a Google Sheet via Gateway
 * @param {string} sheetId - Google Sheet ID
 * @param {string} sheetName - Tab/sheet name
 * @param {string} range - Cell range
 * @param {any[][]} values - 2D array of values to write
 * @returns {Promise<boolean>} Success status
 */
export async function writeSheet(sheetId, sheetName, range, values) {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'sheetsWrite',
        sheetId,
        sheetName,
        range,
        values,
      }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (err) {
    console.error('Sheet write failed:', err);
    return false;
  }
}

/**
 * Append a row to a Google Sheet via Gateway
 * @param {string} sheetId - Google Sheet ID
 * @param {string} sheetName - Tab/sheet name
 * @param {any[]} row - Array of values for one row
 * @returns {Promise<boolean>} Success status
 */
export async function appendRow(sheetId, sheetName, row) {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'sheetsAppend',
        sheetId,
        sheetName,
        values: [row],
      }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (err) {
    console.error('Sheet append failed:', err);
    return false;
  }
}

/**
 * Get color for a segment status
 * @param {string} status - Status string
 * @returns {string} Hex color code
 */
export function getStatusColor(status) {
  const statusMap = {
    'Not Started': STATUS_COLORS.NOT_STARTED,
    'In Progress': STATUS_COLORS.IN_PROGRESS,
    'Complete': STATUS_COLORS.COMPLETE,
    'QC Approved': STATUS_COLORS.QC_APPROVED,
    'Blocked': STATUS_COLORS.BLOCKED,
    'Issue': STATUS_COLORS.ISSUE,
  };
  return statusMap[status] || STATUS_COLORS.NOT_STARTED;
}

/**
 * Parse segment data from sheet rows into objects
 * @param {any[][]} rows - Raw sheet data (first row = headers)
 * @returns {object[]} Array of segment objects
 */
export function parseSegments(rows) {
  if (!rows || rows.length < 2) return [];
  
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });
}

/**
 * Parse splice point data from sheet rows
 * @param {any[][]} rows - Raw sheet data
 * @returns {object[]} Array of splice point objects
 */
export function parseSplicePoints(rows) {
  return parseSegments(rows); // Same parsing logic
}

/**
 * Group segments by section
 * @param {object[]} segments - Array of segment objects
 * @returns {object} Map of section → segments
 */
export function groupBySection(segments) {
  return segments.reduce((groups, seg) => {
    const section = seg.section || 'Unknown';
    if (!groups[section]) groups[section] = [];
    groups[section].push(seg);
    return groups;
  }, {});
}

/**
 * Filter segments for a specific contractor
 * @param {object[]} segments - All segments
 * @param {string} company - Contractor company name
 * @returns {object[]} Filtered segments
 */
export function getContractorSegments(segments, company) {
  return segments.filter(s =>
    s.boring_assigned_to === company ||
    s.pulling_assigned_to === company ||
    s.splicing_assigned_to === company
  );
}

/**
 * Sanitize segment data for contractor view (hide pricing)
 * @param {object} segment - Full segment data
 * @returns {object} Sanitized segment without billing info
 */
export function sanitizeForContractor(segment) {
  const sanitized = { ...segment };
  delete sanitized.total_value;
  delete sanitized.work_items;
  delete sanitized.boring_actual_cost;
  delete sanitized.pulling_actual_cost;
  return sanitized;
}

/**
 * Calculate project summary statistics
 * @param {object[]} segments - All project segments
 * @returns {object} Summary stats
 */
export function getProjectStats(segments) {
  const stats = {
    totalSegments: segments.length,
    totalFootage: 0,
    boringComplete: 0,
    boringInProgress: 0,
    pullingComplete: 0,
    pullingInProgress: 0,
    splicingComplete: 0,
    splicingInProgress: 0,
    issues: 0,
  };

  segments.forEach(seg => {
    stats.totalFootage += parseFloat(seg.footage) || 0;
    
    if (seg.boring_status === 'QC Approved' || seg.boring_status === 'Complete') stats.boringComplete++;
    else if (seg.boring_status === 'In Progress') stats.boringInProgress++;
    
    if (seg.pulling_status === 'QC Approved' || seg.pulling_status === 'Complete') stats.pullingComplete++;
    else if (seg.pulling_status === 'In Progress') stats.pullingInProgress++;
    
    if (seg.splicing_status === 'QC Approved' || seg.splicing_status === 'Complete') stats.splicingComplete++;
    else if (seg.splicing_status === 'In Progress') stats.splicingInProgress++;
    
    if (seg.boring_status === 'Issue' || seg.pulling_status === 'Issue') stats.issues++;
  });

  return stats;
}

// v1.0.0
