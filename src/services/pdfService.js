/**
 * LYT Communications - PDF Service v2.0
 * 
 * Fills actual IRS W-4, W-9 forms and LYT MSA with user data and signatures.
 * Uses pdf-lib to manipulate PDF form fields.
 * 
 * v2.0 - Complete field filling for all W-4 and W-9 fields
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
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
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
 * W-4 Field Reference:
 * Step 1: Personal Info
 *   - "a First name and middle initial"
 *   - "Last name"
 *   - "b Social security number"
 *   - "Address"
 *   - "City or town state and ZIP code"
 *   - Filing status checkboxes (Single, Married, Head of household)
 * 
 * Step 2: Multiple Jobs (checkbox field 9)
 * 
 * Step 3: Dependents
 *   - "fill_14" = qualifying children amount ($2000 each)
 *   - "fill_15" = other dependents amount ($500 each)
 *   - "fill_16" = total (fill_14 + fill_15)
 * 
 * Step 4: Other Adjustments
 *   - "fill_17" = other income (4a)
 *   - "fill_22" = deductions (4b)
 *   - "fill_23" = extra withholding (4c)
 * 
 * Step 5: Signature
 *   - "Date"
 *   - Signature image
 * 
 * Employer Section:
 *   - "Employers name and address"
 *   - "First date of employment"
 *   - "Employer identification number EIN"
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
    
    // ========== STEP 1: Personal Information ==========
    // 1a - First name and middle initial
    const firstMiddle = `${data.firstName || ''}${data.middleName ? ' ' + data.middleName : ''}`.trim();
    setText('a First name and middle initial', firstMiddle);
    
    // 1a - Last name
    setText('Last name', data.lastName || '');
    
    // 1b - Social Security Number - Draw individual digits
    // W-4 SSN field is at x=476, y=91, w=100, h=17
    // SSN format: XXX-XX-XXXX with boxes spaced evenly
    const ssn = (data.ssn || '').replace(/\D/g, '');
    if (ssn.length === 9) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const pageHeight = 792;
      
      // W-4 SSN boxes start at x=476, each digit ~10px apart
      // Y position from top is 91, so from bottom: 792 - 91 - 17 = 684
      const ssnY = pageHeight - 91 - 12;
      const ssnStartX = 480;
      const digitSpacing = 10.5;
      
      for (let i = 0; i < 9; i++) {
        let xOffset = i * digitSpacing;
        // Add gaps for dashes (after 3rd and 5th digits)
        if (i >= 3) xOffset += 4;
        if (i >= 5) xOffset += 4;
        
        firstPage.drawText(ssn[i], {
          x: ssnStartX + xOffset,
          y: ssnY,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    }
    
    // Address
    setText('Address', data.address || '');
    
    // City, State, ZIP
    const cityStateZip = `${data.city || ''}, ${data.state || ''} ${data.zip || ''}`.trim();
    setText('City or town state and ZIP code', cityStateZip);
    
    // 1c - Filing Status (checkboxes)
    const status = (data.filingStatus || '').toLowerCase();
    if (status === 'single' || status === 'married_separate' || status === 'single or married filing separately') {
      setCheck('Single or Married filing separately', true);
    } else if (status === 'married' || status === 'married_joint' || status === 'married filing jointly') {
      setCheck('Married filing jointly or Qualifying surviving spouse', true);
    } else if (status === 'head' || status === 'head_of_household' || status === 'head of household') {
      setCheck('Head of household Check only if youre unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual', true);
    }
    
    // ========== STEP 2: Multiple Jobs or Spouse Works ==========
    // Field 9 is the "two jobs" checkbox area - we can set text here if needed
    if (data.multipleJobs) {
      // The checkbox for "two jobs only" is embedded in the form - try to check it
      try {
        // This is a text field that may have a checkbox nearby
        setText('option is generally more accurate than Step 2b if pay at the lower paying job is more than half of the pay at', 'X');
      } catch (e) {
        // Field may not exist or be accessible
      }
    }
    
    // ========== STEP 3: Claim Dependents ==========
    // Qualifying children under 17 - $2,000 each (field fill_14)
    const childrenCount = parseInt(data.qualifyingChildren) || 0;
    const childrenAmount = childrenCount * 2000;
    if (childrenAmount > 0) {
      setText('fill_14', String(childrenAmount));
    }
    
    // Other dependents - $500 each (field fill_15)
    const otherDepsCount = parseInt(data.otherDependents) || 0;
    const otherDepsAmount = otherDepsCount * 500;
    if (otherDepsAmount > 0) {
      setText('fill_15', String(otherDepsAmount));
    }
    
    // Total dependents (fill_16) - sum of fill_14 and fill_15
    const totalDependents = childrenAmount + otherDepsAmount;
    if (totalDependents > 0) {
      setText('fill_16', String(totalDependents));
    }
    
    // ========== STEP 4: Other Adjustments ==========
    // 4a - Other income (not from jobs) - fill_17
    if (data.otherIncome && data.otherIncome !== '0' && data.otherIncome !== '') {
      setText('fill_17', String(data.otherIncome));
    }
    
    // 4b - Deductions - fill_22
    if (data.deductions && data.deductions !== '0' && data.deductions !== '') {
      setText('fill_22', String(data.deductions));
    }
    
    // 4c - Extra withholding - fill_23
    if (data.extraWithholding && data.extraWithholding !== '0' && data.extraWithholding !== '') {
      setText('fill_23', String(data.extraWithholding));
    }
    
    // ========== PAGE 3: Step 2(b) Worksheet (Multiple Jobs) ==========
    // These fields are on the right side of page 3
    if (data.worksheet) {
      // Line 1 - undefined_2 (Step 2b line 1)
      if (data.worksheet.step2b_line1) {
        setText('undefined_2', String(data.worksheet.step2b_line1));
      }
      // Line 2a
      if (data.worksheet.step2b_line2a) {
        setText('2a', String(data.worksheet.step2b_line2a));
      }
      // Line 2b
      if (data.worksheet.step2b_line2b) {
        setText('2b', String(data.worksheet.step2b_line2b));
      }
      // Line 2c
      if (data.worksheet.step2b_line2c) {
        setText('2c', String(data.worksheet.step2b_line2c));
      }
      // Line 3
      if (data.worksheet.step2b_line3) {
        setText('3', String(data.worksheet.step2b_line3));
      }
      // Line 4 - undefined_3
      if (data.worksheet.step2b_line4) {
        setText('undefined_3', String(data.worksheet.step2b_line4));
      }
    }
    
    // ========== PAGE 4: Step 4(b) Deductions Worksheet ==========
    if (data.deductionsWorksheet) {
      // Line 1a
      if (data.deductionsWorksheet.line1a) {
        setText('1a', String(data.deductionsWorksheet.line1a));
      }
      // Line 1b
      if (data.deductionsWorksheet.line1b) {
        setText('1b', String(data.deductionsWorksheet.line1b));
      }
      // Line 1c
      if (data.deductionsWorksheet.line1c) {
        setText('1c', String(data.deductionsWorksheet.line1c));
      }
      // Line 1d - undefined_4
      if (data.deductionsWorksheet.line1d) {
        setText('undefined_4', String(data.deductionsWorksheet.line1d));
      }
      // Line 3a
      if (data.deductionsWorksheet.line3a) {
        setText('3a', String(data.deductionsWorksheet.line3a));
      }
      // Line 3b
      if (data.deductionsWorksheet.line3b) {
        setText('3b', String(data.deductionsWorksheet.line3b));
      }
      // Line 3c - undefined_5
      if (data.deductionsWorksheet.line3c) {
        setText('undefined_5', String(data.deductionsWorksheet.line3c));
      }
      // Line 5 - undefined_6
      if (data.deductionsWorksheet.line5) {
        setText('undefined_6', String(data.deductionsWorksheet.line5));
      }
      // Line 6a
      if (data.deductionsWorksheet.line6a) {
        setText('6a', String(data.deductionsWorksheet.line6a));
      }
      // Line 6b
      if (data.deductionsWorksheet.line6b) {
        setText('6b', String(data.deductionsWorksheet.line6b));
      }
      // Line 6c
      if (data.deductionsWorksheet.line6c) {
        setText('6c', String(data.deductionsWorksheet.line6c));
      }
      // Line 6d
      if (data.deductionsWorksheet.line6d) {
        setText('6d', String(data.deductionsWorksheet.line6d));
      }
      // Line 6e
      if (data.deductionsWorksheet.line6e) {
        setText('6e', String(data.deductionsWorksheet.line6e));
      }
      // Line 7 - undefined_7
      if (data.deductionsWorksheet.line7) {
        setText('undefined_7', String(data.deductionsWorksheet.line7));
      }
      // Line 8a
      if (data.deductionsWorksheet.line8a) {
        setText('8a', String(data.deductionsWorksheet.line8a));
      }
      // Line 8b
      if (data.deductionsWorksheet.line8b) {
        setText('8b', String(data.deductionsWorksheet.line8b));
      }
      // Line 9 - undefined_9
      if (data.deductionsWorksheet.line9) {
        setText('undefined_9', String(data.deductionsWorksheet.line9));
      }
      // Line 10
      if (data.deductionsWorksheet.line10) {
        setText('10', String(data.deductionsWorksheet.line10));
      }
      // Line 11
      if (data.deductionsWorksheet.line11) {
        setText('11', String(data.deductionsWorksheet.line11));
      }
      // Line 12
      if (data.deductionsWorksheet.line12) {
        setText('12', String(data.deductionsWorksheet.line12));
      }
      // Line 13
      if (data.deductionsWorksheet.line13) {
        setText('13', String(data.deductionsWorksheet.line13));
      }
      // Line 14
      if (data.deductionsWorksheet.line14) {
        setText('14', String(data.deductionsWorksheet.line14));
      }
      // Line 15
      if (data.deductionsWorksheet.line15) {
        setText('15', String(data.deductionsWorksheet.line15));
      }
    }
    
    // ========== STEP 5: Sign Here ==========
    // Date
    setText('Date', new Date().toLocaleDateString('en-US'));
    
    // ========== EMPLOYER SECTION (for office use) ==========
    setText('Employers name and address', 'LYT Communications, LLC\n12130 State Highway 3\nWebster, TX 77598');
    setText('First date of employment', new Date().toLocaleDateString('en-US'));
    // Leave EIN blank - employer fills this
    
    // ========== EMBED SIGNATURE IMAGE ==========
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const pages = pdfDoc.getPages();
          const firstPage = pages[0];
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          // W-4 signature line is near bottom of first page
          // Signature field is at approximately x=100, y=676 (from top)
          // In pdf-lib coords (from bottom): 792 - 676 - 26 = 90
          firstPage.drawImage(sigImage, {
            x: 105,
            y: 92,
            width: 160,
            height: 40,
          });
          
          // Add signature verification info BELOW the signature (not overlapping form)
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            firstPage.drawText(verifyText, {
              x: 105,
              y: 80,
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
    return uint8ArrayToBase64(pdfBytes);
    
  } catch (error) {
    console.error('Error filling W-4:', error);
    throw error;
  }
}

/**
 * Fill IRS Form W-9 with contractor data - ALL FIELDS
 * 
 * W-9 Field Reference:
 * Line 1: Name (required)
 *   - "1 Name of entityindividual..."
 * 
 * Line 2: Business name/DBA (if different)
 *   - "2 Business namedisregarded entity name..."
 * 
 * Line 3a: Federal tax classification (checkboxes)
 *   - "Individualsole proprietor"
 *   - "C corporation"
 *   - "S corporation"
 *   - "Partnership"
 *   - "Trustestate"
 *   - "LLC Enter the tax classification..."
 *   - "Other see instructions"
 *   - "undefined" = LLC tax classification letter (C, S, or P)
 * 
 * Line 4: Exemptions (optional)
 *   - "Exempt payee code if any"
 *   - "Compliance Act FATCA reporting"
 * 
 * Line 5: Address
 *   - "5 Address number street and apt or suite no..."
 * 
 * Line 6: City, state, ZIP
 *   - "6 City state and ZIP code"
 * 
 * Line 7: Account numbers (optional)
 *   - "7 List account numbers here optional"
 * 
 * Part I - TIN (Taxpayer Identification Number)
 *   - "Social security number" (for SSN - 3 boxes or single field)
 *   - "Text11" = First 2 digits of EIN
 *   - "Text12" = Last 7 digits of EIN
 * 
 * Part II - Certification
 *   - "Signature of US person Date"
 *   - Signature image
 */
export async function fillW9(data, signatureDataUrl, signatureInfo = {}) {
  try {
    console.log('Loading W-9 PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.W9);
    const form = pdfDoc.getForm();
    
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
    
    // ========== LINE 1: Name ==========
    const name = data.companyName || data.name || '';
    setText('1 Name of entityindividual An entry is required For a sole proprietor or disregarded entity enter the owners name on line 1 and enter the businessdisregarded entitys name on line 2', name);
    
    // ========== LINE 2: Business name/DBA ==========
    if (data.dba) {
      setText('2 Business namedisregarded entity name if different from above', data.dba);
    }
    
    // ========== LINE 3a: Federal Tax Classification ==========
    const entityType = (data.entityType || '').toLowerCase();
    
    if (entityType.includes('individual') || entityType.includes('sole') || entityType === 'sole_proprietor') {
      setCheck('Individualsole proprietor', true);
    } else if (entityType.includes('c corp') || entityType === 'c_corporation') {
      setCheck('C corporation', true);
    } else if (entityType.includes('s corp') || entityType === 's_corporation') {
      setCheck('S corporation', true);
    } else if (entityType.includes('partner') || entityType === 'partnership') {
      setCheck('Partnership', true);
    } else if (entityType.includes('trust') || entityType.includes('estate')) {
      setCheck('Trustestate', true);
    } else if (entityType.includes('llc')) {
      setCheck('LLC Enter the tax classification C  C corporation S  S corporation P  Partnership', true);
      // LLC tax classification letter (C, S, or P)
      const taxClass = (data.taxClassification || 'C').charAt(0).toUpperCase();
      setText('undefined', taxClass);
    } else if (entityType.includes('other')) {
      setCheck('Other see instructions', true);
    }
    
    // ========== LINE 4: Exemptions (usually blank) ==========
    if (data.exemptPayeeCode) {
      setText('Exempt payee code if any', data.exemptPayeeCode);
    }
    if (data.fatcaCode) {
      setText('Compliance Act FATCA reporting', data.fatcaCode);
    }
    
    // ========== LINE 5: Address ==========
    setText('5 Address number street and apt or suite no See instructions', data.address || '');
    
    // ========== LINE 6: City, State, ZIP ==========
    const cityStateZip = `${data.city || ''}, ${data.state || ''} ${data.zip || ''}`.trim();
    setText('6 City state and ZIP code', cityStateZip);
    
    // ========== LINE 7: Account numbers (optional) ==========
    if (data.accountNumbers) {
      setText('7 List account numbers here optional', data.accountNumbers);
    }
    
    // ========== PART I: Taxpayer Identification Number ==========
    // W-9 has individual boxes for each digit
    // SSN boxes (9 total) at y≈372: x positions [417.8, 431.9, 446.6, 475.2, 489.9, 518.4, 532.7, 547.3, 561.8]
    // EIN boxes (9 total) at y≈420: x positions [417.6, 432.0, 460.9, 475.4, 489.9, 504.3, 518.5, 532.9, 547.3]
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pageHeight = 792;
    
    // SSN box positions (x coordinates, sorted left to right)
    const ssnBoxX = [417.8, 431.9, 446.6, 475.2, 489.9, 518.4, 532.7, 547.3, 561.8];
    const ssnBoxY = pageHeight - 372 - 18; // Convert from top to bottom coordinate
    
    // EIN box positions (x coordinates, sorted left to right)
    const einBoxX = [417.6, 432.0, 460.9, 475.4, 489.9, 504.3, 518.5, 532.9, 547.3];
    const einBoxY = pageHeight - 420 - 18;
    
    if (data.ein) {
      // EIN format: XX-XXXXXXX - draw each digit in its own box
      const ein = (data.ein || '').replace(/\D/g, '');
      if (ein.length >= 9) {
        for (let i = 0; i < 9 && i < ein.length; i++) {
          firstPage.drawText(ein[i], {
            x: einBoxX[i] + 3, // Center in box
            y: einBoxY,
            size: 14,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
      }
    } else if (data.ssn) {
      // SSN format: XXX-XX-XXXX - draw each digit in its own box
      const ssn = (data.ssn || '').replace(/\D/g, '');
      if (ssn.length >= 9) {
        for (let i = 0; i < 9 && i < ssn.length; i++) {
          firstPage.drawText(ssn[i], {
            x: ssnBoxX[i] + 3, // Center in box
            y: ssnBoxY,
            size: 14,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
      }
    }
    
    // ========== PART II: Certification ==========
    // Date
    setText('Signature of US person Date', new Date().toLocaleDateString('en-US'));
    
    // ========== EMBED SIGNATURE IMAGE ==========
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const pages = pdfDoc.getPages();
          const firstPage = pages[0];
          const fontForSig = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          // W-9 signature line is at approximately y=466 from top
          // In pdf-lib coords: 792 - 466 - 30 = 296
          firstPage.drawImage(sigImage, {
            x: 45,
            y: 296,
            width: 160,
            height: 35,
          });
          
          // Add signature verification info BELOW the signature line
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            firstPage.drawText(verifyText, {
              x: 45,
              y: 285,
              size: 6,
              font: fontForSig,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }
      } catch (sigErr) {
        console.error('W-9 signature embed error:', sigErr);
      }
    }
    
    form.flatten();
    const pdfBytes = await pdfDoc.save();
    return uint8ArrayToBase64(pdfBytes);
    
  } catch (error) {
    console.error('Error filling W-9:', error);
    throw error;
  }
}

/**
 * Sign MSA document
 * MSA has Adobe Sign placeholders that need to be covered and replaced with actual values
 * 
 * Page 1 placeholders:
 *   - {{EffectiveDate_es_:signer1:date}} at x=176, y=137
 *   - {{SubcontractorName_es_:signer2:text}} at x=176, y=197
 *   - {{EntityType_es_:signer2:text}} at x=176, y=223
 * 
 * Page 15 (Signature page) - SUBCONTRACTOR section:
 *   - {{Sig_signer2_es_:signer2:signature}} at x=224, y=380
 *   - {{Name_signer2_es_:signer2:fullname}} at x=156, y=424
 *   - {{Title_signer2_es_:signer2:text}} at x=156, y=450
 *   - {{Date_signer2_es_:signer2:date}} at x=156, y=476
 */
export async function fillMSA(data, signatureDataUrl, signatureInfo = {}) {
  try {
    console.log('Loading MSA PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.MSA);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const lastPage = pages[pages.length - 1];
    const pageHeight = 792; // Letter size
    
    const currentDate = new Date().toLocaleDateString('en-US');
    
    // Helper to convert bbox Y (from top) to pdf-lib Y (from bottom)
    const toY = (bboxY, height = 10) => pageHeight - bboxY - height;
    
    // Helper to cover placeholder text with white rectangle and draw new text
    const replacePlaceholder = (page, x, bboxY, width, height, newText, fontSize = 10) => {
      const y = toY(bboxY, height);
      // Cover the placeholder with white
      page.drawRectangle({
        x: x - 2,
        y: y - 2,
        width: width + 4,
        height: height + 4,
        color: rgb(1, 1, 1), // white
      });
      // Draw the new text
      page.drawText(newText || '', {
        x: x,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    };
    
    // ========== PAGE 1: Header Info ==========
    // Effective Date
    replacePlaceholder(firstPage, 176, 137, 110, 12, currentDate);
    
    // Subcontractor Name
    replacePlaceholder(firstPage, 176, 197, 130, 12, data.companyName || '');
    
    // Entity Type
    replacePlaceholder(firstPage, 176, 223, 100, 12, data.entityType || 'LLC');
    
    // ========== PAGE 15: Signature Page ==========
    // Subcontractor Printed Name
    replacePlaceholder(lastPage, 156, 424, 130, 12, data.contactName || '');
    
    // Subcontractor Title
    replacePlaceholder(lastPage, 156, 450, 110, 12, data.contactTitle || data.title || '');
    
    // Subcontractor Date
    replacePlaceholder(lastPage, 156, 476, 110, 12, currentDate);
    
    // ========== Embed Subcontractor Signature ==========
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          
          // Draw signature image (no white rectangle - signature should have transparent bg)
          // Signature placeholder is at x=224, y=380 from top
          lastPage.drawImage(sigImage, {
            x: 224,
            y: toY(380, 45),
            width: 160,
            height: 40,
          });
          
          // Add signature verification info below signature (in the margin area)
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            lastPage.drawText(verifyText, {
              x: 224,
              y: toY(380, 45) - 10,
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
    
    const pdfBytes = await pdfDoc.save();
    return uint8ArrayToBase64(pdfBytes);
    
  } catch (error) {
    console.error('Error signing MSA:', error);
    throw error;
  }
}

/**
 * Create a branded PDF for other forms (Direct Deposit, Emergency Contact, etc.)
 * Uses ASCII characters [X] and [ ] for checkboxes to avoid encoding issues
 */
export async function createFormPdf(title, sections, signatureDataUrl, signerName, signatureInfo = {}) {
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    let y = height - 50;
    
    // Blue header
    page.drawRectangle({
      x: 0,
      y: height - 60,
      width: width,
      height: 60,
      color: rgb(0, 0.467, 0.714), // #0077B6
    });
    
    page.drawText('LYT Communications, LLC', {
      x: 50,
      y: height - 38,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    
    y = height - 90;
    
    // Document title
    page.drawText(title, {
      x: 50,
      y: y,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    
    y -= 30;
    
    // Sections
    for (const section of sections) {
      if (section.title) {
        page.drawText(section.title, {
          x: 50,
          y: y,
          size: 11,
          font: fontBold,
          color: rgb(0, 0.467, 0.714),
        });
        y -= 18;
      }
      
      if (section.fields) {
        for (const field of section.fields) {
          page.drawText(`${field.label}: ${field.value || ''}`, {
            x: 50,
            y: y,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
          });
          y -= 15;
        }
      }
      
      if (section.paragraphs) {
        for (const para of section.paragraphs) {
          // Simple word wrap
          const words = para.split(' ');
          let line = '';
          for (const word of words) {
            if ((line + word).length > 90) {
              page.drawText(line.trim(), { x: 50, y: y, size: 9, font: font, color: rgb(0, 0, 0) });
              y -= 12;
              line = word + ' ';
            } else {
              line += word + ' ';
            }
          }
          if (line.trim()) {
            page.drawText(line.trim(), { x: 50, y: y, size: 9, font: font, color: rgb(0, 0, 0) });
            y -= 12;
          }
          y -= 5;
        }
      }
      
      if (section.checkboxes) {
        for (const cb of section.checkboxes) {
          // Use ASCII checkboxes to avoid encoding issues
          const mark = cb.checked ? '[X]' : '[ ]';
          page.drawText(`${mark} ${cb.label}`, { x: 50, y: y, size: 9, font: font, color: rgb(0, 0, 0) });
          y -= 14;
        }
      }
      
      y -= 10;
    }
    
    // E-Sign consent
    y -= 10;
    page.drawLine({ start: { x: 50, y: y }, end: { x: width - 50, y: y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 15;
    
    page.drawText('ELECTRONIC SIGNATURE CONSENT', { x: 50, y: y, size: 8, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    y -= 12;
    
    page.drawText('By signing, I consent to electronic transaction per ESIGN Act and UETA.', { x: 50, y: y, size: 7, font: font, color: rgb(0.4, 0.4, 0.4) });
    y -= 25;
    
    // Signature area
    page.drawText('Signature:', { x: 50, y: y, size: 10, font: font, color: rgb(0, 0, 0) });
    
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          page.drawImage(sigImage, { x: 120, y: y - 15, width: 150, height: 40 });
        }
      } catch (e) {
        console.log('Signature error:', e);
      }
    }
    
    y -= 50;
    page.drawText(`Printed Name: ${signerName || ''}`, { x: 50, y: y, size: 10, font: font, color: rgb(0, 0, 0) });
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 300, y: y, size: 10, font: font, color: rgb(0, 0, 0) });
    
    y -= 15;
    page.drawText(`Time: ${new Date().toLocaleTimeString()}`, { x: 300, y: y, size: 10, font: font, color: rgb(0, 0, 0) });
    
    if (signatureInfo.ip) {
      page.drawText(`IP: ${signatureInfo.ip}`, { x: 420, y: y, size: 10, font: font, color: rgb(0, 0, 0) });
    }
    
    // Footer
    page.drawText(`Document ID: LYT-${Date.now()} | Generated: ${new Date().toISOString()}`, {
      x: 50, y: 30, size: 7, font: font, color: rgb(0.5, 0.5, 0.5)
    });
    
    const pdfBytes = await pdfDoc.save();
    return uint8ArrayToBase64(pdfBytes);
    
  } catch (error) {
    console.error('Error creating form PDF:', error);
    throw error;
  }
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default {
  fillW4,
  fillW9,
  fillMSA,
  createFormPdf,
};
