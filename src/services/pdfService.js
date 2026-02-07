/**
 * pdfService.js - PDF Form Filling Service v2.60
 * Fills actual IRS W-4, W-9 forms and LYT MSA with user data and signatures.
 * Uses pdf-lib to manipulate PDF form fields.
 * 
 * v2.49 - FIXED createFormPdf to handle array of sections (for test panel)
 * v2.47 - FIXED W-4 page 3-4 field mappings
 * v2.66 - Fix W-9 field names to match actual form fields
 * v2.64 - Add checkbox support to createFormPdf
 * v2.63 - Fix verification text positions - move to right of signature on all forms
 * v2.62 - REMOVED white rectangles - transparent PNG signatures draw directly on form
 * v2.61 - Signature white background fix: Draw white rectangle before transparent PNG signature
 * v2.60 - MSA v4.0: Fill page 1 header + page 15 signature with timestamp/IP
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// PDF URLs in public folder
const PDF_URLS = {
  W4: '/Form%20W-4%20sign.pdf',
  W9: '/Form%20W-9%20sign.pdf',
  MSA: '/LYT_MSA_2026_AdobeSign_Full_v4_1.pdf',
};

/**
 * Convert base64 data URL to Uint8Array
 */
function dataUrlToBytes(dataUrl) {
  if (!dataUrl) return null;
  try {
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
 */
export async function fillW4(data, signatureDataUrl, signatureInfo = {}) {
  try {
    console.log('Loading W-4 PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.W4);
    const form = pdfDoc.getForm();
    
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
    
    // PAGE 1 - STEP 1: PERSONAL INFO
    const firstName = data.firstName || '';
    const middleInitial = data.middleInitial || '';
    setText('a First name and middle initial', `${firstName} ${middleInitial}`.trim());
    setText('Last name', data.lastName || '');
    
    // SSN with dashes
    if (data.ssn) {
      const ssnClean = data.ssn.replace(/\D/g, '');
      const ssnFormatted = `${ssnClean.slice(0,3)}-${ssnClean.slice(3,5)}-${ssnClean.slice(5,9)}`;
      setText('b Social security number', ssnFormatted);
    }
    
    setText('Address', data.address || '');
    const cityStateZip = [data.city, data.state, data.zip].filter(Boolean).join(', ');
    setText('City or town state and ZIP code', cityStateZip);
    
    // Filing Status
    if (data.filingStatus === 'single') {
      setCheck('Single or Married filing separately', true);
    } else if (data.filingStatus === 'married') {
      setCheck('Married filing jointly or Qualifying surviving spouse', true);
    } else if (data.filingStatus === 'head') {
      setCheck('Head of household Check only if youre unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual', true);
    }
    
    // STEP 2: MULTIPLE JOBS
    if (data.multipleJobs) {
      setCheck('option is generally more accurate than Step 2b if pay at the lower paying job is more than half of the pay at', true);
    }
    
    // STEP 3: DEPENDENTS
    if (data.qualifyingChildren && data.qualifyingChildren > 0) {
      const childAmount = parseInt(data.qualifyingChildren) * 2000;
      setText('fill_22', childAmount.toString());
    }
    if (data.otherDependents && data.otherDependents > 0) {
      const otherAmount = parseInt(data.otherDependents) * 500;
      setText('fill_23', otherAmount.toString());
    }
    const totalDependents = 
      (parseInt(data.qualifyingChildren || 0) * 2000) + 
      (parseInt(data.otherDependents || 0) * 500);
    if (totalDependents > 0) {
      setText('fill_14', totalDependents.toString());
    }
    
    // STEP 4: OTHER ADJUSTMENTS
    if (data.otherIncome) setText('fill_15', data.otherIncome);
    if (data.deductions) setText('fill_16', data.deductions);
    if (data.extraWithholding) setText('fill_17', data.extraWithholding);
    if (data.exempt) setText('undefined', 'EXEMPT');
    
    // STEP 5: DATE
    setText('Date', data.w4Date || new Date().toLocaleDateString());
    
    // EMPLOYER SECTION
    setText('Employers name and address', data.employerName || 'LYT Communications, LLC');
    setText('First date of employment', data.hireDate || '');
    setText('Employer identification number EIN', data.employerEIN || '');
    
    // PAGE 3 - STEP 2(b) WORKSHEET
    if (data.worksheet) {
      if (data.worksheet.step2b_line1) setText('undefined_2', data.worksheet.step2b_line1);
      if (data.worksheet.step2b_line2a) setText('2a', data.worksheet.step2b_line2a);
      if (data.worksheet.step2b_line2b) setText('2b', data.worksheet.step2b_line2b);
      if (data.worksheet.step2b_line2c) setText('2c', data.worksheet.step2b_line2c);
      if (data.worksheet.step2b_line3) setText('3', data.worksheet.step2b_line3);
      if (data.worksheet.step2b_line4) setText('undefined_3', data.worksheet.step2b_line4);
    }
    
    // PAGE 4 - STEP 4(b) WORKSHEET - CORRECT FIELD MAPPINGS
    if (data.deductionsWorksheet) {
      const dw = data.deductionsWorksheet;
      if (dw.line1a) setText('1a', dw.line1a);
      if (dw.line1b) setText('1b', dw.line1b);
      if (dw.line1c) setText('1c', dw.line1c);
      if (dw.line1d) setText('undefined_4', dw.line1d);  // FIXED
      if (dw.line3a) setText('3a', dw.line3a);
      if (dw.line3b) setText('3b', dw.line3b);
      if (dw.line3c) setText('undefined_5', dw.line3c);  // FIXED
      if (dw.line5) setText('undefined_6', dw.line5);    // FIXED
      if (dw.line6a) setText('6a', dw.line6a);
      if (dw.line6b) setText('6b', dw.line6b);
      if (dw.line6c) setText('6c', dw.line6c);
      if (dw.line6d) setText('6d', dw.line6d);
      if (dw.line6e) setText('6e', dw.line6e);
      if (dw.line7) setText('undefined_7', dw.line7);    // FIXED
      if (dw.line8a) setText('8a', dw.line8a);
      if (dw.line8b) setText('8b', dw.line8b);
      if (dw.line9) setText('undefined_9', dw.line9);    // FIXED
      if (dw.line10) setText('10', dw.line10);
      if (dw.line11) setText('11', dw.line11);
      if (dw.line12) setText('12', dw.line12);
      if (dw.line13) setText('13', dw.line13);
      if (dw.line14) setText('14', dw.line14);
      if (dw.line15) setText('15', dw.line15);
    }
    
    // SIGNATURE - v2.62: Draw transparent PNG signature directly (NO white background)
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const pages = pdfDoc.getPages();
          const firstPage = pages[0];
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          // Draw transparent PNG signature directly on the form
          firstPage.drawImage(sigImage, {
            x: 105,
            y: 92,
            width: 150,
            height: 35,
          });
          
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            firstPage.drawText(verifyText, {
              x: 260,
              y: 95,
              size: 5,
              font: font,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }
      } catch (sigErr) {
        console.error('W-4 signature embed error:', sigErr);
      }
    }
    
    form.flatten();
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
 */

export async function fillW9(data, signatureDataUrl, signatureInfo = {}) {
  try {
    console.log('Loading W-9 PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.W9);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
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
    
    // Line 1 - Name (CORRECT field name)
    const name = data.companyName || data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim();
    setText('1 Name of entityindividual An entry is required For a sole proprietor or disregarded entity enter the owners name on line 1 and enter the businessdisregarded entitys name on line 2', name);
    
    // Line 2 - Business name/DBA (CORRECT field name)
    if (data.dba) {
      setText('2 Business namedisregarded entity name if different from above', data.dba);
    }
    
    // Line 3 - Federal tax classification (CORRECT checkbox names)
    const entityType = (data.entityType || '').toLowerCase();
    if (entityType === 'individual' || entityType === 'sole_proprietor' || entityType === 'sole') {
      setCheck('Individualsole proprietor', true);
    } else if (entityType === 'c_corp' || entityType === 'c_corporation' || entityType === 'c corporation') {
      setCheck('C corporation', true);
    } else if (entityType === 's_corp' || entityType === 's_corporation' || entityType === 's corporation') {
      setCheck('S corporation', true);
    } else if (entityType === 'partnership') {
      setCheck('Partnership', true);
    } else if (entityType === 'trust' || entityType === 'estate') {
      setCheck('Trustestate', true);
    } else if (entityType === 'llc' || entityType.includes('llc')) {
      setCheck('LLC Enter the tax classification C  C corporation S  S corporation P  Partnership', true);
      // Tax classification letter
      if (data.taxClassification || data.llcClassification) {
        setText('undefined', data.taxClassification || data.llcClassification);
      }
    } else if (entityType === 'other') {
      setCheck('Other see instructions', true);
    }
    
    // Line 4 - Exemptions
    if (data.exemptPayeeCode) setText('Exempt payee code if any', data.exemptPayeeCode);
    if (data.fatcaCode) setText('Compliance Act FATCA reporting', data.fatcaCode);
    
    // Line 5 - Address (CORRECT field name)
    setText('5 Address number street and apt or suite no See instructions', data.address || '');
    
    // Line 6 - City, State, ZIP (CORRECT field name)
    const cityStateZip = [data.city, data.state, data.zip].filter(Boolean).join(', ');
    setText('6 City state and ZIP code', cityStateZip);
    
    // Line 7 - Account numbers
    if (data.accountNumbers) setText('7 List account numbers here optional', data.accountNumbers);
    
    // SSN - Draw each digit in its own box
    const ssnBoxX = [417.8, 431.9, 446.6, 475.2, 489.9, 518.4, 532.7, 547.3, 561.8];
    const ssnY = 372;
    
    if (data.ssn && (entityType === 'individual' || entityType === 'sole_proprietor' || entityType === 'sole' || !data.ein)) {
      const ssnClean = data.ssn.replace(/\D/g, '');
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
    const einBoxX = [417.6, 432.0, 460.9, 475.4, 489.9, 504.3, 518.5, 532.9, 547.3];
    const einY = 355;
    
    if (data.ein) {
      const einClean = data.ein.replace(/\D/g, '');
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
    
    // SIGNATURE - v2.66: Draw transparent PNG directly
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          
          // Draw transparent PNG signature directly on form - lowered to fit signature line
          firstPage.drawImage(sigImage, {
            x: 75,
            y: 188,
            width: 150,
            height: 30,
          });
          
          // Verification text to the right
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            firstPage.drawText(verifyText, {
              x: 75,
              y: 168,
              size: 5,
              font: font,
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
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    return `data:application/pdf;base64,${base64}`;
    
  } catch (error) {
    console.error('Error filling W-9:', error);
    throw error;
  }
}

export async function fillMSA(data, signatureDataUrl, signatureInfo = {}) {
  try {
    console.log('[v2.60] Loading MSA v4.0 PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.MSA);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Extract data with fallbacks
    const contractorName = data.companyName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const effectiveDate = data.effectiveDate || data.msaEffectiveDate || new Date().toLocaleDateString();
    const printedName = data.printedName || data.msaPrintedName || data.contactName || '';
    const title = data.title || data.msaTitle || data.contactTitle || '';
    const signatureDate = data.signatureDate || data.msaDate || new Date().toLocaleDateString();
    
    // Convert entity type code to display text
    const entityTypeMap = {
      'sole': 'Sole Proprietor',
      'llc-c': 'LLC (taxed as C-Corp)',
      'llc-s': 'LLC (taxed as S-Corp)',
      'llc-p': 'LLC (taxed as Partnership)',
      'c-corp': 'C Corporation',
      's-corp': 'S Corporation',
      'partnership': 'Partnership',
      'trust': 'Trust/Estate',
      'other': 'Other',
    };
    const entityType = entityTypeMap[data.entityType] || data.entityType || '';
    
    // ==== PAGE 1: HEADER INFO ====
    // VERIFIED COORDINATES - tested visually and confirmed working
    const page1 = pages[0];
    
    // Effective Date: x=150, y=649
    page1.drawText(effectiveDate, {
      x: 150,
      y: 649,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    console.log('[v2.60] Page 1: Effective Date at (150, 649)');
    
    // Subcontractor Name: x=180, y=583
    page1.drawText(contractorName, {
      x: 180,
      y: 583,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    console.log('[v2.60] Page 1: Subcontractor Name at (180, 583)');
    
    // Entity Type: x=130, y=547
    page1.drawText(entityType, {
      x: 130,
      y: 547,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    console.log('[v2.60] Page 1: Entity Type at (130, 547)');
    
    // ==== PAGE 15: SIGNATURE PAGE (SUBCONTRACTOR section) ====
    // VERIFIED COORDINATES - tested visually and confirmed working
    const lastPage = pages[pages.length - 1];
    
    // Signature image: x=100, y=398 - v2.61: White background for clean signature
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          
          // Draw transparent PNG signature directly on form (NO white background)
          lastPage.drawImage(sigImage, {
            x: 100,
            y: 390,
            width: 150,
            height: 35,
          });
          console.log('[v2.62] Page 15: Signature at (100, 390)');
          
          // Signature verification timestamp: x=100, y=383
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            lastPage.drawText(verifyText, {
              x: 255,
              y: 395,
              size: 5,
              font: font,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }
      } catch (sigErr) {
        console.error('[v2.60] MSA signature embed error:', sigErr);
      }
    }
    
    // Printed Name: x=150, y=358
    if (printedName) {
      lastPage.drawText(printedName, {
        x: 150,
        y: 358,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
      console.log('[v2.60] Page 15: Printed Name at (150, 358)');
    }
    
    // Title: x=100, y=331
    if (title) {
      lastPage.drawText(title, {
        x: 100,
        y: 331,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
      console.log('[v2.60] Page 15: Title at (100, 331)');
    }
    
    // Date: x=100, y=305
    lastPage.drawText(signatureDate, {
      x: 100,
      y: 305,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    console.log('[v2.60] Page 15: Date at (100, 305)');
    
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    console.log('[v2.60] MSA PDF generated successfully');
    return `data:application/pdf;base64,${base64}`;
    
  } catch (error) {
    console.error('[v2.60] Error filling MSA:', error);
    throw error;
  }
}

// v3.0 - Professional PDF layout with LYT branding, proper text wrapping, page numbers
export async function createFormPdf(title, content, signatureDataUrl, signatureInfo = {}, attachmentImage = null) {
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page dimensions
    const pageWidth = 612;
    const pageHeight = 792;
    const leftMargin = 50;
    const rightMargin = pageWidth - 50;
    const contentWidth = rightMargin - leftMargin;
    const contentBottom = 65;

    // LYT Brand Colors
    const lytBlue = rgb(0, 0.467, 0.714);
    const lytTeal = rgb(0, 0.706, 0.847);
    const lytDarkBlue = rgb(0.008, 0.243, 0.541);
    const white = rgb(1, 1, 1);
    const darkText = rgb(0.12, 0.12, 0.12);
    const medGray = rgb(0.4, 0.4, 0.4);
    const lightBg = rgb(0.965, 0.975, 0.99);
    const borderColor = rgb(0.80, 0.84, 0.90);
    const checkGreen = rgb(0.18, 0.65, 0.25);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 40;

    // Accurate word wrapping using font metrics
    const wrapText = (text, fontSize, maxWidth, useFont) => {
      if (!text) return [''];
      useFont = useFont || font;
      const lines = [];
      // Split on newlines first
      const rawLines = String(text).split('\n');
      for (const rawLine of rawLines) {
        const words = rawLine.split(' ');
        let currentLine = '';
        for (const word of words) {
          if (!word) continue;
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const testWidth = useFont.widthOfTextAtSize(testLine, fontSize);
          if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        else if (rawLine === '') lines.push('');
      }
      return lines.length ? lines : [''];
    };

    // Create new page
    const newPage = () => {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 40;
    };

    // Ensure space available, creates new page if needed
    const ensureSpace = (needed) => {
      if (y - needed < contentBottom) {
        newPage();
        return true;
      }
      return false;
    };

    // ===== HEADER (first page only) =====
    // Dark blue header bar
    page.drawRectangle({
      x: 0, y: pageHeight - 68, width: pageWidth, height: 68,
      color: lytDarkBlue,
    });
    // Teal accent strip
    page.drawRectangle({
      x: 0, y: pageHeight - 72, width: pageWidth, height: 4,
      color: lytTeal,
    });
    // Company name
    page.drawText('LYT COMMUNICATIONS', {
      x: leftMargin, y: pageHeight - 32, size: 20, font: fontBold, color: white,
    });
    // Company details
    page.drawText('12130 State Highway 3, Webster, TX 77598   |   (832) 850-3887   |   info@lytcomm.com', {
      x: leftMargin, y: pageHeight - 52, size: 8, font: font, color: rgb(0.72, 0.82, 0.98),
    });

    y = pageHeight - 95;

    // ===== DOCUMENT TITLE =====
    page.drawText(title.toUpperCase(), {
      x: leftMargin, y: y, size: 15, font: fontBold, color: lytBlue,
    });
    y -= 6;
    // Teal underline
    page.drawLine({
      start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y },
      thickness: 2.5, color: lytTeal,
    });
    y -= 4;
    // Thin separator
    page.drawLine({
      start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y },
      thickness: 0.5, color: borderColor,
    });
    y -= 10;

    // ===== CONTENT SECTIONS =====
    if (Array.isArray(content)) {
      for (const section of content) {
        // Skip electronic signature/record sections when signature is present
        if (signatureDataUrl && section.title && (
          section.title.toUpperCase().includes('ELECTRONIC SIGNATURE') ||
          section.title.toUpperCase().includes('ELECTRONIC RECORD')
        )) {
          continue;
        }

        // Pre-calculate section height for smarter page breaks
        let estimatedHeight = 0;
        if (section.title) estimatedHeight += 28;
        if (section.fields) estimatedHeight += section.fields.length * 20 + 8;
        if (section.checkboxes) estimatedHeight += section.checkboxes.length * 22 + 8;
        if (section.paragraphs) {
          for (const para of section.paragraphs) {
            const lines = wrapText(para, 9, contentWidth - 28);
            estimatedHeight += lines.length * 14 + 10;
          }
        }
        if (section.table) estimatedHeight += ((section.table.rows?.length || 0) + 1) * 20 + 10;

        // Try to keep small sections together on one page
        const maxPageContent = pageHeight - 40 - contentBottom;
        if (estimatedHeight > 0 && estimatedHeight < maxPageContent) {
          ensureSpace(Math.min(estimatedHeight + 10, 220));
        }

        // Track where section content starts (after title) for bordered box
        let sectionContentStartY = y;

        // ---- Section Title Bar ----
        if (section.title) {
          ensureSpace(28);
          // Dark blue title bar
          page.drawRectangle({
            x: leftMargin, y: y - 22, width: contentWidth, height: 22,
            color: lytDarkBlue,
          });
          page.drawText(section.title, {
            x: leftMargin + 12, y: y - 16, size: 9.5, font: fontBold, color: white,
          });
          y -= 22;
          sectionContentStartY = y;
        }

        // ---- Fields ----
        if (section.fields && section.fields.length > 0) {
          const rowHeight = 18;

          for (let i = 0; i < section.fields.length; i++) {
            const field = section.fields[i];
            ensureSpace(rowHeight);

            const rowY = y - rowHeight;

            // Alternating row background
            if (i % 2 === 0) {
              page.drawRectangle({
                x: leftMargin + 0.5, y: rowY, width: contentWidth - 1, height: rowHeight,
                color: lightBg,
              });
            }
            // Row bottom border
            page.drawLine({
              start: { x: leftMargin, y: rowY },
              end: { x: rightMargin, y: rowY },
              thickness: 0.3, color: borderColor,
            });

            // Label (bold, muted)
            const labelText = (field.label || '') + ':';
            page.drawText(labelText, {
              x: leftMargin + 12, y: rowY + 5, size: 8.5, font: fontBold, color: medGray,
              maxWidth: 160,
            });
            // Value
            const valueStr = String(field.value ?? 'N/A');
            page.drawText(valueStr, {
              x: leftMargin + 178, y: rowY + 5, size: 8.5, font: font, color: darkText,
              maxWidth: contentWidth - 190,
            });

            y = rowY;
          }
        }

        // ---- Checkboxes ----
        if (section.checkboxes && section.checkboxes.length > 0) {
          const cbRowHeight = 20;

          for (let i = 0; i < section.checkboxes.length; i++) {
            const cb = section.checkboxes[i];
            ensureSpace(cbRowHeight);

            const rowY = y - cbRowHeight;

            // Subtle alternating background
            if (i % 2 === 0) {
              page.drawRectangle({
                x: leftMargin + 0.5, y: rowY, width: contentWidth - 1, height: cbRowHeight,
                color: lightBg,
              });
            }

            // Checkbox
            const boxSize = 10;
            const boxX = leftMargin + 12;
            const boxY = rowY + 5;

            if (cb.checked) {
              // Filled checkbox
              page.drawRectangle({
                x: boxX, y: boxY, width: boxSize, height: boxSize,
                color: checkGreen, borderColor: checkGreen, borderWidth: 0.5,
              });
              // White checkmark lines
              page.drawLine({
                start: { x: boxX + 2, y: boxY + 4.5 },
                end: { x: boxX + 4, y: boxY + 2 },
                thickness: 1.6, color: white,
              });
              page.drawLine({
                start: { x: boxX + 4, y: boxY + 2 },
                end: { x: boxX + 8, y: boxY + 7.5 },
                thickness: 1.6, color: white,
              });
            } else {
              // Empty checkbox
              page.drawRectangle({
                x: boxX, y: boxY, width: boxSize, height: boxSize,
                borderColor: borderColor, borderWidth: 1, color: white,
              });
            }

            // Label
            page.drawText(cb.label || '', {
              x: leftMargin + 28, y: rowY + 6, size: 8.5, font: font, color: darkText,
              maxWidth: contentWidth - 40,
            });

            y = rowY;
          }
        }

        // ---- Paragraphs (with proper wrapping) ----
        if (section.paragraphs && section.paragraphs.length > 0) {
          // Light background for entire paragraph area
          const paraLinesAll = [];
          for (const para of section.paragraphs) {
            paraLinesAll.push(...wrapText(para, 8.5, contentWidth - 30));
            paraLinesAll.push(null); // gap marker
          }
          const paraBlockHeight = paraLinesAll.reduce((h, l) => h + (l === null ? 6 : 13), 0) + 10;

          // Draw background
          if (paraBlockHeight < 300) ensureSpace(paraBlockHeight);
          else ensureSpace(40);
          const paraBgTop = y;
          page.drawRectangle({
            x: leftMargin + 0.5, y: Math.max(y - paraBlockHeight, contentBottom),
            width: contentWidth - 1,
            height: Math.min(paraBlockHeight, y - contentBottom),
            color: rgb(0.98, 0.99, 1),
          });

          y -= 6;
          for (const line of paraLinesAll) {
            if (line === null) { y -= 6; continue; }
            ensureSpace(15);
            page.drawText(line, {
              x: leftMargin + 14, y: y - 11, size: 8.5, font: font, color: darkText,
            });
            y -= 13;
          }
          y -= 4;

          // Teal left accent bar
          if (paraBgTop - y > 8 && paraBgTop > contentBottom) {
            const barTop = Math.min(paraBgTop, pageHeight - 40);
            const barBottom = Math.max(y + 2, contentBottom);
            if (barTop > barBottom) {
              page.drawRectangle({
                x: leftMargin, y: barBottom, width: 3, height: barTop - barBottom,
                color: lytTeal,
              });
            }
          }
        }

        // ---- Table ----
        if (section.table && section.table.rows) {
          const colWidths = section.table.colWidths || [200, 100, 100];
          const tableRowHeight = 18;

          // Header row
          if (section.table.headers) {
            ensureSpace(tableRowHeight);
            page.drawRectangle({
              x: leftMargin, y: y - tableRowHeight, width: contentWidth, height: tableRowHeight,
              color: lytDarkBlue,
            });
            let colX = leftMargin + 8;
            for (let i = 0; i < section.table.headers.length; i++) {
              page.drawText(section.table.headers[i], {
                x: colX, y: y - 13, size: 8, font: fontBold, color: white,
              });
              colX += colWidths[i] || 100;
            }
            y -= tableRowHeight;
          }

          // Data rows
          for (let r = 0; r < section.table.rows.length; r++) {
            const row = section.table.rows[r];
            ensureSpace(tableRowHeight);

            const rowY = y - tableRowHeight;

            // Alternating row colors
            if (r % 2 === 0) {
              page.drawRectangle({
                x: leftMargin + 0.5, y: rowY, width: contentWidth - 1, height: tableRowHeight,
                color: lightBg,
              });
            }

            let colX = leftMargin + 8;
            for (let i = 0; i < row.length; i++) {
              page.drawText(String(row[i] || ''), {
                x: colX, y: rowY + 5, size: 8, font: font, color: darkText,
                maxWidth: (colWidths[i] || 100) - 10,
              });
              colX += colWidths[i] || 100;
            }

            // Row border
            page.drawLine({
              start: { x: leftMargin, y: rowY },
              end: { x: rightMargin, y: rowY },
              thickness: 0.3, color: borderColor,
            });

            y = rowY;
          }
        }

        // ---- Draw section box border (left + right + bottom) ----
        if (sectionContentStartY > y && sectionContentStartY > contentBottom) {
          const boxTop = sectionContentStartY;
          const boxBottom = y;
          // Left border
          page.drawLine({
            start: { x: leftMargin, y: boxTop }, end: { x: leftMargin, y: boxBottom },
            thickness: 0.5, color: borderColor,
          });
          // Right border
          page.drawLine({
            start: { x: rightMargin, y: boxTop }, end: { x: rightMargin, y: boxBottom },
            thickness: 0.5, color: borderColor,
          });
          // Bottom border
          page.drawLine({
            start: { x: leftMargin, y: boxBottom }, end: { x: rightMargin, y: boxBottom },
            thickness: 0.5, color: borderColor,
          });
        }

        y -= 8; // Space between sections
      }
    }

    // ===== EMBEDDED IMAGE (Voided Check) =====
    if (attachmentImage) {
      try {
        let imgData = attachmentImage.data || attachmentImage;

        if (imgData) {
          const imgBase64 = imgData.includes('base64,') ? imgData.split('base64,')[1] : imgData;
          const imgBytes = Uint8Array.from(atob(imgBase64), c => c.charCodeAt(0));

          const mimeType = attachmentImage.mimeType ||
            (imgData.includes('image/png') ? 'image/png' :
             imgData.includes('image/jpeg') ? 'image/jpeg' : 'image/jpeg');

          let imgEmbed;
          if (mimeType.includes('png')) {
            imgEmbed = await pdfDoc.embedPng(imgBytes);
          } else if (mimeType.includes('pdf')) {
            ensureSpace(30);
            page.drawText('VOIDED CHECK: See attached PDF file', {
              x: leftMargin + 14, y: y - 15, size: 9, font: font, color: darkText,
            });
            y -= 35;
          } else {
            imgEmbed = await pdfDoc.embedJpg(imgBytes);
          }

          if (imgEmbed) {
            ensureSpace(180);

            // Section header
            page.drawRectangle({
              x: leftMargin, y: y - 22, width: contentWidth, height: 22,
              color: lytDarkBlue,
            });
            page.drawText('VOIDED CHECK / BANK VERIFICATION', {
              x: leftMargin + 12, y: y - 16, size: 9.5, font: fontBold, color: white,
            });
            y -= 28;

            // Scale image
            const maxImgWidth = contentWidth - 20;
            const maxImgHeight = 150;
            const dims = imgEmbed.scale(1);
            let imgWidth = dims.width;
            let imgHeight = dims.height;

            if (imgWidth > maxImgWidth) {
              const scale = maxImgWidth / imgWidth;
              imgWidth = maxImgWidth;
              imgHeight *= scale;
            }
            if (imgHeight > maxImgHeight) {
              const scale = maxImgHeight / imgHeight;
              imgHeight = maxImgHeight;
              imgWidth *= scale;
            }

            // Draw image with border
            const imgBoxHeight = imgHeight + 16;
            page.drawRectangle({
              x: leftMargin, y: y - imgBoxHeight, width: contentWidth, height: imgBoxHeight,
              borderColor: borderColor, borderWidth: 0.5,
            });
            page.drawImage(imgEmbed, {
              x: leftMargin + 10, y: y - imgHeight - 8, width: imgWidth, height: imgHeight,
            });
            y -= imgBoxHeight + 10;
          }
        }
      } catch (imgErr) {
        console.error('Error embedding attachment:', imgErr);
        page.drawText('[Image could not be embedded: ' + imgErr.message + ']', {
          x: leftMargin + 12, y: y - 15, size: 8, font: font, color: rgb(0.7, 0.2, 0.2),
        });
        y -= 25;
      }
    }

    // ===== SIGNATURE BLOCK =====
    if (signatureDataUrl) {
      try {
        ensureSpace(105);

        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);

          y -= 6;
          const sigBlockTop = y;
          const sigBlockHeight = 92;

          // Full-width signature block with dark blue header strip
          page.drawRectangle({
            x: leftMargin, y: sigBlockTop - 20, width: contentWidth, height: 20,
            color: lytDarkBlue,
          });
          page.drawText('AUTHORIZED SIGNATURE', {
            x: leftMargin + 12, y: sigBlockTop - 14, size: 9, font: fontBold, color: white,
          });

          // Signature content area
          page.drawRectangle({
            x: leftMargin, y: sigBlockTop - sigBlockHeight,
            width: contentWidth, height: sigBlockHeight - 20,
            color: rgb(0.985, 0.99, 1),
            borderColor: borderColor, borderWidth: 0.5,
          });

          // Signature image (left side)
          page.drawImage(sigImage, {
            x: leftMargin + 16, y: sigBlockTop - 62, width: 170, height: 36,
          });

          // Signature line
          page.drawLine({
            start: { x: leftMargin + 16, y: sigBlockTop - 66 },
            end: { x: leftMargin + 220, y: sigBlockTop - 66 },
            thickness: 0.7, color: darkText,
          });
          page.drawText('Signature', {
            x: leftMargin + 16, y: sigBlockTop - 76, size: 7, font: font, color: medGray,
          });

          // Date field (right side)
          const dateStr = signatureInfo.timestamp
            ? signatureInfo.timestamp.split(',')[0] || new Date().toLocaleDateString()
            : new Date().toLocaleDateString();
          page.drawText(dateStr, {
            x: leftMargin + 320, y: sigBlockTop - 46, size: 10, font: font, color: darkText,
          });
          page.drawLine({
            start: { x: leftMargin + 320, y: sigBlockTop - 50 },
            end: { x: rightMargin - 16, y: sigBlockTop - 50 },
            thickness: 0.7, color: darkText,
          });
          page.drawText('Date', {
            x: leftMargin + 320, y: sigBlockTop - 60, size: 7, font: font, color: medGray,
          });

          // Verification info (bottom)
          const sigInfo = `e-Signed: ${signatureInfo.timestamp || new Date().toLocaleString()}  |  IP: ${signatureInfo.ip || 'N/A'}`;
          page.drawText(sigInfo, {
            x: leftMargin + 16, y: sigBlockTop - sigBlockHeight + 6, size: 6.5, font: font, color: medGray,
          });

          y = sigBlockTop - sigBlockHeight - 6;
        }
      } catch (sigErr) {
        console.error('Signature embed error:', sigErr);
      }
    }

    // ===== ADD FOOTERS WITH PAGE NUMBERS TO ALL PAGES =====
    const allPages = pdfDoc.getPages();
    const totalPages = allPages.length;
    for (let i = 0; i < totalPages; i++) {
      const p = allPages[i];
      // Teal line above footer
      p.drawLine({
        start: { x: leftMargin, y: 48 },
        end: { x: rightMargin, y: 48 },
        thickness: 0.7, color: lytTeal,
      });
      // Company name left
      p.drawText('LYT Communications, LLC  |  Confidential', {
        x: leftMargin, y: 36, size: 7, font: font, color: medGray,
      });
      // Page number right
      const pageLabel = `Page ${i + 1} of ${totalPages}`;
      const pageLabelWidth = font.widthOfTextAtSize(pageLabel, 7);
      p.drawText(pageLabel, {
        x: rightMargin - pageLabelWidth, y: 36, size: 7, font: font, color: medGray,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    return `data:application/pdf;base64,${base64}`;

  } catch (error) {
    console.error('Error creating form PDF:', error);
    throw error;
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  fillW4,
  fillW9,
  fillMSA,
  createFormPdf,
};
