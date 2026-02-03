/**
 * LYT Communications - Map Data Service
 * Version: 2.0.0
 * Updated: 2026-02-03
 * 
 * Data bridge between React frontend and Google Sheets database.
 * Fetches project/segment/splice data via Gateway API.
 * Falls back to built-in demo data when DB not yet configured.
 * 
 * Read path:  Gateway sheetsRead -> parse rows -> structured objects
 * Write path: Gateway sheetsWrite/sheetsAppend -> Google Sheets
 */

import { STATUS_COLORS } from '../config/mapConfig';

// ===== CONFIGURATION =====
const PROJECT_DB_SHEET_ID = process.env.REACT_APP_PROJECT_DB_SHEET_ID || '';
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbwiq8NzgdUQ6Hu44NHN3ASdAYTd68uK6wGRK_CpJroSoiMuv66aRmPAzDxmtXexl6MK/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';

const SHEETS = {
  PROJECTS: 'Projects',
  SEGMENTS: 'Segments',
  SPLICE_POINTS: 'Splice Points',
  ASSIGNMENTS: 'Assignments',
  RATE_CARDS: 'Rate Cards',
  USERS: 'PM Users',
  WORK_LOG: 'Work Log',
  ISSUES: 'Issues',
};

// ===== DEMO DATA =====
const DEMO_PROJECT = {
  project_id: 'VXS-SLPH01-006',
  customer: 'Vexus Fiber',
  project_name: 'Sulphur LA City Build',
  po_number: '3160880',
  total_value: 421712.30,
  start_date: '2026-02-05',
  completion_date: '2029-01-09',
  status: 'Active',
};

const DEMO_SEGMENTS = [
  { segment_id: 'VXS-SLPH01-006-A-A01', contractor_id: 'A\u2192A01', section: 'A', from_handhole: 'A (17x30x18)', to_handhole: 'A01 (15x20x12)', footage: 148, street: 'W Parish Rd', gps_start_lat: 30.2367, gps_start_lng: -93.3776, gps_end_lat: 30.2372, gps_end_lng: -93.3768, boring_status: 'QC Approved', pulling_status: 'Complete', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #2', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A02', contractor_id: 'A01\u2192A02', section: 'A', from_handhole: 'A01 (15x20x12)', to_handhole: 'A02 (15x20x12)', footage: 132, street: 'W Parish Rd', gps_start_lat: 30.2372, gps_start_lng: -93.3768, gps_end_lat: 30.2378, gps_end_lng: -93.3760, boring_status: 'QC Approved', pulling_status: 'In Progress', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #2', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A03', contractor_id: 'A02\u2192A03', section: 'A', from_handhole: 'A02 (15x20x12)', to_handhole: 'A03 (15x20x12)', footage: 156, street: 'Beglis Pkwy', gps_start_lat: 30.2378, gps_start_lng: -93.3760, gps_end_lat: 30.2385, gps_end_lng: -93.3752, boring_status: 'Complete', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A04', contractor_id: 'A03\u2192A04', section: 'A', from_handhole: 'A03 (15x20x12)', to_handhole: 'A04 (15x20x12)', footage: 198, street: 'Beglis Pkwy', gps_start_lat: 30.2385, gps_start_lng: -93.3752, gps_end_lat: 30.2392, gps_end_lng: -93.3743, boring_status: 'In Progress', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A05', contractor_id: 'A04\u2192A05', section: 'A', from_handhole: 'A04 (15x20x12)', to_handhole: 'A05 (15x20x12)', footage: 175, street: 'Elm St', gps_start_lat: 30.2392, gps_start_lng: -93.3743, gps_end_lat: 30.2398, gps_end_lng: -93.3735, boring_status: 'Not Started', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: '', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-B-B01', contractor_id: 'B\u2192B01', section: 'B', from_handhole: 'B (17x30x18)', to_handhole: 'B01 (15x20x12)', footage: 210, street: 'S Cities Service Hwy', gps_start_lat: 30.2350, gps_start_lng: -93.3810, gps_end_lat: 30.2358, gps_end_lng: -93.3800, boring_status: 'QC Approved', pulling_status: 'QC Approved', splicing_status: 'In Progress', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #1', splicing_assigned_to: 'LYT Splice Crew' },
  { segment_id: 'VXS-SLPH01-006-B-B02', contractor_id: 'B01\u2192B02', section: 'B', from_handhole: 'B01 (15x20x12)', to_handhole: 'B02 (15x20x12)', footage: 185, street: 'S Cities Service Hwy', gps_start_lat: 30.2358, gps_start_lng: -93.3800, gps_end_lat: 30.2365, gps_end_lng: -93.3790, boring_status: 'QC Approved', pulling_status: 'In Progress', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #1', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-B-B03', contractor_id: 'B02\u2192B03', section: 'B', from_handhole: 'B02 (15x20x12)', to_handhole: 'B03 (15x20x12)', footage: 162, street: 'Oak Ave', gps_start_lat: 30.2365, gps_start_lng: -93.3790, gps_end_lat: 30.2370, gps_end_lng: -93.3782, boring_status: 'Issue', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-C-C01', contractor_id: 'C\u2192C01', section: 'C', from_handhole: 'C (30x48x24)', to_handhole: 'C01 (15x20x12)', footage: 220, street: 'N Main St', gps_start_lat: 30.2340, gps_start_lng: -93.3820, gps_end_lat: 30.2348, gps_end_lng: -93.3810, boring_status: 'Not Started', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: '', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-C-C02', contractor_id: 'C01\u2192C02', section: 'C', from_handhole: 'C01 (15x20x12)', to_handhole: 'C02 (15x20x12)', footage: 195, street: 'N Main St', gps_start_lat: 30.2348, gps_start_lng: -93.3810, gps_end_lat: 30.2355, gps_end_lng: -93.3800, boring_status: 'Not Started', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: '', pulling_assigned_to: '', splicing_assigned_to: '' },
];

const DEMO_SPLICE_POINTS = [
  { splice_id: 'VXS-SLPH01-006-SPL-A01', project_id: 'VXS-SLPH01-006', contractor_id: 'A01', location: 'Handhole A01 (15x20x12)', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'mid-span', status: 'Not Started', gps_lat: 30.2372, gps_lng: -93.3768 },
  { splice_id: 'VXS-SLPH01-006-SPL-A03', project_id: 'VXS-SLPH01-006', contractor_id: 'A03', location: 'Handhole A03 (15x20x12)', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'end-of-line', status: 'Not Started', gps_lat: 30.2385, gps_lng: -93.3752 },
  { splice_id: 'VXS-SLPH01-006-SPL-B01', project_id: 'VXS-SLPH01-006', contractor_id: 'B01', location: 'Handhole B01 (15x20x12)', handhole_type: '15x20x12 TB', splice_type: '1x8', position_type: 'mid-span', status: 'In Progress', gps_lat: 30.2358, gps_lng: -93.3800 },
  { splice_id: 'VXS-SLPH01-006-SPL-C', project_id: 'VXS-SLPH01-006', contractor_id: 'C', location: 'Handhole C (30x48x24)', handhole_type: '30x48x24 LHH', splice_type: 'F1', position_type: 'end-of-line', fiber_count: 432, tray_count: 8, status: 'Not Started', gps_lat: 30.2340, gps_lng: -93.3820 },
];

// ===== GATEWAY HELPERS =====

async function gatewayCall(payload) {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ secret: GATEWAY_SECRET, ...payload }),
    });
    return await response.json();
  } catch (err) {
    console.error('[mapService] Gateway call failed:', err);
    return { success: false, error: err.message };
  }
}

export async function readSheet(sheetId, sheetName, range) {
  const data = await gatewayCall({ action: 'sheetsRead', sheetId: sheetId || PROJECT_DB_SHEET_ID, sheetName, range });
  return data.success ? (data.data || []) : [];
}

export async function writeSheet(sheetId, sheetName, range, values) {
  const data = await gatewayCall({ action: 'sheetsWrite', sheetId: sheetId || PROJECT_DB_SHEET_ID, sheetName, range, values });
  return data.success || false;
}

export async function appendRow(sheetId, sheetName, row) {
  const data = await gatewayCall({ action: 'sheetsAppend', sheetId: sheetId || PROJECT_DB_SHEET_ID, sheetName, values: [row] });
  return data.success || false;
}

// ===== ROW PARSING =====

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
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

// ===== HIGH-LEVEL DATA LOADING =====

export function isDemoMode() {
  return !PROJECT_DB_SHEET_ID;
}

export async function loadProjects(projectId) {
  if (!PROJECT_DB_SHEET_ID) {
    const projects = [DEMO_PROJECT];
    return projectId ? projects.filter(p => p.project_id === projectId) : projects;
  }
  try {
    const rows = await readSheet(PROJECT_DB_SHEET_ID, SHEETS.PROJECTS, 'A1:Z1000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadProjects failed:', err);
    return [DEMO_PROJECT];
  }
}

export async function loadSegments(projectId) {
  if (!PROJECT_DB_SHEET_ID) {
    return normalizeSegments(DEMO_SEGMENTS);
  }
  try {
    const rows = await readSheet(PROJECT_DB_SHEET_ID, SHEETS.SEGMENTS, 'A1:AZ5000');
    const parsed = rowsToObjects(rows);
    const filtered = projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
    return normalizeSegments(filtered);
  } catch (err) {
    console.error('[mapService] loadSegments failed:', err);
    return normalizeSegments(DEMO_SEGMENTS);
  }
}

export async function loadSplicePoints(projectId) {
  if (!PROJECT_DB_SHEET_ID) {
    return DEMO_SPLICE_POINTS;
  }
  try {
    const rows = await readSheet(PROJECT_DB_SHEET_ID, SHEETS.SPLICE_POINTS, 'A1:Z5000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadSplicePoints failed:', err);
    return DEMO_SPLICE_POINTS;
  }
}

/**
 * Load all data for a project in one call.
 * Returns { project, segments, splicePoints, isDemo }
 */
export async function loadFullProject(projectId) {
  const isDemo = isDemoMode();
  if (isDemo) {
    console.log('[mapService] Demo mode - using built-in data');
  }
  const [projects, segments, splicePoints] = await Promise.all([
    loadProjects(projectId),
    loadSegments(projectId),
    loadSplicePoints(projectId),
  ]);
  return {
    project: projects[0] || DEMO_PROJECT,
    segments,
    splicePoints,
    isDemo,
  };
}

// ===== DATA WRITING =====

export async function updateSegmentField(segmentId, field, value) {
  if (!PROJECT_DB_SHEET_ID) {
    console.log(`[mapService] Demo: ${segmentId}.${field} = ${value}`);
    return true;
  }
  try {
    const rows = await readSheet(PROJECT_DB_SHEET_ID, SHEETS.SEGMENTS, 'A1:AZ5000');
    const headers = rows[0] || [];
    const colIndex = headers.indexOf(field);
    const rowIndex = rows.slice(1).findIndex(r => r[0] === segmentId || r[headers.indexOf('segment_id')] === segmentId);
    if (colIndex === -1 || rowIndex === -1) return false;
    const colLetter = colIndex < 26 ? String.fromCharCode(65 + colIndex) : 'A' + String.fromCharCode(65 + colIndex - 26);
    return await writeSheet(PROJECT_DB_SHEET_ID, SHEETS.SEGMENTS, `${colLetter}${rowIndex + 2}`, [[value]]);
  } catch (err) {
    console.error('[mapService] updateSegmentField failed:', err);
    return false;
  }
}

export async function logAction(projectId, segmentId, userEmail, action, details, lat, lng) {
  if (!PROJECT_DB_SHEET_ID) {
    console.log(`[mapService] Demo log: ${action} on ${segmentId}`);
    return true;
  }
  return await appendRow(PROJECT_DB_SHEET_ID, SHEETS.WORK_LOG, [
    '', new Date().toISOString(), projectId, segmentId, userEmail, action,
    typeof details === 'object' ? JSON.stringify(details) : (details || ''),
    lat || '', lng || '',
  ]);
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
  return segments.filter(s =>
    s.boring_assigned_to === company ||
    s.pulling_assigned_to === company ||
    s.splicing_assigned_to === company
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
  const stats = { totalSegments: segments.length, totalFootage: 0, boringComplete: 0, boringInProgress: 0, pullingComplete: 0, pullingInProgress: 0, splicingComplete: 0, splicingInProgress: 0, issues: 0 };
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

export { SHEETS, PROJECT_DB_SHEET_ID };

// v2.0.0
