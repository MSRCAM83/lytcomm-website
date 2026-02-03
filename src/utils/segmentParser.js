/**
 * LYT Communications - Segment Parser
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Parses construction map data to identify:
 * - Handhole locations and IDs (A, A01, A02, B, B01, etc.)
 * - Segment footage (numbers along fiber routes)
 * - Splice point locations (TYCO-D markers, 1x4 symbols)
 * - Section boundaries (A, B, C, D, E, F)
 * - Street names
 * - Utility crossing locations
 * 
 * Works with both AI-extracted text and manual data entry.
 */

import { HANDHOLE_TYPES } from '../config/mapConfig';
import { generateSegmentId, generateSpliceId } from './idGenerator';

/**
 * Parse raw text from a construction map PDF into structured segment data
 * @param {string} rawText - Extracted text from construction map PDF
 * @param {string} projectCode - Project code (e.g., VXS-SLPH01-006)
 * @returns {object} { segments: [], splicePoints: [], handholes: [], sections: [], errors: [] }
 */
export function parseMapText(rawText, projectCode) {
  const result = {
    segments: [],
    splicePoints: [],
    handholes: [],
    sections: [],
    errors: [],
  };

  if (!rawText || !projectCode) {
    result.errors.push('Missing raw text or project code');
    return result;
  }

  try {
    // Extract handholes
    result.handholes = extractHandholes(rawText);

    // Extract segments (connections between handholes with footage)
    result.segments = extractSegments(rawText, result.handholes, projectCode);

    // Extract splice points
    result.splicePoints = extractSplicePoints(rawText, result.handholes, projectCode);

    // Identify sections
    result.sections = identifySections(result.handholes);

  } catch (err) {
    result.errors.push(`Parse error: ${err.message}`);
  }

  return result;
}

/**
 * Extract handhole locations from map text
 * Looks for patterns like: A (17x30x18), A01 (15x20x12), B (30x48x24)
 */
export function extractHandholes(text) {
  const handholes = [];
  const seen = new Set();

  // Pattern: letter+optional_number + handhole size in parens
  // e.g., "A (17x30x18)", "A01 (15x20x12)", "B05 (17x30x18)"
  const hhPattern = /\b([A-Z]\d{0,3})\s*\((\d{1,2}x\d{1,2}x\d{1,2})\s*(?:TB|B|LHH)?\)/gi;
  let match;

  while ((match = hhPattern.exec(text)) !== null) {
    const id = match[1].toUpperCase();
    const size = match[2];

    if (seen.has(id)) continue;
    seen.add(id);

    const typeInfo = HANDHOLE_TYPES[size] || { label: `Unknown (${size})`, size: 'medium' };

    handholes.push({
      id,
      size,
      type: typeInfo.label,
      sizeCategory: typeInfo.size,
      unitCode: typeInfo.unitCode || '',
      section: id.replace(/\d+/g, ''),
      isHub: /^[A-Z]$/.test(id), // Single letter = hub/main handhole
    });
  }

  return handholes.sort((a, b) => {
    // Sort by section letter, then by number
    const secA = a.section;
    const secB = b.section;
    if (secA !== secB) return secA.localeCompare(secB);
    const numA = parseInt(a.id.replace(/[A-Z]/g, '') || '0');
    const numB = parseInt(b.id.replace(/[A-Z]/g, '') || '0');
    return numA - numB;
  });
}

/**
 * Extract segments (fiber paths between handholes) with footage
 * Looks for patterns like: A→A01: 148 LF, or "148" between handhole references
 */
export function extractSegments(text, handholes, projectCode) {
  const segments = [];
  const hhIds = new Set(handholes.map(h => h.id));

  // Pattern 1: Explicit "FROM→TO: FOOTAGE LF" or "FROM to TO 148 LF"
  const segPattern = /\b([A-Z]\d{0,3})\s*(?:→|->|to)\s*([A-Z]\d{0,3})\s*[:=]?\s*(\d+)\s*(?:LF|ft|feet)?/gi;
  let match;

  while ((match = segPattern.exec(text)) !== null) {
    const from = match[1].toUpperCase();
    const to = match[2].toUpperCase();
    const footage = parseInt(match[3]);

    if (!hhIds.has(from) || !hhIds.has(to)) continue;
    if (footage < 1 || footage > 10000) continue; // Sanity check

    const section = from.replace(/\d+/g, '');
    const segmentId = generateSegmentId(projectCode, section, from, to);

    segments.push({
      segment_id: segmentId,
      contractor_id: `${from}→${to}`,
      project_id: projectCode,
      section,
      from_handhole: from,
      to_handhole: to,
      footage,
      from_hh: handholes.find(h => h.id === from),
      to_hh: handholes.find(h => h.id === to),
      boring_status: 'Not Started',
      pulling_status: 'Not Started',
    });
  }

  return segments;
}

/**
 * Extract splice points from map text
 * Identifies 1x4, 1x8, F1, TYCO-D splice locations
 */
export function extractSplicePoints(text, handholes, projectCode) {
  const splicePoints = [];

  // Pattern: handhole ID + splice type indicator
  const splicePatterns = [
    { pattern: /\b([A-Z]\d{0,3})\s*[-–]\s*(?:1x4|1×4)\s*(?:terminal)?/gi, type: '1x4', fiberCount: 2, trayCount: 1 },
    { pattern: /\b([A-Z]\d{0,3})\s*[-–]\s*(?:1x8|1×8)\s*(?:splitter)?/gi, type: '1x8', fiberCount: 2, trayCount: 1 },
    { pattern: /\b([A-Z]\d{0,3})\s*[-–]\s*(?:TYCO-?D|F1)\s*(?:butt\s*splice)?/gi, type: 'F1', fiberCount: 432, trayCount: 8 },
  ];

  const seen = new Set();

  for (const { pattern, type, fiberCount, trayCount } of splicePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const locationId = match[1].toUpperCase();
      const key = `${locationId}-${type}`;

      if (seen.has(key)) continue;
      seen.add(key);

      const hh = handholes.find(h => h.id === locationId);
      const spliceId = generateSpliceId(projectCode, locationId);

      // Determine position type based on handhole connections
      const isEndOfLine = hh && !hh.isHub;

      splicePoints.push({
        splice_id: spliceId,
        project_id: projectCode,
        contractor_id: locationId,
        location: `Handhole ${locationId}${hh ? ` (${hh.size})` : ''}`,
        handhole_type: hh?.size || 'unknown',
        splice_type: type,
        position_type: isEndOfLine ? 'end-of-line' : 'mid-span',
        fiber_count: fiberCount,
        tray_count: trayCount,
        status: 'Not Started',
      });
    }
  }

  return splicePoints;
}

/**
 * Identify unique sections from handhole data
 */
export function identifySections(handholes) {
  const sectionMap = {};

  for (const hh of handholes) {
    const sec = hh.section;
    if (!sectionMap[sec]) {
      sectionMap[sec] = {
        id: sec,
        handholes: [],
        hubHandhole: null,
      };
    }
    sectionMap[sec].handholes.push(hh.id);
    if (hh.isHub) {
      sectionMap[sec].hubHandhole = hh.id;
    }
  }

  return Object.values(sectionMap);
}

/**
 * Parse work order text to extract project metadata
 * @param {string} text - Extracted text from work order PDF
 * @returns {object} Project metadata
 */
export function parseWorkOrderText(text) {
  const project = {
    project_name: '',
    customer: '',
    po_number: '',
    total_value: 0,
    start_date: '',
    completion_date: '',
    unit_items: [],
  };

  if (!text) return project;

  // Extract PO number
  const poMatch = text.match(/(?:PO|Purchase\s*Order)\s*#?\s*:?\s*(\d{5,10})/i);
  if (poMatch) project.po_number = poMatch[1];

  // Extract dates
  const datePattern = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/g;
  const dates = [];
  let dateMatch;
  while ((dateMatch = datePattern.exec(text)) !== null) {
    dates.push(dateMatch[1]);
  }
  if (dates.length >= 1) project.start_date = dates[0];
  if (dates.length >= 2) project.completion_date = dates[dates.length - 1];

  // Extract unit items (unit code + quantity + rate)
  const unitPattern = /\b(UG\d{1,2}|FS\d{1,2})\s+.*?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:LF|EA|SF|CF|HR)\s+\$?([\d,]+\.?\d*)/gi;
  let unitMatch;
  while ((unitMatch = unitPattern.exec(text)) !== null) {
    project.unit_items.push({
      code: unitMatch[1].toUpperCase(),
      quantity: parseFloat(unitMatch[2].replace(/,/g, '')),
      rate: parseFloat(unitMatch[3].replace(/,/g, '')),
    });
  }

  // Calculate total
  project.total_value = project.unit_items.reduce(
    (sum, item) => sum + (item.quantity * item.rate),
    0
  );

  return project;
}

// v1.0.0
