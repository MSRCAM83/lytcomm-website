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

import { STATUS_COLORS, VEXUS_RATES } from '../config/mapConfig';

// ===== CONFIGURATION =====
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';

// Database spreadsheet IDs (one per table)
const DB = {
  PROJECTS:     '1MVtbCNqgE34YpP-auSp96WdhLeXLNVauZJSX1Oalr70',
  SEGMENTS:     '1tW_3y6OzEMmkPX8JiYIN6m6dgwx291RSwQ2uTN5X8sg',
  SPLICE_POINTS:'1lFMlmlyTgbtGkxB0zhJNoa7M2RFH5bd25VPLh_xdCFU',
  HANDHOLES:    '1tW_3y6OzEMmkPX8JiYIN6m6dgwx291RSwQ2uTN5X8sg', // Uses Handholes tab in Segments sheet
  FLOWERPOTS:   '1tW_3y6OzEMmkPX8JiYIN6m6dgwx291RSwQ2uTN5X8sg', // Uses Flowerpots tab in Segments sheet
  GROUND_RODS:  '1tW_3y6OzEMmkPX8JiYIN6m6dgwx291RSwQ2uTN5X8sg', // Uses GroundRods tab in Segments sheet
  ASSIGNMENTS:  '1g2Ml8PFsN0HZA_chLqje2OTnYAZXDPVMZ1trRmKN-qY',
  RATE_CARDS:   '10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4',
  USERS:        '1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw',
  WORK_LOG:     '1mhO4eZ-07SWM2VOjHcZML7vne9dMyT33O0bSI1DzcC8',
  ISSUES:       '1hPth_lqawUJfX5ik2dROL7j96v1j1i3FA1kkdgqk83g',
  LINE_ITEMS:   '1tW_3y6OzEMmkPX8JiYIN6m6dgwx291RSwQ2uTN5X8sg', // Uses LineItems tab in Segments sheet
};

// ===== EMPTY FALLBACK DATA (no demo data) =====
const DEMO_PROJECT = null;
const DEMO_SEGMENTS = [];
const DEMO_SPLICE_POINTS = [];
const DEMO_FLOWERPOTS = [];
const DEMO_HANDHOLES = [];
const DEMO_GROUND_RODS = [];

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

export async function loadFlowerpots(projectId) {
  const online = await checkDbConnection();
  if (!online) return DEMO_FLOWERPOTS.filter(fp => !projectId || fp.project_id === projectId);
  try {
    const rows = await readSheet(DB.FLOWERPOTS, 'Flowerpots!A1:J5000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadFlowerpots failed:', err);
    return DEMO_FLOWERPOTS.filter(fp => !projectId || fp.project_id === projectId);
  }
}

export async function loadHandholes(projectId) {
  const online = await checkDbConnection();
  if (!online) return DEMO_HANDHOLES.filter(hh => !projectId || hh.project_id === projectId);
  try {
    const rows = await readSheet(DB.HANDHOLES, 'Handholes!A1:L5000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadHandholes failed:', err);
    return DEMO_HANDHOLES.filter(hh => !projectId || hh.project_id === projectId);
  }
}

export async function loadGroundRods(projectId) {
  const online = await checkDbConnection();
  if (!online) return DEMO_GROUND_RODS.filter(gr => !projectId || gr.project_id === projectId);
  try {
    const rows = await readSheet(DB.GROUND_RODS, 'GroundRods!A1:F5000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadGroundRods failed:', err);
    return DEMO_GROUND_RODS.filter(gr => !projectId || gr.project_id === projectId);
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
 * Returns ALL billable items: { project, segments, splicePoints, handholes, flowerpots, groundRods, assignments, isDemo }
 */
export async function loadFullProject(projectId) {
  const online = await checkDbConnection();
  const isDemo = !online;
  if (isDemo) console.log('[mapService] Demo mode - using built-in data');
  else console.log('[mapService] LIVE mode - loading from Google Sheets');

  const [projects, segments, splicePoints, handholes, flowerpots, groundRods, assignments] = await Promise.all([
    loadProjects(projectId),
    loadSegments(projectId),
    loadSplicePoints(projectId),
    loadHandholes(projectId),
    loadFlowerpots(projectId),
    loadGroundRods(projectId),
    loadAssignments(projectId),
  ]);
  return {
    project: projects[0] || DEMO_PROJECT,
    segments,
    splicePoints,
    handholes,
    flowerpots,
    groundRods,
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
 * Import a full project with ALL billable items from AI extraction.
 * Writes: project, handholes, flowerpots, ground_rods, segments, splice_points
 * Returns { success, counts, errors }
 */
export async function importProject(extractionData, projectId) {
  const online = await checkDbConnection();
  if (!online) return { success: false, error: 'Database offline' };

  const errors = [];
  const counts = { project: 0, handholes: 0, flowerpots: 0, groundRods: 0, segments: 0, splicePoints: 0 };

  // Extract data from the extraction result
  const projectData = extractionData.project || extractionData;
  const handholes = extractionData.handholes || [];
  const flowerpots = extractionData.flowerpots || [];
  const groundRods = extractionData.ground_rods || [];
  const segments = extractionData.segments || [];
  const splicePoints = extractionData.splice_points || [];

  console.log(`[importProject] Importing: ${handholes.length} HH, ${flowerpots.length} FP, ${groundRods.length} GR, ${segments.length} SEG, ${splicePoints.length} SP`);

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
    if (ok) counts.project = 1;
    else errors.push('Failed to write project row');
  } catch (err) {
    errors.push(`Project write error: ${err.message}`);
  }

  // 2. Write handhole rows
  for (const hh of handholes) {
    try {
      const row = [[
        hh.id || `${projectId}-HH-${counts.handholes + 1}`,
        projectId,
        hh.label || '',
        hh.type || '',
        hh.code || 'UG20',
        hh.qty || 1,
        hh.section || '',
        hh.gps_lat || '',
        hh.gps_lng || '',
        'Not Started',
        new Date().toISOString(),
      ]];
      const ok = await appendRow(DB.HANDHOLES, row);
      if (ok) counts.handholes++;
      else errors.push(`Failed to write handhole ${hh.label || hh.id}`);
    } catch (err) {
      errors.push(`Handhole ${hh.label}: ${err.message}`);
    }
  }

  // 3. Write flowerpot rows
  for (const fp of flowerpots) {
    try {
      const row = [[
        fp.id || `${projectId}-FP-${counts.flowerpots + 1}`,
        projectId,
        fp.label || '',
        fp.code || 'UG12',
        fp.qty || 1,
        fp.gps_lat || '',
        fp.gps_lng || '',
        'Not Started',
        new Date().toISOString(),
      ]];
      const ok = await appendRow(DB.FLOWERPOTS, row);
      if (ok) counts.flowerpots++;
      else errors.push(`Failed to write flowerpot ${fp.label || fp.id}`);
    } catch (err) {
      errors.push(`Flowerpot ${fp.label}: ${err.message}`);
    }
  }

  // 4. Write ground rod rows
  for (const gr of groundRods) {
    try {
      const row = [[
        gr.id || `${projectId}-GR-${counts.groundRods + 1}`,
        projectId,
        gr.code || 'UG13',
        gr.qty || 1,
        gr.handhole_id || '',
        new Date().toISOString(),
      ]];
      const ok = await appendRow(DB.GROUND_RODS, row);
      if (ok) counts.groundRods++;
      else errors.push(`Failed to write ground rod ${gr.id}`);
    } catch (err) {
      errors.push(`Ground rod ${gr.id}: ${err.message}`);
    }
  }

  // 5. Write segment rows
  for (const seg of segments) {
    try {
      const segmentId = seg.id || `${projectId}-SEG-${counts.segments + 1}`;
      const row = [[
        segmentId,
        projectId,
        seg.contractor_id || '',
        seg.section || '',
        seg.from_structure_id || seg.from_handhole || '',
        seg.to_structure_id || seg.to_handhole || '',
        seg.footage || 0,
        seg.street || '',
        seg.gps_start_lat || '',
        seg.gps_start_lng || '',
        seg.gps_end_lat || '',
        seg.gps_end_lng || '',
        // Bore info
        seg.bore?.code || '',
        seg.bore?.qty || seg.footage || 0,
        seg.bore?.duct_count || 1,
        // Pull info
        seg.pull?.code || '',
        seg.pull?.qty || seg.footage || 0,
        seg.pull?.cable_type || '',
        // Status
        'Not Started',
        '', '', '', '', '', '', '', '',
        'Not Started',
        '', '', '', '', '', '', '', '',
      ]];
      const ok = await appendRow(DB.SEGMENTS, row);
      if (ok) counts.segments++;
      else errors.push(`Failed to write segment ${seg.contractor_id || segmentId}`);
    } catch (err) {
      errors.push(`Segment ${seg.contractor_id}: ${err.message}`);
    }
  }

  // 6. Write splice point rows with PM readings
  for (const sp of splicePoints) {
    try {
      const spliceId = sp.id || `${projectId}-SP-${counts.splicePoints + 1}`;
      const spliceType = sp.splice_type || '1x4';

      // Build PM readings JSON for 1x4s
      let pmReadings = '';
      if (spliceType === '1x4' && sp.splitters) {
        const readings = [];
        for (const splitter of sp.splitters) {
          for (const reading of (splitter.readings || [])) {
            readings.push({
              id: reading.id,
              port: reading.port,
              value_dBm: reading.value_dBm,
              status: reading.status || 'pending',
              splitter_id: splitter.id,
            });
          }
        }
        pmReadings = JSON.stringify(readings);
      }

      const row = [[
        spliceId,
        projectId,
        sp.contractor_id || sp.handhole_label || '',
        sp.location || sp.handhole_id || '',
        sp.handhole_type || '',
        spliceType,
        sp.position_type || '',
        sp.fiber_count || 2,
        sp.tray_count || 1,
        sp.gps_lat || '',
        sp.gps_lng || '',
        'Not Started',
        '', '', '', '', '',
        sp.enclosure_photos_required || 7,
        sp.pm_photos_required || (spliceType === '1x4' ? 2 : 0),
        sp.total_photos_required || (spliceType === '1x4' ? 9 : 8),
        pmReadings,
        sp.splitter_count || (spliceType === '1x4' ? 2 : 0),
      ]];
      const ok = await appendRow(DB.SPLICE_POINTS, row);
      if (ok) counts.splicePoints++;
      else errors.push(`Failed to write splice ${sp.contractor_id || spliceId}`);
    } catch (err) {
      errors.push(`Splice ${sp.contractor_id}: ${err.message}`);
    }
  }

  console.log(`[importProject] Complete: ${JSON.stringify(counts)}, errors: ${errors.length}`);

  return {
    success: errors.length === 0,
    counts,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ===== LINE ITEMS =====

/**
 * Load all line items for a project.
 */
export async function loadLineItems(projectId) {
  const online = await checkDbConnection();
  if (!online) return [];
  try {
    const rows = await readSheet(DB.LINE_ITEMS, 'LineItems!A1:M5000');
    const parsed = rowsToObjects(rows);
    return projectId ? parsed.filter(r => r.project_id === projectId) : parsed;
  } catch (err) {
    console.error('[mapService] loadLineItems failed:', err);
    return [];
  }
}

/**
 * Import line items for a project.
 * Looks up vexus_rate from master rate card, sets contractor_rate to default.
 */
export async function importLineItems(projectId, lineItems, rateCardId) {
  const online = await checkDbConnection();
  if (!online) return { success: false, error: 'Database offline' };

  const errors = [];
  let imported = 0;

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    const code = item.code || '';
    const rateInfo = VEXUS_RATES[code] || {};
    const vexusRate = rateInfo.vexus || 0;
    const contractorRate = rateInfo.default_contractor || 0;
    const margin = vexusRate - contractorRate;
    const lineItemId = `${projectId}-LI-${String(i + 1).padStart(3, '0')}`;

    try {
      const row = [[
        projectId,
        lineItemId,
        code,
        item.description || rateInfo.description || '',
        item.uom || rateInfo.uom || '',
        item.quantity || 0,
        item.segment_id || '',
        item.structure_id || '',
        item.splice_id || '',
        vexusRate,
        contractorRate,
        margin,
        'Not Started',
      ]];
      const ok = await appendRow(DB.LINE_ITEMS, row);
      if (ok) imported++;
      else errors.push(`Failed: ${code} (${lineItemId})`);
    } catch (err) {
      errors.push(`${code}: ${err.message}`);
    }
  }

  return { success: errors.length === 0, imported, total: lineItems.length, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Get all line items for a project (alias for loadLineItems).
 */
export async function getProjectLineItems(projectId) {
  return loadLineItems(projectId);
}

/**
 * Admin adjusts contractor rate for a specific line item.
 * Recalculates margin = vexus_rate - new contractor_rate.
 */
export async function updateLineItemRate(projectId, lineItemId, contractorRate) {
  const online = await checkDbConnection();
  if (!online) return false;
  try {
    const rows = await readSheet(DB.LINE_ITEMS, 'LineItems!A1:M5000');
    if (!rows || rows.length < 2) return false;
    const headers = rows[0];
    const idCol = headers.indexOf('line_item_id');
    const contractorRateCol = headers.indexOf('contractor_rate');
    const marginCol = headers.indexOf('margin');
    const vexusRateCol = headers.indexOf('vexus_rate');
    const rowIndex = rows.slice(1).findIndex(r => r[idCol] === lineItemId);
    if (rowIndex === -1 || contractorRateCol === -1) return false;

    const actualRow = rowIndex + 2;
    const vexusRate = parseFloat(rows[actualRow - 1][vexusRateCol]) || 0;
    const margin = vexusRate - contractorRate;

    const crCol = contractorRateCol < 26
      ? String.fromCharCode(65 + contractorRateCol)
      : String.fromCharCode(64 + Math.floor(contractorRateCol / 26)) + String.fromCharCode(65 + (contractorRateCol % 26));
    const mCol = marginCol < 26
      ? String.fromCharCode(65 + marginCol)
      : String.fromCharCode(64 + Math.floor(marginCol / 26)) + String.fromCharCode(65 + (marginCol % 26));

    await writeSheet(DB.LINE_ITEMS, `LineItems!${crCol}${actualRow}`, [[contractorRate]]);
    await writeSheet(DB.LINE_ITEMS, `LineItems!${mCol}${actualRow}`, [[margin]]);
    return true;
  } catch (err) {
    console.error('[mapService] updateLineItemRate failed:', err);
    return false;
  }
}

/**
 * Import a project from the new EXTRACTION_PROMPT.md JSON format.
 * Handles unified structures[], line_items[], nested gps { lat, lng }.
 */
export async function importProjectFromExtraction(extractionData, projectId) {
  const online = await checkDbConnection();
  if (!online) return { success: false, error: 'Database offline' };

  const errors = [];
  const counts = { project: 0, segments: 0, structures: 0, splicePoints: 0, lineItems: 0 };

  const proj = extractionData.project || {};
  const segments = extractionData.segments || [];
  const structures = extractionData.structures || [];
  const splicePoints = extractionData.splice_points || [];
  const lineItems = extractionData.line_items || [];

  console.log(`[importProjectFromExtraction] ${segments.length} SEG, ${structures.length} STRUCT, ${splicePoints.length} SP, ${lineItems.length} LI`);

  // 1. Project row
  try {
    const row = [[
      projectId,
      proj.client || 'Vexus',
      proj.name || '',
      proj.work_order_number || '',
      '', // total_value — computed later
      proj.date_received || '',
      '', // completion_date
      'Active',
      '', // map_pdf_url
      '', // work_order_pdf_url
      proj.rate_card || 'vexus-la-tx-2026',
      new Date().toISOString(),
      'matt@lytcomm.com',
    ]];
    const ok = await appendRow(DB.PROJECTS, row);
    if (ok) counts.project = 1;
    else errors.push('Failed to write project');
  } catch (err) {
    errors.push(`Project: ${err.message}`);
  }

  // 2. Segments
  for (const seg of segments) {
    try {
      const gpsStartLat = seg.gps_start?.lat || '';
      const gpsStartLng = seg.gps_start?.lng || '';
      const gpsEndLat = seg.gps_end?.lat || '';
      const gpsEndLng = seg.gps_end?.lng || '';

      const boreCode = seg.duct_count <= 3 ? `UG${seg.duct_count}` : 'UG16';
      const row = [[
        seg.segment_id || `${projectId}-SEG-${counts.segments + 1}`,
        projectId,
        '', // contractor_id
        '', // section
        '', '', // from/to structure
        seg.footage || 0,
        seg.street_name || seg.description || '',
        gpsStartLat, gpsStartLng,
        gpsEndLat, gpsEndLng,
        boreCode,
        seg.footage || 0,
        seg.duct_count || 1,
        'UG4', // pull code
        seg.footage || 0,
        seg.cable_type || '',
        'Not Started',
        '', '', '', '', '', '', '', '',
        'Not Started',
        '', '', '', '', '', '', '', '',
      ]];
      const ok = await appendRow(DB.SEGMENTS, row);
      if (ok) counts.segments++;
      else errors.push(`Segment ${seg.segment_id}`);
    } catch (err) {
      errors.push(`Segment: ${err.message}`);
    }
  }

  // 3. Structures — split by type into existing sheets
  for (const struct of structures) {
    try {
      const gpsLat = struct.gps?.lat || '';
      const gpsLng = struct.gps?.lng || '';
      const t = struct.type || '';

      if (t === 'handhole') {
        const row = [[
          struct.id || `${projectId}-HH-${counts.structures + 1}`,
          projectId, '', struct.size || '', struct.unit_code || 'UG17',
          1, '', gpsLat, gpsLng, 'Not Started', new Date().toISOString(),
        ]];
        await appendRow(DB.HANDHOLES, row);
      } else if (t === 'flowerpot') {
        const row = [[
          struct.id || `${projectId}-FP-${counts.structures + 1}`,
          projectId, '', struct.unit_code || 'UG12', 1,
          gpsLat, gpsLng, 'Not Started', new Date().toISOString(),
        ]];
        await appendRow(DB.FLOWERPOTS, row);
      } else if (t === 'ground_rod') {
        const row = [[
          struct.id || `${projectId}-GR-${counts.structures + 1}`,
          projectId, struct.unit_code || 'UG13', 1, '', new Date().toISOString(),
        ]];
        await appendRow(DB.GROUND_RODS, row);
      } else if (t === 'terminal_box' || t === 'pedestal' || t === 'marker_post' || t === 'aux_ground') {
        // Store in Handholes sheet with type column
        const row = [[
          struct.id || `${projectId}-${t.toUpperCase().replace('_', '')}-${counts.structures + 1}`,
          projectId, '', t, struct.unit_code || 'UG20',
          1, '', gpsLat, gpsLng, 'Not Started', new Date().toISOString(),
        ]];
        await appendRow(DB.HANDHOLES, row);
      }
      counts.structures++;
    } catch (err) {
      errors.push(`Structure ${struct.id}: ${err.message}`);
    }
  }

  // 4. Splice points
  for (const sp of splicePoints) {
    try {
      const gpsLat = sp.gps?.lat || '';
      const gpsLng = sp.gps?.lng || '';
      const row = [[
        sp.splice_id || `${projectId}-SP-${counts.splicePoints + 1}`,
        projectId,
        '', // contractor_id
        sp.handhole_id || '',
        '', // handhole_type
        sp.splice_type || 'ring_cut',
        '', // position_type
        sp.fiber_count || 0,
        1, // tray_count
        gpsLat, gpsLng,
        'Not Started',
        '', '', '', '', '',
        7, 0, 8, '', 0,
      ]];
      const ok = await appendRow(DB.SPLICE_POINTS, row);
      if (ok) counts.splicePoints++;
      else errors.push(`Splice ${sp.splice_id}`);
    } catch (err) {
      errors.push(`Splice: ${err.message}`);
    }
  }

  // 5. Line items
  if (lineItems.length > 0) {
    const liResult = await importLineItems(projectId, lineItems, proj.rate_card || 'vexus-la-tx-2026');
    counts.lineItems = liResult.imported || 0;
    if (liResult.errors) errors.push(...liResult.errors);
  }

  console.log(`[importProjectFromExtraction] Done: ${JSON.stringify(counts)}, errors: ${errors.length}`);

  return {
    success: errors.length === 0,
    counts,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Load full project including line items.
 */
export async function loadFullProjectWithLineItems(projectId) {
  const base = await loadFullProject(projectId);
  const lineItems = await loadLineItems(projectId);
  return { ...base, lineItems };
}

export { DB };

// v4.0.0 - All billables: handholes, flowerpots, ground_rods, segments, splice_points
// v4.1.0 - Added LINE_ITEMS support, importProjectFromExtraction, rate card integration
