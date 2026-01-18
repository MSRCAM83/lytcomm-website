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
  appsScript: 'https://script.google.com/macros/s/AKfycbyfpYe0FaALAAU7XtgqbDswDCnl47e8LZhTxZSzyKv7FqB5q1gFDPjJTpgbuMARLH3t/exec',
  googleDriveFolder: '11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC',
  rateCardSheet: '10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4',
  w4Pdf: '/Form%20W-4%20sign.pdf',
  w9Pdf: '/Form%20W-9%20sign.pdf',
  msaPdf: '/LYT%20MSA%202006%20-%20v3.4.pdf',
};

// Onboarding invite code
export const INVITE_CODE = 'welcome2lyt';

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

export const mockUsers = [
  { id: 1, name: 'Matt Campbell', email: 'matt@lytcomm.com', role: 'admin', phone: '555-0100', avatar: 'MC' },
  { id: 2, name: 'Mason Roy', email: 'mason@lytcomm.com', role: 'admin', phone: '555-0101', avatar: 'MR' },
  { id: 3, name: 'Donnie Smith', email: 'donnie@lytcomm.com', role: 'supervisor', phone: '555-0102', avatar: 'DS' },
  { id: 4, name: 'John Rivera', email: 'john@lytcomm.com', role: 'technician', phone: '555-0103', avatar: 'JR' },
  { id: 5, name: 'Sarah Chen', email: 'sarah@lytcomm.com', role: 'technician', phone: '555-0104', avatar: 'SC' },
];

export const mockProjects = [
  { id: 1, name: 'Downtown Fiber Expansion', client: 'City of Webster', status: 'active', progress: 65, crew: [4, 5], startDate: '2024-12-01', endDate: '2025-02-28' },
  { id: 2, name: 'Bayshore Business Park', client: 'Bayshore Properties LLC', status: 'active', progress: 30, crew: [4], startDate: '2024-12-15', endDate: '2025-03-15' },
  { id: 3, name: 'Harbor Medical Center', client: 'UTMB Health', status: 'pending', progress: 0, crew: [], startDate: '2025-01-10', endDate: '2025-04-30' },
  { id: 4, name: 'Clear Lake Residential', client: 'KB Homes', status: 'completed', progress: 100, crew: [4, 5], startDate: '2024-10-01', endDate: '2024-12-20' },
];

export const mockContractors = [
  { id: 1, company: 'ABC Drilling LLC', contact: 'Tom Wilson', email: 'tom@abcdrilling.com', phone: '555-1001', status: 'active', skills: ['HDD Drilling', 'Underground Construction'] },
  { id: 2, company: 'Precision Splice Co', contact: 'Maria Garcia', email: 'maria@precisionsplice.com', phone: '555-1002', status: 'active', skills: ['Fiber Splicing', 'OTDR Testing'] },
  { id: 3, company: 'SkyHigh Aerial', contact: 'James Lee', email: 'james@skyhighaerial.com', phone: '555-1003', status: 'pending', skills: ['Aerial Construction', 'Pole Climbing', 'Bucket Truck Operation'] },
];

export const mockTimeEntries = [
  { id: 1, userId: 4, date: '2025-01-15', clockIn: '07:00', clockOut: '16:30', breakTime: 30, project: 'Downtown Fiber Expansion', status: 'approved' },
  { id: 2, userId: 4, date: '2025-01-16', clockIn: '07:00', clockOut: '17:00', breakTime: 30, project: 'Downtown Fiber Expansion', status: 'approved' },
  { id: 3, userId: 4, date: '2025-01-17', clockIn: '07:00', clockOut: null, breakTime: 0, project: 'Bayshore Business Park', status: 'active' },
  { id: 4, userId: 5, date: '2025-01-15', clockIn: '06:30', clockOut: '15:30', breakTime: 30, project: 'Downtown Fiber Expansion', status: 'approved' },
  { id: 5, userId: 5, date: '2025-01-16', clockIn: '06:30', clockOut: '16:00', breakTime: 45, project: 'Downtown Fiber Expansion', status: 'pending' },
];

export const mockInvoices = [
  { id: 1, contractorId: 1, project: 'Downtown Fiber Expansion', amount: 15000, date: '2025-01-10', status: 'paid', dueDate: '2025-01-25' },
  { id: 2, contractorId: 2, project: 'Downtown Fiber Expansion', amount: 8500, date: '2025-01-12', status: 'pending', dueDate: '2025-01-27' },
  { id: 3, contractorId: 1, project: 'Bayshore Business Park', amount: 12000, date: '2025-01-15', status: 'submitted', dueDate: '2025-01-30' },
];

export const mockFiles = [
  { id: 1, name: 'Safety Manual 2025.pdf', folder: 'Safety', size: '2.4 MB', date: '2025-01-01', type: 'pdf' },
  { id: 2, name: 'OTDR Testing Procedures.pdf', folder: 'SOPs', size: '1.1 MB', date: '2024-12-15', type: 'pdf' },
  { id: 3, name: 'Daily Inspection Checklist.pdf', folder: 'Forms', size: '245 KB', date: '2024-12-01', type: 'pdf' },
  { id: 4, name: 'Project Specs - Downtown.pdf', folder: 'Projects', size: '5.2 MB', date: '2024-12-10', type: 'pdf' },
  { id: 5, name: 'Equipment Inventory.xlsx', folder: 'Admin', size: '890 KB', date: '2025-01-05', type: 'xlsx' },
];

export const mockAnnouncements = [
  { id: 1, title: 'Safety Meeting', content: 'Mandatory safety meeting this Friday at 7 AM.', date: '2025-01-15', priority: 'high' },
  { id: 2, title: 'New Project Kickoff', content: 'Harbor Medical Center project starting Jan 20th.', date: '2025-01-14', priority: 'normal' },
  { id: 3, title: 'Holiday Schedule', content: 'Office closed Monday Jan 20th for MLK Day.', date: '2025-01-10', priority: 'normal' },
];
