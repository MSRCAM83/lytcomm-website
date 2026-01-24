// LYT Communications - Configuration Constants

export const colors = {
  blue: '#0077B6',
  teal: '#00B4D8',
  green: '#39B54A',
  darkBlue: '#023E8A',
  dark: '#0a1628',
  darkLight: '#0d1b2a',
  coral: '#e85a4f',
  orange: '#ff6b35',
  white: '#ffffff',
  gray: '#6b7280',
  grayLight: '#9ca3af',
  grayDark: '#374151',
};

export const LYT_INFO = {
  name: 'LYT Communications',
  address: '12130 State Highway 3',
  city: 'Webster',
  state: 'TX',
  zip: '77598',
  phone: '(832) 850-3887',
  email: 'info@lytcomm.com',
  adminEmails: ['matt@lytcomm.com', 'mason@lytcomm.com', 'donnie@lytcomm.com'],
};

export const URLS = {
  // ONBOARDING Script (v5.5) - Handles employee/contractor form submissions
  // DO NOT USE FOR PORTAL - Use Gateway instead
  appsScript: 'https://script.google.com/macros/s/AKfycbw3cnZ7eZJu1wWovxE-_xKDyyWwPR2Mw3jqH05rjrF2XN00jqeaQW3S3aiRwXaxi2skJw/exec',
  
  // Claude Gateway - Used for Portal login, user management, sheets/email operations
  gateway: 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec',
  
  googleDriveFolder: '11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC',
  rateCardSheet: '10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4',
  usersSheet: '1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw',
  w4Pdf: '/Form%20W-4%20sign.pdf',
  w9Pdf: '/Form%20W-9%20sign.pdf',
  msaPdf: '/LYT_MSA_2026_AdobeSign_Full_v4_1.pdf',
};

// Onboarding invite code
export const INVITE_CODE = 'welcome2lyt';

// NDA invite code  
export const NDA_CODE = 'lytnda2026';

// Rate Card Data (embedded for reliability)
export const RATE_CARD = {
  updated: '2026-01-01',
  laborRates: [
    { position: 'Project Manager', rate: '$85/hr' },
    { position: 'Superintendent', rate: '$75/hr' },
    { position: 'Foreman', rate: '$65/hr' },
    { position: 'Lead Technician', rate: '$55/hr' },
    { position: 'Fiber Splicer', rate: '$52/hr' },
    { position: 'Lineman (Aerial)', rate: '$50/hr' },
    { position: 'Equipment Operator', rate: '$48/hr' },
    { position: 'Technician', rate: '$42/hr' },
    { position: 'Laborer', rate: '$35/hr' },
    { position: 'Flagger/Traffic Control', rate: '$32/hr' }
  ],
  equipmentRates: [
    { equipment: 'Directional Drill (Small)', rate: '$1,200/day' },
    { equipment: 'Directional Drill (Large)', rate: '$2,500/day' },
    { equipment: 'Mini Excavator', rate: '$450/day' },
    { equipment: 'Backhoe', rate: '$500/day' },
    { equipment: 'Bucket Truck (40ft)', rate: '$600/day' },
    { equipment: 'Bucket Truck (55ft+)', rate: '$800/day' },
    { equipment: 'Trencher', rate: '$350/day' },
    { equipment: 'Boring Machine', rate: '$400/day' },
    { equipment: 'Fusion Splicer', rate: '$200/day' },
    { equipment: 'OTDR Test Set', rate: '$150/day' },
    { equipment: 'Locator Set', rate: '$75/day' },
    { equipment: 'Generator (Portable)', rate: '$100/day' },
    { equipment: 'Air Compressor', rate: '$125/day' },
    { equipment: 'Light Tower', rate: '$150/day' }
  ],
  unitRates: [
    { description: 'Underground Bore (per ft)', rate: '$8-15/ft' },
    { description: 'Open Trench (per ft)', rate: '$4-8/ft' },
    { description: 'Conduit Install 2" (per ft)', rate: '$2.50/ft' },
    { description: 'Conduit Install 4" (per ft)', rate: '$4.00/ft' },
    { description: 'Fiber Pull (per ft)', rate: '$0.50-1.00/ft' },
    { description: 'Fiber Splice (per splice)', rate: '$25-35/splice' },
    { description: 'Aerial Strand (per ft)', rate: '$1.50/ft' },
    { description: 'Aerial Fiber (per ft)', rate: '$1.00/ft' },
    { description: 'Pole Attachment', rate: '$150-250/pole' },
    { description: 'Handhole Install (Small)', rate: '$350-500/ea' },
    { description: 'Handhole Install (Large)', rate: '$600-900/ea' },
    { description: 'Vault Install', rate: '$1,500-3,000/ea' },
    { description: 'OTDR Testing (per strand)', rate: '$15/strand' },
    { description: 'As-Built Documentation', rate: '$500-1,500/project' }
  ]
};

// Gateway configuration (for portal components)
export const GATEWAY_CONFIG = {
  url: 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec',
  secret: 'LYTcomm2026ClaudeGatewaySecretKey99',
  usersSheetId: '1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw'
};
