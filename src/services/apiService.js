/**
 * LYT Communications - API Integration Service
 * Version: 1.0
 * Purpose: Connect React frontend to Google Apps Script backend
 *          for onboarding form submissions and file uploads
 * 
 * Location: src/services/apiService.js
 */

import { URLS } from '../config/constants';

// ============================================================
// CONFIGURATION
// ============================================================

const API_ENDPOINT = URLS.appsScript;
const TIMEOUT_MS = 30000; // 30 second timeout

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Convert File object to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Get user's IP address for audit trail
 * @returns {Promise<string>} - IP address or 'unknown'
 */
export const getUserIpAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Could not get IP address:', error);
    return 'unknown';
  }
};

/**
 * Make a fetch request with timeout
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, options, timeout = TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
};

// ============================================================
// API HEALTH CHECK
// ============================================================

/**
 * Check if the API is running and accessible
 * @returns {Promise<boolean>}
 */
export const checkApiStatus = async () => {
  try {
    const response = await fetchWithTimeout(API_ENDPOINT, {
      method: 'GET',
    }, 10000);
    
    const data = await response.json();
    return data.status === 'OK';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// ============================================================
// EMPLOYEE ONBOARDING SUBMISSION
// ============================================================

/**
 * Submit employee onboarding data
 * @param {object} formData - All form data collected during onboarding
 * @param {object} signatures - All signature images (base64)
 * @returns {Promise<object>} - API response
 */
export const submitEmployeeOnboarding = async (formData, signatures = {}) => {
  try {
    // Get IP address for audit trail
    const ipAddress = await getUserIpAddress();
    
    // Prepare voided check if present
    let voidedCheckBase64 = null;
    if (formData.directDeposit?.voidedCheck instanceof File) {
      voidedCheckBase64 = await fileToBase64(formData.directDeposit.voidedCheck);
    }
    
    // Build payload
    const payload = {
      type: 'employee_onboarding',
      ipAddress,
      timestamp: new Date().toISOString(),
      
      // Personal Information
      personalInfo: formData.personalInfo ? {
        firstName: formData.personalInfo.firstName,
        lastName: formData.personalInfo.lastName,
        email: formData.personalInfo.email,
        phone: formData.personalInfo.phone,
        address: formData.personalInfo.address,
        city: formData.personalInfo.city,
        state: formData.personalInfo.state,
        zip: formData.personalInfo.zip,
        ssn: formData.personalInfo.ssn,
        dateOfBirth: formData.personalInfo.dateOfBirth,
        driversLicense: formData.personalInfo.driversLicense,
        driversLicenseState: formData.personalInfo.driversLicenseState,
      } : null,
      
      // W-4 Data
      w4Data: formData.w4Data ? {
        filingStatus: formData.w4Data.filingStatus,
        multipleJobs: formData.w4Data.multipleJobs,
        dependents: formData.w4Data.dependents,
        otherIncome: formData.w4Data.otherIncome,
        deductions: formData.w4Data.deductions,
        extraWithholding: formData.w4Data.extraWithholding,
        exempt: formData.w4Data.exempt,
        signature: signatures.w4Signature ? true : false,
        signatureData: signatures.w4Signature,
      } : null,
      
      // Direct Deposit
      directDeposit: formData.directDeposit ? {
        bankName: formData.directDeposit.bankName,
        routingNumber: formData.directDeposit.routingNumber,
        accountNumber: formData.directDeposit.accountNumber,
        accountType: formData.directDeposit.accountType,
        depositPercentage: formData.directDeposit.depositPercentage || 100,
        voidedCheckBase64: voidedCheckBase64,
        signature: signatures.directDepositSignature ? true : false,
        signatureData: signatures.directDepositSignature,
      } : null,
      
      // Emergency Contact
      emergencyContact: formData.emergencyContact ? {
        name: formData.emergencyContact.name,
        relationship: formData.emergencyContact.relationship,
        phone: formData.emergencyContact.phone,
        altPhone: formData.emergencyContact.altPhone,
        // Secondary contact if provided
        name2: formData.emergencyContact.name2,
        relationship2: formData.emergencyContact.relationship2,
        phone2: formData.emergencyContact.phone2,
      } : null,
      
      // Safety Acknowledgment
      safetyAcknowledgment: formData.safetyAcknowledgment ? {
        acknowledged: formData.safetyAcknowledgment.acknowledged,
        hseManualRead: formData.safetyAcknowledgment.hseManualRead,
        drugTestConsent: formData.safetyAcknowledgment.drugTestConsent,
        mvrConsent: formData.safetyAcknowledgment.mvrConsent,
        signature: signatures.safetySignature ? true : false,
        signatureData: signatures.safetySignature,
      } : null,
      
      // All signatures
      signatures: {
        w4Signature: signatures.w4Signature || null,
        directDepositSignature: signatures.directDepositSignature || null,
        safetySignature: signatures.safetySignature || null,
      }
    };
    
    // Submit to API
    const response = await fetchWithTimeout(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Employee onboarding submission failed');
    }
    
    return result;
    
  } catch (error) {
    console.error('Employee onboarding submission error:', error);
    throw error;
  }
};

// ============================================================
// CONTRACTOR ONBOARDING SUBMISSION
// ============================================================

/**
 * Submit contractor onboarding data
 * @param {object} formData - All form data collected during onboarding
 * @param {object} signatures - All signature images (base64)
 * @returns {Promise<object>} - API response
 */
export const submitContractorOnboarding = async (formData, signatures = {}) => {
  try {
    // Get IP address for audit trail
    const ipAddress = await getUserIpAddress();
    
    // Prepare file uploads
    let coiBase64 = null;
    if (formData.insurance?.coiFile instanceof File) {
      coiBase64 = await fileToBase64(formData.insurance.coiFile);
    }
    
    let voidedCheckBase64 = null;
    if (formData.banking?.voidedCheck instanceof File) {
      voidedCheckBase64 = await fileToBase64(formData.banking.voidedCheck);
    }
    
    // Build payload
    const payload = {
      type: 'contractor_onboarding',
      ipAddress,
      timestamp: new Date().toISOString(),
      
      // Company Information
      companyInfo: formData.companyInfo ? {
        companyName: formData.companyInfo.companyName,
        dba: formData.companyInfo.dba,
        contactName: formData.companyInfo.contactName,
        title: formData.companyInfo.title,
        email: formData.companyInfo.email,
        phone: formData.companyInfo.phone,
        address: formData.companyInfo.address,
        city: formData.companyInfo.city,
        state: formData.companyInfo.state,
        zip: formData.companyInfo.zip,
        ein: formData.companyInfo.ein,
        entityType: formData.companyInfo.entityType,
        yearsInBusiness: formData.companyInfo.yearsInBusiness,
      } : null,
      
      // MSA Agreement
      msaAgreement: formData.msaAgreement ? {
        agreed: formData.msaAgreement.agreed,
        signature: signatures.msaSignature ? true : false,
        signatureData: signatures.msaSignature,
      } : null,
      
      // W-9 Data
      w9Data: formData.w9Data ? {
        name: formData.w9Data.name,
        businessName: formData.w9Data.businessName,
        federalTaxClassification: formData.w9Data.federalTaxClassification,
        exemptPayeeCode: formData.w9Data.exemptPayeeCode,
        fatcaCode: formData.w9Data.fatcaCode,
        address: formData.w9Data.address,
        city: formData.w9Data.city,
        state: formData.w9Data.state,
        zip: formData.w9Data.zip,
        tin: formData.w9Data.tin,
        tinType: formData.w9Data.tinType,
        signature: signatures.w9Signature ? true : false,
        signatureData: signatures.w9Signature,
      } : null,
      
      // Insurance Information
      insurance: formData.insurance ? {
        generalLiability: formData.insurance.generalLiability,
        generalLiabilityExpiry: formData.insurance.generalLiabilityExpiry,
        autoLiability: formData.insurance.autoLiability,
        autoLiabilityExpiry: formData.insurance.autoLiabilityExpiry,
        workersComp: formData.insurance.workersComp,
        workersCompExpiry: formData.insurance.workersCompExpiry,
        umbrellaPolicy: formData.insurance.umbrellaPolicy,
        umbrellaPolicyExpiry: formData.insurance.umbrellaPolicyExpiry,
        emr: formData.insurance.emr,
        coiBase64: coiBase64,
        coiFileName: formData.insurance.coiFile?.name,
      } : null,
      
      // Fleet & Personnel
      fleetPersonnel: formData.fleetPersonnel ? {
        numberOfEmployees: formData.fleetPersonnel.numberOfEmployees,
        vehicles: formData.fleetPersonnel.vehicles,
        equipment: formData.fleetPersonnel.equipment,
        personnel: formData.fleetPersonnel.personnel,
      } : null,
      
      // Skills Inventory
      skillsInventory: formData.skillsInventory ? {
        aerialConstruction: formData.skillsInventory.aerialConstruction,
        aerialExperience: formData.skillsInventory.aerialExperience,
        aerialCapabilities: formData.skillsInventory.aerialCapabilities,
        undergroundConstruction: formData.skillsInventory.undergroundConstruction,
        undergroundExperience: formData.skillsInventory.undergroundExperience,
        undergroundCapabilities: formData.skillsInventory.undergroundCapabilities,
        fiberSplicing: formData.skillsInventory.fiberSplicing,
        splicingExperience: formData.skillsInventory.splicingExperience,
        splicingCapabilities: formData.skillsInventory.splicingCapabilities,
        hddDrilling: formData.skillsInventory.hddDrilling,
        hddExperience: formData.skillsInventory.hddExperience,
        hddCapabilities: formData.skillsInventory.hddCapabilities,
        otdrTesting: formData.skillsInventory.otdrTesting,
        otherSkills: formData.skillsInventory.otherSkills,
      } : null,
      
      // Rate Card Acceptance
      rateCardAcceptance: formData.rateCardAcceptance ? {
        ratesAccepted: formData.rateCardAcceptance.ratesAccepted,
        retainageAccepted: formData.rateCardAcceptance.retainageAccepted,
        lienWaiverAccepted: formData.rateCardAcceptance.lienWaiverAccepted,
        paymentTermsAccepted: formData.rateCardAcceptance.paymentTermsAccepted,
        signature: signatures.rateCardSignature ? true : false,
        signatureData: signatures.rateCardSignature,
      } : null,
      
      // Banking Information
      banking: formData.banking ? {
        bankName: formData.banking.bankName,
        routingNumber: formData.banking.routingNumber,
        accountNumber: formData.banking.accountNumber,
        accountType: formData.banking.accountType,
        paymentMethod: formData.banking.paymentMethod,
        voidedCheckBase64: voidedCheckBase64,
        signature: signatures.bankingSignature ? true : false,
        signatureData: signatures.bankingSignature,
      } : null,
      
      // All signatures
      signatures: {
        msaSignature: signatures.msaSignature || null,
        w9Signature: signatures.w9Signature || null,
        rateCardSignature: signatures.rateCardSignature || null,
        bankingSignature: signatures.bankingSignature || null,
        safetySignature: signatures.safetySignature || null,
      }
    };
    
    // Submit to API
    const response = await fetchWithTimeout(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Contractor onboarding submission failed');
    }
    
    return result;
    
  } catch (error) {
    console.error('Contractor onboarding submission error:', error);
    throw error;
  }
};

// ============================================================
// INDIVIDUAL FILE UPLOAD
// ============================================================

/**
 * Upload a single file to Google Drive
 * @param {File} file - The file to upload
 * @param {string} folderId - Optional specific folder ID
 * @param {string} folderPath - Optional folder path (e.g., 'Employee/Documents')
 * @returns {Promise<object>} - API response with file URL
 */
export const uploadFile = async (file, folderId = null, folderPath = null) => {
  try {
    const fileBase64 = await fileToBase64(file);
    
    const payload = {
      type: 'file_upload',
      fileName: file.name,
      fileBase64: fileBase64,
      mimeType: file.type,
      folderId: folderId,
      folderPath: folderPath,
      timestamp: new Date().toISOString()
    };
    
    const response = await fetchWithTimeout(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'File upload failed');
    }
    
    return result;
    
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// ============================================================
// TEST SUBMISSION
// ============================================================

/**
 * Test the API connection and folder creation
 * @param {boolean} sendEmail - Whether to send a test email
 * @returns {Promise<object>} - API response
 */
export const testApiConnection = async (sendEmail = false) => {
  try {
    const payload = {
      type: 'test',
      sendEmail: sendEmail,
      timestamp: new Date().toISOString()
    };
    
    const response = await fetchWithTimeout(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    }, 15000);
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('API test error:', error);
    throw error;
  }
};

// ============================================================
// EXPORT DEFAULT
// ============================================================

const apiService = {
  checkApiStatus,
  submitEmployeeOnboarding,
  submitContractorOnboarding,
  uploadFile,
  testApiConnection,
  fileToBase64,
  getUserIpAddress,
};

export default apiService;
