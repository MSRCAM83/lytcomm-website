/**
 * LYT Communications - Map Data Service
 * Version: 3.0.0
 * Updated: 2026-02-03
 * 
 * Data bridge between React frontend and Google Sheets database.
 * Reads/writes project data via Gateway API to separate spreadsheets.
 * Falls back to built-in demo data on network failure.
 * 
 * Database: 8 Google Sheets (one per table)
 * Gateway: GAS proxy for all Sheets operations
 */

import { STATUS_COLORS } from '../config/mapConfig';

// ===== CONFIGURATION =====
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';

// Database spreadsheet IDs (one per table)
const DB = {
  PROJECTS:     '1MVtbCNqgE34YpP-auSp96WdhLeXLNVauZJSX1Oalr70',
  SEGMENTS:     '1tW_3y6OzEMmkPX8JiYIN6m6dgwx291RSwQ2uTN5X8sg',
  SPLICE_POINTS:'1lFMlmlyTgbtGkxB0zhJNoa7M2RFH5bd25VPLh_xdCFU',
  ASSIGNMENTS:  '1g2Ml8PFsN0HZA_chLqje2OTnYAZXDPVMZ1trRmKN-qY',
  RATE_CARDS:   '10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4',
  USERS:        '1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw',
  WORK_LOG:     '1mhO4eZ-07SWM2VOjHcZML7vne9dMyT33O0bSI1DzcC8',
  ISSUES:       '1hPth_lqawUJfX5ik2dROL7j96v1j1i3FA1kkdgqk83g',
};

// ===== DEMO FALLBACK DATA =====
const DEMO_PROJECT = {
  project_id: 'VXS-SLPH01-006', customer: 'Vexus Fiber',
  project_name: 'Sulphur LA City Build', po_number: '3160880',
  total_value: 421712.30, start_date: '2026-02-05',
  completion_date: '2029-01-09', status: 'Active',
};

const DEMO_SEGMENTS = [
  { segment_id: 'VXS-SLPH01-006-A-A01', contractor_id: 'A\u2192A01', section: 'A', from_handhole: 'A (17x30x18)', to_handhole: 'A01 (15x20x12)', footage: 148, street: 'W Parish Rd', gps_start_lat: 30.2366, gps_start_lng: -93.3774, gps_end_lat: 30.2370, gps_end_lng: -93.3780, boring_status: 'QC Approved', pulling_status: 'Complete', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #1' },
  { segment_id: 'VXS-SLPH01-006-A-A02', contractor_id: 'A01\u2192A02', section: 'A', from_handhole: 'A01 (15x20x12)', to_handhole: 'A02 (15x20x12)', footage: 172, street: 'W Parish Rd', gps_start_lat: 30.2370, gps_start_lng: -93.3780, gps_end_lat: 30.2375, gps_end_lng: -93.3788, boring_status: 'QC Approved', pulling_status: 'Complete', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #1' },
  { segment_id: 'VXS-SLPH01-006-A-A03', contractor_id: 'A02\u2192A03', section: 'A', from_handhole: 'A02 (15x20x12)', to_handhole: 'A03 (15x20x12)', footage: 165, street: 'W Parish Rd', gps_start_lat: 30.2375, gps_start_lng: -93.3788, gps_end_lat: 30.2380, gps_end_lng: -93.3796, boring_status: 'Complete', pulling_status: 'In Progress', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #1' },
  { segment_id: 'VXS-SLPH01-006-A-A04', contractor_id: 'A03\u2192A04', section: 'A', from_handhole: 'A03 (15x20x12)', to_handhole: 'A04 (15x20x12)', footage: 198, street: 'N Huntington St', gps_start_lat: 30.2380, gps_start_lng: -93.3796, gps_end_lat: 30.2387, gps_end_lng: -93.3802, boring_status: 'In Progress', pulling_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC' },
  { segment_id: 'VXS-SLPH01-006-A-A05', contractor_id: 'A04\u2192A05', section: 'A', from_handhole: 'A04 (15x20x12)', to_handhole: 'A05 (15x20x12)', footage: 210, street: 'N Huntington St', gps_start_lat: 30.2387, gps_start_lng: -93.3802, gps_end_lat: 30.2394, gps_end_lng: -93.3808, boring_status: 'Not Started', pulling_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC' },
  { segment_id: 'VXS-SLPH01-006-B-B01', contractor_id: 'B\u2192B01', section: 'B', from_handhole: 'B (30x48x24)', to_handhole: 'B01 (17x30x18)', footage: 320, street: 'S Cities Service Hwy', gps_start_lat: 30.2350, gps_start_lng: -93.3760, gps_end_lat: 30.2340, gps_end_lng: -93.3745, boring_status: 'QC Approved', pulling_status: 'QC Approved', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #2' },
  { segment_id: 'VXS-SLPH01-006-B-B02', contractor_id: 'B01\u2192B02', section: 'B', from_handhole: 'B01 (17x30x18)', to_handhole: 'B02 (15x20x12)', footage: 285, street: 'S Cities Service Hwy', gps_start_lat: 30.2340, gps_start_lng: -93.3745, gps_end_lat: 30.2332, gps_end_lng: -93.3732, boring_status: 'QC Approved', pulling_status: 'In Progress', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #2' },
  { segment_id: 'VXS-SLPH01-006-B-B03', contractor_id: 'B02\u2192B03', section: 'B', from_handhole: 'B02 (15x20x12)', to_handhole: 'B03 (15x20x12)', footage: 156, street: 'E Napoleon St', gps_start_lat: 30.2332, gps_start_lng: -93.3732, gps_end_lat: 30.2328, gps_end_lng: -93.3720, boring_status: 'Complete', pulling_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC' },
  { segment_id: 'VXS-SLPH01-006-C-C01', contractor_id: 'C\u2192C01', section: 'C', from_handhole: 'C (17x30x18)', to_handhole: 'C01 (15x20x12)', footage: 245, street: 'Maplewood Dr', gps_start_lat: 30.2400, gps_start_lng: -93.3750, gps_end_lat: 30.2410, gps_end_lng: -93.3762, boring_status: 'Issue', pulling_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', boring_notes: 'Hit rock at 80 LF - rerouting' },
  { segment_id: 'VXS-SLPH01-006-C-C02', contractor_id: 'C01\u2192C02', section: 'C', from_handhole: 'C01 (15x20x12)', to_handhole: 'C02 (15x20x12)', footage: 190, street: 'Maplewood Dr', gps_start_lat: 30.2410, gps_start_lng: -93.3762, gps_end_lat: 30.2418, gps_end_lng: -93.3772, boring_status: 'Not Started', pulling_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC' },
  { segment_id: 'VXS-SLPH01-006-D-D01', contractor_id: 'D\u2192D01', section: 'D', from_handhole: 'D (17x30x18)', to_handhole: 'D01 (15x20x12)', footage: 178, street: 'E Burton St', gps_start_lat: 30.2345, gps_start_lng: -93.3800, gps_end_lat: 30.2352, gps_end_lng: -93.3812, boring_status: 'Not Started', pulling_status: 'Not Started' },
  { segment_id: 'VXS-SLPH01-006-D-D02', contractor_id: 'D01\u2192D02', section: 'D', from_handhole: 'D01 (15x20x12)', to_handhole: 'D02 (15x20x12)', footage: 225, street: 'E Burton St', gps_start_lat: 30.2352, gps_start_lng: -93.3812, gps_end_lat: 30.2360, gps_end_lng: -93.3824, boring_status: 'Not Started', pulling_status: 'Not Started' },
];

const DEMO_SPLICE_POINTS = [
  { splice_id: 'VXS-SLPH01-006-SPL-A01', project_id: 'VXS-SLPH01-006', contractor_id: 'A01', location: 'Handhole A01 (15x20x12)', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'mid-span', status: 'Not Started', gps_lat: 30.2370, gps_lng: -93.3780 },
  { splice_id: 'VXS-SLPH01-006-SPL-A02', project_id: 'VXS-SLPH01-006', contractor_id: 'A02', location: 'Handhole A02 (15x20x12)', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'mid-span', status: 'Not Started', gps_lat: 30.2375, gps_lng: -93.3788 },
  { splice_id: 'VXS-SLPH01-006-SPL-A05', project_id: 'VXS-SLPH01-006', contractor_id: 'A05', location: 'Handhole A05 (15x20x12)', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'end-of-line', status: 'Not Started', gps_lat: 30.2394, gps_lng: -93.3808 },
  { splice_id: 'VXS-SLPH01-006-SPL-B', project_id: 'VXS-SLPH01-006', contractor_id: 'B', location: 'Handhole B (30x48x24)', handhole_type: '30x48x24 LHH', splice_type: 'F1', position_type: 'mid-span', fiber_count: 432, tray_count: 8, status: 'Not Started', gps_lat: 30.2350, gps_lng: -93.3760 },
  { splice_id: 'VXS-SLPH01-006-SPL-B01', project_id: 'VXS-SLPH01-006', contractor_id: 'B01', location: 'Handhole B01 (17x30x18)', handhole_type: '17x30x18 B', splice_type: '1x8', position_type: 'mid-span', status: 'Not Started', gps_lat: 30.2340, gps_lng: -93.3745 },
  { splice_id: 'VXS-SLPH01-006-SPL-C01', project_id: 'VXS-SLPH01-006', contractor_id: 'C01', location: 'Handhole C01 (15x20x12)', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'mid-span', status: 'Not Started', gps_lat: 30.2410, gps_lng: -93.3762 },
  { splice_id: 'VXS-SLPH01-006-SPL-D01', project_id: 'VXS-SLPH01-006', contractor_id: 'D01', location: 'Handhole D01 (15x20x12)', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'end-of-line', status: 'Not Started', gps_lat: 30.2352, gps_lng: -93.3812 },
];

// ===== GATEWAY HELPERS =====

let _dbOnline = null; // Cache: null=unknown, true/false

async function gatewayCall(action, params) {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: GATEWAY_SECRET, action, params }),
    });
    const text = await response.text();
    // GAS returns redirect HTML - follow it
    if (text.includes('<HTML>')) {
      const match = text.match(/HREF="([^"]+)"/);
      if (match) {
        const redirectUrl = match[1].replace(/&amp;/g, '&');
        const finalResp = await fetch(redirectUrl);
        const finalText = await finalResp.text();
        return JSON.parse(finalText);
      }
    }
    return JSON.parse(text);
  } catch (err) {
    console.error('[mapService] Gateway call failed:', err);
    return { success: false, error: err.message };
  }
}

async function readSheet(spreadsheetId, range) {
  const result = await gatewayCall('sheetsRead', { spreadsheetId, range });
  if (result.success && result.data && result.data.data) {
    return result.data.data;
  }
  return [];
}

async function writeSheet(spreadsheetId, range, values) {
  const result = await gatewayCall('sheetsWrite', { spreadsheetId, range, values });
  return result.success || false;
}

async function appendRow(spreadsheetId, values) {
  const result = await gatewayCall('sheetsAppend', { spreadsheetId, values });
  return result.success || false;
}

// ===== ROW PARSING =====

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => (h || '').toString().trim());
  return rows.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = row[i] !== undefined && row[i] !== null ? row[i] : '';
      });
      return obj;
    });
}

// ===== SEGMENT NORMALIZATION =====

function normalizeSegments(segments) {
  return segments.map(s => ({
    ...s,
    footage: parseFloat(s.footage) || 0,
    gps_start: s.gps_start || { lat: parseFloat(s.gps_start_lat) || 0, lng: parseFloat(s.gps_start_lng) || 0 },
    gps_end: s.gps_end || { lat: parseFloat(s.gps_end_lat) || 0, lng: parseFloat(s.gps_end_lng) || 0 },
    boring_status: s.boring_status || 'Not Started',
    pulling_status: s.pulling_status || 'Not Started',
    splicing_status: s.splicing_status || 'Not Started',
    boring_assigned_to: s.boring_assigned_to || '',
    pulling_assigned_to: s.pulling_assigned_to || '',
    splicing_assigned_to: s.splicing_assigned_to || '',
  }));
}

// ===== DATABASE CONNECTIVITY CHECK =====

export async function checkDbConnection() {
  if (_dbOnline !== null) return _dbOnline;
  try {
    const rows = await readSheet(DB.PROJECTS, 'A1:A2');
    _dbOnline = rows.length >= 1 && rows[0][0] === 'project_id';
    console.log(`[mapService] DB ${_dbOnline ? 'ONLINE' : 'OFFLINE'} - ${_dbOnline ? 'live data' : 'demo fallback'}`);
    return _dbOnline;
  } catch (e) {
    _dbOnline = false;
    console.log('[mapService] DB OFFLINE - demo fallback');
    return false;
  }
}

export function isDemoMode() {
  return _dbOnline === false;
}

export function resetDbCache() {
  _dbOnline = null;
}

// ===== HIGH-LEVEL DATA LOADING =====

export async function loadProjects(projectId) {
  const online = await checkDbConnection();
  if (!online) {
    const projects = [DEMO_PROJECT];
    return projectId ? projects.filter(p => p.project_id === projectId) : projects;
  }
  try {
    const rows = await readSheet(DB.PROJECTS, 'A1:M1000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadProjects failed:', err);
    return [DEMO_PROJECT];
  }
}

export async function loadSegments(projectId) {
  const online = await checkDbConnection();
  if (!online) return normalizeSegments(DEMO_SEGMENTS);
  try {
    const rows = await readSheet(DB.SEGMENTS, 'A1:AD5000');
    const parsed = rowsToObjects(rows);
    const filtered = projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
    return normalizeSegments(filtered);
  } catch (err) {
    console.error('[mapService] loadSegments failed:', err);
    return normalizeSegments(DEMO_SEGMENTS);
  }
}

export async function loadSplicePoints(projectId) {
  const online = await checkDbConnection();
  if (!online) return DEMO_SPLICE_POINTS;
  try {
    const rows = await readSheet(DB.SPLICE_POINTS, 'A1:V5000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadSplicePoints failed:', err);
    return DEMO_SPLICE_POINTS;
  }
}

export async function loadAssignments(projectId) {
  const online = await checkDbConnection();
  if (!online) return [];
  try {
    const rows = await readSheet(DB.ASSIGNMENTS, 'A1:K1000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadAssignments failed:', err);
    return [];
  }
}

export async function loadRateCards(rateCardId) {
  const online = await checkDbConnection();
  if (!online) return [];
  try {
    const rows = await readSheet(DB.RATE_CARDS, 'A1:H1000');
    const parsed = rowsToObjects(rows);
    return rateCardId ? parsed.filter(r => r.rate_card_id === rateCardId) : parsed;
  } catch (err) {
    console.error('[mapService] loadRateCards failed:', err);
    return [];
  }
}

export async function loadIssues(projectId) {
  const online = await checkDbConnection();
  if (!online) return [];
  try {
    const rows = await readSheet(DB.ISSUES, 'A1:K1000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadIssues failed:', err);
    return [];
  }
}

/**
 * Load all data for a project in one call.
 * Returns { project, segments, splicePoints, assignments, isDemo }
 */
export async function loadFullProject(projectId) {
  const online = await checkDbConnection();
  const isDemo = !online;
  if (isDemo) console.log('[mapService] Demo mode - using built-in data');
  else console.log('[mapService] LIVE mode - loading from Google Sheets');

  const [projects, segments, splicePoints, assignments] = await Promise.all([
    loadProjects(projectId),
    loadSegments(projectId),
    loadSplicePoints(projectId),
    loadAssignments(projectId),
  ]);
  return {
    project: projects[0] || DEMO_PROJECT,
    segments,
    splicePoints,
    assignments,
    isDemo,
  };
}

// ===== DATA WRITING =====

export async function updateSegmentField(segmentId, field, value) {
  const online = await checkDbConnection();
  if (!online) {
    console.log(`[mapService] Demo: ${segmentId}.${field} = ${value}`);
    return true;
  }
  try {
    const rows = await readSheet(DB.SEGMENTS, 'A1:AD5000');
    if (!rows || rows.length < 2) return false;
    const headers = rows[0];
    const colIndex = headers.indexOf(field);
    const segIdCol = headers.indexOf('segment_id');
    const rowIndex = rows.slice(1).findIndex(r => r[segIdCol] === segmentId);
    if (colIndex === -1 || rowIndex === -1) {
      console.error(`[mapService] Field "${field}" or segment "${segmentId}" not found`);
      return false;
    }
    const colLetter = colIndex < 26
      ? String.fromCharCode(65 + colIndex)
      : String.fromCharCode(64 + Math.floor(colIndex / 26)) + String.fromCharCode(65 + (colIndex % 26));
    const cellRange = `${colLetter}${rowIndex + 2}`;
    console.log(`[mapService] Writing ${segmentId}.${field} = "${value}" to cell ${cellRange}`);
    return await writeSheet(DB.SEGMENTS, cellRange, [[value]]);
  } catch (err) {
    console.error('[mapService] updateSegmentField failed:', err);
    return false;
  }
}

export async function updateSpliceField(spliceId, field, value) {
  const online = await checkDbConnection();
  if (!online) {
    console.log(`[mapService] Demo: ${spliceId}.${field} = ${value}`);
    return true;
  }
  try {
    const rows = await readSheet(DB.SPLICE_POINTS, 'A1:V5000');
    if (!rows || rows.length < 2) return false;
    const headers = rows[0];
    const colIndex = headers.indexOf(field);
    const idCol = headers.indexOf('splice_id');
    const rowIndex = rows.slice(1).findIndex(r => r[idCol] === spliceId);
    if (colIndex === -1 || rowIndex === -1) return false;
    const colLetter = colIndex < 26
      ? String.fromCharCode(65 + colIndex)
      : String.fromCharCode(64 + Math.floor(colIndex / 26)) + String.fromCharCode(65 + (colIndex % 26));
    return await writeSheet(DB.SPLICE_POINTS, `${colLetter}${rowIndex + 2}`, [[value]]);
  } catch (err) {
    console.error('[mapService] updateSpliceField failed:', err);
    return false;
  }
}

export async function logAction(projectId, segmentId, userEmail, action, details, gpsCoords) {
  const online = await checkDbConnection();
  if (!online) {
    console.log(`[mapService] Demo log: ${action} on ${segmentId}`);
    return true;
  }
  const logId = `LOG-${Date.now()}`;
  return await appendRow(DB.WORK_LOG, [[
    logId,
    new Date().toISOString(),
    projectId || '',
    segmentId || '',
    userEmail || '',
    action || '',
    typeof details === 'object' ? JSON.stringify(details) : (details || ''),
    gpsCoords || '',
  ]]);
}

export async function createIssue(projectId, segmentId, reportedBy, issueType, description) {
  const online = await checkDbConnection();
  if (!online) return false;
  const issueId = `ISS-${Date.now()}`;
  return await appendRow(DB.ISSUES, [[
    issueId, projectId || '', segmentId || '', reportedBy || '',
    new Date().toISOString(), issueType || 'Other', description || '',
    '', '', '', 'Open',
  ]]);
}

export async function resolveIssue(issueId, resolvedBy, resolution) {
  const online = await checkDbConnection();
  if (!online) return false;
  try {
    const rows = await readSheet(DB.ISSUES, 'A1:K1000');
    if (!rows || rows.length < 2) return false;
    const headers = rows[0];
    const idCol = headers.indexOf('issue_id');
    const rowIndex = rows.slice(1).findIndex(r => r[idCol] === issueId);
    if (rowIndex === -1) return false;
    const actualRow = rowIndex + 2;
    await writeSheet(DB.ISSUES, `H${actualRow}:K${actualRow}`, [[resolution, resolvedBy, new Date().toISOString(), 'Resolved']]);
    return true;
  } catch (err) {
    console.error('[mapService] resolveIssue failed:', err);
    return false;
  }
}

// ===== UTILITY FUNCTIONS =====

export function getStatusColor(status) {
  const map = {
    'Not Started': STATUS_COLORS.NOT_STARTED,
    'Potholing': STATUS_COLORS.IN_PROGRESS,
    'Pothole Approved': STATUS_COLORS.CRITICAL_PATH,
    'In Progress': STATUS_COLORS.IN_PROGRESS,
    'Complete': STATUS_COLORS.COMPLETE,
    'QC Approved': STATUS_COLORS.QC_APPROVED,
    'Blocked': STATUS_COLORS.BLOCKED,
    'Issue': STATUS_COLORS.ISSUE,
  };
  return map[status] || STATUS_COLORS.NOT_STARTED;
}

export function groupBySection(segments) {
  return segments.reduce((groups, seg) => {
    const section = seg.section || 'Unknown';
    if (!groups[section]) groups[section] = [];
    groups[section].push(seg);
    return groups;
  }, {});
}

export function getContractorSegments(segments, company) {
  if (!company) return [];
  const lc = company.toLowerCase();
  return segments.filter(s =>
    (s.boring_assigned_to || '').toLowerCase().includes(lc) ||
    (s.pulling_assigned_to || '').toLowerCase().includes(lc) ||
    (s.splicing_assigned_to || '').toLowerCase().includes(lc)
  );
}

export function sanitizeForContractor(segment) {
  const s = { ...segment };
  delete s.total_value;
  delete s.work_items;
  delete s.boring_actual_cost;
  delete s.pulling_actual_cost;
  return s;
}

export function getProjectStats(segments) {
  const stats = {
    totalSegments: segments.length, totalFootage: 0,
    boringComplete: 0, boringInProgress: 0,
    pullingComplete: 0, pullingInProgress: 0,
    splicingComplete: 0, splicingInProgress: 0,
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

/**
 * Bulk assign segments to a contractor for a given work type.
 * Updates the assigned_to field for boring/pulling/splicing on multiple segments.
 */
export async function bulkAssignSegments(segmentIds, workType, contractorName, projectId) {
  const online = await checkDbConnection();
  if (!online) return { success: false, error: 'Database offline' };

  const fieldMap = {
    boring: 'boring_assigned_to',
    pulling: 'pulling_assigned_to',
    splicing: 'splicing_assigned_to',
  };
  const field = fieldMap[workType];
  if (!field) return { success: false, error: `Invalid work type: ${workType}` };

  let updated = 0;
  const errors = [];

  for (const segId of segmentIds) {
    try {
      const ok = await updateSegmentField(segId, field, contractorName);
      if (ok) updated++;
      else errors.push(`Failed: ${segId}`);
    } catch (err) {
      errors.push(`${segId}: ${err.message}`);
    }
  }

  // Also create an assignment record
  try {
    const assignmentId = `ASGN-${Date.now()}`;
    await appendRow(DB.ASSIGNMENTS, [[
      assignmentId,
      projectId || '',
      contractorName,
      '',
      workType,
      JSON.stringify(segmentIds),
      '',
      new Date().toISOString(),
      '',
      'Medium',
      'Assigned',
      `Bulk assigned ${segmentIds.length} segments`,
    ]]);
  } catch (err) {
    console.warn('[mapService] Assignment record failed:', err);
  }

  return {
    success: errors.length === 0,
    updated,
    total: segmentIds.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Import a full project (project + segments + splice points) from AI extraction.
 * Batch-writes all data to Google Sheets via Gateway.
 * Returns { success, counts, errors }
 */
export async function importProject(projectData, segmentsData, splicePointsData, projectId) {
  const online = await checkDbConnection();
  if (!online) return { success: false, error: 'Database offline' };

  const errors = [];
  let projectWritten = false;
  let segmentsWritten = 0;
  let splicesWritten = 0;

  // 1. Write project row
  try {
    const projRow = [[
      projectId,
      projectData.customer || '',
      projectData.project_name || '',
      projectData.po_number || '',
      projectData.total_value || 0,
      projectData.start_date || '',
      projectData.completion_date || '',
      projectData.status || 'Active',
      '', // map_pdf_url
      '', // work_order_pdf_url
      projectData.rate_card_id || 'vexus-la-tx-2026',
      new Date().toISOString(),
      projectData.created_by || 'matt@lytcomm.com',
    ]];
    const ok = await appendRow(DB.PROJECTS, projRow);
    if (ok) projectWritten = true;
    else errors.push('Failed to write project row');
  } catch (err) {
    errors.push(`Project write error: ${err.message}`);
  }

  // 2. Write segment rows
  for (const seg of (segmentsData || [])) {
    try {
      const segmentId = `${projectId}-${seg.section || 'X'}-${(seg.to_handhole || seg.contractor_id || '').replace(/[^A-Za-z0-9]/g, '')}`;
      const row = [[
        segmentId,                                  // segment_id
        projectId,                                  // project_id
        seg.contractor_id || '',                    // contractor_id
        seg.section || '',                          // section
        seg.from_handhole || '',                    // from_handhole
        seg.to_handhole || '',                      // to_handhole
        seg.footage || 0,                           // footage
        seg.street || '',                           // street
        seg.gps_start_lat || '',                    // gps_start_lat
        seg.gps_start_lng || '',                    // gps_start_lng
        seg.gps_end_lat || '',                      // gps_end_lat
        seg.gps_end_lng || '',                      // gps_end_lng
        'Not Started',                              // boring_status
        '', '', '', '', '', '', '', '',             // boring fields (assigned_to through notes)
        'Not Started',                              // pulling_status
        '', '', '', '', '', '', '', '',             // pulling fields
      ]];
      const ok = await appendRow(DB.SEGMENTS, row);
      if (ok) segmentsWritten++;
      else errors.push(`Failed to write segment ${seg.contractor_id}`);
    } catch (err) {
      errors.push(`Segment ${seg.contractor_id}: ${err.message}`);
    }
  }

  // 3. Write splice point rows
  for (const sp of (splicePointsData || [])) {
    try {
      const spliceId = `${projectId}-SPL-${(sp.contractor_id || sp.location || '').replace(/[^A-Za-z0-9]/g, '')}`;
      const requiredPhotos = sp.splice_type === '1x4'
        ? '["basket","splice_tray","strength_members","grommets","closed","cables","in_ground"]'
        : sp.splice_type === '1x8'
          ? '["basket","splitter_tray","splice_tray","strength_members","grommets","closed","cables","in_ground"]'
          : '["basket","splice_trays","strength_members","closed","cables","in_ground"]';
      
      const row = [[
        spliceId,                                   // splice_id
        projectId,                                  // project_id
        sp.contractor_id || '',                     // contractor_id
        sp.location || '',                          // location
        sp.handhole_type || '',                     // handhole_type
        sp.splice_type || '',                       // splice_type
        sp.position_type || '',                     // position_type
        sp.fiber_count || 2,                        // fiber_count
        sp.tray_count || 1,                         // tray_count
        sp.gps_lat || '',                           // gps_lat
        sp.gps_lng || '',                           // gps_lng
        'Not Started',                              // status
        '', '', '', '', '',                         // assigned_to through qc_approved_date
        requiredPhotos,                             // required_photos
        '', '', '', '',                             // uploaded_photos through notes
      ]];
      const ok = await appendRow(DB.SPLICE_POINTS, row);
      if (ok) splicesWritten++;
      else errors.push(`Failed to write splice ${sp.contractor_id}`);
    } catch (err) {
      errors.push(`Splice ${sp.contractor_id}: ${err.message}`);
    }
  }

  return {
    success: errors.length === 0,
    counts: {
      project: projectWritten ? 1 : 0,
      segments: segmentsWritten,
      splicePoints: splicesWritten,
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}

export { DB };

// v3.1.0
