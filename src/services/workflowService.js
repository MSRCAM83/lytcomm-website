/**
 * LYT Communications - Workflow Service
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Manages the three-phase construction workflow:
 * Boring → Pulling → Splicing
 * 
 * Enforces status transitions, QC approval gates,
 * and photo validation requirements.
 */

import { STATUS_TRANSITIONS, PHOTO_REQUIREMENTS, WORKFLOW_PHASES } from '../config/mapConfig';

/**
 * Check if a status transition is allowed
 * @param {string} phase - Current phase (boring, pulling, splicing)
 * @param {string} currentStatus - Current status string
 * @param {string} newStatus - Desired new status
 * @returns {boolean} Whether the transition is allowed
 */
export function canTransition(phase, currentStatus, newStatus) {
  const transitions = STATUS_TRANSITIONS[phase];
  if (!transitions || !transitions[currentStatus]) return false;
  return transitions[currentStatus].includes(newStatus);
}

/**
 * Get available next statuses for a segment
 * @param {string} phase - Current phase
 * @param {string} currentStatus - Current status
 * @returns {string[]} Array of valid next statuses
 */
export function getAvailableStatuses(phase, currentStatus) {
  const transitions = STATUS_TRANSITIONS[phase];
  if (!transitions || !transitions[currentStatus]) return [];
  return transitions[currentStatus];
}

/**
 * Check if a phase can begin based on prerequisite phase completion
 * @param {object} segment - Segment data object
 * @param {string} targetPhase - Phase to start
 * @returns {object} { allowed: boolean, reason: string }
 */
export function canStartPhase(segment, targetPhase) {
  const phaseIndex = WORKFLOW_PHASES.indexOf(targetPhase);
  
  if (phaseIndex === 0) {
    return { allowed: true, reason: 'Boring is the first phase' };
  }

  if (phaseIndex === 1) {
    // Pulling requires boring QC approved
    if (segment.boring_status !== 'QC Approved') {
      return {
        allowed: false,
        reason: 'Boring must be QC Approved before pulling can begin',
      };
    }
    return { allowed: true, reason: 'Boring QC approved' };
  }

  if (phaseIndex === 2) {
    // Splicing requires pulling QC approved
    if (segment.pulling_status !== 'QC Approved') {
      return {
        allowed: false,
        reason: 'Pulling must be QC Approved before splicing can begin',
      };
    }
    return { allowed: true, reason: 'Pulling QC approved' };
  }

  return { allowed: false, reason: 'Unknown phase' };
}

/**
 * Get required photo count for a splice type
 * @param {string} spliceType - '1x4', '1x8', 'F1', 'TYCO-D'
 * @param {number} trayCount - Number of trays (for F1/TYCO-D)
 * @returns {number} Required photo count
 */
export function getRequiredPhotoCount(spliceType, trayCount) {
  const req = PHOTO_REQUIREMENTS[spliceType];
  if (!req) return 0;
  
  if (req.count) return req.count;
  if (req.baseCount && req.perTray) {
    return req.baseCount + (trayCount * req.perTray) + 1; // +1 for basket
  }
  return 0;
}

/**
 * Get required photo type labels for a splice
 * @param {string} spliceType - Splice type
 * @param {number} trayCount - Number of trays (for F1/TYCO-D)
 * @returns {string[]} Array of required photo type labels
 */
export function getRequiredPhotoTypes(spliceType, trayCount) {
  const req = PHOTO_REQUIREMENTS[spliceType];
  if (!req) return [];

  if (req.types) return [...req.types];

  if (req.baseTypes && req.trayPrefix) {
    const photos = ['Basket'];
    for (let i = 1; i <= (trayCount || 1); i++) {
      photos.push(`${req.trayPrefix} #${i}`);
    }
    photos.push(...req.baseTypes.slice(1));
    return photos;
  }
  return [];
}

/**
 * Validate that all required photos have been uploaded
 * @param {string} spliceType - Splice type
 * @param {number} trayCount - Number of trays
 * @param {object} uploadedPhotos - Map of photoType → URL
 * @returns {object} { valid: boolean, missing: string[], uploaded: number, required: number }
 */
export function validatePhotos(spliceType, trayCount, uploadedPhotos) {
  const requiredTypes = getRequiredPhotoTypes(spliceType, trayCount);
  const uploaded = uploadedPhotos || {};
  const missing = requiredTypes.filter(type => !uploaded[type]);

  return {
    valid: missing.length === 0,
    missing,
    uploaded: requiredTypes.length - missing.length,
    required: requiredTypes.length,
  };
}

/**
 * Calculate segment progress percentage
 * @param {object} segment - Segment data
 * @returns {object} Progress by phase and overall
 */
export function calculateProgress(segment) {
  const statusWeight = {
    'Not Started': 0,
    'In Progress': 0.5,
    'Complete': 0.8,
    'QC Approved': 1.0,
    'Issue': 0.3,
  };

  const boringProgress = statusWeight[segment.boring_status] || 0;
  const pullingProgress = statusWeight[segment.pulling_status] || 0;
  const splicingProgress = segment.splicing_status 
    ? (statusWeight[segment.splicing_status] || 0) 
    : 0;

  // Boring = 40%, Pulling = 30%, Splicing = 30%
  const overall = (boringProgress * 0.4) + (pullingProgress * 0.3) + (splicingProgress * 0.3);

  return {
    boring: Math.round(boringProgress * 100),
    pulling: Math.round(pullingProgress * 100),
    splicing: Math.round(splicingProgress * 100),
    overall: Math.round(overall * 100),
  };
}

/**
 * Get the current active phase for a segment
 * @param {object} segment - Segment data
 * @returns {string} Current active phase name
 */
export function getCurrentPhase(segment) {
  if (segment.boring_status !== 'QC Approved') return 'boring';
  if (segment.pulling_status !== 'QC Approved') return 'pulling';
  return 'splicing';
}

/**
 * Calculate project-level progress
 * @param {object[]} segments - Array of segment data
 * @returns {object} Project progress stats
 */
export function calculateProjectProgress(segments) {
  if (!segments || segments.length === 0) {
    return { overall: 0, boring: 0, pulling: 0, splicing: 0, complete: 0, total: 0 };
  }

  let boringSum = 0;
  let pullingSum = 0;
  let splicingSum = 0;
  let completeCount = 0;

  segments.forEach(seg => {
    const progress = calculateProgress(seg);
    boringSum += progress.boring;
    pullingSum += progress.pulling;
    splicingSum += progress.splicing;
    if (progress.overall === 100) completeCount++;
  });

  const count = segments.length;
  return {
    overall: Math.round(((boringSum + pullingSum + splicingSum) / 3) / count),
    boring: Math.round(boringSum / count),
    pulling: Math.round(pullingSum / count),
    splicing: Math.round(splicingSum / count),
    complete: completeCount,
    total: count,
  };
}

// v1.0.0
