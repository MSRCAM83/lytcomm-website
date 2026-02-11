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

// Vexus LA/TX 2026 Master Rate Card — ALL unit codes
// vexus = what Vexus pays LYT, default_contractor = starting contractor rate (adjustable per project)
// CRITICAL: Contractors NEVER see vexus rates or margins
export const VEXUS_RATES = {
  // Aerial
  AE1:    { description: 'Place 6M strand', uom: 'LF', vexus: 0.65, default_contractor: 0.50 },
  AE2:    { description: 'Lash Cable up to 144F on new strand', uom: 'LF', vexus: 0.80, default_contractor: 0.60 },
  AE3:    { description: 'Overlash to existing up to 144F', uom: 'LF', vexus: 0.80, default_contractor: 0.60 },
  'AE3.1': { description: 'Lash/Overlash larger than 144F', uom: 'LF', vexus: 1.20, default_contractor: 0.90 },
  AE4:    { description: 'Place Down Guy incl Guy Guard', uom: 'EA', vexus: 17.40, default_contractor: 14.00 },
  AE5:    { description: 'Place Screw Anchor 6000 lbs', uom: 'EA', vexus: 42.60, default_contractor: 30.00 },
  AE6:    { description: 'Place Guy Guard', uom: 'EA', vexus: 0.00, default_contractor: 0.00 },
  AE7:    { description: 'Place 2in Riser Guard', uom: 'EA', vexus: 40.00, default_contractor: 30.00 },
  AE8:    { description: 'Place ADSS cable', uom: 'LF', vexus: 0.48, default_contractor: 0.40 },
  AE9L:   { description: 'Cable Extension Arm Long', uom: 'EA', vexus: 65.00, default_contractor: 50.00 },
  AE9S:   { description: 'Cable Extension Arm Short/Sidewalk', uom: 'EA', vexus: 55.00, default_contractor: 40.00 },
  AE10:   { description: 'Tree Trimming', uom: 'Span', vexus: 35.00, default_contractor: 25.00 },
  AE11:   { description: 'Resag cable', uom: 'Span', vexus: 30.00, default_contractor: 25.00 },
  AE12:   { description: 'Delash/relash', uom: 'LF', vexus: 0.80, default_contractor: 0.60 },
  AE13:   { description: 'Dead end Pole Transfer', uom: 'EA', vexus: 65.00, default_contractor: 50.00 },
  AE14:   { description: 'Straight thru Pole Transfer', uom: 'EA', vexus: 45.00, default_contractor: 35.00 },
  AE15:   { description: 'Bonding aerial strand', uom: 'EA', vexus: 10.00, default_contractor: 8.00 },
  AE17:   { description: 'Place Aerial Damper Unit', uom: 'EA', vexus: 25.00, default_contractor: 20.00 },
  AE18:   { description: 'Place Tree/Squirrel Guard', uom: 'LF', vexus: 0.32, default_contractor: 0.25 },
  AE19:   { description: 'Remobilize temp to permanent pole attachment', uom: 'EA', vexus: 45.00, default_contractor: 35.00 },
  AE31:   { description: 'Figure 8 cable up to 144F dip transition', uom: 'EA', vexus: 30.00, default_contractor: 22.00 },
  'AE31.1': { description: 'Figure 8 cable larger than 144F dip transition', uom: 'LF', vexus: 1.20, default_contractor: 0.90 },
  // Fiber Splicing
  FS1:    { description: 'Fusion splice 1 fiber', uom: 'EA', vexus: 16.50, default_contractor: 13.00 },
  FS2:    { description: 'Ring cut', uom: 'EA', vexus: 275.00, default_contractor: 180.00 },
  FS3:    { description: 'Test Fiber', uom: 'EA', vexus: 6.60, default_contractor: 5.00 },
  FS4:    { description: 'ReEnter/Install Enclosure', uom: 'EA', vexus: 137.50, default_contractor: 100.00 },
  FS05:   { description: 'Ribbon splice', uom: 'EA', vexus: 16.50, default_contractor: 13.00 },
  // Underground — Boring
  UG1:    { description: 'Directional bore 1x 1.25in subduct', uom: 'LF', vexus: 8.00, default_contractor: 6.00 },
  UG2:    { description: 'Directional bore 2x 1.25in subduct', uom: 'LF', vexus: 8.00, default_contractor: 6.00 },
  UG3:    { description: 'Directional bore 3x 1.25in subduct', uom: 'LF', vexus: 8.00, default_contractor: 6.00 },
  UG16:   { description: 'Directional bore 4x 1.25in subduct', uom: 'LF', vexus: 8.50, default_contractor: 6.50 },
  UG23:   { description: 'Directional bore 5x 1.25in subduct', uom: 'LF', vexus: 9.50, default_contractor: 7.00 },
  UG24:   { description: 'Directional bore 6x 1.25in subduct', uom: 'LF', vexus: 10.50, default_contractor: 8.00 },
  UG21:   { description: '4in HDPE Duct Install bore', uom: 'LF', vexus: 8.25, default_contractor: 6.00 },
  UG29:   { description: 'Bore 1x 2in duct', uom: 'LF', vexus: 8.00, default_contractor: 6.00 },
  UG30:   { description: 'Bore 2x 2in duct', uom: 'LF', vexus: 8.00, default_contractor: 6.00 },
  UG32:   { description: 'Cut/bore/saw', uom: 'LF', vexus: 8.00, default_contractor: 6.00 },
  // Underground — Pulling
  UG4:    { description: 'Pull up to 144ct armored/all micro cable in duct', uom: 'LF', vexus: 0.55, default_contractor: 0.40 },
  UG22:   { description: 'Pull inner duct', uom: 'LF', vexus: 0.60, default_contractor: 0.45 },
  UG28:   { description: 'Pull 288-432ct armored fiber in duct', uom: 'LF', vexus: 1.00, default_contractor: 0.60 },
  // Underground — Direct Bury
  UG5:    { description: 'Direct Bury Cable - Plow', uom: 'LF', vexus: 2.10, default_contractor: 1.50 },
  UG6:    { description: 'Direct Bury Cable add depth 6in increments', uom: 'EA', vexus: 0.50, default_contractor: 0.40 },
  UG7:    { description: 'Direct Bury Pipe - Plow', uom: 'LF', vexus: 2.10, default_contractor: 1.60 },
  UG8:    { description: 'Direct Bury Pipe add duct', uom: 'LF', vexus: 0.50, default_contractor: 0.40 },
  // Underground — Structures
  UG9:    { description: 'Buried plant Pedestal', uom: 'EA', vexus: 40.00, default_contractor: 30.00 },
  UG10:   { description: 'Fiberglass/polycrete Handhole 30x48x30', uom: 'EA', vexus: 310.00, default_contractor: 240.00 },
  UG11:   { description: 'Fiberglass/polycrete Handhole 24x36x24', uom: 'EA', vexus: 110.00, default_contractor: 85.00 },
  UG12:   { description: 'Utility Box / Flowerpot', uom: 'EA', vexus: 20.00, default_contractor: 16.00 },
  UG13:   { description: 'Ground rod 5/8in x 8ft', uom: 'EA', vexus: 40.00, default_contractor: 30.00 },
  UG14:   { description: 'Locate Marker post / Aux Ground Assembly', uom: 'EA', vexus: 18.00, default_contractor: 14.00 },
  UG15:   { description: 'Route Marker Post', uom: 'EA', vexus: 12.00, default_contractor: 9.00 },
  UG17:   { description: 'HDPE Handhole 17x30x18', uom: 'EA', vexus: 60.00, default_contractor: 48.00 },
  UG18:   { description: 'HDPE Handhole 24x36x18', uom: 'EA', vexus: 125.00, default_contractor: 100.00 },
  UG19:   { description: 'HDPE Handhole 30x48x18', uom: 'EA', vexus: 250.00, default_contractor: 200.00 },
  UG20:   { description: 'Terminal Box', uom: 'EA', vexus: 40.00, default_contractor: 30.00 },
  UG27:   { description: 'HDPE Handhole 30x48x24', uom: 'EA', vexus: 210.00, default_contractor: 160.00 },
  UG31:   { description: 'Ground rod clamp/wire into marker post', uom: 'EA', vexus: 15.00, default_contractor: 12.00 },
  // Poles
  PP1:    { description: 'Place Pole 35ft Class 7', uom: 'EA', vexus: 360.00, default_contractor: 280.00 },
  PP2:    { description: 'Hand Carry/Set in rear Easement', uom: 'EA', vexus: 100.00, default_contractor: 80.00 },
  PP3:    { description: 'Detach and Remove Pole up to 35ft', uom: 'EA', vexus: 200.00, default_contractor: 160.00 },
  BCP:    { description: 'Pole Banding', uom: 'EA', vexus: 0.00, default_contractor: 0.00 },
  // Restoration
  PA01:   { description: 'Place Asphalt up to 4in', uom: 'SF', vexus: 20.00, default_contractor: 15.00 },
  PA02:   { description: 'Place Asphalt over 4in up to 8in', uom: 'SF', vexus: 30.00, default_contractor: 24.00 },
  PA02A:  { description: 'Place Asphalt over 8in depth additive', uom: 'SF', vexus: 3.00, default_contractor: 2.25 },
  PC01:   { description: 'Place Concrete up to 4in', uom: 'SF', vexus: 30.00, default_contractor: 20.00 },
  PC02:   { description: 'Place Concrete over 4in up to 8in', uom: 'SF', vexus: 40.00, default_contractor: 30.00 },
  PC02A:  { description: 'Place Concrete over 8in depth additive', uom: 'SF', vexus: 4.00, default_contractor: 3.00 },
  RA1:    { description: 'Remove Asphalt', uom: 'CF', vexus: 20.00, default_contractor: 15.00 },
  RC1:    { description: 'Remove Concrete', uom: 'CF', vexus: 40.00, default_contractor: 30.00 },
  // Other
  HSPH:   { description: 'Hardscape Potholing', uom: 'EA', vexus: 200.00, default_contractor: 150.00 },
  TC1:    { description: 'Traffic control personnel', uom: 'HR', vexus: 40.00, default_contractor: 30.00 },
  // Hourly Personnel (T&M / Extra Work)
  L10A:   { description: 'Foreman', uom: 'HR', vexus: 45.00, default_contractor: 35.00 },
  L30A:   { description: 'Lineman', uom: 'HR', vexus: 40.00, default_contractor: 30.00 },
  L40A:   { description: 'Technician', uom: 'HR', vexus: 40.00, default_contractor: 30.00 },
  L50A:   { description: 'Laborer', uom: 'HR', vexus: 35.00, default_contractor: 25.00 },
  L70A:   { description: 'Supervisor', uom: 'HR', vexus: 75.00, default_contractor: 55.00 },
  // Hourly Equipment (T&M / Extra Work)
  E10:    { description: 'Pickup truck', uom: 'HR', vexus: 9.00, default_contractor: 7.00 },
  E20:    { description: 'Directional drill', uom: 'HR', vexus: 115.00, default_contractor: 90.00 },
  E30:    { description: 'Mini excavator', uom: 'HR', vexus: 45.00, default_contractor: 35.00 },
  E40:    { description: 'Backhoe', uom: 'HR', vexus: 55.00, default_contractor: 42.00 },
  E50:    { description: 'Trailer', uom: 'HR', vexus: 12.00, default_contractor: 9.00 },
  E60:    { description: 'Air compressor', uom: 'HR', vexus: 18.00, default_contractor: 14.00 },
  E70:    { description: 'Generator', uom: 'HR', vexus: 15.00, default_contractor: 12.00 },
  E80:    { description: 'Cable reel trailer', uom: 'HR', vexus: 15.00, default_contractor: 12.00 },
  E82:    { description: 'Fusion splicer', uom: 'HR', vexus: 25.00, default_contractor: 20.00 },
};

// v1.2.0 - Added PM thresholds, updated photo requirements with PM reading counts
// v1.3.0 - Added VEXUS_RATES master rate card with dual pricing
