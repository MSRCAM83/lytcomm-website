/**
 * testSubmissions.js - Generate and submit test onboarding data
 * Creates fully-filled contractor/employee submissions with all PDFs
 */

import { URLS } from '../config/constants';
import { fillW4, fillW9, fillMSA, createFormPdf } from './pdfService';

/**
 * Generate a test signature PNG data URL
 * Draws "Test Signature" on a small canvas
 */
function generateTestSignature() {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw a cursive-style signature
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // "T"
  ctx.moveTo(20, 25); ctx.lineTo(50, 25);
  ctx.moveTo(35, 25); ctx.lineTo(35, 55);
  // "e"
  ctx.moveTo(55, 40); ctx.quadraticCurveTo(55, 30, 65, 30);
  ctx.quadraticCurveTo(75, 30, 75, 40); ctx.lineTo(55, 40);
  ctx.quadraticCurveTo(55, 55, 70, 55);
  // "s"
  ctx.moveTo(85, 33); ctx.quadraticCurveTo(78, 30, 78, 37);
  ctx.quadraticCurveTo(78, 42, 88, 42);
  ctx.quadraticCurveTo(92, 47, 80, 50);
  // "t"
  ctx.moveTo(100, 20); ctx.lineTo(100, 55);
  ctx.moveTo(92, 32); ctx.lineTo(108, 32);
  // Swoosh underline
  ctx.moveTo(20, 60); ctx.quadraticCurveTo(80, 65, 140, 55);
  ctx.quadraticCurveTo(180, 48, 200, 55);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

/**
 * Submit a fully-filled test contractor onboarding
 */
export async function submitTestContractor(onProgress) {
  const log = (msg) => {
    console.log('[Test Contractor] ' + msg);
    if (onProgress) onProgress(msg);
  };

  try {
    log('Generating test data...');

    const testSignature = generateTestSignature();
    const signatureInfo = {
      timestamp: new Date().toLocaleString(),
      ip: '127.0.0.1',
    };
    const signatureTimestamp = new Date().toISOString();

    // Complete contractor form data
    const formData = {
      companyName: 'Test Contractor LLC',
      dba: 'TC Services',
      entityType: 'llc-s',
      taxClassification: 'S',
      contactName: 'John Doe',
      contactTitle: 'President',
      email: 'john@testcontractor.com',
      phone: '(555) 123-4567',
      address: '1234 Main Street',
      city: 'Webster',
      state: 'TX',
      zip: '77598',
      taxIdType: 'ein',
      ein: '12-3456789',
      ssn: '',
      // MSA
      msaPrintedName: 'John Doe',
      msaTitle: 'President',
      msaSignature: testSignature,
      msaDate: new Date().toISOString().split('T')[0],
      msaEffectiveDate: new Date().toISOString().split('T')[0],
      // W-9
      w9Signature: testSignature,
      w9Date: new Date().toISOString().split('T')[0],
      // Insurance
      coiFileName: 'test_coi.pdf',
      coiExpiration: '2027-12-31',
      liabilityAmount: '$2,000,000',
      workersCompAmount: '$1,000,000',
      // Fleet & Personnel
      fleet: [
        { type: 'Bucket Truck', count: '3', description: 'Altec AT37G' },
        { type: 'Directional Drill', count: '2', description: 'Vermeer D24x40' },
        { type: 'Mini Excavator', count: '1', description: 'Cat 303.5' },
      ],
      personnel: [
        { name: 'John Doe', role: 'Owner/Operator', certifications: 'OSHA 30, CDL Class A' },
        { name: 'Jane Smith', role: 'Lead Technician', certifications: 'OSHA 10, Fiber Splicing' },
        { name: 'Bob Johnson', role: 'Crew Foreman', certifications: 'OSHA 10, Traffic Control' },
      ],
      // Skills
      skills: ['HDD Drilling', 'Fiber Splicing', 'Underground Construction', 'OTDR Testing', 'Aerial Construction'],
      otherSkills: 'Locating, Restoration, Conduit Installation',
      // Rate Card
      rateCardAccepted: true,
      rateCardSignature: testSignature,
      // Safety
      safetySignature: testSignature,
      // Banking
      bankName: 'Test National Bank',
      routingNumber: '111000025',
      accountNumber: '123456789012',
      accountType: 'checking',
      directDepositSignature: testSignature,
      directDepositAgreed: true,
    };

    // ========== GENERATE ALL PDFs ==========

    // 0. Company Info PDF
    log('Generating Company Info PDF...');
    const companyInfoPdf = await createFormPdf(
      'Company Information',
      [
        { title: 'COMPANY DETAILS', fields: [
          { label: 'Company Name', value: formData.companyName },
          { label: 'DBA', value: formData.dba },
          { label: 'Entity Type', value: formData.entityType },
          { label: 'Tax ID Type', value: 'EIN' },
          { label: 'Tax ID', value: formData.ein },
        ]},
        { title: 'PRIMARY CONTACT', fields: [
          { label: 'Contact Name', value: formData.contactName },
          { label: 'Title', value: formData.contactTitle },
          { label: 'Email', value: formData.email },
          { label: 'Phone', value: formData.phone },
        ]},
        { title: 'ADDRESS', fields: [
          { label: 'Street', value: formData.address },
          { label: 'City', value: formData.city },
          { label: 'State', value: formData.state },
          { label: 'ZIP', value: formData.zip },
        ]},
        { title: 'ELECTRONIC RECORD', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      null, signatureInfo
    );

    // 1. W-9
    log('Generating W-9 PDF...');
    const w9Pdf = await fillW9({
      companyName: formData.companyName,
      dba: formData.dba,
      entityType: formData.entityType,
      taxClassification: formData.taxClassification,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      ein: formData.ein,
    }, formData.w9Signature, signatureInfo);

    // 2. MSA
    log('Generating MSA PDF...');
    const msaPdf = await fillMSA({
      companyName: formData.companyName,
      contactName: formData.contactName,
      contactTitle: formData.contactTitle,
      title: formData.contactTitle,
      entityType: formData.entityType,
      effectiveDate: formData.msaEffectiveDate,
      printedName: formData.msaPrintedName,
      msaDate: formData.msaDate,
    }, formData.msaSignature, signatureInfo);

    // 3. Insurance
    log('Generating Insurance PDF...');
    const insurancePdf = await createFormPdf(
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
          { label: 'Each Occurrence', value: '$1,000,000' },
        ]},
        { title: 'CONTRACTOR COVERAGE', fields: [
          { label: 'General Liability', value: formData.liabilityAmount },
          { label: 'Workers Comp', value: formData.workersCompAmount },
        ]},
        { title: 'CERTIFICATE DETAILS', fields: [
          { label: 'COI Uploaded', value: formData.coiFileName },
          { label: 'Expiration Date', value: formData.coiExpiration },
        ]},
      ],
      null, signatureInfo
    );

    // 4. Rate Card (with sample rates since we can't fetch live data in test)
    log('Generating Rate Card PDF...');
    const rateCardPdf = await createFormPdf(
      'Rate Card Acceptance Agreement',
      [
        { title: 'CONTRACTOR', fields: [
          { label: 'Company', value: formData.companyName },
          { label: 'Contact', value: formData.contactName },
        ]},
        { title: 'SAMPLE RATES (TEST)', fields: [
          { label: 'UG01 - 1 Duct Bore (per ft)', value: '$8.50' },
          { label: 'UG02 - 2 Duct Bore (per ft)', value: '$11.00' },
          { label: 'UG04-M024 - 24ct Cable Pull (per ft)', value: '$1.25' },
          { label: 'UG12 - Flowerpot Install (each)', value: '$125.00' },
          { label: 'UG17 - Handhole Install (each)', value: '$450.00' },
        ]},
        { title: 'PAYMENT TERMS', checkboxes: [
          { label: 'Net 30 from invoice approval', checked: true },
          { label: '10% retainage until project completion', checked: true },
          { label: 'Lien waivers required with payment applications', checked: true },
        ]},
        { paragraphs: ['By signing, I acknowledge receipt of and agree to the LYT Communications Rate Card above.'] },
      ],
      formData.rateCardSignature, signatureInfo
    );

    // 5. Fleet & Personnel
    log('Generating Fleet PDF...');
    const fleetList = formData.fleet
      .filter(f => f.type || f.count)
      .map(f => `${f.type}: ${f.count} (${f.description})`);

    const fleetPdf = await createFormPdf(
      'Fleet & Personnel Information',
      [
        { title: 'CONTRACTOR', fields: [
          { label: 'Company', value: formData.companyName },
          { label: 'Contact', value: formData.contactName },
        ]},
        { title: 'PERSONNEL', fields: [
          { label: 'Key Personnel Listed', value: formData.personnel.filter(p => p.name).length },
          ...formData.personnel.filter(p => p.name).map(p => ({
            label: p.name,
            value: [p.role, p.certifications].filter(Boolean).join(' - '),
          })),
        ]},
        { title: 'FLEET/EQUIPMENT', fields: fleetList.map((item, i) => ({ label: `Item ${i+1}`, value: item })) },
        { title: 'ELECTRONIC RECORD', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      null, signatureInfo
    );

    // 6. Skills
    log('Generating Skills PDF...');
    const skillsPdf = await createFormPdf(
      'Skills & Capabilities Inventory',
      [
        { title: 'CONTRACTOR', fields: [
          { label: 'Company', value: formData.companyName },
          { label: 'Contact', value: formData.contactName },
        ]},
        { title: 'CERTIFIED SKILLS', checkboxes: formData.skills.map(s => ({ label: s, checked: true })) },
        { title: 'ADDITIONAL SKILLS/SERVICES', paragraphs: [formData.otherSkills] },
        { title: 'ELECTRONIC RECORD', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      null, signatureInfo
    );

    // 7. Direct Deposit
    log('Generating Direct Deposit PDF...');
    const directDepositPdf = await createFormPdf(
      'Direct Deposit Authorization',
      [
        { title: 'COMPANY', fields: [
          { label: 'Company Name', value: formData.companyName },
          { label: 'Contact', value: formData.contactName },
        ]},
        { title: 'BANK INFORMATION', fields: [
          { label: 'Bank Name', value: formData.bankName },
          { label: 'Routing Number', value: formData.routingNumber },
          { label: 'Account Number', value: formData.accountNumber },
          { label: 'Account Type', value: formData.accountType },
        ]},
        { title: 'AUTHORIZATION', paragraphs: [
          'I authorize LYT Communications, LLC to initiate credit entries to the account above.',
        ]},
        { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      formData.directDepositSignature, signatureInfo
    );

    // 8. Safety
    log('Generating Safety PDF...');
    const safetyPdf = await createFormPdf(
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
          { label: 'General Liability', value: formData.liabilityAmount },
          { label: 'Workers Comp', value: formData.workersCompAmount },
        ]},
        { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      formData.safetySignature, signatureInfo
    );

    // ========== BUILD & SUBMIT PAYLOAD ==========
    log('Submitting to Google Apps Script...');

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
        effectiveDate: formData.msaEffectiveDate,
        printedName: formData.msaPrintedName,
        msaDate: formData.msaDate,
        taxIdType: formData.taxIdType,
        ein: formData.ein,
        bankName: formData.bankName,
        routingNumber: formData.routingNumber,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
      },
      signatureVerification: {
        ipAddress: '127.0.0.1',
        timestamp: signatureTimestamp,
        userAgent: 'TestSubmission/1.0',
      },
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
      submittedAt: new Date().toISOString(),
    };

    const response = await fetch(URLS.appsScript, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      // GAS returns HTML with redirect - follow it to get actual JSON response
      if (text.includes('HREF="')) {
        const match = text.match(/HREF="([^"]+)"/i);
        if (match) {
          const redirectUrl = match[1].replace(/&amp;/g, '&');
          const finalResponse = await fetch(redirectUrl);
          const finalText = await finalResponse.text();
          try {
            result = JSON.parse(finalText);
          } catch {
            result = { success: true, message: 'Submitted (redirect followed)' };
          }
        } else {
          result = { success: false, error: 'Could not parse redirect URL' };
        }
      } else {
        result = { success: false, error: text.substring(0, 200) };
      }
    }

    log(result.success ? 'SUCCESS: ' + (result.message || 'Contractor test submitted') : 'ERROR: ' + result.error);
    return result;

  } catch (error) {
    log('FAILED: ' + error.message);
    throw error;
  }
}

/**
 * Submit a fully-filled test employee onboarding
 */
export async function submitTestEmployee(onProgress) {
  const log = (msg) => {
    console.log('[Test Employee] ' + msg);
    if (onProgress) onProgress(msg);
  };

  try {
    log('Generating test data...');

    const testSignature = generateTestSignature();
    const signatureInfo = {
      timestamp: new Date().toLocaleString(),
      ip: '127.0.0.1',
    };
    const signatureTimestamp = new Date().toISOString();

    const formData = {
      firstName: 'Jane',
      middleName: 'M',
      lastName: 'TestEmployee',
      email: 'jane@testemployee.com',
      phone: '(555) 987-6543',
      address: '5678 Oak Avenue',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
      dateOfBirth: '1990-05-15',
      ssn: '123-45-6789',
      // W-4
      filingStatus: 'single',
      multipleJobs: false,
      qualifyingChildren: 1,
      otherDependents: 0,
      otherIncome: '',
      deductions: '',
      extraWithholding: '50',
      exempt: false,
      w4Signature: testSignature,
      w4Date: new Date().toISOString().split('T')[0],
      // Direct Deposit
      bankName: 'Test Employee Bank',
      routingNumber: '111000025',
      accountNumber: '987654321098',
      accountType: 'checking',
      directDepositAgreed: true,
      directDepositSignature: testSignature,
      // Emergency Contact
      emergencyName: 'Bob TestContact',
      emergencyRelation: 'Spouse',
      emergencyPhone: '(555) 111-2222',
      emergencyEmail: 'bob@test.com',
      // Consents
      backgroundCheckConsent: true,
      backgroundCheckSignature: testSignature,
      drugTestConsent: true,
      drugTestSignature: testSignature,
      // Safety
      safetyAcknowledged: true,
      safetySignature: testSignature,
    };

    const fullName = `${formData.firstName} ${formData.lastName}`;

    // ========== GENERATE ALL PDFs ==========

    // 0. Personal Info
    log('Generating Personal Info PDF...');
    const personalInfoPdf = await createFormPdf(
      'Employee Personal Information',
      [
        { title: 'PERSONAL DETAILS', fields: [
          { label: 'Full Name', value: fullName },
          { label: 'Email', value: formData.email },
          { label: 'Phone', value: formData.phone },
          { label: 'Date of Birth', value: formData.dateOfBirth },
          { label: 'SSN', value: `***-**-${formData.ssn.slice(-4)}` },
        ]},
        { title: 'ADDRESS', fields: [
          { label: 'Street', value: formData.address },
          { label: 'City', value: formData.city },
          { label: 'State', value: formData.state },
          { label: 'ZIP', value: formData.zip },
        ]},
        { title: 'ELECTRONIC RECORD', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      null, signatureInfo
    );

    // 1. W-4
    log('Generating W-4 PDF...');
    const w4Pdf = await fillW4({
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      ssn: formData.ssn,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      filingStatus: formData.filingStatus,
      multipleJobs: formData.multipleJobs,
      qualifyingChildren: formData.qualifyingChildren,
      otherDependents: formData.otherDependents,
      otherIncome: formData.otherIncome,
      deductions: formData.deductions,
      extraWithholding: formData.extraWithholding,
    }, formData.w4Signature, signatureInfo);

    // 2. Direct Deposit
    log('Generating Direct Deposit PDF...');
    const directDepositPdf = await createFormPdf(
      'Direct Deposit Authorization',
      [
        { title: 'EMPLOYEE', fields: [
          { label: 'Name', value: fullName },
          { label: 'Email', value: formData.email },
          { label: 'Phone', value: formData.phone },
        ]},
        { title: 'BANK INFORMATION', fields: [
          { label: 'Bank Name', value: formData.bankName },
          { label: 'Routing Number', value: formData.routingNumber },
          { label: 'Account Number', value: formData.accountNumber },
          { label: 'Account Type', value: formData.accountType },
        ]},
        { title: 'AUTHORIZATION', paragraphs: [
          'I authorize LYT Communications, LLC to initiate credit entries to my account.',
          'This authorization remains in effect until I provide written notice to discontinue.',
        ]},
        { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      formData.directDepositSignature, signatureInfo
    );

    // 3. Emergency Contact
    log('Generating Emergency Contact PDF...');
    const emergencyContactPdf = await createFormPdf(
      'Emergency Contact Information',
      [
        { title: 'EMPLOYEE', fields: [
          { label: 'Name', value: fullName },
          { label: 'Phone', value: formData.phone },
        ]},
        { title: 'EMERGENCY CONTACT', fields: [
          { label: 'Name', value: formData.emergencyName },
          { label: 'Relationship', value: formData.emergencyRelation },
          { label: 'Phone', value: formData.emergencyPhone },
          { label: 'Email', value: formData.emergencyEmail },
        ]}
      ],
      null, signatureInfo
    );

    // 4. Background Check
    log('Generating Background Check PDF...');
    const backgroundCheckPdf = await createFormPdf(
      'Background Check Authorization',
      [
        { title: 'APPLICANT', fields: [
          { label: 'Name', value: fullName },
          { label: 'DOB', value: formData.dateOfBirth },
          { label: 'SSN', value: formData.ssn },
        ]},
        { title: 'AUTHORIZATION', paragraphs: [
          'I authorize LYT Communications, LLC to conduct a background investigation including criminal records, employment verification, education verification, and reference checks.',
        ], checkboxes: [
          { label: 'I authorize this background check', checked: true }
        ]},
        { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      formData.backgroundCheckSignature, signatureInfo
    );

    // 5. Drug Test
    log('Generating Drug Test PDF...');
    const drugTestPdf = await createFormPdf(
      'Drug and Alcohol Testing Consent',
      [
        { title: 'EMPLOYEE', fields: [{ label: 'Name', value: fullName }]},
        { title: 'CONSENT', paragraphs: [
          'I consent to drug and alcohol testing as required by company policy.',
        ], checkboxes: [
          { label: 'Pre-employment testing required', checked: true },
          { label: 'Random testing may be conducted', checked: true },
          { label: 'Post-accident testing may be required', checked: true },
          { label: 'I consent to testing', checked: true }
        ]},
        { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      formData.drugTestSignature, signatureInfo
    );

    // 6. Safety
    log('Generating Safety PDF...');
    const safetyPdf = await createFormPdf(
      'HSE Safety Acknowledgment',
      [
        { title: 'EMPLOYEE', fields: [{ label: 'Name', value: fullName }]},
        { title: 'ACKNOWLEDGMENT', paragraphs: [
          'I have received, read, and understand the LYT Communications HSE Manual.',
        ], checkboxes: [
          { label: 'Follow all safety procedures', checked: true },
          { label: 'Use required PPE', checked: true },
          { label: 'Report injuries immediately', checked: true },
          { label: 'Participate in safety training', checked: true },
          { label: 'I acknowledge the HSE Manual', checked: true }
        ]},
        { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
          { label: 'IP Address', value: '127.0.0.1' },
          { label: 'Timestamp', value: signatureTimestamp },
        ]}
      ],
      formData.safetySignature, signatureInfo
    );

    // ========== BUILD & SUBMIT PAYLOAD ==========
    log('Submitting to Google Apps Script...');

    const payload = {
      action: 'submitEmployeeOnboarding',
      formData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        ssn: formData.ssn,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        bankName: formData.bankName,
        routingNumber: formData.routingNumber,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        emergencyName: formData.emergencyName,
        emergencyPhone: formData.emergencyPhone,
        emergencyRelation: formData.emergencyRelation,
      },
      signatureVerification: {
        ipAddress: '127.0.0.1',
        timestamp: signatureTimestamp,
        userAgent: 'TestSubmission/1.0',
      },
      filledPdfs: {
        personalInfo: personalInfoPdf,
        w4: w4Pdf,
        directDeposit: directDepositPdf,
        emergencyContact: emergencyContactPdf,
        backgroundCheck: backgroundCheckPdf,
        drugTest: drugTestPdf,
        safety: safetyPdf,
      },
      submittedAt: new Date().toISOString(),
    };

    const response = await fetch(URLS.appsScript, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      // GAS returns HTML with redirect - follow it to get actual JSON response
      if (text.includes('HREF="')) {
        const match = text.match(/HREF="([^"]+)"/i);
        if (match) {
          const redirectUrl = match[1].replace(/&amp;/g, '&');
          const finalResponse = await fetch(redirectUrl);
          const finalText = await finalResponse.text();
          try {
            result = JSON.parse(finalText);
          } catch {
            result = { success: true, message: 'Submitted (redirect followed)' };
          }
        } else {
          result = { success: false, error: 'Could not parse redirect URL' };
        }
      } else {
        result = { success: false, error: text.substring(0, 200) };
      }
    }

    log(result.success ? 'SUCCESS: ' + (result.message || 'Employee test submitted') : 'ERROR: ' + result.error);
    return result;

  } catch (error) {
    log('FAILED: ' + error.message);
    throw error;
  }
}
