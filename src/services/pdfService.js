/**
 * pdfService.js - PDF Form Filling Service v2.47
 * Fills actual IRS W-4, W-9 forms and LYT MSA with user data and signatures.
 * Uses pdf-lib to manipulate PDF form fields.
 * 
 * FIXED: Correct field name mapping for W-4 pages 3-4
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// PDF URLs in public folder
const PDF_URLS = {
  W4: '/Form%20W-4%20sign.pdf',
  W9: '/Form%20W-9%20sign.pdf',
  MSA: '/LYT_MSA_2026_AdobeSign_Full_v3_5.pdf',
};

/**
 * Convert base64 data URL to Uint8Array
 */
function dataUrlToBytes(dataUrl) {
  if (!dataUrl) return null;
  try {
    // Handle both data:image/png;base64, and raw base64
    const base64 = dataUrl.includes('base64,') 
      ? dataUrl.split('base64,')[1] 
      : dataUrl;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error('Error converting signature:', e);
    return null;
  }
}

/**
 * Load PDF from public folder
 */
async function loadPdf(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load PDF: ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  return PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
}

/**
 * Fill IRS Form W-4 with employee data - ALL FIELDS
 * 
 * W-4 ACTUAL FIELD NAMES (from PDF inspection):
 * 
 * PAGE 1 - Step 1: Personal Info
 *   - "a First name and middle initial"
 *   - "Last name"
 *   - "b Social security number"
 *   - "Address"
 *   - "City or town state and ZIP code"
 *   - "Single or Married filing separately" (checkbox)
 *   - "Married filing jointly or Qualifying surviving spouse" (checkbox)
 *   - "Head of household..." (checkbox)
 * 
 * PAGE 1 - Step 2: Multiple Jobs
 *   - "option is generally more accurate..." (checkbox for 2c)
 * 
 * PAGE 1 - Step 3: Dependents
 *   - "fill_22" (qualifying children amount)
 *   - "fill_23" (other dependents amount)
 *   - "fill_14" (total dependents)
 * 
 * PAGE 1 - Step 4: Other Adjustments
 *   - "fill_15" (other income)
 *   - "fill_16" (deductions)
 *   - "fill_17" (extra withholding)
 *   - "undefined" (exempt checkbox text)
 * 
 * PAGE 1 - Step 5: Signature
 *   - "Date"
 *   - Signature drawn as image
 * 
 * PAGE 1 - Employer Section
 *   - "Employers name and address"
 *   - "First date of employment"
 *   - "Employer identification number EIN"
 * 
 * PAGE 3 - Step 2(b) Worksheet (Multiple Jobs)
 *   - "undefined_2" (Line 1)
 *   - "2a" (Line 2a)
 *   - "2b" (Line 2b)
 *   - "2c" (Line 2c)
 *   - "3" (Line 3)
 *   - "undefined_3" (Line 4)
 * 
 * PAGE 4 - Step 4(b) Worksheet (Deductions)
 *   - "1a", "1b", "1c" (Lines 1a-1c)
 *   - "undefined_4" (Line 1d)
 *   - "3a", "3b" (Lines 3a-3b)
 *   - "undefined_5" (Line 3c)
 *   - "undefined_6" (Line 5)
 *   - "6a", "6b", "6c", "6d", "6e" (Lines 6a-6e)
 *   - "undefined_7" (Line 7)
 *   - "8a", "8b" (Lines 8a-8b)
 *   - "undefined_9" (Line 9)
 *   - "10", "11", "12", "13", "14", "15" (Lines 10-15)
 */
export async function fillW4(data, signatureDataUrl, signatureInfo = {}) {
  try {
    console.log('Loading W-4 PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.W4);
    const form = pdfDoc.getForm();
    
    // Helper to safely set text field
    const setText = (fieldName, value) => {
      try {
        const field = form.getTextField(fieldName);
        if (field && value !== undefined && value !== null && value !== '') {
          field.setText(String(value));
        }
      } catch (e) {
        console.log(`W-4 field "${fieldName}" not found or error:`, e.message);
      }
    };
    
    // Helper to safely check checkbox
    const setCheck = (fieldName, checked) => {
      try {
        const field = form.getCheckBox(fieldName);
        if (field && checked) {
          field.check();
        }
      } catch (e) {
        console.log(`W-4 checkbox "${fieldName}" not found or error:`, e.message);
      }
    };
    
    // ===== PAGE 1 - STEP 1: PERSONAL INFO =====
    
    // 1a - First name and middle initial
    const firstName = data.firstName || '';
    const middleInitial = data.middleInitial || '';
    setText('a First name and middle initial', `${firstName} ${middleInitial}`.trim());
    
    // 1a - Last name
    setText('Last name', data.lastName || '');
    
    // 1b - Social Security Number - Draw individual digits with proper spacing
    if (data.ssn) {
      const ssnClean = data.ssn.replace(/\D/g, '');
      // Format: XXX-XX-XXXX with dashes
      const ssnFormatted = `${ssnClean.slice(0,3)}-${ssnClean.slice(3,5)}-${ssnClean.slice(5,9)}`;
      setText('b Social security number', ssnFormatted);
    }
    
    // 1c - Address
    setText('Address', data.address || '');
    
    // City, State, ZIP
    const cityStateZip = [data.city, data.state, data.zip].filter(Boolean).join(', ');
    setText('City or town state and ZIP code', cityStateZip);
    
    // 1c - Filing Status (checkboxes)
    if (data.filingStatus === 'single') {
      setCheck('Single or Married filing separately', true);
    } else if (data.filingStatus === 'married') {
      setCheck('Married filing jointly or Qualifying surviving spouse', true);
    } else if (data.filingStatus === 'head') {
      setCheck('Head of household Check only if youre unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual', true);
    }
    
    // ===== PAGE 1 - STEP 2: MULTIPLE JOBS =====
    if (data.multipleJobs) {
      setCheck('option is generally more accurate than Step 2b if pay at the lower paying job is more than half of the pay at', true);
    }
    
    // ===== PAGE 1 - STEP 3: DEPENDENTS =====
    // Qualifying children ($2,000 each)
    if (data.qualifyingChildren && data.qualifyingChildren > 0) {
      const childAmount = parseInt(data.qualifyingChildren) * 2000;
      setText('fill_22', childAmount.toString());
    }
    
    // Other dependents ($500 each)
    if (data.otherDependents && data.otherDependents > 0) {
      const otherAmount = parseInt(data.otherDependents) * 500;
      setText('fill_23', otherAmount.toString());
    }
    
    // Total dependents claim
    const totalDependents = 
      (parseInt(data.qualifyingChildren || 0) * 2000) + 
      (parseInt(data.otherDependents || 0) * 500);
    if (totalDependents > 0) {
      setText('fill_14', totalDependents.toString());
    }
    
    // ===== PAGE 1 - STEP 4: OTHER ADJUSTMENTS =====
    // 4a - Other income
    if (data.otherIncome) {
      setText('fill_15', data.otherIncome);
    }
    
    // 4b - Deductions
    if (data.deductions) {
      setText('fill_16', data.deductions);
    }
    
    // 4c - Extra withholding
    if (data.extraWithholding) {
      setText('fill_17', data.extraWithholding);
    }
    
    // Exempt status
    if (data.exempt) {
      setText('undefined', 'EXEMPT');
    }
    
    // ===== PAGE 1 - STEP 5: DATE =====
    setText('Date', data.w4Date || new Date().toLocaleDateString());
    
    // ===== PAGE 1 - EMPLOYER SECTION =====
    setText('Employers name and address', data.employerName || 'LYT Communications, LLC');
    setText('First date of employment', data.hireDate || '');
    setText('Employer identification number EIN', data.employerEIN || '');
    
    // ===== PAGE 3 - STEP 2(b) WORKSHEET (Multiple Jobs) =====
    // CORRECT FIELD MAPPING:
    // Line 1 -> "undefined_2"
    // Line 2a -> "2a"
    // Line 2b -> "2b"  
    // Line 2c -> "2c"
    // Line 3 -> "3"
    // Line 4 -> "undefined_3"
    
    if (data.worksheet) {
      if (data.worksheet.step2b_line1) setText('undefined_2', data.worksheet.step2b_line1);
      if (data.worksheet.step2b_line2a) setText('2a', data.worksheet.step2b_line2a);
      if (data.worksheet.step2b_line2b) setText('2b', data.worksheet.step2b_line2b);
      if (data.worksheet.step2b_line2c) setText('2c', data.worksheet.step2b_line2c);
      if (data.worksheet.step2b_line3) setText('3', data.worksheet.step2b_line3);
      if (data.worksheet.step2b_line4) setText('undefined_3', data.worksheet.step2b_line4);
    }
    
    // ===== PAGE 4 - STEP 4(b) WORKSHEET (Deductions) =====
    // CORRECT FIELD MAPPING:
    // Line 1a -> "1a"
    // Line 1b -> "1b"
    // Line 1c -> "1c"
    // Line 1d -> "undefined_4"
    // Line 3a -> "3a"
    // Line 3b -> "3b"
    // Line 3c -> "undefined_5"
    // Line 5 -> "undefined_6"
    // Line 6a-6e -> "6a", "6b", "6c", "6d", "6e"
    // Line 7 -> "undefined_7"
    // Line 8a -> "8a"
    // Line 8b -> "8b"
    // Line 9 -> "undefined_9"
    // Line 10-15 -> "10", "11", "12", "13", "14", "15"
    
    if (data.deductionsWorksheet) {
      const dw = data.deductionsWorksheet;
      
      // Lines 1a-1d
      if (dw.line1a) setText('1a', dw.line1a);
      if (dw.line1b) setText('1b', dw.line1b);
      if (dw.line1c) setText('1c', dw.line1c);
      if (dw.line1d) setText('undefined_4', dw.line1d);  // FIXED
      
      // Lines 3a-3c
      if (dw.line3a) setText('3a', dw.line3a);
      if (dw.line3b) setText('3b', dw.line3b);
      if (dw.line3c) setText('undefined_5', dw.line3c);  // FIXED
      
      // Line 5
      if (dw.line5) setText('undefined_6', dw.line5);    // FIXED
      
      // Lines 6a-6e
      if (dw.line6a) setText('6a', dw.line6a);
      if (dw.line6b) setText('6b', dw.line6b);
      if (dw.line6c) setText('6c', dw.line6c);
      if (dw.line6d) setText('6d', dw.line6d);
      if (dw.line6e) setText('6e', dw.line6e);
      
      // Line 7
      if (dw.line7) setText('undefined_7', dw.line7);    // FIXED
      
      // Lines 8a-8b
      if (dw.line8a) setText('8a', dw.line8a);
      if (dw.line8b) setText('8b', dw.line8b);
      
      // Line 9
      if (dw.line9) setText('undefined_9', dw.line9);    // FIXED
      
      // Lines 10-15
      if (dw.line10) setText('10', dw.line10);
      if (dw.line11) setText('11', dw.line11);
      if (dw.line12) setText('12', dw.line12);
      if (dw.line13) setText('13', dw.line13);
      if (dw.line14) setText('14', dw.line14);
      if (dw.line15) setText('15', dw.line15);
    }
    
    // ===== SIGNATURE =====
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const pages = pdfDoc.getPages();
          const firstPage = pages[0];
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          // W-4 signature line - position based on PDF layout
          // Signature line is approximately at y=90 from bottom
          firstPage.drawImage(sigImage, {
            x: 105,
            y: 92,
            width: 150,
            height: 35,
          });
          
          // Add signature verification BELOW signature
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            firstPage.drawText(verifyText, {
              x: 105,
              y: 78,
              size: 6,
              font: font,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }
      } catch (sigErr) {
        console.error('W-4 signature embed error:', sigErr);
      }
    }
    
    // Flatten form to prevent further editing
    form.flatten();
    
    // Save and convert to base64
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    return `data:application/pdf;base64,${base64}`;
    
  } catch (error) {
    console.error('Error filling W-4:', error);
    throw error;
  }
}


/**
 * Fill IRS Form W-9 with contractor data - ALL FIELDS
 * 
 * W-9 ACTUAL FIELD NAMES (from PDF inspection):
 * 
 * Line 1: Name -> "Name"
 * Line 2: Business name/DBA -> "Business namedisregarded entity name if different from above"
 * Line 3: Entity type checkboxes -> "IndividualSole proprietor or", etc.
 * Line 4: Exemptions -> "Exempt payee code if any", "Exemption from FATCA reporting"
 * Line 5: Address -> "Address number street and apt or suite no See instructions"
 * Line 6: City/State/ZIP -> "City state and ZIP code"
 * Line 7: Account numbers -> "List account numbers here optional"
 * SSN boxes (Part I) -> Individual digit fields
 * EIN boxes (Part I) -> Individual digit fields
 * Signature -> drawn as image
 * Date -> "Date"
 */
export async function fillW9(data, signatureDataUrl, signatureInfo = {}) {
  try {
    console.log('Loading W-9 PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.W9);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Helper to safely set text field
    const setText = (fieldName, value) => {
      try {
        const field = form.getTextField(fieldName);
        if (field && value !== undefined && value !== null && value !== '') {
          field.setText(String(value));
        }
      } catch (e) {
        console.log(`W-9 field "${fieldName}" not found or error:`, e.message);
      }
    };
    
    // Helper to safely check checkbox
    const setCheck = (fieldName, checked) => {
      try {
        const field = form.getCheckBox(fieldName);
        if (field && checked) {
          field.check();
        }
      } catch (e) {
        console.log(`W-9 checkbox "${fieldName}" not found or error:`, e.message);
      }
    };
    
    // Line 1 - Name
    const name = data.companyName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
    setText('Name', name);
    
    // Line 2 - Business name/DBA
    if (data.dba) {
      setText('Business namedisregarded entity name if different from above', data.dba);
    }
    
    // Line 3 - Federal tax classification (checkboxes)
    const entityType = (data.entityType || '').toLowerCase();
    if (entityType === 'individual' || entityType === 'sole_proprietor') {
      setCheck('IndividualSole proprietor or', true);
    } else if (entityType === 'c_corp' || entityType === 'c corporation') {
      setCheck('C Corporation', true);
    } else if (entityType === 's_corp' || entityType === 's corporation') {
      setCheck('S Corporation', true);
    } else if (entityType === 'partnership') {
      setCheck('Partnership', true);
    } else if (entityType === 'trust' || entityType === 'estate') {
      setCheck('Trustestate', true);
    } else if (entityType === 'llc') {
      setCheck('Limited liability company Enter the tax classification C C corporation S S corporation P Partnership', true);
      // LLC tax classification letter
      if (data.llcClassification) {
        setText('undefined', data.llcClassification);
      }
    } else if (entityType === 'other') {
      setCheck('Other see instructions', true);
    }
    
    // Line 4 - Exemptions
    if (data.exemptPayeeCode) {
      setText('Exempt payee code if any', data.exemptPayeeCode);
    }
    if (data.fatcaCode) {
      setText('Exemption from FATCA reporting', data.fatcaCode);
    }
    
    // Line 5 - Address
    setText('Address number street and apt or suite no See instructions', data.address || '');
    
    // Line 6 - City, State, ZIP
    const cityStateZip = [data.city, data.state, data.zip].filter(Boolean).join(', ');
    setText('City state and ZIP code', cityStateZip);
    
    // Line 7 - Account numbers (optional)
    if (data.accountNumbers) {
      setText('List account numbers here optional', data.accountNumbers);
    }
    
    // Part I - TIN (SSN or EIN)
    // SSN - Draw each digit in its own box
    // W-9 SSN box positions (x coords from left): approximately 417.8, 431.9, 446.6, 475.2, 489.9, 518.4, 532.7, 547.3, 561.8
    // Y position: approximately 372
    if (data.ssn && (entityType === 'individual' || entityType === 'sole_proprietor' || !data.ein)) {
      const ssnClean = data.ssn.replace(/\D/g, '');
      const ssnBoxX = [417.8, 431.9, 446.6, 475.2, 489.9, 518.4, 532.7, 547.3, 561.8];
      const ssnY = 372;
      
      for (let i = 0; i < Math.min(ssnClean.length, 9); i++) {
        firstPage.drawText(ssnClean[i], {
          x: ssnBoxX[i],
          y: ssnY,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    }
    
    // EIN - Draw each digit in its own box
    // W-9 EIN box positions (x coords): approximately 417.6, 432.0, 460.9, 475.4, 489.9, 504.3, 518.5, 532.9, 547.3
    // Y position: approximately 420 (above SSN boxes)
    if (data.ein) {
      const einClean = data.ein.replace(/\D/g, '');
      const einBoxX = [417.6, 432.0, 460.9, 475.4, 489.9, 504.3, 518.5, 532.9, 547.3];
      const einY = 420;
      
      for (let i = 0; i < Math.min(einClean.length, 9); i++) {
        firstPage.drawText(einClean[i], {
          x: einBoxX[i],
          y: einY,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    }
    
    // Date
    setText('Date', data.w9Date || new Date().toLocaleDateString());
    
    // Signature - Draw as image
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          
          // W-9 signature line position
          firstPage.drawImage(sigImage, {
            x: 45,
            y: 296,
            width: 150,
            height: 30,
          });
          
          // Add signature verification below
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            firstPage.drawText(verifyText, {
              x: 45,
              y: 283,
              size: 6,
              font: font,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }
      } catch (sigErr) {
        console.error('W-9 signature embed error:', sigErr);
      }
    }
    
    // Flatten form
    form.flatten();
    
    // Save and convert to base64
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    return `data:application/pdf;base64,${base64}`;
    
  } catch (error) {
    console.error('Error filling W-9:', error);
    throw error;
  }
}


/**
 * Fill MSA PDF with contractor data
 * Replaces {{placeholder}} text with actual values
 */
export async function fillMSA(data, signatureDataUrl, signatureInfo = {}) {
  try {
    console.log('Loading MSA PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.MSA);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Get the last page for contractor signature
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();
    
    // Fill contractor info on signature page
    // Position these based on the MSA layout
    const contractorName = data.companyName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const contactName = data.contactName || data.printedName || '';
    const title = data.title || '';
    const effectiveDate = data.effectiveDate || new Date().toLocaleDateString();
    
    // Draw contractor information
    // Company Name
    lastPage.drawText(contractorName, {
      x: 72,
      y: height - 180,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Printed Name
    if (contactName) {
      lastPage.drawText(contactName, {
        x: 72,
        y: height - 220,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Title
    if (title) {
      lastPage.drawText(title, {
        x: 72,
        y: height - 260,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Effective Date
    lastPage.drawText(effectiveDate, {
      x: 72,
      y: height - 300,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Signature
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          
          // Draw signature
          lastPage.drawImage(sigImage, {
            x: 72,
            y: height - 380,
            width: 150,
            height: 35,
          });
          
          // Add signature verification below
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            lastPage.drawText(verifyText, {
              x: 72,
              y: height - 395,
              size: 6,
              font: font,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }
      } catch (sigErr) {
        console.error('MSA signature embed error:', sigErr);
      }
    }
    
    // Save and return
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    return `data:application/pdf;base64,${base64}`;
    
  } catch (error) {
    console.error('Error filling MSA:', error);
    throw error;
  }
}


/**
 * Create a simple form PDF (for non-IRS forms like Direct Deposit, Safety, etc.)
 */
export async function createFormPdf(title, content, signatureDataUrl, signatureInfo = {}) {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    let y = height - 50;
    
    // Title
    page.drawText(title, {
      x: 50,
      y: y,
      size: 16,
      font: fontBold,
      color: rgb(0, 0.467, 0.714), // LYT Blue
    });
    y -= 30;
    
    // Draw horizontal line
    page.drawLine({
      start: { x: 50, y: y },
      end: { x: width - 50, y: y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;
    
    // Content - split by newlines and render
    const lines = content.split('\n');
    for (const line of lines) {
      if (y < 120) {
        // Add new page if needed
        break;
      }
      
      const isBold = line.startsWith('**') || line.includes(':');
      const cleanLine = line.replace(/\*\*/g, '');
      
      page.drawText(cleanLine, {
        x: 50,
        y: y,
        size: 10,
        font: isBold ? fontBold : font,
        color: rgb(0, 0, 0),
        maxWidth: width - 100,
      });
      y -= 14;
    }
    
    // Signature if provided
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          
          y = Math.max(y, 100) - 50;
          
          page.drawText('Signature:', {
            x: 50,
            y: y + 45,
            size: 10,
            font: fontBold,
            color: rgb(0, 0, 0),
          });
          
          page.drawImage(sigImage, {
            x: 50,
            y: y,
            width: 150,
            height: 35,
          });
          
          // Verification info
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            page.drawText(verifyText, {
              x: 50,
              y: y - 15,
              size: 6,
              font: font,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }
      } catch (sigErr) {
        console.error('Form signature embed error:', sigErr);
      }
    }
    
    // Footer
    page.drawText('LYT Communications, LLC - Confidential', {
      x: 50,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    return `data:application/pdf;base64,${base64}`;
    
  } catch (error) {
    console.error('Error creating form PDF:', error);
    throw error;
  }
}

export default {
  fillW4,
  fillW9,
  fillMSA,
  createFormPdf,
};
