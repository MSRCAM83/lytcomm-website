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
  // ONBOARDING Script (v6.0) - Handles employee/contractor form submissions + email notifications
  appsScript: 'https://script.google.com/macros/s/AKfycbx6AIFsqaRbQDJ5GwBegGZCJMzkvQZ4A2wwYXw7BjoP7Hqz44uxbyMi1jxoIDLZuiMH-w/exec',
  
  // PORTAL Script (v1.0) - Handles login, user management, password reset
  // Script ID: 1q7rGi07EhRasc5EdwU7QKGz7h_2-e1Qokk-EbVMEUHhz_IveC09sfcKG
  // DEPLOY FROM: https://script.google.com/d/1q7rGi07EhRasc5EdwU7QKGz7h_2-e1Qokk-EbVMEUHhz_IveC09sfcKG/edit
  // After deploying, update this URL:
  portalScript: 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec',
  
  googleDriveFolder: '11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC',
  rateCardSheet: '10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4',
  w4Pdf: '/Form%20W-4%20sign.pdf',
  w9Pdf: '/Form%20W-9%20sign.pdf',
  msaPdf: '/LYT_MSA_2026_AdobeSign_Full_v4_1.pdf',
};

// Onboarding invite code
export const INVITE_CODE = 'welcome2lyt';

// NDA signing invite code
export const NDA_INVITE_CODE = 'lytnda2026';

// Admin configuration
export const ADMIN_CONFIG = {
  primaryAdmin: 'matt@lytcomm.com',
  notificationEmails: ['matt@lytcomm.com'],
  allowSecondaryAdmins: true,
};

export const images = {
  hero: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1920&q=80',
  fiberClose: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
  networkSwitch: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
  construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  aerial: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
  underground: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&q=80',
  testing: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
  team: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
  hddDrill: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  splicingTech: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
  bucketTruck: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
};

export const services = [
  {
    id: 1,
    title: 'HDD Drilling',
    description: 'Horizontal Directional Drilling for underground fiber installation with minimal surface disruption.',
    image: images.underground,
  },
  {
    id: 2,
    title: 'Fiber Splicing',
    description: 'Precision fusion splicing and OTDR testing for optimal network performance.',
    image: images.fiberClose,
  },
  {
    id: 3,
    title: 'Aerial Construction',
    description: 'Pole-to-pole fiber installation, strand mapping, and aerial network builds.',
    image: images.aerial,
  },
  {
    id: 4,
    title: 'Underground Construction',
    description: 'Trenching, boring, and conduit installation for buried fiber networks.',
    image: images.construction,
  },
  {
    id: 5,
    title: 'Network Testing',
    description: 'Comprehensive OTDR, power meter, and certification testing services.',
    image: images.testing,
  },
  {
    id: 6,
    title: 'Project Management',
    description: 'End-to-end fiber project coordination from design to completion.',
    image: images.team,
  },
];

export const skillOptions = [
  'HDD Drilling',
  'Fiber Splicing',
  'Aerial Construction',
  'Underground Construction',
  'OTDR Testing',
  'Pole Climbing',
  'Bucket Truck Operation',
  'Project Management',
  'Safety Supervision',
  'Traffic Control',
];

// Empty - no mock data. All data comes from database.
export const mockUsers = [];
export const mockProjects = [];
export const mockContractors = [];
export const mockTimeEntries = [];
export const mockInvoices = [];
export const mockFiles = [];
export const mockAnnouncements = [];


// Gateway configuration (for portal components)
export const GATEWAY_CONFIG = {
  url: 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec',
  secret: 'LYTcomm2026ClaudeGatewaySecretKey99',
  usersSheetId: '1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw'
};
