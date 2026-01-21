/**
 * LYT Communications - PDF Service
 * 
 * Fills actual IRS W-4, W-9 forms and LYT MSA with user data and signatures.
 * Uses pdf-lib to manipulate PDF form fields.
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
 * Fill IRS Form W-4 with employee data
 * 
 * Field names from actual form:
 * - "a First name and middle initial"
 * - "Last name"
 * - "b Social security number"
 * - "Address"
 * - "City or town state and ZIP code"
 * - "Single or Married filing separately" (checkbox)
 * - "Married filing jointly or Qualifying surviving spouse" (checkbox)
 * - "Head of household..." (checkbox)
 * - "fill_14" through "fill_17" (Step 3 amounts)
 * - "fill_22", "fill_23" (Step 4 amounts)
 * - "Date"
 * - "Signature2_es_:signer:signature" (signature field)
 */
export async function fillW4(data, signatureDataUrl) {
  try {
    console.log('Loading W-4 PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.W4);
    const form = pdfDoc.getForm();
    
    // Helper to safely set text field
    const setText = (fieldName, value) => {
      try {
        const field = form.getTextField(fieldName);
        if (field && value !== undefined && value !== null) {
          field.setText(String(value));
        }
      } catch (e) {
        console.log(`W-4 field "${fieldName}" error:`, e.message);
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
        console.log(`W-4 checkbox "${fieldName}" error:`, e.message);
      }
    };
    
    // Step 1a - Name
    setText('a First name and middle initial', `${data.firstName || ''} ${data.middleName || ''}`.trim());
    setText('Last name', data.lastName || '');
    
    // Step 1b - SSN
    setText('b Social security number', data.ssn || '');
    
    // Address
    setText('Address', data.address || '');
    setText('City or town state and ZIP code', `${data.city || ''}, ${data.state || ''} ${data.zip || ''}`);
    
    // Step 1c - Filing Status
    const status = (data.filingStatus || '').toLowerCase();
    if (status === 'single' || status === 'married_separate') {
      setCheck('Single or Married filing separately', true);
    } else if (status === 'married' || status === 'married_joint') {
      setCheck('Married filing jointly or Qualifying surviving spouse', true);
    } else if (status === 'head') {
      setCheck('Head of household Check only if youre unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual', true);
    }
    
    // Step 3 - Dependents (fill_14 = children x $2000, fill_15 = other x $500)
    if (data.qualifyingChildren) {
      const childAmount = parseInt(data.qualifyingChildren) * 2000;
      setText('fill_14', childAmount > 0 ? String(childAmount) : '');
    }
    if (data.otherDependents) {
      const otherAmount = parseInt(data.otherDependents) * 500;
      setText('fill_15', otherAmount > 0 ? String(otherAmount) : '');
    }
    
    // Step 4a - Other income
    if (data.otherIncome) {
      setText('fill_16', data.otherIncome);
    }
    
    // Step 4b - Deductions
    if (data.deductions) {
      setText('fill_17', data.deductions);
    }
    
    // Step 4c - Extra withholding
    if (data.extraWithholding) {
      setText('fill_22', data.extraWithholding);
    }
    
    // Date
    setText('Date', new Date().toLocaleDateString());
    
    // Employer info
    setText('Employers name and address', 'LYT Communications, LLC\n12130 State Highway 3\nWebster, TX 77598');
    setText('Employer identification number EIN', '');
    setText('First date of employment', new Date().toLocaleDateString());
    
    // Embed signature image
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const pages = pdfDoc.getPages();
          const firstPage = pages[0];
          
          // W-4 signature line is near bottom of first page
          // Position: approximately x=72, y=195, width=180, height=45
          firstPage.drawImage(sigImage, {
            x: 72,
            y: 188,
            width: 180,
            height: 45,
          });
        }
      } catch (sigErr) {
        console.error('W-4 signature embed error:', sigErr);
      }
    }
    
    // Flatten form
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
 * Fill IRS Form W-9 with contractor data
 * 
 * Field names from actual form:
 * - "1 Name of entityindividual..." (name/company)
 * - "2 Business namedisregarded entity name..." (DBA)
 * - "Individualsole proprietor" (checkbox)
 * - "C corporation" (checkbox)
 * - "S corporation" (checkbox)
 * - "Partnership" (checkbox)
 * - "LLC Enter the tax classification..." (checkbox)
 * - "undefined" (LLC classification letter)
 * - "5 Address..." (address)
 * - "6 City state and ZIP code" (city/state/zip)
 * - "Text11", "Text12" (EIN parts)
 * - "Social security number" (SSN)
 * - "Signature of US person Date" (date)
 * - "Signature1_es_:signer:signature" (signature)
 */
export async function fillW9(data, signatureDataUrl) {
  try {
    console.log('Loading W-9 PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.W9);
    const form = pdfDoc.getForm();
    
    const setText = (fieldName, value) => {
      try {
        const field = form.getTextField(fieldName);
        if (field && value !== undefined && value !== null) {
          field.setText(String(value));
        }
      } catch (e) {
        console.log(`W-9 field "${fieldName}" error:`, e.message);
      }
    };
    
    const setCheck = (fieldName, checked) => {
      try {
        const field = form.getCheckBox(fieldName);
        if (field && checked) {
          field.check();
        }
      } catch (e) {
        console.log(`W-9 checkbox "${fieldName}" error:`, e.message);
      }
    };
    
    // Line 1 - Name
    setText('1 Name of entityindividual An entry is required For a sole proprietor or disregarded entity enter the owners name on line 1 and enter the businessdisregarded entitys name on line 2', 
      data.companyName || data.name || '');
    
    // Line 2 - DBA
    setText('2 Business namedisregarded entity name if different from above', data.dba || '');
    
    // Line 3 - Tax Classification
    const entityType = (data.entityType || '').toLowerCase();
    if (entityType.includes('individual') || entityType.includes('sole')) {
      setCheck('Individualsole proprietor', true);
    } else if (entityType.includes('c corp') && !entityType.includes('s corp')) {
      setCheck('C corporation', true);
    } else if (entityType.includes('s corp')) {
      setCheck('S corporation', true);
    } else if (entityType.includes('partner')) {
      setCheck('Partnership', true);
    } else if (entityType.includes('trust') || entityType.includes('estate')) {
      setCheck('Trustestate', true);
    } else if (entityType.includes('llc')) {
      setCheck('LLC Enter the tax classification C  C corporation S  S corporation P  Partnership', true);
      // LLC tax classification letter
      if (data.taxClassification) {
        setText('undefined', data.taxClassification.charAt(0).toUpperCase());
      }
    }
    
    // Line 5 - Address
    setText('5 Address number street and apt or suite no See instructions', data.address || '');
    
    // Line 6 - City, State, ZIP
    setText('6 City state and ZIP code', `${data.city || ''}, ${data.state || ''} ${data.zip || ''}`);
    
    // Part I - TIN
    if (data.ein) {
      const ein = (data.ein || '').replace(/\D/g, '');
      setText('Text11', ein.substring(0, 2));
      setText('Text12', ein.substring(2));
    } else if (data.ssn) {
      setText('Social security number', data.ssn);
    }
    
    // Signature date
    setText('Signature of US person Date', new Date().toLocaleDateString());
    
    // Embed signature
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const pages = pdfDoc.getPages();
          const firstPage = pages[0];
          
          // W-9 signature line position
          firstPage.drawImage(sigImage, {
            x: 72,
            y: 130,
            width: 180,
            height: 45,
          });
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
 * MSA has no form fields, so we add signature and info to last page
 */
export async function fillMSA(data, signatureDataUrl) {
  try {
    console.log('Loading MSA PDF...');
    const pdfDoc = await loadPdf(PDF_URLS.MSA);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    
    // Add contractor info to signature block area
    // These positions need adjustment based on actual MSA layout
    const sigBlockY = 180;
    
    // Company Name
    lastPage.drawText(data.companyName || '', {
      x: 72,
      y: sigBlockY + 100,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    
    // Printed Name
    lastPage.drawText(`Name: ${data.contactName || ''}`, {
      x: 72,
      y: sigBlockY + 60,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Title
    lastPage.drawText(`Title: ${data.contactTitle || data.title || ''}`, {
      x: 300,
      y: sigBlockY + 60,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Date
    lastPage.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 72,
      y: sigBlockY + 40,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Embed signature
    if (signatureDataUrl) {
      try {
        const sigBytes = dataUrlToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          lastPage.drawImage(sigImage, {
            x: 72,
            y: sigBlockY - 10,
            width: 200,
            height: 50,
          });
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
 */
export async function createFormPdf(title, sections, signatureDataUrl, signerName) {
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
