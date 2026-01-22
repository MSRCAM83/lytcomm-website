/**
 * pdfService.js - PDF Form Filling Service v2.60
 * Fills actual IRS W-4, W-9 forms and LYT MSA with user data and signatures.
 * Uses pdf-lib to manipulate PDF form fields.
 * 
 * v2.49 - FIXED createFormPdf to handle array of sections (for test panel)
 * v2.47 - FIXED W-4 page 3-4 field mappings
 * v2.62 - REMOVED white rectangles - transparent PNG signatures draw directly on form
 * v2.61 - Signature white background fix: Draw white rectangle before transparent PNG signature
 * v2.60 - MSA v4.0: Fill page 1 header + page 15 signature with timestamp/IP
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
    
    // Line 1 - Name
    const name = data.companyName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
    setText('Name', name);
    
    // Line 2 - Business name/DBA
    if (data.dba) {
      setText('Business namedisregarded entity name if different from above', data.dba);
    }
    
    // Line 3 - Federal tax classification
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
      if (data.llcClassification) {
        setText('undefined', data.llcClassification);
      }
    } else if (entityType === 'other') {
      setCheck('Other see instructions', true);
    }
    
    // Line 4 - Exemptions
    if (data.exemptPayeeCode) setText('Exempt payee code if any', data.exemptPayeeCode);
    if (data.fatcaCode) setText('Exemption from FATCA reporting', data.fatcaCode);
    
    // Line 5 - Address
    setText('Address number street and apt or suite no See instructions', data.address || '');
    
    // Line 6 - City, State, ZIP
    const cityStateZip = [data.city, data.state, data.zip].filter(Boolean).join(', ');
    setText('City state and ZIP code', cityStateZip);
    
    // Line 7 - Account numbers
    if (data.accountNumbers) setText('List account numbers here optional', data.accountNumbers);
    
    // SSN - Draw each digit in its own box
    const ssnBoxX = [417.8, 431.9, 446.6, 475.2, 489.9, 518.4, 532.7, 547.3, 561.8];
    const ssnY = 372;
    
    if (data.ssn && (entityType === 'individual' || entityType === 'sole_proprietor' || !data.ein)) {
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
    const einY = 420;
    
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
    
    // Date
    setText('Date', data.w9Date || new Date().toLocaleDateString());
    
    // Signature - v2.62: Draw transparent PNG directly (NO white background)
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          
          // Draw transparent PNG signature directly on form
          firstPage.drawImage(sigImage, {
            x: 75,
            y: 205,
            width: 150,
            height: 30,
          });
          
          if (signatureInfo.timestamp || signatureInfo.ip) {
            const verifyText = `Signed: ${signatureInfo.timestamp || ''} | IP: ${signatureInfo.ip || ''}`;
            firstPage.drawText(verifyText, {
              x: 75,
              y: 190,
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
    
    form.flatten();
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
 */
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
              x: 100,
              y: 375,
              size: 6,
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
    
    // Handle content - either string or array of sections
    if (typeof content === 'string') {
      // Original string format - split by newlines
      const lines = content.split('\n');
      for (const line of lines) {
        if (y < 120) break;
        
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
    } else if (Array.isArray(content)) {
      // Array format - sections with title, fields, paragraphs
      for (const section of content) {
        if (y < 120) break;
        
        // Section title
        if (section.title) {
          y -= 10; // Extra space before section
          page.drawText(section.title, {
            x: 50,
            y: y,
            size: 11,
            font: fontBold,
            color: rgb(0, 0.3, 0.5),
          });
          y -= 18;
        }
        
        // Fields (label: value pairs)
        if (section.fields && Array.isArray(section.fields)) {
          for (const field of section.fields) {
            if (y < 120) break;
            const text = `${field.label}: ${field.value || 'N/A'}`;
            page.drawText(text, {
              x: 60,
              y: y,
              size: 10,
              font: font,
              color: rgb(0, 0, 0),
              maxWidth: width - 120,
            });
            y -= 14;
          }
        }
        
        // Paragraphs
        if (section.paragraphs && Array.isArray(section.paragraphs)) {
          for (const para of section.paragraphs) {
            if (y < 120) break;
            // Word wrap long paragraphs
            const words = para.split(' ');
            let line = '';
            for (const word of words) {
              const testLine = line + (line ? ' ' : '') + word;
              if (testLine.length > 80) {
                page.drawText(line, {
                  x: 60,
                  y: y,
                  size: 9,
                  font: font,
                  color: rgb(0.2, 0.2, 0.2),
                });
                y -= 12;
                line = word;
              } else {
                line = testLine;
              }
            }
            if (line) {
              page.drawText(line, {
                x: 60,
                y: y,
                size: 9,
                font: font,
                color: rgb(0.2, 0.2, 0.2),
              });
              y -= 12;
            }
            y -= 6; // Extra space after paragraph
          }
        }
      }
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
          
          // v2.62: Draw transparent PNG signature directly (NO white background)
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
