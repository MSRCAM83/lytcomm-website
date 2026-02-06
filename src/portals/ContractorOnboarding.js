// ContractorOnboarding.js v2.58 - Added phone auto-formatting
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Building, FileText, FileCheck, Shield, Users, Wrench, DollarSign, CreditCard, AlertCircle, Upload, Download, RefreshCw, ChevronDown, Sun, Moon } from 'lucide-react';
import { colors, LYT_INFO, URLS, skillOptions } from '../config/constants';
import SignaturePad from '../components/SignaturePad';
import EINInput from '../components/EINInput';
import SSNInput from '../components/SSNInput';
import { fillW9, fillMSA, createFormPdf } from '../services/pdfService';

// Format phone number as (000) 000-0000
const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
};

const ContractorOnboarding = ({ setCurrentPage, darkMode, setDarkMode }) => {
  // Onboarding section accent colors (orange/green)
  const accentPrimary = darkMode ? '#ff6b35' : '#28a745';       // Orange vs Green
  const accentSecondary = darkMode ? '#c850c0' : '#00b4d8';     // Pink vs Teal
// eslint-disable-next-line no-unused-vars
  const accentGradient = darkMode 
    ? 'linear-gradient(135deg, #ff6b35 0%, #c850c0 100%)'
    : 'linear-gradient(135deg, #28a745 0%, #00b4d8 100%)';
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';
  
  // Logo text colors
  const logoLY = darkMode ? '#e6c4d9' : '#0a3a7d';
  const logoT = darkMode ? '#e6c4d9' : '#2ec7c0';
// eslint-disable-next-line no-unused-vars
  const logoComm = darkMode ? '#ffffff' : '#1e293b';

  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [showMsaPdf, setShowMsaPdf] = useState(false);
  const [showW9Pdf, setShowW9Pdf] = useState(false);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showStepDropdown, setShowStepDropdown] = useState(false);
  
  // Hidden skip feature - triple tap counter
  const [skipTapCount, setSkipTapCount] = useState(0);
  const [skipTapTimer, setSkipTapTimer] = useState(null);
  
  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Hidden skip: triple-tap on header title to skip to next step
  const handleHeaderTap = () => {
    if (skipTapTimer) clearTimeout(skipTapTimer);
    
    const newCount = skipTapCount + 1;
    setSkipTapCount(newCount);
    
    if (newCount >= 3) {
      // Triple tap detected - skip to next step (or cycle back)
      setCurrentStep((prev) => (prev + 1) % steps.length);
      setSkipTapCount(0);
    } else {
      // Reset counter after 500ms of no taps
      const timer = setTimeout(() => setSkipTapCount(0), 500);
      setSkipTapTimer(timer);
    }
  };

  const [formData, setFormData] = useState({
    // Company Info
    companyName: '',
    dba: '',
    entityType: '',
    contactName: '',
    contactTitle: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    // MSA - additional fields for PDF generation
    msaPrintedName: '',
    msaTitle: '',
    msaSignature: null,
    msaDate: new Date().toISOString().split('T')[0],
    msaEffectiveDate: new Date().toISOString().split('T')[0],
    witnessName: '',
    witnessSignature: null,
    witnessDate: '',
    // W-9
    taxIdType: 'ein',
    ein: '',
    ssn: '',
    taxClassification: '',
    exemptPayeeCode: '',
    fatcaCode: '',
    w9Signature: null,
    w9Date: new Date().toISOString().split('T')[0],
    // Insurance
    coiFile: null,
    coiFileName: '',
    coiExpiration: '',
    liabilityAmount: '',
    workersCompAmount: '',
    // Fleet & Personnel
    fleet: [{ type: '', count: '', description: '' }],
    personnel: [{ name: '', role: '', certifications: '' }],
    // Skills
    skills: [],
    otherSkills: '',
    // Rate Card
    rateCardAccepted: false,
    rateCardSignature: null,
    // Safety
    safetySignature: null,
    // Banking / Direct Deposit
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    voidedCheckFile: null,
    voidedCheckFileName: '',
    directDepositSignature: null,
    directDepositDate: new Date().toISOString().split('T')[0],
    directDepositAgreed: false,
  });

  // State for live rate card data
  const [rateCardData, setRateCardData] = useState([]);
  const [rateCardLoading, setRateCardLoading] = useState(false);
  const [rateCardError, setRateCardError] = useState(null);

  const steps = [
    { id: 'company', title: 'Company Info', icon: Building },
    { id: 'msa', title: 'MSA Agreement', icon: FileText },
    { id: 'w9', title: 'W-9 Tax Form', icon: FileCheck },
    { id: 'insurance', title: 'Insurance', icon: Shield },
    { id: 'fleet', title: 'Fleet & Personnel', icon: Users },
    { id: 'skills', title: 'Skills', icon: Wrench },
    { id: 'rates', title: 'Rate Card', icon: DollarSign },
    { id: 'banking', title: 'Banking', icon: CreditCard },
  ];

  const entityTypes = [
    { value: 'sole', label: 'Sole Proprietor' },
    { value: 'llc-c', label: 'LLC (taxed as C-Corp)' },
    { value: 'llc-s', label: 'LLC (taxed as S-Corp)' },
    { value: 'llc-p', label: 'LLC (taxed as Partnership)' },
    { value: 'c-corp', label: 'C Corporation' },
    { value: 's-corp', label: 'S Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'trust', label: 'Trust/Estate' },
    { value: 'other', label: 'Other' },
  ];

  // Fetch rate card data from Google Sheets
  const fetchRateCard = async () => {
    setRateCardLoading(true);
    setRateCardError(null);
    try {
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${URLS.rateCardSheet}/export?format=csv`
      );
      const text = await response.text();
      
      // Parse CSV
      const lines = text.split('\n').filter(line => line.trim());
      const data = [];
      let currentCategory = '';
      
      for (const line of lines) {
        // Skip header rows and empty lines
        if (line.includes('Contractor:') || line.includes('Unit Code,') || !line.trim()) continue;
        
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        
        // Check if this is a valid data row (starts with a code like AE1, FS1, etc.)
        if (cols[0] && /^[A-Z]{1,4}[0-9]/.test(cols[0])) {
          // Determine category from code prefix
          const code = cols[0];
          if (code.startsWith('AE') || code.startsWith('BCP')) currentCategory = 'AERIAL';
          else if (code.startsWith('FS')) currentCategory = 'SPLICING';
          else if (code.startsWith('UG')) currentCategory = 'UNDERGROUND';
          else if (code.startsWith('PP') || code.startsWith('PA') || code.startsWith('PC') || code.startsWith('RA') || code.startsWith('RC')) currentCategory = 'POLES & RESTORATION';
          else if (code.startsWith('TC') || code.startsWith('HS')) currentCategory = 'OTHER';
          
          data.push({
            code: cols[0] || '',
            description: cols[1] || '',
            uom: cols[2] || '',
            price: cols[3] || '',
            category: currentCategory
          });
        }
      }
      
      setRateCardData(data);
    } catch (err) {
      console.error('Failed to fetch rate card:', err);
      setRateCardError('Failed to load rate card. Please try again.');
    } finally {
      setRateCardLoading(false);
    }
  };

  // Fetch rate card on component mount
  useEffect(() => {
    fetchRateCard();
  }, []);

  // Download rate card as CSV
  const downloadRateCard = () => {
    if (rateCardData.length === 0) return;
    
    const headers = ['Unit Code', 'Description', 'UOM', 'Unit Price'];
    const csvContent = [
      headers.join(','),
      ...rateCardData.map(row => 
        [row.code, `"${row.description}"`, row.uom, row.price].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LYT_Rate_Card_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle voided check upload
  const handleVoidedCheckUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        voidedCheckFile: file,
        voidedCheckFileName: file.name,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Auto-format phone numbers
    if (name === 'phone' || name === 'contactPhone') {
      setFormData({ ...formData, [name]: formatPhoneNumber(value) });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleSkillToggle = (skill) => {
    const newSkills = formData.skills.includes(skill)
      ? formData.skills.filter((s) => s !== skill)
      : [...formData.skills, skill];
    setFormData({ ...formData, skills: newSkills });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        coiFile: file,
        coiFileName: file.name,
      });
    }
  };

  const addFleetItem = () => {
    setFormData({
      ...formData,
      fleet: [...formData.fleet, { type: '', count: '', description: '' }],
    });
  };

  const updateFleetItem = (index, field, value) => {
    const newFleet = [...formData.fleet];
    newFleet[index][field] = value;
    setFormData({ ...formData, fleet: newFleet });
  };

  const removeFleetItem = (index) => {
    if (formData.fleet.length > 1) {
      setFormData({ ...formData, fleet: formData.fleet.filter((_, i) => i !== index) });
    }
  };

  const addPersonnelItem = () => {
    setFormData({
      ...formData,
      personnel: [...formData.personnel, { name: '', role: '', certifications: '' }],
    });
  };

  const updatePersonnelItem = (index, field, value) => {
    const newPersonnel = [...formData.personnel];
    newPersonnel[index][field] = value;
    setFormData({ ...formData, personnel: newPersonnel });
  };

  const removePersonnelItem = (index) => {
    if (formData.personnel.length > 1) {
      setFormData({ ...formData, personnel: formData.personnel.filter((_, i) => i !== index) });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // ========== CAPTURE IP ADDRESS FOR ESIGN COMPLIANCE ==========
      let ipAddress = 'Unable to capture';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (ipErr) {
        console.log('IP capture failed:', ipErr);
      }
      const signatureTimestamp = new Date().toISOString();
      
      // ========== GENERATE FILLED PDFs ==========
      console.log('Generating contractor PDFs...');
      
      const signatureInfo = {
        timestamp: new Date().toLocaleString(),
        ip: ipAddress
      };
      
      // 0. Company Info PDF (captures all Step 1 data)
      let companyInfoPdf = null;
      try {
        companyInfoPdf = await createFormPdf(
          'Company Information',
          [
            { title: 'COMPANY DETAILS', fields: [
              { label: 'Company Name', value: formData.companyName },
              { label: 'DBA', value: formData.dba || 'N/A' },
              { label: 'Entity Type', value: formData.entityType },
              { label: 'Tax ID Type', value: formData.taxIdType === 'ein' ? 'EIN' : 'SSN' },
              { label: 'Tax ID', value: formData.taxIdType === 'ein' ? formData.ein : `***-**-${(formData.ssn || '').slice(-4)}` },
            ]},
            { title: 'PRIMARY CONTACT', fields: [
              { label: 'Contact Name', value: formData.contactName },
              { label: 'Title', value: formData.contactTitle },
              { label: 'Email', value: formData.contactEmail },
              { label: 'Phone', value: formData.contactPhone },
            ]},
            { title: 'ADDRESS', fields: [
              { label: 'Street', value: formData.address },
              { label: 'City', value: formData.city },
              { label: 'State', value: formData.state },
              { label: 'ZIP', value: formData.zip },
            ]},
            { title: 'ELECTRONIC RECORD', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          null,
          signatureInfo
        );
        console.log('Company Info PDF created');
      } catch (e) {
        console.error('Company Info error:', e);
      }
      
      // 1. Fill actual IRS W-9 form
      let w9Pdf = null;
      try {
        w9Pdf = await fillW9({
          companyName: formData.companyName,
          dba: formData.dba,
          entityType: formData.entityType,
          effectiveDate: formData.msaEffectiveDate || new Date().toLocaleDateString(),
          printedName: formData.msaPrintedName || formData.contactName,
          msaDate: formData.msaDate || new Date().toLocaleDateString(),
          taxClassification: formData.taxClassification,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          ein: formData.taxIdType === 'ein' ? formData.ein : '',
          ssn: formData.taxIdType === 'ssn' ? formData.ssn : '',
        }, formData.w9Signature, signatureInfo);
        console.log('W-9 PDF filled successfully');
      } catch (e) {
        console.error('W-9 error:', e);
      }
      
      // 2. Sign MSA document
      let msaPdf = null;
      try {
        msaPdf = await fillMSA({
          companyName: formData.companyName,
          contactName: formData.contactName,
          contactTitle: formData.contactTitle,
          title: formData.contactTitle,
          entityType: formData.entityType,
          effectiveDate: formData.msaEffectiveDate || new Date().toLocaleDateString(),
          printedName: formData.msaPrintedName || formData.contactName,
          msaDate: formData.msaDate || new Date().toLocaleDateString(),
        }, formData.msaSignature, signatureInfo);
        console.log('MSA signed successfully');
      } catch (e) {
        console.error('MSA error:', e);
      }
      
      // 3. Insurance Certificate Info (per MSA Article 9)
      let insurancePdf = null;
      try {
        insurancePdf = await createFormPdf(
          'Insurance Certificate Requirements',
          [
            { title: 'CONTRACTOR', fields: [
              { label: 'Company', value: formData.companyName },
              { label: 'Contact', value: formData.contactName },
            ]},
            { title: 'WORKERS COMPENSATION (MSA 9.1a)', fields: [
              { label: 'Each Accident', value: '$1,000,000' },
              { label: 'Disease - Each Employee', value: '$1,000,000' },
              { label: 'Disease - Policy Limit', value: '$1,000,000' },
            ]},
            { title: 'COMMERCIAL GENERAL LIABILITY (MSA 9.1b)', fields: [
              { label: 'Aggregate', value: '$2,000,000' },
              { label: 'Products/Completed Ops', value: '$2,000,000' },
              { label: 'Personal Injury', value: '$1,000,000' },
              { label: 'Each Occurrence', value: '$1,000,000' },
              { label: 'Fire Damage', value: '$50,000' },
              { label: 'Medical Expense', value: '$5,000' },
            ]},
            { title: 'AUTO LIABILITY (MSA 9.1c)', fields: [
              { label: 'Combined Single Limit', value: '$1,000,000' },
            ]},
            { title: 'UMBRELLA/EXCESS (MSA 9.1d)', fields: [
              { label: 'Jobs up to $250K', value: '$1,000,000' },
              { label: 'Jobs $250K - $1M', value: '$3,000,000' },
              { label: 'Jobs $1M+', value: '$5,000,000' },
            ]},
            { title: 'CONTRACTOR COVERAGE', fields: [
              { label: 'General Liability', value: formData.liabilityAmount || 'See COI' },
              { label: 'Workers Comp', value: formData.workersCompAmount || 'See COI' },
            ]},
            { title: 'CERTIFICATE DETAILS', fields: [
              { label: 'COI Uploaded', value: formData.coiFileName || 'Pending' },
              { label: 'Expiration Date', value: formData.coiExpiration || 'TBD' },
            ]},
            { paragraphs: [
              'LYT Communications, LLC must be listed as Additional Insured on all policies.',
              'Policies must cover underground damage, 811 failures, residential projects, and XCU hazards.',
              'Maintain completed ops coverage for 6 years or statute of repose.',
            ]},
          ],
          null,
          signatureInfo
        );
        console.log('Insurance PDF created');
      } catch (e) {
        console.error('Insurance error:', e);
      }
      
      // 4. Rate Card Acceptance with live rates from Google Sheets
      let rateCardPdf = null;
      try {
        // Build rate sections from live data grouped by category
        const rateCategories = rateCardData.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {});

        const rateSections = Object.entries(rateCategories).map(([category, items]) => ({
          title: `${category} RATES`,
          fields: items.map(item => ({
            label: `${item.code} - ${item.description} (${item.uom})`,
            value: item.price,
          })),
        }));

        rateCardPdf = await createFormPdf(
          'Rate Card Acceptance Agreement',
          [
            { title: 'CONTRACTOR', fields: [
              { label: 'Company', value: formData.companyName },
              { label: 'Contact', value: formData.contactName },
            ]},
            ...rateSections,
            { title: 'PAYMENT TERMS', checkboxes: [
              { label: 'Net 30 from invoice approval', checked: true },
              { label: '10% retainage until project completion', checked: true },
              { label: 'Lien waivers required with payment applications', checked: true },
              { label: 'Subject to change with 30-day written notice', checked: true },
            ]},
            { paragraphs: ['By signing, I acknowledge receipt of and agree to the LYT Communications Rate Card above.'] },
          ],
          formData.rateCardSignature,
          signatureInfo
        );
        console.log('Rate Card PDF created');
      } catch (e) {
        console.error('Rate Card error:', e);
      }
      
      // 5. Fleet & Personnel PDF
      let fleetPdf = null;
      try {
        // Format fleet data
        const fleetList = (formData.fleet || [])
          .filter(f => f.type || f.count)
          .map(f => `${f.type}: ${f.count} ${f.description ? `(${f.description})` : ''}`);
        
        fleetPdf = await createFormPdf(
          'Fleet & Personnel Information',
          [
            { title: 'CONTRACTOR', fields: [
              { label: 'Company', value: formData.companyName },
              { label: 'Contact', value: formData.contactName },
            ]},
            { title: 'PERSONNEL', fields: [
              { label: 'Key Personnel Listed', value: formData.personnel.filter(p => p.name).length || 'None' },
              ...formData.personnel.filter(p => p.name).map(p => ({
                label: p.name,
                value: [p.role, p.certifications].filter(Boolean).join(' - ') || 'No details',
              })),
            ]},
            { title: 'FLEET/EQUIPMENT', fields: fleetList.length > 0 
              ? fleetList.map((item, i) => ({ label: `Item ${i+1}`, value: item }))
              : [{ label: 'Equipment', value: 'None specified' }]
            },
            { title: 'ELECTRONIC RECORD', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          null,
          signatureInfo
        );
        console.log('Fleet PDF created');
      } catch (e) {
        console.error('Fleet error:', e);
      }
      
      // 6. Skills Inventory PDF
      let skillsPdf = null;
      try {
        const skillsList = (formData.skills || []).length > 0
          ? formData.skills.map(s => ({ label: s, checked: true }))
          : [{ label: 'No skills selected', checked: false }];
        
        skillsPdf = await createFormPdf(
          'Skills & Capabilities Inventory',
          [
            { title: 'CONTRACTOR', fields: [
              { label: 'Company', value: formData.companyName },
              { label: 'Contact', value: formData.contactName },
            ]},
            { title: 'CERTIFIED SKILLS', checkboxes: skillsList },
            ...(formData.otherSkills ? [{ title: 'ADDITIONAL SKILLS/SERVICES', paragraphs: [formData.otherSkills] }] : []),
            { title: 'ELECTRONIC RECORD', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          null,
          signatureInfo
        );
        console.log('Skills PDF created');
      } catch (e) {
        console.error('Skills error:', e);
      }
      
      // 7. Direct Deposit Authorization (with embedded voided check)
      let directDepositPdf = null;
      let voidedCheckImage = null;

      if (formData.voidedCheckFile) {
        try {
          const reader = new FileReader();
          voidedCheckImage = await new Promise((resolve, reject) => {
            reader.onload = () => resolve({
              data: reader.result,
              mimeType: formData.voidedCheckFile.type
            });
            reader.onerror = reject;
            reader.readAsDataURL(formData.voidedCheckFile);
          });
        } catch (e) {
          console.error('Error reading voided check:', e);
        }
      }

      try {
        directDepositPdf = await createFormPdf(
          'Direct Deposit Authorization',
          [
            { title: 'COMPANY', fields: [
              { label: 'Company Name', value: formData.companyName },
              { label: 'Contact', value: formData.contactName },
            ]},
            { title: 'BANK INFORMATION', fields: [
              { label: 'Bank Name', value: formData.bankName },
              { label: 'Routing Number', value: formData.routingNumber },
              { label: 'Account Number', value: formData.accountNumber || '' },
              { label: 'Account Type', value: formData.accountType },
            ]},
            { title: 'AUTHORIZATION', paragraphs: [
              'I authorize LYT Communications, LLC to initiate credit entries to the account above.',
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          formData.directDepositSignature,
          signatureInfo,
          voidedCheckImage
        );
        console.log('Direct Deposit PDF created');
      } catch (e) {
        console.error('Direct Deposit error:', e);
      }
      
      // 5. Safety Acknowledgment
      let safetyPdf = null;
      try {
        safetyPdf = await createFormPdf(
          'Safety Program Acknowledgment',
          [
            { title: 'CONTRACTOR', fields: [
              { label: 'Company', value: formData.companyName },
              { label: 'Contact', value: formData.contactName },
            ]},
            { title: 'SAFETY REQUIREMENTS', checkboxes: [
              { label: 'Complete site-specific safety orientation', checked: true },
              { label: 'Required PPE at all times on job sites', checked: true },
              { label: 'Report all incidents immediately', checked: true },
              { label: 'Daily toolbox safety meetings required', checked: true },
              { label: 'OSHA and LYT safety policy compliance', checked: true },
            ]},
            { title: 'INSURANCE', fields: [
              { label: 'General Liability', value: formData.liabilityAmount || 'Per COI' },
              { label: 'Workers Comp', value: formData.workersCompAmount || 'Per COI' },
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          formData.safetySignature || formData.msaSignature,
          signatureInfo
        );
        console.log('Safety PDF created');
      } catch (e) {
        console.error('Safety error:', e);
      }

      // Prepare COI file upload
      let coiFileData = null;
      if (formData.coiFile) {
        const reader = new FileReader();
        coiFileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve({
            name: formData.coiFileName,
            data: reader.result.split(',')[1],
            mimeType: formData.coiFile.type
          });
          reader.onerror = reject;
          reader.readAsDataURL(formData.coiFile);
        });
      }

      // Build payload with filled PDFs
      // IMPORTANT: Use 'action' field (not 'type') with exact action name expected by Apps Script
      const payload = {
        action: 'submitContractorOnboarding',
        formData: {
          companyName: formData.companyName,
          dba: formData.dba,
          contactName: formData.contactName,
          contactTitle: formData.contactTitle,
          contactEmail: formData.email,
          contactPhone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          entityType: formData.entityType,
          effectiveDate: formData.msaEffectiveDate || new Date().toLocaleDateString(),
          printedName: formData.msaPrintedName || formData.contactName,
          msaDate: formData.msaDate || new Date().toLocaleDateString(),
          taxIdType: formData.taxIdType,
          ein: formData.taxIdType === 'ein' ? formData.ein : '',
          ssn: formData.taxIdType === 'ssn' ? formData.ssn : '',
          bankName: formData.bankName,
          routingNumber: formData.routingNumber,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
        },
        // ESIGN compliance
        signatureVerification: {
          ipAddress: ipAddress,
          timestamp: signatureTimestamp,
          userAgent: navigator.userAgent,
        },
        // PRE-FILLED PDFs (base64)
        filledPdfs: {
          companyInfo: companyInfoPdf,
          w9: w9Pdf,
          msa: msaPdf,
          insurance: insurancePdf,
          fleet: fleetPdf,
          skills: skillsPdf,
          rateCard: rateCardPdf,
          directDeposit: directDepositPdf,
          safety: safetyPdf,
        },
        coiFile: coiFileData,
        submittedAt: new Date().toISOString(),
      };

      console.log('Submitting contractor with filled PDFs...');

      // Submit to Google Apps Script
      // Note: GAS returns a 302 redirect which can cause issues reading the response
      // The data IS processed even if we can't read the response
      let result = { success: false, error: 'Unknown error' };
      
      try {
        const response = await fetch(URLS.appsScript, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });

        const text = await response.text();
        console.log('Response text:', text.substring(0, 500));
        
        // Try to parse as JSON
        try {
          result = JSON.parse(text);
        } catch (parseErr) {
          // Check if this looks like a Google redirect/error page
          if (text.includes('Moved Temporarily')) {
            // GAS processed the request but redirected
            // The data was submitted - we just can't confirm
            result = { 
              success: true, 
              message: 'Submitted successfully',
              note: 'Check Google Drive for confirmation'
            };
          } else if (text.includes('Page Not Found') || text.includes('unable to open')) {
            result = { success: false, error: 'Server error - please try again' };
          } else {
            result = { success: false, error: 'Unexpected response from server' };
          }
        }
      } catch (fetchErr) {
        console.error('Fetch error:', fetchErr);
        result = { success: false, error: 'Network error: ' + fetchErr.message };
      }
      
      console.log('Result:', result);

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Submission failed.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Force light background for all form inputs to ensure text visibility
  // Using white background with dark text for maximum contrast in all modes
  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxSizing: 'border-box',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
  };

  // Option styling removed - using light background inputs ensures visibility

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    fontSize: '0.9rem',
    color: textColor,
  };

  // Step renderers
  const renderCompanyInfo = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Company Information</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Company Name *</label>
          <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>DBA (if applicable)</label>
          <input type="text" name="dba" value={formData.dba} onChange={handleChange} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Entity Type *</label>
        <select name="entityType" value={formData.entityType} onChange={handleChange} required style={selectStyle}>
          <option value="">Select entity type...</option>
          {entityTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Contact Name *</label>
          <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Title *</label>
          <input type="text" name="contactTitle" value={formData.contactTitle} onChange={handleChange} required style={inputStyle} placeholder="e.g., Owner, President" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Phone *</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Street Address *</label>
        <input type="text" name="address" value={formData.address} onChange={handleChange} required style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>City *</label>
          <input type="text" name="city" value={formData.city} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>State *</label>
          <input type="text" name="state" value={formData.state} onChange={handleChange} required maxLength={2} style={inputStyle} placeholder="TX" />
        </div>
        <div>
          <label style={labelStyle}>ZIP *</label>
          <input type="text" name="zip" value={formData.zip} onChange={handleChange} required style={inputStyle} />
        </div>
      </div>
    </div>
  );

  const renderMSA = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Master Subcontractor Agreement</h3>
        <button
          onClick={() => setShowMsaPdf(!showMsaPdf)}
          style={{ 
            padding: '8px 16px',
            backgroundColor: showMsaPdf ? accentPrimary : 'transparent',
            border: `1px solid ${accentPrimary}`,
            borderRadius: '6px',
            color: showMsaPdf ? '#fff' : accentPrimary,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {showMsaPdf ? 'Hide Agreement' : 'View Full Agreement (PDF)'}
        </button>
      </div>

      {/* Embedded PDF Viewer */}
      {showMsaPdf && (
        <div style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${darkMode ? '#374151' : '#ddd'}` }}>
          <iframe
            src={`${URLS.msaPdf}#toolbar=0&navpanes=0&scrollbar=1`}
            style={{
              width: '100%',
              height: isMobile ? '300px' : '500px',
              border: 'none',
              backgroundColor: '#fff',
            }}
            title="Master Subcontractor Agreement"
          />
          <div style={{ padding: '12px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderTop: `1px solid ${darkMode ? '#374151' : '#ddd'}`, textAlign: 'center' }}>
            <a
              href={URLS.msaPdf}
              download="LYT_MSA.pdf"
              style={{ color: accentPrimary, fontSize: '0.85rem', textDecoration: 'none' }}
            >
              Download PDF
            </a>
          </div>
        </div>
      )}

      <div style={{ padding: '24px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px', marginBottom: '24px', maxHeight: '300px', overflow: 'auto' }}>
        <h4 style={{ fontWeight: '600', marginBottom: '12px' }}>Agreement Summary</h4>
        <p style={{ color: colors.gray, lineHeight: '1.7', marginBottom: '12px' }}>
          This Master Subcontractor Agreement ("Agreement") is entered into between {LYT_INFO.name} ("Company") 
          and the Subcontractor identified below.
        </p>
        <p style={{ color: colors.gray, lineHeight: '1.7', marginBottom: '12px' }}>
          By signing below, Subcontractor agrees to:
        </p>
        <ul style={{ color: colors.gray, lineHeight: '1.8', paddingLeft: '20px', marginBottom: '12px' }}>
          <li>Perform services in accordance with all applicable laws and regulations</li>
          <li>Maintain required insurance coverage throughout the term</li>
          <li>Comply with all safety requirements and Company policies</li>
          <li>Submit accurate and timely invoices per the agreed rate schedule</li>
          <li>Maintain confidentiality of all proprietary information</li>
          <li>Indemnify Company against claims arising from Subcontractor's work</li>
        </ul>
        <p style={{ color: colors.gray, lineHeight: '1.7', fontSize: '0.9rem' }}>
          <strong>Please review the full PDF agreement before signing.</strong>
        </p>
      </div>

      <SignaturePad
        onSignatureChange={(sig) => setFormData({ ...formData, msaSignature: sig })}
        label="Authorized Signature"
        darkMode={darkMode}
      />

      {/* Required fields that will be filled into the MSA PDF */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
        <div>
          <label style={labelStyle}>Printed Name *</label>
          <input 
            type="text" 
            name="msaPrintedName" 
            value={formData.msaPrintedName} 
            onChange={handleChange} 
            required
            style={inputStyle} 
            placeholder="Full legal name"
          />
        </div>
        <div>
          <label style={labelStyle}>Title *</label>
          <input 
            type="text" 
            name="msaTitle" 
            value={formData.msaTitle} 
            onChange={handleChange} 
            required
            style={inputStyle} 
            placeholder="e.g., Owner, President, Manager"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
        <div>
          <label style={labelStyle}>Signature Date *</label>
          <input type="date" name="msaDate" value={formData.msaDate} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Agreement Effective Date *</label>
          <input type="date" name="msaEffectiveDate" value={formData.msaEffectiveDate} onChange={handleChange} required style={inputStyle} />
        </div>
      </div>

      {/* Witness section - optional but recommended */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: darkMode ? '#1f2937' : '#f0f9ff', borderRadius: '8px', border: `1px solid ${darkMode ? '#374151' : '#bae6fd'}` }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: darkMode ? '#93c5fd' : '#0369a1' }}>Witness (Recommended)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Witness Name</label>
            <input type="text" name="witnessName" value={formData.witnessName} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Witness Date</label>
            <input type="date" name="witnessDate" value={formData.witnessDate} onChange={handleChange} style={inputStyle} />
          </div>
        </div>
        {formData.witnessName && (
          <div style={{ marginTop: '12px' }}>
            <SignaturePad
              onSignatureChange={(sig) => setFormData({ ...formData, witnessSignature: sig })}
              label="Witness Signature"
              required={false}
              darkMode={darkMode}
            />
          </div>
        )}
      </div>

      {/* Autofill notice */}
      <p style={{ marginTop: '16px', fontSize: '0.85rem', color: darkMode ? '#9ca3af' : '#6b7280', fontStyle: 'italic' }}>
        Note: Company information from Step 1 ({formData.companyName || 'Company Name'}) will be automatically included in the final agreement document.
      </p>
    </div>
  );

  const renderW9 = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>W-9 Request for Taxpayer Identification</h3>
        <button
          onClick={() => setShowW9Pdf(!showW9Pdf)}
          style={{ 
            padding: '8px 16px',
            backgroundColor: showW9Pdf ? accentPrimary : 'transparent',
            border: `1px solid ${accentPrimary}`,
            borderRadius: '6px',
            color: showW9Pdf ? '#fff' : accentPrimary,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {showW9Pdf ? 'Hide PDF' : 'View PDF Form'}
        </button>
      </div>

      {/* Embedded PDF Viewer */}
      {showW9Pdf && (
        <div style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${darkMode ? '#374151' : '#ddd'}` }}>
          <iframe
            src={`${URLS.w9Pdf}#toolbar=0&navpanes=0&scrollbar=1`}
            style={{
              width: '100%',
              height: isMobile ? '350px' : '600px',
              border: 'none',
              backgroundColor: '#fff',
            }}
            title="W-9 Form"
          />
          <div style={{ padding: '12px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderTop: `1px solid ${darkMode ? '#374151' : '#ddd'}`, textAlign: 'center' }}>
            <a
              href={URLS.w9Pdf}
              download="W-9_Form.pdf"
              style={{ color: accentPrimary, fontSize: '0.85rem', textDecoration: 'none' }}
            >
              Download PDF
            </a>
          </div>
        </div>
      )}

      {/* Tax ID Type */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Tax Identification Type *</label>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
          {[
            { value: 'ein', label: 'EIN (Employer Identification Number)' },
            { value: 'ssn', label: 'SSN (Social Security Number)' },
          ].map((option) => (
            <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="taxIdType"
                value={option.value}
                checked={formData.taxIdType === option.value}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        
        {formData.taxIdType === 'ein' ? (
          <EINInput value={formData.ein} onChange={(val) => setFormData({ ...formData, ein: val })} darkMode={darkMode} />
        ) : (
          <SSNInput value={formData.ssn} onChange={(val) => setFormData({ ...formData, ssn: val })} darkMode={darkMode} />
        )}
      </div>

      {/* Tax Classification */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Federal Tax Classification *</label>
        <select
          name="taxClassification"
          value={formData.taxClassification}
          onChange={handleChange}
          required
          style={selectStyle}
        >
          <option value="">Select classification...</option>
          <option value="individual">Individual/Sole Proprietor</option>
          <option value="c-corp">C Corporation</option>
          <option value="s-corp">S Corporation</option>
          <option value="partnership">Partnership</option>
          <option value="trust">Trust/Estate</option>
          <option value="llc-c">LLC - C Corporation</option>
          <option value="llc-s">LLC - S Corporation</option>
          <option value="llc-p">LLC - Partnership</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Exemptions */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Exemptions (if applicable)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>Exempt Payee Code</label>
            <input type="text" name="exemptPayeeCode" value={formData.exemptPayeeCode} onChange={handleChange} style={inputStyle} placeholder="Leave blank if none" />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>FATCA Exemption Code</label>
            <input type="text" name="fatcaCode" value={formData.fatcaCode} onChange={handleChange} style={inputStyle} placeholder="Leave blank if none" />
          </div>
        </div>
      </div>

      {/* Certification */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: `${accentPrimary}10`, borderRadius: '8px' }}>
        <p style={{ fontSize: '0.9rem', color: colors.gray, lineHeight: '1.6' }}>
          <strong>Certification:</strong> Under penalties of perjury, I certify that the number shown on this form is my correct taxpayer 
          identification number, I am not subject to backup withholding, and I am a U.S. citizen or other U.S. person.
        </p>
      </div>

      <SignaturePad
        onSignatureChange={(sig) => setFormData({ ...formData, w9Signature: sig })}
        label="Signature"
        darkMode={darkMode}
      />

      <div style={{ marginTop: '16px' }}>
        <label style={labelStyle}>Date</label>
        <input type="date" name="w9Date" value={formData.w9Date} onChange={handleChange} style={{ ...inputStyle, maxWidth: '200px' }} />
      </div>
    </div>
  );

  const renderInsurance = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Insurance Certificate</h3>
      
      {/* File Upload */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Upload Certificate of Insurance (COI) *</label>
        <div
          style={{
            border: `2px dashed ${formData.coiFile ? accentSecondary : colors.gray}`,
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            backgroundColor: darkMode ? '#111827' : '#f8fafc',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('coi-upload').click()}
        >
          <input
            type="file"
            id="coi-upload"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Upload size={40} color={formData.coiFile ? accentSecondary : colors.gray} style={{ marginBottom: '12px' }} />
          {formData.coiFileName ? (
            <p style={{ color: accentSecondary, fontWeight: '500' }}>✓ {formData.coiFileName}</p>
          ) : (
            <>
              <p style={{ color: colors.gray, marginBottom: '8px' }}>Click to upload or drag and drop</p>
              <p style={{ color: colors.gray, fontSize: '0.85rem' }}>PDF, JPG, or PNG (max 10MB)</p>
            </>
          )}
        </div>
      </div>

      {/* Insurance Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label style={labelStyle}>COI Expiration Date *</label>
          <input type="date" name="coiExpiration" value={formData.coiExpiration} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>General Liability Amount *</label>
          <input type="text" name="liabilityAmount" value={formData.liabilityAmount} onChange={handleChange} required style={inputStyle} placeholder="e.g., $1,000,000" />
        </div>
        <div>
          <label style={labelStyle}>Workers' Comp Amount *</label>
          <input type="text" name="workersCompAmount" value={formData.workersCompAmount} onChange={handleChange} required style={inputStyle} placeholder="e.g., $500,000" />
        </div>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: `${accentPrimary}10`, borderRadius: '8px' }}>
        <p style={{ fontSize: '0.9rem', color: colors.gray }}>
          <strong>Requirements:</strong> Minimum $1M general liability, current workers' compensation coverage, 
          and {LYT_INFO.name} must be listed as additionally insured.
        </p>
      </div>
    </div>
  );

  const renderFleetPersonnel = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Fleet & Personnel</h3>
      
      {/* Fleet */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>Equipment/Fleet</h4>
        {formData.fleet.map((item, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 80px 2fr auto', gap: '12px', marginBottom: isMobile ? '20px' : '12px', alignItems: 'end', padding: isMobile ? '12px' : '0', backgroundColor: isMobile ? (darkMode ? '#1f2937' : '#f8fafc') : 'transparent', borderRadius: isMobile ? '8px' : '0' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Type</label>
              <input
                type="text"
                value={item.type}
                onChange={(e) => updateFleetItem(idx, 'type', e.target.value)}
                style={inputStyle}
                placeholder="e.g., Bucket Truck"
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Count</label>
              <input
                type="number"
                value={item.count}
                onChange={(e) => updateFleetItem(idx, 'count', e.target.value)}
                style={inputStyle}
                min={0}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Description</label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateFleetItem(idx, 'description', e.target.value)}
                style={inputStyle}
                placeholder="Year, make, model, capacity"
              />
            </div>
            <button
              type="button"
              onClick={() => removeFleetItem(idx)}
              style={{
                padding: '12px',
                backgroundColor: accentError,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                opacity: formData.fleet.length === 1 ? 0.5 : 1,
                width: isMobile ? '100%' : 'auto',
              }}
              disabled={formData.fleet.length === 1}
            >
              {isMobile ? 'Remove' : '×'}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addFleetItem}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: accentPrimary,
            border: `1px solid ${accentPrimary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          + Add Equipment
        </button>
      </div>

      {/* Personnel */}
      <div>
        <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>Key Personnel</h4>
        {formData.personnel.map((person, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr auto', gap: '12px', marginBottom: isMobile ? '20px' : '12px', alignItems: 'end', padding: isMobile ? '12px' : '0', backgroundColor: isMobile ? (darkMode ? '#1f2937' : '#f8fafc') : 'transparent', borderRadius: isMobile ? '8px' : '0' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Name</label>
              <input
                type="text"
                value={person.name}
                onChange={(e) => updatePersonnelItem(idx, 'name', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Role</label>
              <input
                type="text"
                value={person.role}
                onChange={(e) => updatePersonnelItem(idx, 'role', e.target.value)}
                style={inputStyle}
                placeholder="e.g., Lead Technician"
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Certifications</label>
              <input
                type="text"
                value={person.certifications}
                onChange={(e) => updatePersonnelItem(idx, 'certifications', e.target.value)}
                style={inputStyle}
                placeholder="e.g., OSHA 30, CDL"
              />
            </div>
            <button
              type="button"
              onClick={() => removePersonnelItem(idx)}
              style={{
                padding: '12px',
                backgroundColor: accentError,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                opacity: formData.personnel.length === 1 ? 0.5 : 1,
                width: isMobile ? '100%' : 'auto',
              }}
              disabled={formData.personnel.length === 1}
            >
              {isMobile ? 'Remove' : '×'}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPersonnelItem}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: accentPrimary,
            border: `1px solid ${accentPrimary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          + Add Personnel
        </button>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Capabilities & Skills</h3>
      
      <p style={{ color: colors.gray, marginBottom: '20px' }}>Select all services your company can provide:</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {skillOptions.map((skill) => (
          <label
            key={skill}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              backgroundColor: formData.skills.includes(skill) ? `${accentPrimary}20` : (darkMode ? colors.dark : '#f8fafc'),
              border: `2px solid ${formData.skills.includes(skill) ? accentPrimary : 'transparent'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={formData.skills.includes(skill)}
              onChange={() => handleSkillToggle(skill)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>{skill}</span>
          </label>
        ))}
      </div>

      <div>
        <label style={labelStyle}>Other Skills/Services</label>
        <textarea
          name="otherSkills"
          value={formData.otherSkills}
          onChange={handleChange}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="List any additional capabilities not shown above..."
        />
      </div>
    </div>
  );

  // Group rate card data by category
  const groupedRateCard = rateCardData.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const [expandedCategories, setExpandedCategories] = useState(['AERIAL']);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const renderRateCard = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Rate Card Acceptance</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchRateCard}
            disabled={rateCardLoading}
            style={{ 
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${accentPrimary}`,
              borderRadius: '6px',
              color: accentPrimary,
              cursor: rateCardLoading ? 'wait' : 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} style={{ animation: rateCardLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button
            type="button"
            onClick={downloadRateCard}
            disabled={rateCardData.length === 0}
            style={{ 
              padding: '8px 12px',
              backgroundColor: accentSecondary,
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: rateCardData.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={14} />
            Download CSV
          </button>
        </div>
      </div>
      
      <div style={{ padding: '24px', backgroundColor: darkMode ? '#1f2937' : '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ color: darkMode ? '#d1d5db' : '#4b5563', lineHeight: '1.7', marginBottom: '16px' }}>
          {LYT_INFO.name} maintains a standard rate card for subcontractor services. Rates are negotiable on a per-project basis 
          and will be specified in individual Scope of Work (SOW) documents.
        </p>
        
        {/* Live Rate Card from Google Sheets */}
        {rateCardLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: darkMode ? '#9ca3af' : '#6b7280' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p>Loading rate card...</p>
          </div>
        ) : rateCardError ? (
          <div style={{ padding: '20px', textAlign: 'center', color: accentError, backgroundColor: darkMode ? '#1f2937' : '#fef2f2', borderRadius: '8px' }}>
            <AlertCircle size={24} style={{ marginBottom: '8px' }} />
            <p>{rateCardError}</p>
            <button onClick={fetchRateCard} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        ) : rateCardData.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: darkMode ? '#9ca3af' : '#6b7280' }}>
            <p>No rate card data available.</p>
          </div>
        ) : (
          <div style={{ 
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, 
            borderRadius: '8px', 
            overflow: 'hidden',
            marginBottom: '16px',
            maxHeight: '450px',
            overflowY: 'auto',
          }}>
            {Object.entries(groupedRateCard).map(([category, items]) => (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: darkMode ? '#374151' : '#e5e7eb',
                    border: 'none',
                    borderBottom: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: darkMode ? '#f9fafb' : '#1f2937',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>{category} ({items.length})</span>
                  <span style={{ transform: expandedCategories.includes(category) ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                </button>
                {expandedCategories.includes(category) && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#9ca3af' : '#6b7280', fontWeight: '500', width: '80px' }}>Code</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#9ca3af' : '#6b7280', fontWeight: '500' }}>Description</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#9ca3af' : '#6b7280', fontWeight: '500', width: '60px' }}>UOM</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#9ca3af' : '#6b7280', fontWeight: '500', width: '80px' }}>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.code} style={{ backgroundColor: idx % 2 === 0 ? (darkMode ? '#111827' : '#ffffff') : (darkMode ? '#1f2937' : '#f9fafb') }}>
                          <td style={{ padding: '8px 12px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: accentPrimary, fontWeight: '500' }}>{item.code}</td>
                          <td style={{ padding: '8px 12px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#e5e7eb' : '#374151' }}>{item.description}</td>
                          <td style={{ padding: '8px 12px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#9ca3af' : '#6b7280', textAlign: 'center' }}>{item.uom}</td>
                          <td style={{ padding: '8px 12px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: accentSecondary, fontWeight: '600', textAlign: 'right' }}>{item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
        
        <p style={{ fontSize: '0.8rem', color: darkMode ? '#9ca3af' : '#6b7280', fontStyle: 'italic' }}>
          * Texas/Louisiana Standard Rates - Live from Google Sheets. Project-specific rates confirmed in SOW.
        </p>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          name="rateCardAccepted"
          checked={formData.rateCardAccepted}
          onChange={handleChange}
          style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: accentPrimary }}
        />
        <span style={{ lineHeight: '1.5', color: textColor }}>
          I have reviewed the rate card and understand that specific rates will be agreed upon in individual
          project SOWs. I agree to the general payment terms of Net 30 from invoice approval with 10% retainage
          held until project completion and final acceptance.
        </span>
      </label>

      {formData.rateCardAccepted && (
        <div style={{ marginTop: '16px' }}>
          <SignaturePad
            onSignatureChange={(sig) => setFormData({ ...formData, rateCardSignature: sig })}
            label="Rate Card Acceptance Signature"
            darkMode={darkMode}
          />
        </div>
      )}
    </div>
  );

  const renderBanking = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Direct Deposit Authorization</h3>
      
      <p style={{ color: darkMode ? '#d1d5db' : '#4b5563', marginBottom: '20px', lineHeight: '1.6' }}>
        Provide your banking details for payment via ACH direct deposit. A voided check is required for verification.
      </p>

      {/* Bank Information */}
      <div style={{ padding: '20px', backgroundColor: darkMode ? '#1f2937' : '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: accentPrimary }}>Bank Account Information</h4>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Bank Name *</label>
          <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Routing Number (ABA) *</label>
            <input
              type="text"
              name="routingNumber"
              value={formData.routingNumber}
              onChange={handleChange}
              required
              maxLength={9}
              style={inputStyle}
              placeholder="9 digits"
            />
          </div>
          <div>
            <label style={labelStyle}>Account Number *</label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Account Type *</label>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['checking', 'savings'].map((type) => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: textColor }}>
                <input
                  type="radio"
                  name="accountType"
                  value={type}
                  checked={formData.accountType === type}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ textTransform: 'capitalize' }}>{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Voided Check Upload */}
      <div style={{ padding: '20px', backgroundColor: darkMode ? '#1f2937' : '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: accentPrimary }}>Voided Check *</h4>
        <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '0.9rem', marginBottom: '16px' }}>
          Please upload an image of a voided check for bank account verification. This ensures accurate ACH deposit setup.
        </p>
        
        <div style={{ 
          border: `2px dashed ${formData.voidedCheckFileName ? colors.green : (darkMode ? '#374151' : '#ddd')}`, 
          borderRadius: '8px', 
          padding: '24px', 
          textAlign: 'center',
          backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#fff'
        }}>
          {formData.voidedCheckFileName ? (
            <div>
              <p style={{ color: colors.green, fontWeight: '500', marginBottom: '8px' }}>✓ {formData.voidedCheckFileName}</p>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, voidedCheckFile: null, voidedCheckFileName: '' })}
                style={{ padding: '8px 16px', backgroundColor: accentError, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                id="voidedCheck"
                accept="image/*,.pdf"
                onChange={handleVoidedCheckUpload}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="voidedCheck"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: accentPrimary,
                  color: '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                <Upload size={18} />
                Upload Voided Check
              </label>
              <p style={{ color: darkMode ? '#6b7280' : '#9ca3af', fontSize: '0.8rem', marginTop: '12px' }}>
                Accepted formats: JPG, PNG, PDF (max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Direct Deposit Authorization Agreement */}
      <div style={{ padding: '20px', backgroundColor: darkMode ? '#111827' : '#fffbeb', borderRadius: '8px', marginBottom: '24px', border: `1px solid ${darkMode ? '#374151' : '#fcd34d'}` }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: darkMode ? '#fcd34d' : '#92400e' }}>Direct Deposit Authorization Agreement</h4>
        
        <div style={{ color: darkMode ? '#d1d5db' : '#4b5563', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '16px' }}>
          <p style={{ marginBottom: '12px' }}>
            I hereby authorize {LYT_INFO.name} to initiate credit entries (deposits) to my account at the financial 
            institution named above. I also authorize the financial institution to accept and credit any such entries.
          </p>
          <p style={{ marginBottom: '12px' }}>
            This authorization will remain in effect until I notify {LYT_INFO.name} in writing to discontinue 
            these payments, allowing reasonable time to act on my request.
          </p>
          <p>
            I understand that if erroneous deposits are made to my account, {LYT_INFO.name} is authorized to 
            debit my account for an amount not to exceed the original amount of the erroneous credit.
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '16px' }}>
          <input
            type="checkbox"
            name="directDepositAgreed"
            checked={formData.directDepositAgreed}
            onChange={handleChange}
            style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: accentPrimary }}
          />
          <span style={{ color: textColor, lineHeight: '1.5' }}>
            I have read and agree to the Direct Deposit Authorization terms above. I certify that the bank 
            account information provided is accurate.
          </span>
        </label>

        {formData.directDepositAgreed && (
          <>
            <SignaturePad
              onSignatureChange={(sig) => setFormData({ ...formData, directDepositSignature: sig })}
              label="Direct Deposit Authorization Signature"
              darkMode={darkMode}
            />
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle}>Date *</label>
              <input 
                type="date" 
                name="directDepositDate" 
                value={formData.directDepositDate} 
                onChange={handleChange} 
                required
                style={{ ...inputStyle, maxWidth: '200px' }} 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderCompanyInfo();
      case 1: return renderMSA();
      case 2: return renderW9();
      case 3: return renderInsurance();
      case 4: return renderFleetPersonnel();
      case 5: return renderSkills();
      case 6: return renderRateCard();
      case 7: return renderBanking();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.companyName && formData.entityType && formData.contactName && formData.email && formData.phone && formData.address && formData.city && formData.state && formData.zip;
      case 1: return formData.msaSignature;
      case 2: return (formData.taxIdType === 'ein' ? formData.ein : formData.ssn) && formData.taxClassification && formData.w9Signature;
      case 3: return formData.coiFile && formData.coiExpiration && formData.liabilityAmount && formData.workersCompAmount;
      case 4: return true;
      case 5: return formData.skills.length > 0;
      case 6: return formData.rateCardAccepted && formData.rateCardSignature;
      case 7: return formData.bankName && formData.routingNumber && formData.accountNumber && formData.directDepositSignature;
      default: return false;
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <CheckCircle size={80} color={accentSecondary} style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '16px', color: textColor }}>
            Registration Complete!
          </h2>
          <p style={{ color: colors.gray, fontSize: '1.1rem', marginBottom: '32px' }}>
            Thank you for registering with {LYT_INFO.name}. Our team will review your submission and 
            contact you within 2-3 business days.
          </p>
          <button
            onClick={() => setCurrentPage('home')}
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              fontWeight: '600',
              backgroundColor: accentPrimary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Return to Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor }}>
      {/* Top Bar with Sun/Moon Toggle */}
      <div style={{ backgroundColor: darkMode ? '#112240' : '#f1f5f9', padding: '6px 20px', display: 'flex', justifyContent: 'flex-end' }}>
        {setDarkMode && (
          <button onClick={() => setDarkMode(!darkMode)} style={{ backgroundColor: 'transparent', border: 'none', color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '4px 8px', borderRadius: '6px', transition: 'all 0.2s ease' }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hide-mobile-toggle">{darkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        )}
      </div>
      
      {/* Header - Triple tap title to skip steps (hidden feature) */}
      <header style={{ padding: isMobile ? '12px 16px' : '16px 20px', backgroundColor: darkMode ? '#0d1b2a' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
        <button
          onClick={() => setCurrentPage('onboarding')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: 'none', color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', fontSize: isMobile ? '0.9rem' : '1rem', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'all 0.2s ease' }}
        >
          <ArrowLeft size={isMobile ? 18 : 20} /> {!isMobile && 'Back'}
        </button>
        <div 
          onClick={handleHeaderTap}
          style={{ fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '700', color: textColor, cursor: 'default', userSelect: 'none' }}
        >
          <span style={{ color: accentPrimary }}>Contractor</span> Registration
        </div>
        <button
          onClick={() => setCurrentPage('home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
        >
          <div style={{ fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '700' }}>
            <span style={{ color: logoLY }}>ly</span><span style={{ color: logoT }}>t</span>
          </div>
        </button>
      </header>

      {/* Progress Steps - Mobile: Dropdown, Desktop: Full bar */}
      {isMobile ? (
        <div style={{ padding: '12px 16px', backgroundColor: cardBg, borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
          <button
            onClick={() => setShowStepDropdown(!showStepDropdown)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: darkMode ? '#0d1b2a' : '#f1f5f9',
              border: `1px solid ${darkMode ? '#374151' : '#e2e8f0'}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: textColor,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: accentPrimary,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.9rem',
              }}>
                {currentStep + 1}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{steps[currentStep].title}</div>
                <div style={{ fontSize: '0.75rem', color: colors.gray }}>Step {currentStep + 1} of {steps.length}</div>
              </div>
            </div>
            <ChevronDown size={20} style={{ transform: showStepDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {showStepDropdown && (
            <div style={{
              marginTop: '8px',
              backgroundColor: darkMode ? colors.dark : '#fff',
              border: `1px solid ${darkMode ? '#374151' : '#e2e8f0'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  onClick={() => { setShowStepDropdown(false); }}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: idx === currentStep ? (darkMode ? '#374151' : '#f1f5f9') : 'transparent',
                    borderBottom: idx < steps.length - 1 ? `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` : 'none',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: idx < currentStep ? accentSecondary : idx === currentStep ? accentPrimary : (darkMode ? '#4b5563' : '#e5e7eb'),
                    color: idx <= currentStep ? '#fff' : colors.gray,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}>
                    {idx < currentStep ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <span style={{ color: idx <= currentStep ? textColor : colors.gray, fontSize: '0.9rem' }}>{step.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '20px', backgroundColor: cardBg, borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, overflowX: 'auto' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', minWidth: '700px' }}>
            {steps.map((step, idx) => (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: idx <= currentStep ? accentPrimary : (darkMode ? colors.dark : '#e5e7eb'),
                    color: idx <= currentStep ? '#fff' : colors.gray,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    marginBottom: '6px',
                  }}
                >
                  {idx < currentStep ? <CheckCircle size={18} /> : idx + 1}
                </div>
                <span style={{ fontSize: '0.7rem', color: idx <= currentStep ? textColor : colors.gray, textAlign: 'center' }}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Content */}
      <main style={{ padding: isMobile ? '20px 12px' : '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: isMobile ? '12px' : '16px', padding: isMobile ? '16px' : '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            {renderStepContent()}

            {error && (
              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: `${accentError}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: accentError }}>
                <AlertCircle size={20} /> {error}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: isMobile ? '24px' : '32px', paddingTop: isMobile ? '16px' : '24px', borderTop: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, gap: '12px' }}>
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                style={{
                  padding: isMobile ? '10px 16px' : '12px 24px',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  backgroundColor: 'transparent',
                  border: `1px solid ${currentStep === 0 ? '#ccc' : colors.gray}`,
                  color: currentStep === 0 ? '#ccc' : textColor,
                  borderRadius: '8px',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flex: isMobile ? 1 : 'none',
                  justifyContent: 'center',
                }}
              >
                <ArrowLeft size={isMobile ? 16 : 18} /> {isMobile ? 'Back' : 'Previous'}
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  style={{
                    padding: isMobile ? '10px 16px' : '12px 24px',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    backgroundColor: canProceed() ? accentPrimary : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center',
                  }}
                >
                  Next <ArrowRight size={isMobile ? 16 : 18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  style={{
                    padding: isMobile ? '10px 16px' : '12px 24px',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    backgroundColor: canProceed() ? accentSecondary : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: canProceed() && !submitting ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center',
                  }}
                >
                  {submitting ? 'Submitting...' : (isMobile ? 'Complete' : 'Complete Registration')}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile-toggle { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ContractorOnboarding;
