/**
 * LYT Communications - Map & Project Configuration
 * Version: 1.2.0
 * Created: 2026-02-02
 * Updated: 2026-02-04
 *
 * Central configuration for the Project Map System including
 * status colors, map icons, billing rates, PM thresholds, and project constants.
 */

// Google Maps API key (public, restricted by HTTP referrer to lytcomm.com)
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCbZXQimBAuIRXJQNq64VjF94FD35JOvLs';

// Segment status color coding
export const STATUS_COLORS = {
  NOT_STARTED: '#FF4444',
  IN_PROGRESS: '#FFB800',
  COMPLETE: '#4CAF50',
  QC_APPROVED: '#2196F3',
  BLOCKED: '#9E9E9E',
  ISSUE: '#FF9800',
  CRITICAL_PATH: '#2196F3',
};

// Map marker icons by type
export const MAP_ICONS = {
  HANDHOLE_15x20x12: '📦',
  HANDHOLE_17x30x18: '🔷',
  HANDHOLE_30x48x24: '🔶',
  SPLICE_1X4: '🔍',
  SPLICE_1X8: '🔌',
  SPLICE_F1: '🔵',
  CREW_BORING: '🚧',
  CREW_PULLING: '🚛',
  CREW_SPLICING: '⚡',
  UTILITY_CROSSING: '⚠️',
  ISSUE: '🚨',
};

// Photo requirements by splice type
export const PHOTO_REQUIREMENTS = {
  '1x4': {
    enclosureCount: 7,
    pmPhotoCount: 2, // 1 photo per splitter (not per reading)
    totalPhotos: 9, // 7 enclosure + 2 PM photos
    enclosureTypes: [
      'Basket',
      'Splice tray',
      'Attached strength members',
      'Grommets from inside',
      'Completed enclosure closed',
      'Cables entering enclosure',
      'Enclosure in ground',
    ],
    splitterCount: 2,
    pmReadingCount: 8, // 8 readings total, but only 2 photos
    splitters: [
      { name: 'Splitter A', ports: ['SA1P1', 'SA1P2', 'SA1P3', 'SA1P4'] },
      { name: 'Splitter B', ports: ['SB1P5', 'SB1P6', 'SB1P7', 'SB1P8'] },
    ],
  },
  '1x8': {
    enclosureCount: 8,
    pmReadingCount: 0, // No PM testing at 1x8/2x8 locations
    totalPhotos: 8,
    enclosureTypes: [
      'Basket',
      'Splitter tray',
      'Splice tray',
      'Attached strength members',
      'Grommets from inside',
      'Completed enclosure closed',
      'Cables entering enclosure',
      'Enclosure in ground',
    ],
  },
  '2x8': {
    enclosureCount: 8,
    pmReadingCount: 0, // No PM testing at 2x8 hub locations
    totalPhotos: 8,
    enclosureTypes: [
      'Basket',
      'Splitter tray',
      'Splice tray',
      'Attached strength members',
      'Grommets from inside',
      'Completed enclosure closed',
      'Cables entering enclosure',
      'Enclosure in ground',
    ],
  },
  'F1': {
    baseCount: 5,
    perTray: 1,
    pmReadingCount: 0,
    baseTypes: [
      'Basket',
      'Strength members and grounds attached',
      'Completed enclosure exterior (closed)',
      'Cable entry with plugs/grommets',
      'Enclosure in handhole',
    ],
    trayPrefix: 'Splice tray',
  },
  'TYCO-D': {
    baseCount: 5,
    perTray: 1,
    pmReadingCount: 0,
    baseTypes: [
      'Basket',
      'Strength members and grounds attached',
      'Completed enclosure exterior (closed)',
      'Cable entry with plugs/grommets',
      'Enclosure in handhole',
    ],
    trayPrefix: 'Splice tray',
  },
};

// Power Meter Thresholds (FTTH Standard)
// These determine pass/fail status for PM readings at 1x4 locations
// TODO: Make adjustable in website settings
export const PM_THRESHOLDS = {
  pass: { min: -25, max: -8 },      // Good signal: -8 to -25 dBm
  warning: { min: -28, max: -25 },  // Marginal: -25 to -28 dBm (investigate)
  failWeak: { max: -28 },           // Too much loss: weaker than -28 dBm
  failStrong: { min: -8 },          // Could overload ONT: stronger than -8 dBm
};

// PM Reading statuses
export const PM_STATUS = {
  PENDING: 'pending',
  NO_LIGHT: 'no_light',  // Fiber not yet lit - timestamp and complete later
  PASS: 'pass',
  WARNING: 'warning',
  FAIL: 'fail',
};

// Helper function to evaluate PM reading status
export function evaluatePMReading(dBm) {
  if (dBm === null || dBm === undefined) return PM_STATUS.PENDING;
  if (dBm > PM_THRESHOLDS.pass.max) return PM_STATUS.FAIL; // Too strong
  if (dBm < PM_THRESHOLDS.failWeak.max) return PM_STATUS.FAIL; // Too weak
  if (dBm < PM_THRESHOLDS.warning.max) return PM_STATUS.WARNING; // Marginal
  return PM_STATUS.PASS;
}

// Vexus LA/TX 2026 Rate Card
export const RATE_CARDS = {
  'vexus-la-tx-2026': {
    customer: 'Vexus Fiber',
    effectiveDate: '2026-01-01',
    rates: {
      // Underground Boring
      UG1:  { description: 'Directional bore 1-4 ducts (1.25" ID)', uom: 'LF', price: 8.00 },
      UG23: { description: 'Directional bore 5 ducts (1.25" ID)', uom: 'LF', price: 9.50 },
      UG24: { description: 'Directional bore 6 ducts (1.25" ID)', uom: 'LF', price: 10.50 },
      // Cable Pulling
      UG4:  { description: 'Pull up to 144ct armored/micro cable', uom: 'LF', price: 0.55 },
      UG28: { description: 'Place 288-432ct armored fiber in duct', uom: 'LF', price: 1.00 },
      // Splicing
      FS1:  { description: 'Fusion splice 1 fiber', uom: 'EA', price: 16.50 },
      FS2:  { description: 'Ring cut (mid-span terminals)', uom: 'EA', price: 275.00 },
      FS3:  { description: 'Test Fiber (OTDR/power meter)', uom: 'EA', price: 6.60 },
      FS4:  { description: 'ReEnter/Install Enclosure (end-of-line)', uom: 'EA', price: 137.50 },
      // Handholes
      UG10: { description: '30x48x30 fiberglass/polycrete', uom: 'EA', price: 310.00 },
      UG11: { description: '24x36x24 fiberglass/polycrete', uom: 'EA', price: 110.00 },
      UG12: { description: 'Utility Box', uom: 'EA', price: 20.00 },
      UG13: { description: 'Ground rod 5/8" x 8\'', uom: 'EA', price: 40.00 },
      UG17: { description: '17x30x18 HDPE handhole', uom: 'EA', price: 60.00 },
      UG18: { description: '24x36x18 HDPE handhole', uom: 'EA', price: 125.00 },
      UG19: { description: '30x48x18 HDPE handhole', uom: 'EA', price: 250.00 },
      UG20: { description: 'Terminal Box', uom: 'EA', price: 40.00 },
      UG27: { description: '30x48x24 HDPE handhole', uom: 'EA', price: 210.00 },
    },
  },
};

// Workflow phase order
export const WORKFLOW_PHASES = ['boring', 'pulling', 'splicing'];

// Status transitions allowed per phase
export const STATUS_TRANSITIONS = {
  boring: {
    'Not Started': ['In Progress'],
    'In Progress': ['Complete', 'Issue'],
    'Complete': ['QC Approved', 'Issue'],
    'QC Approved': [],
    'Issue': ['In Progress'],
  },
  pulling: {
    'Not Started': ['In Progress'],
    'In Progress': ['Complete', 'Issue'],
    'Complete': ['QC Approved', 'Issue'],
    'QC Approved': [],
    'Issue': ['In Progress'],
  },
  splicing: {
    'Not Started': ['In Progress'],
    'In Progress': ['Complete', 'Issue'],
    'Complete': ['QC Approved', 'Issue'],
    'QC Approved': [],
    'Issue': ['In Progress'],
  },
};

// Handhole type mapping
export const HANDHOLE_TYPES = {
  '15x20x12': { label: 'Terminal Box (TB)', size: 'small', icon: MAP_ICONS.HANDHOLE_15x20x12, unitCode: 'UG20' },
  '17x30x18': { label: 'HDPE Handhole (B)', size: 'medium', icon: MAP_ICONS.HANDHOLE_17x30x18, unitCode: 'UG17' },
  '24x36x18': { label: 'HDPE Handhole', size: 'medium', icon: MAP_ICONS.HANDHOLE_17x30x18, unitCode: 'UG18' },
  '24x36x24': { label: 'Fiberglass/Polycrete', size: 'medium', icon: MAP_ICONS.HANDHOLE_17x30x18, unitCode: 'UG11' },
  '30x48x18': { label: 'HDPE Handhole', size: 'large', icon: MAP_ICONS.HANDHOLE_30x48x24, unitCode: 'UG19' },
  '30x48x24': { label: 'HDPE Large Handhole (LHH)', size: 'large', icon: MAP_ICONS.HANDHOLE_30x48x24, unitCode: 'UG27' },
  '30x48x30': { label: 'Fiberglass/Polycrete', size: 'large', icon: MAP_ICONS.HANDHOLE_30x48x24, unitCode: 'UG10' },
};

// Role-based permissions
export const PERMISSIONS = {
  Admin: {
    canViewAllProjects: true,
    canCreateProjects: true,
    canDeleteProjects: true,
    canAssignWork: true,
    canApproveQC: true,
    canGenerateInvoices: true,
    canManageUsers: true,
    canViewRateCard: true,
    canViewOtherContractors: true,
  },
  Contractor: {
    canViewAssignedWork: true,
    canUpdateStatus: true,
    canUploadPhotos: true,
    canReportIssues: true,
    canViewRateCard: false,
    canViewOtherContractors: false,
  },
  Employee: {
    canViewAssignedWork: true,
    canUpdateStatus: true,
    canUploadPhotos: true,
    canReportIssues: true,
    canViewAllProjects: true,
    canViewRateCard: false,
  },
  'QC Inspector': {
    canViewAllWork: true,
    canApproveWork: true,
    canRejectWork: true,
    canViewPhotos: true,
    canAddQCNotes: true,
  },
};

// Mobile breakpoints
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1440,
};

// Google Sheets database config
export const SHEETS_CONFIG = {
  projects: 'Projects',
  segments: 'Segments',
  splicePoints: 'Splice Points',
  assignments: 'Assignments',
  rateCards: 'Rate Cards',
  users: 'Users',
  workLog: 'Work Log',
  issues: 'Issues',
};

// v1.2.0 - Added PM thresholds, updated photo requirements with PM reading counts
