/**
 * LYT Communications - Onboarding Document Handler v2.0
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create new project, name it "LYT Onboarding Handler"
 * 3. Paste this entire code
 * 4. Click Deploy > New deployment
 * 5. Select type: Web app
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Click Deploy and copy the Web App URL
 * 9. Paste that URL into the React app's APPS_SCRIPT_URL constant
 * 
 * IMPORTANT: After ANY code changes, you must create a NEW deployment
 * (Deploy > New deployment), not just save the file!
 */

// Your LYT Communications Google Drive folder ID
const PARENT_FOLDER_ID = '11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC';

// Notification emails
const SUCCESS_EMAILS = ['matt@lytcomm.com', 'mason@lytcomm.com', 'donnie@lytcomm.com'];
const ERROR_EMAILS = ['matt@lytcomm.com', 'mason@lytcomm.com'];

/**
 * Handle incoming POST requests from the portal
 */
function doPost(e) {
  Logger.log('=== doPost called ===');
  
  try {
    // Check if we received any data
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('ERROR: No POST data received');
      return createResponse({ 
        success: false, 
        error: 'No data received. Check that the form is sending data correctly.' 
      });
    }
    
    Logger.log('Raw POST data length: ' + e.postData.contents.length);
    
    // Parse JSON
    let data;
    try {
      data = JSON.parse(e.postData.contents);
      Logger.log('Parsed data type: ' + data.type);
    } catch (parseError) {
      Logger.log('ERROR: JSON parse failed: ' + parseError.toString());
      return createResponse({ 
        success: false, 
        error: 'Invalid JSON data: ' + parseError.toString() 
      });
    }
    
    // Process the onboarding
    const result = processOnboarding(data);
    Logger.log('Process result: ' + JSON.stringify(result));
    
    return createResponse(result);
    
  } catch (error) {
    Logger.log('ERROR in doPost: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return createResponse({ 
      success: false, 
      error: 'Server error: ' + error.toString() 
    });
  }
}

/**
 * Handle GET requests (for testing the endpoint)
 */
function doGet(e) {
  Logger.log('doGet called - API health check');
  return createResponse({ 
    status: 'LYT Onboarding API Active v2.0',
    timestamp: new Date().toISOString(),
    folderId: PARENT_FOLDER_ID
  });
}

/**
 * Create JSON response with proper CORS headers
 */
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Process onboarding submission
 */
function processOnboarding(data) {
  Logger.log('=== processOnboarding started ===');
  
  // Validate required data
  if (!data) {
    return { success: false, error: 'No data provided' };
  }
  
  const type = data.type || 'unknown';
  const formData = data.formData || {};
  const documents = data.documents || {};
  const coiFile = data.coiFile;
  const voidedCheck = data.voidedCheck;
  const idFile = data.idFile;
  
  Logger.log('Type: ' + type);
  Logger.log('FormData keys: ' + Object.keys(formData).join(', '));
  
  // Create folder name
  let folderName;
  
  if (type === 'employee') {
    const firstName = formData.firstName || 'Unknown';
    const lastName = formData.lastName || 'Employee';
    folderName = `${firstName} ${lastName}`;
  } else {
    const companyName = formData.companyName || 'Unknown Contractor';
    folderName = `${companyName}`;
  }
  
  Logger.log('Folder name: ' + folderName);
  
  // Step 1: Get parent folder
  let parentFolder;
  try {
    parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    Logger.log('✓ Parent folder found: ' + parentFolder.getName());
  } catch (folderError) {
    Logger.log('ERROR: Cannot access parent folder: ' + folderError.toString());
    sendErrorEmail(type, formData, 'Cannot access Google Drive folder', folderError.toString());
    return { 
      success: false, 
      error: 'Cannot access Google Drive folder. Check folder ID and permissions.',
      details: folderError.toString()
    };
  }
  
  // Step 2: Get or create the Employees or Contractors subfolder
  let typeFolder;
  const subfolderName = type === 'employee' ? 'Employees' : 'Contractors';
  
  try {
    // Check if subfolder already exists
    const subfolders = parentFolder.getFoldersByName(subfolderName);
    if (subfolders.hasNext()) {
      typeFolder = subfolders.next();
      Logger.log('✓ Found existing subfolder: ' + subfolderName);
    } else {
      // Create the subfolder
      typeFolder = parentFolder.createFolder(subfolderName);
      Logger.log('✓ Created new subfolder: ' + subfolderName);
    }
  } catch (subfolderError) {
    Logger.log('ERROR: Cannot access/create subfolder: ' + subfolderError.toString());
    sendErrorEmail(type, formData, 'Cannot create ' + subfolderName + ' subfolder', subfolderError.toString());
    return { 
      success: false, 
      error: 'Cannot create ' + subfolderName + ' subfolder.',
      details: subfolderError.toString()
    };
  }
  
  // Step 3: Create the individual submission folder inside the type subfolder
  let newFolder;
  try {
    newFolder = typeFolder.createFolder(folderName);
    Logger.log('✓ Created folder: ' + newFolder.getUrl());
  } catch (createError) {
    Logger.log('ERROR: Cannot create folder: ' + createError.toString());
    sendErrorEmail(type, formData, 'Cannot create submission folder', createError.toString());
    return { 
      success: false, 
      error: 'Cannot create folder in Google Drive.',
      details: createError.toString()
    };
  }
  
  // Track what we save
  const savedFiles = [];
  const errors = [];
  
  // Step 4: Save main onboarding document (HTML)
  try {
    const docContent = createOnboardingDocument(type, formData, documents);
    const docBlob = Utilities.newBlob(docContent, 'text/html', `${folderName} - Onboarding Data.html`);
    const docFile = newFolder.createFile(docBlob);
    savedFiles.push('Onboarding Data.html');
    Logger.log('✓ Saved: Onboarding Data.html');
  } catch (docError) {
    Logger.log('ERROR saving HTML doc: ' + docError.toString());
    errors.push('Failed to save onboarding document: ' + docError.toString());
  }
  
  // Step 5: Save JSON backup
  try {
    const jsonData = {
      type: type,
      formData: formData,
      documents: documents,
      submittedAt: new Date().toISOString()
    };
    const jsonBlob = Utilities.newBlob(
      JSON.stringify(jsonData, null, 2),
      'application/json',
      `${folderName} - Data Backup.json`
    );
    const jsonFile = newFolder.createFile(jsonBlob);
    savedFiles.push('Data Backup.json');
    Logger.log('✓ Saved: Data Backup.json');
  } catch (jsonError) {
    Logger.log('ERROR saving JSON: ' + jsonError.toString());
    errors.push('Failed to save JSON backup: ' + jsonError.toString());
  }
  
  // Step 6: Save document acknowledgments
  if (documents && typeof documents === 'object') {
    for (const [docName, docData] of Object.entries(documents)) {
      try {
        if (docData && docData.signed) {
          const acknowledgment = createDocumentAcknowledgment(docName, docData, formData);
          const ackBlob = Utilities.newBlob(acknowledgment, 'text/html', `${docName} - Signed Acknowledgment.html`);
          newFolder.createFile(ackBlob);
          savedFiles.push(`${docName} - Signed Acknowledgment.html`);
          Logger.log('✓ Saved acknowledgment: ' + docName);
        }
      } catch (ackError) {
        Logger.log('ERROR saving acknowledgment for ' + docName + ': ' + ackError.toString());
        errors.push(`Failed to save ${docName} acknowledgment`);
      }
    }
  }
  
  // Step 7: Handle COI file upload for contractors
  if (coiFile && coiFile.data) {
    try {
      const coiData = Utilities.base64Decode(coiFile.data);
      const coiBlob = Utilities.newBlob(
        coiData,
        coiFile.mimeType || 'application/pdf',
        coiFile.name || 'Certificate_of_Insurance.pdf'
      );
      newFolder.createFile(coiBlob);
      savedFiles.push(coiFile.name || 'Certificate_of_Insurance.pdf');
      Logger.log('✓ Saved COI file');
    } catch (coiError) {
      Logger.log('ERROR saving COI: ' + coiError.toString());
      errors.push('Failed to save COI file: ' + coiError.toString());
    }
  }
  
  // Step 8: Handle voided check upload for employees
  if (voidedCheck && voidedCheck.data) {
    try {
      const checkData = Utilities.base64Decode(voidedCheck.data);
      const checkBlob = Utilities.newBlob(
        checkData,
        voidedCheck.mimeType || 'application/pdf',
        voidedCheck.name || 'Voided_Check.pdf'
      );
      newFolder.createFile(checkBlob);
      savedFiles.push(voidedCheck.name || 'Voided_Check.pdf');
      Logger.log('✓ Saved voided check');
    } catch (checkError) {
      Logger.log('ERROR saving voided check: ' + checkError.toString());
      errors.push('Failed to save voided check: ' + checkError.toString());
    }
  }
  
  // Step 9: Handle ID file upload
  if (idFile && idFile.data) {
    try {
      const idData = Utilities.base64Decode(idFile.data);
      const idBlob = Utilities.newBlob(
        idData,
        idFile.mimeType || 'application/pdf',
        idFile.name || 'ID_Document.pdf'
      );
      newFolder.createFile(idBlob);
      savedFiles.push(idFile.name || 'ID_Document.pdf');
      Logger.log('✓ Saved ID file');
    } catch (idError) {
      Logger.log('ERROR saving ID: ' + idError.toString());
      errors.push('Failed to save ID file: ' + idError.toString());
    }
  }
  
  // Step 10: Send notification email (non-blocking)
  if (SUCCESS_EMAILS && SUCCESS_EMAILS.length > 0) {
    try {
      sendSuccessEmail(type, formData, newFolder.getUrl());
      Logger.log('✓ Success notification emails sent');
    } catch (emailError) {
      Logger.log('WARNING: Email failed (non-critical): ' + emailError.toString());
      // Don't add to errors - email failure shouldn't fail the whole process
    }
  }
  
  // Step 11: Send warning email if there were partial errors
  if (errors.length > 0 && ERROR_EMAILS && ERROR_EMAILS.length > 0) {
    try {
      sendErrorEmail(type, formData, 'Partial errors during submission (folder created but some files failed)', errors.join('; '));
      Logger.log('✓ Warning email sent for partial errors');
    } catch (emailError) {
      Logger.log('WARNING: Error email failed: ' + emailError.toString());
    }
  }
  
  // Build result
  const displayName = type === 'employee' 
    ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Employee'
    : formData.companyName || 'Contractor';
  
  Logger.log('=== processOnboarding completed ===');
  Logger.log('Saved files: ' + savedFiles.join(', '));
  if (errors.length > 0) {
    Logger.log('Errors: ' + errors.join('; '));
  }
  
  return {
    success: true,
    folderId: newFolder.getId(),
    folderUrl: newFolder.getUrl(),
    folderName: folderName,
    savedFiles: savedFiles,
    warnings: errors.length > 0 ? errors : undefined,
    message: `Onboarding documents saved successfully for ${displayName}`
  };
}

/**
 * Create comprehensive onboarding document
 */
function createOnboardingDocument(type, formData, documents) {
  // Ensure formData exists
  formData = formData || {};
  documents = documents || {};
  
  const timestamp = Utilities.formatDate(new Date(), 'America/Chicago', 'MMMM dd, yyyy \'at\' hh:mm a z');
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LYT Communications - Onboarding Record</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { background: #0077B6; color: white; padding: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; }
    .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 20px; }
    .section h2 { color: #0077B6; margin-top: 0; border-bottom: 2px solid #00B4D8; padding-bottom: 10px; }
    .field { margin-bottom: 15px; }
    .field label { font-weight: bold; color: #333; display: block; margin-bottom: 5px; }
    .field .value { background: #f5f5f5; padding: 8px 12px; display: block; border-radius: 4px; }
    .status { padding: 5px 10px; border-radius: 4px; display: inline-block; }
    .status.signed { background: #28a745; color: white; }
    .status.pending { background: #ffc107; color: black; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #0077B6; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>LYT Communications</h1>
    <p>${type === 'employee' ? 'Employee' : 'Contractor'} Onboarding Record</p>
  </div>
  
  <div class="section">
    <h2>Submission Details</h2>
    <div class="field">
      <label>Submitted At</label>
      <div class="value">${timestamp}</div>
    </div>
    <div class="field">
      <label>Onboarding Type</label>
      <div class="value">${type === 'employee' ? 'New Employee' : 'Contractor / Subcontractor'}</div>
    </div>
  </div>
`;

  if (type === 'employee') {
    html += createEmployeeSection(formData);
  } else {
    html += createContractorSection(formData);
  }
  
  // Document status section
  html += `
  <div class="section">
    <h2>Document Status</h2>
    <table>
      <tr>
        <th>Document</th>
        <th>Status</th>
        <th>Signed At</th>
      </tr>
`;
  
  if (documents && typeof documents === 'object') {
    for (const [docName, docData] of Object.entries(documents)) {
      const isSigned = docData && docData.signed;
      const signedAt = (docData && docData.signedAt) || '-';
      html += `
      <tr>
        <td>${formatDocName(docName)}</td>
        <td><span class="status ${isSigned ? 'signed' : 'pending'}">${isSigned ? 'SIGNED' : 'Pending'}</span></td>
        <td>${signedAt}</td>
      </tr>
`;
    }
  } else {
    html += `
      <tr>
        <td colspan="3">No documents recorded</td>
      </tr>
`;
  }
  
  html += `
    </table>
  </div>
  
  <div class="footer">
    <p><strong>LYT Communications, LLC</strong></p>
    <p>12130 State Highway 3, Webster, TX 77598</p>
    <p>This document was automatically generated by the LYT Onboarding Portal.</p>
  </div>
</body>
</html>
`;
  
  return html;
}

/**
 * Safely get a value with fallback
 */
function safe(value, fallback) {
  return (value !== undefined && value !== null && value !== '') ? value : (fallback || '');
}

/**
 * Create employee-specific form sections
 */
function createEmployeeSection(formData) {
  formData = formData || {};
  
  return `
  <div class="section">
    <h2>Personal Information</h2>
    <div class="field">
      <label>Full Name</label>
      <div class="value">${safe(formData.firstName)} ${safe(formData.middleName)} ${safe(formData.lastName)}</div>
    </div>
    <div class="field">
      <label>Email</label>
      <div class="value">${safe(formData.email, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Phone</label>
      <div class="value">${safe(formData.phone, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Address</label>
      <div class="value">${safe(formData.address)}, ${safe(formData.city)}, ${safe(formData.state)} ${safe(formData.zip)}</div>
    </div>
    <div class="field">
      <label>Date of Birth</label>
      <div class="value">${safe(formData.dateOfBirth, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>SSN (Last 4)</label>
      <div class="value">XXX-XX-${safe(formData.ssnLast4, '****')}</div>
    </div>
  </div>
  
  <div class="section">
    <h2>Direct Deposit Information</h2>
    <div class="field">
      <label>Bank Name</label>
      <div class="value">${safe(formData.bankName, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Routing Number</label>
      <div class="value">${safe(formData.routingNumber, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Account Number (Last 4)</label>
      <div class="value">****${safe(formData.accountLast4, '****')}</div>
    </div>
    <div class="field">
      <label>Account Type</label>
      <div class="value">${safe(formData.accountType, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Voided Check Uploaded</label>
      <div class="value">${formData.voidedCheckUploaded ? 'Yes' : 'No'}</div>
    </div>
  </div>
  
  <div class="section">
    <h2>ID Verification</h2>
    <div class="field">
      <label>ID Type</label>
      <div class="value">${safe(formData.idType, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>ID Uploaded</label>
      <div class="value">${formData.idUploaded ? 'Yes' : 'No'}</div>
    </div>
  </div>
  
  <div class="section">
    <h2>Employment Consents</h2>
    <div class="field">
      <label>Background Check Authorization</label>
      <div class="value">${formData.backgroundCheckConsent ? '✓ Signed and Consented' : 'Not signed'}</div>
    </div>
    <div class="field">
      <label>Drug & Alcohol Testing Consent</label>
      <div class="value">${formData.drugTestConsent ? '✓ Signed and Consented' : 'Not signed'}</div>
    </div>
  </div>
  
  <div class="section">
    <h2>Emergency Contact</h2>
    <div class="field">
      <label>Contact Name</label>
      <div class="value">${safe(formData.emergencyName, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Relationship</label>
      <div class="value">${safe(formData.emergencyRelationship, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Phone</label>
      <div class="value">${safe(formData.emergencyPhone, 'Not provided')}</div>
    </div>
  </div>
`;
}

/**
 * Create contractor-specific form sections
 */
function createContractorSection(formData) {
  formData = formData || {};
  
  let html = `
  <div class="section">
    <h2>Company Information</h2>
    <div class="field">
      <label>Company Name</label>
      <div class="value">${safe(formData.companyName, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>DBA (if applicable)</label>
      <div class="value">${safe(formData.dba, 'N/A')}</div>
    </div>
    <div class="field">
      <label>Entity Type</label>
      <div class="value">${safe(formData.entityType, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>EIN</label>
      <div class="value">${safe(formData.ein, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Address</label>
      <div class="value">${safe(formData.companyAddress)}, ${safe(formData.companyCity)}, ${safe(formData.companyState)} ${safe(formData.companyZip)}</div>
    </div>
  </div>
  
  <div class="section">
    <h2>Primary Contact</h2>
    <div class="field">
      <label>Contact Name</label>
      <div class="value">${safe(formData.contactName, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Title</label>
      <div class="value">${safe(formData.contactTitle, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Email</label>
      <div class="value">${safe(formData.contactEmail, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Phone</label>
      <div class="value">${safe(formData.contactPhone, 'Not provided')}</div>
    </div>
  </div>
  
  <div class="section">
    <h2>Insurance Information</h2>
    <div class="field">
      <label>Insurance Carrier</label>
      <div class="value">${safe(formData.insuranceCarrier, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Policy Number</label>
      <div class="value">${safe(formData.policyNumber, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Expiration Date</label>
      <div class="value">${safe(formData.insuranceExpiration, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>COI Uploaded</label>
      <div class="value">${formData.coiUploaded ? 'Yes' : 'No'}</div>
    </div>
  </div>
`;

  // Fleet/Personnel section - with safe checks
  const fleet = formData.fleet;
  if (fleet && Array.isArray(fleet) && fleet.length > 0) {
    html += `
  <div class="section">
    <h2>Fleet & Equipment</h2>
    <table>
      <tr>
        <th>Type</th>
        <th>Make/Model</th>
        <th>Year</th>
        <th>VIN/ID</th>
      </tr>
`;
    fleet.forEach(function(item) {
      if (item) {
        html += `
      <tr>
        <td>${safe(item.type)}</td>
        <td>${safe(item.makeModel)}</td>
        <td>${safe(item.year)}</td>
        <td>${safe(item.vin)}</td>
      </tr>
`;
      }
    });
    html += `
    </table>
  </div>
`;
  }

  // Personnel section - with safe checks
  const personnel = formData.personnel;
  if (personnel && Array.isArray(personnel) && personnel.length > 0) {
    html += `
  <div class="section">
    <h2>Personnel</h2>
    <table>
      <tr>
        <th>Name</th>
        <th>Role</th>
        <th>Phone</th>
        <th>Certifications</th>
      </tr>
`;
    personnel.forEach(function(person) {
      if (person) {
        html += `
      <tr>
        <td>${safe(person.name)}</td>
        <td>${safe(person.role)}</td>
        <td>${safe(person.phone)}</td>
        <td>${safe(person.certifications)}</td>
      </tr>
`;
      }
    });
    html += `
    </table>
  </div>
`;
  }

  // Skills section - with safe checks
  const skills = formData.skills;
  if (skills && typeof skills === 'object') {
    const skillLabels = {
      hddDrilling: 'HDD Drilling',
      fiberSplicing: 'Fiber Splicing',
      aerialConstruction: 'Aerial Construction',
      undergroundConstruction: 'Underground Construction',
      cableInstallation: 'Cable Installation',
      testing: 'Testing & QA',
      restoration: 'Restoration',
      permitting: 'Permitting'
    };
    
    const hasSkills = Object.keys(skillLabels).some(function(key) {
      return skills[key];
    });
    
    if (hasSkills) {
      html += `
  <div class="section">
    <h2>Capabilities & Skills</h2>
    <table>
      <tr>
        <th>Skill</th>
        <th>Certified</th>
      </tr>
`;
      for (const key in skillLabels) {
        if (skills[key]) {
          html += `
      <tr>
        <td>${skillLabels[key]}</td>
        <td>✓</td>
      </tr>
`;
        }
      }
      html += `
    </table>
  </div>
`;
    }
  }

  // Banking section
  html += `
  <div class="section">
    <h2>Banking / Payment Information</h2>
    <div class="field">
      <label>Bank Name</label>
      <div class="value">${safe(formData.bankName, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Routing Number</label>
      <div class="value">${safe(formData.routingNumber, 'Not provided')}</div>
    </div>
    <div class="field">
      <label>Account Number (Last 4)</label>
      <div class="value">****${safe(formData.accountLast4, '****')}</div>
    </div>
    <div class="field">
      <label>Account Type</label>
      <div class="value">${safe(formData.accountType, 'Not provided')}</div>
    </div>
  </div>
`;

  return html;
}

/**
 * Create document acknowledgment record
 */
function createDocumentAcknowledgment(docName, docData, formData) {
  docData = docData || {};
  formData = formData || {};
  
  const timestamp = Utilities.formatDate(new Date(), 'America/Chicago', 'MMMM dd, yyyy \'at\' hh:mm a z');
  const signerName = formData.firstName 
    ? `${safe(formData.firstName)} ${safe(formData.lastName)}` 
    : safe(formData.companyName, 'Unknown');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Document Acknowledgment - ${formatDocName(docName)}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; }
    .header { background: #0077B6; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; border: 1px solid #ddd; }
    .signature-box { border: 2px solid #28a745; padding: 20px; margin: 20px 0; background: #f9fff9; }
    .signature { font-family: 'Brush Script MT', cursive; font-size: 28px; color: #333; }
    .timestamp { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>LYT Communications</h1>
    <h2>Document Acknowledgment</h2>
  </div>
  
  <div class="content">
    <h3>${formatDocName(docName)}</h3>
    
    <p>This document certifies that the following individual/entity has acknowledged and agreed to the terms of the above-referenced document.</p>
    
    <div class="signature-box">
      <p><strong>Signer:</strong> ${signerName}</p>
      <p><strong>Document:</strong> ${formatDocName(docName)}</p>
      <p><strong>Signed At:</strong> ${safe(docData.signedAt, timestamp)}</p>
      <p><strong>IP Address:</strong> ${safe(docData.ipAddress, 'Not recorded')}</p>
      
      <hr>
      
      <p><strong>Electronic Signature:</strong></p>
      <p class="signature">${signerName}</p>
      
      <p class="timestamp">By clicking "I Agree" on the LYT Communications Onboarding Portal, the signer acknowledged that they have read, understood, and agree to be bound by the terms of this document.</p>
    </div>
    
    <p><strong>LYT Communications, LLC</strong><br>
    12130 State Highway 3<br>
    Webster, TX 77598</p>
  </div>
</body>
</html>
`;
}

/**
 * Format document name for display
 */
function formatDocName(docName) {
  const names = {
    'w4': 'Form W-4 (Employee Withholding Certificate)',
    'w9': 'Form W-9 (Request for Taxpayer Identification Number)',
    'msa': 'Master Subcontractor Agreement',
    'safety': 'Safety Acknowledgment',
    'directDeposit': 'Direct Deposit Authorization',
    'rateCard': 'Rate Card Acceptance',
    'backgroundCheck': 'Background Check Authorization',
    'drugTest': 'Drug & Alcohol Testing Consent'
  };
  return names[docName] || docName;
}

/**
 * Send success notification email
 */
function sendSuccessEmail(type, formData, folderUrl) {
  formData = formData || {};
  
  const displayName = type === 'employee'
    ? `${safe(formData.firstName)} ${safe(formData.lastName)}`
    : safe(formData.companyName, 'Unknown');
  
  const contactInfo = type === 'employee'
    ? `Email: ${safe(formData.email, 'Not provided')}\nPhone: ${safe(formData.phone, 'Not provided')}`
    : `Contact: ${safe(formData.contactName)}\nEmail: ${safe(formData.contactEmail, 'No email')}\nPhone: ${safe(formData.contactPhone, 'Not provided')}`;
  
  const subject = `✓ New ${type === 'employee' ? 'Employee' : 'Contractor'} Onboarding Complete: ${displayName}`;
  
  const body = `
A new ${type} has successfully completed onboarding on the LYT Communications portal.

${type === 'employee' ? 'EMPLOYEE' : 'CONTRACTOR'} DETAILS
${'-'.repeat(40)}
${type === 'employee' ? 'Name' : 'Company'}: ${displayName}
${contactInfo}

Documents have been saved to Google Drive:
${folderUrl}

---
LYT Communications Onboarding System
`;
  
  // Send to all success recipients
  SUCCESS_EMAILS.forEach(function(email) {
    try {
      MailApp.sendEmail(email, subject, body);
    } catch (err) {
      Logger.log('Failed to send to ' + email + ': ' + err.toString());
    }
  });
}

/**
 * Send error notification email
 */
function sendErrorEmail(type, formData, errorMessage, errorDetails) {
  formData = formData || {};
  
  const displayName = type === 'employee'
    ? `${safe(formData.firstName, 'Unknown')} ${safe(formData.lastName, 'Employee')}`
    : safe(formData.companyName, 'Unknown Contractor');
  
  const subject = `⚠️ Onboarding Submission Error: ${displayName}`;
  
  const body = `
An error occurred during onboarding submission on the LYT Communications portal.

SUBMISSION DETAILS
${'-'.repeat(40)}
Type: ${type === 'employee' ? 'Employee' : 'Contractor'}
${type === 'employee' ? 'Name' : 'Company'}: ${displayName}
Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}

ERROR INFORMATION
${'-'.repeat(40)}
Error: ${errorMessage}
${errorDetails ? 'Details: ' + errorDetails : ''}

FORM DATA RECEIVED
${'-'.repeat(40)}
${JSON.stringify(formData, null, 2)}

---
LYT Communications Onboarding System
Please investigate this issue.
`;
  
  // Send to all error recipients
  ERROR_EMAILS.forEach(function(email) {
    try {
      MailApp.sendEmail(email, subject, body);
    } catch (err) {
      Logger.log('Failed to send error email to ' + email + ': ' + err.toString());
    }
  });
}

/**
 * TEST FUNCTION - Run this first to verify everything works!
 * In Google Apps Script editor: Click Run > testSetup
 */
function testSetup() {
  Logger.log('=== LYT Onboarding Setup Test v2.0 ===');
  
  // Test 1: Folder access
  try {
    const folder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    Logger.log('✓ PASS: Connected to folder: ' + folder.getName());
    Logger.log('  Folder URL: ' + folder.getUrl());
  } catch (err) {
    Logger.log('✗ FAIL: Cannot access folder: ' + err.toString());
    Logger.log('  Make sure PARENT_FOLDER_ID is correct and you have edit access');
    return false;
  }
  
  // Test 2: Create test file
  try {
    const folder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    const testBlob = Utilities.newBlob('Test file - safe to delete', 'text/plain', 'TEST_DELETE_ME.txt');
    const testFile = folder.createFile(testBlob);
    Logger.log('✓ PASS: Created test file');
    
    // Clean up
    testFile.setTrashed(true);
    Logger.log('✓ PASS: Deleted test file');
  } catch (err) {
    Logger.log('✗ FAIL: Cannot create files: ' + err.toString());
    return false;
  }
  
  // Test 3: Email (if configured)
  if (SUCCESS_EMAILS && SUCCESS_EMAILS.length > 0) {
    Logger.log('ℹ Success emails will be sent to: ' + SUCCESS_EMAILS.join(', '));
  }
  if (ERROR_EMAILS && ERROR_EMAILS.length > 0) {
    Logger.log('ℹ Error emails will be sent to: ' + ERROR_EMAILS.join(', '));
  }
  
  Logger.log('');
  Logger.log('=== ALL TESTS PASSED ===');
  Logger.log('Your setup is ready! Deploy as a Web App:');
  Logger.log('1. Deploy > New deployment');
  Logger.log('2. Type: Web app');
  Logger.log('3. Execute as: Me');
  Logger.log('4. Who has access: Anyone');
  
  return true;
}

/**
 * TEST FUNCTION - Simulate an employee form submission
 */
function testEmployeeSubmission() {
  Logger.log('=== Test Employee Submission ===');
  
  const testData = {
    type: 'employee',
    formData: {
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test@example.com',
      phone: '555-1234',
      bankName: 'Test Bank',
      routingNumber: '123456789',
      accountLast4: '4321',
      accountType: 'checking',
      voidedCheckUploaded: false,
      idType: 'drivers-license',
      idUploaded: false,
      backgroundCheckConsent: true,
      drugTestConsent: true,
      emergencyName: 'Emergency Contact',
      emergencyRelationship: 'Spouse',
      emergencyPhone: '555-5678'
    },
    documents: {
      w4: { signed: true, signedAt: new Date().toISOString() },
      safety: { signed: true, signedAt: new Date().toISOString() },
      directDeposit: { signed: true, signedAt: new Date().toISOString() },
      backgroundCheck: { signed: true, signedAt: new Date().toISOString() },
      drugTest: { signed: true, signedAt: new Date().toISOString() }
    }
  };
  
  const result = processOnboarding(testData);
  Logger.log('Result: ' + JSON.stringify(result, null, 2));
  
  if (result.success) {
    Logger.log('');
    Logger.log('✓ Test submission successful!');
    Logger.log('Check your Google Drive folder for the test files.');
    Logger.log('Folder: ' + result.folderUrl);
  } else {
    Logger.log('✗ Test submission failed: ' + result.error);
  }
  
  return result;
}

/**
 * TEST FUNCTION - Simulate a contractor form submission
 */
function testContractorSubmission() {
  Logger.log('=== Test Contractor Submission ===');
  
  const testData = {
    type: 'contractor',
    formData: {
      companyName: 'Test Contractor LLC',
      contactName: 'John Doe',
      contactEmail: 'john@testcontractor.com',
      contactPhone: '555-9999',
      ein: '12-3456789',
      bankName: 'Business Bank',
      routingNumber: '987654321',
      accountLast4: '8765',
      accountType: 'checking',
      coiUploaded: false
    },
    documents: {
      msa: { signed: true, signedAt: new Date().toISOString() },
      w9: { signed: true, signedAt: new Date().toISOString() },
      rateCard: { signed: true, signedAt: new Date().toISOString() }
    }
  };
  
  const result = processOnboarding(testData);
  Logger.log('Result: ' + JSON.stringify(result, null, 2));
  
  if (result.success) {
    Logger.log('');
    Logger.log('✓ Test submission successful!');
    Logger.log('Check your Google Drive folder for the test files.');
    Logger.log('Folder: ' + result.folderUrl);
  } else {
    Logger.log('✗ Test submission failed: ' + result.error);
  }
  
  return result;
}
