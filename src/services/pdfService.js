/**
 * LYT Communications - PDF Filling Service
 * 
 * Uses pdf-lib to fill actual IRS W-4, W-9 forms and LYT MSA
 * with user data and embedded signatures.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// PDF URLs - these are in the public folder
const PDF_URLS = {
  W4: '/Form%20W-4%20sign.pdf',
  W9: '/Form%20W-9%20sign.pdf',
  MSA: '/LYT_MSA_2026_AdobeSign_Full_v3_5.pdf',
};

/**
 * Load a PDF from URL
 */
async function loadPdf(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return PDFDocument.load(arrayBuffer);
}

/**
 * Convert base64 signature to PNG bytes
 */
function signatureToBytes(signatureDataUrl) {
  if (!signatureDataUrl) return null;
  const base64 = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Fill W-4 Form with employee data
 */
export async function fillW4(employeeData, signatureDataUrl) {
  try {
    const pdfDoc = await loadPdf(PDF_URLS.W4);
    const form = pdfDoc.getForm();
    
    // Get all field names for debugging
    const fields = form.getFields();
    console.log('W-4 Fields:', fields.map(f => f.getName()));
    
    // Fill personal info
    const setTextField = (fieldName, value) => {
      try {
        const field = form.getTextField(fieldName);
        if (field && value) field.setText(String(value));
      } catch (e) {
        console.log(`Field not found or error: ${fieldName}`, e.message);
      }
    };
    
    // Personal Information (Step 1)
    setTextField('a First name and middle initial', `${employeeData.firstName || ''} ${employeeData.middleName || ''}`.trim());
    setTextField('Last name', employeeData.lastName || '');
    setTextField('b Social security number', employeeData.ssn || '');
    setTextField('Address', employeeData.address || '');
    setTextField('City or town state and ZIP code', `${employeeData.city || ''}, ${employeeData.state || ''} ${employeeData.zip || ''}`);
    
    // Filing Status (Step 1c) - checkboxes
    const setCheckbox = (fieldName, checked) => {
      try {
        const field = form.getCheckBox(fieldName);
        if (field && checked) field.check();
      } catch (e) {
        console.log(`Checkbox not found: ${fieldName}`, e.message);
      }
    };
    
    if (employeeData.filingStatus === 'single') {
      setCheckbox('Single or Married filing separately', true);
    } else if (employeeData.filingStatus === 'married') {
      setCheckbox('Married filing jointly or Qualifying surviving spouse', true);
    } else if (employeeData.filingStatus === 'head') {
      setCheckbox('Head of household Check only if youre unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual', true);
    }
    
    // Step 2 - Multiple Jobs
    if (employeeData.multipleJobs) {
      setCheckbox('option is generally more accurate than Step 2b if pay at the lower paying job is more than half of the pay at', true);
    }
    
    // Step 3 - Dependents
    if (employeeData.qualifyingChildren) {
      setTextField('fill_14', String(parseInt(employeeData.qualifyingChildren) * 2000));
    }
    if (employeeData.otherDependents) {
      setTextField('fill_15', String(parseInt(employeeData.otherDependents) * 500));
    }
    
    // Step 4 - Other adjustments
    if (employeeData.otherIncome) {
      setTextField('fill_16', employeeData.otherIncome);
    }
    if (employeeData.deductions) {
      setTextField('fill_17', employeeData.deductions);
    }
    if (employeeData.extraWithholding) {
      setTextField('fill_22', employeeData.extraWithholding);
    }
    
    // Date
    setTextField('Date', new Date().toLocaleDateString());
    
    // Embed signature image
    if (signatureDataUrl) {
      try {
        const sigBytes = signatureToBytes(signatureDataUrl);
        const sigImage = await pdfDoc.embedPng(sigBytes);
        
        // Get the signature field and its position
        const sigField = form.getField('Signature2_es_:signer:signature');
        if (sigField) {
          const widgets = sigField.acroField.getWidgets();
          if (widgets.length > 0) {
            const widget = widgets[0];
            const rect = widget.getRectangle();
            
            // Draw the signature image on the page
            const pages = pdfDoc.getPages();
            const page = pages[0]; // Signature is on first page
            
            page.drawImage(sigImage, {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            });
          }
        }
      } catch (sigError) {
        console.log('Signature embed error:', sigError);
        // Try alternative approach - draw on fixed position
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const sigBytes = signatureToBytes(signatureDataUrl);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          // W-4 signature line is approximately at these coordinates
          firstPage.drawImage(sigImage, {
            x: 50,
            y: 195,
            width: 150,
            height: 40,
          });
        }
      }
    }
    
    // Flatten the form so it can't be edited
    form.flatten();
    
    // Save and return as base64
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    return base64;
    
  } catch (error) {
    console.error('Error filling W-4:', error);
    throw error;
  }
}

/**
 * Fill W-9 Form with contractor data
 */
export async function fillW9(contractorData, signatureDataUrl) {
  try {
    const pdfDoc = await loadPdf(PDF_URLS.W9);
    const form = pdfDoc.getForm();
    
    const setTextField = (fieldName, value) => {
      try {
        const field = form.getTextField(fieldName);
        if (field && value) field.setText(String(value));
      } catch (e) {
        console.log(`Field not found: ${fieldName}`);
      }
    };
    
    const setCheckbox = (fieldName, checked) => {
      try {
        const field = form.getCheckBox(fieldName);
        if (field && checked) field.check();
      } catch (e) {
        console.log(`Checkbox not found: ${fieldName}`);
      }
    };
    
    // Line 1 - Name
    setTextField('1 Name of entityindividual An entry is required For a sole proprietor or disregarded entity enter the owners name on line 1 and enter the businessdisregarded entitys name on line 2', 
      contractorData.companyName || '');
    
    // Line 2 - Business name/DBA
    setTextField('2 Business namedisregarded entity name if different from above', contractorData.dba || '');
    
    // Line 3 - Tax classification checkboxes
    const entityType = (contractorData.entityType || '').toLowerCase();
    if (entityType.includes('individual') || entityType.includes('sole')) {
      setCheckbox('Individualsole proprietor', true);
    } else if (entityType.includes('c corp')) {
      setCheckbox('C corporation', true);
    } else if (entityType.includes('s corp')) {
      setCheckbox('S corporation', true);
    } else if (entityType.includes('partner')) {
      setCheckbox('Partnership', true);
    } else if (entityType.includes('trust') || entityType.includes('estate')) {
      setCheckbox('Trustestate', true);
    } else if (entityType.includes('llc')) {
      setCheckbox('LLC Enter the tax classification C  C corporation S  S corporation P  Partnership', true);
      // Set the LLC tax classification letter
      if (contractorData.taxClassification) {
        setTextField('undefined', contractorData.taxClassification.charAt(0).toUpperCase());
      }
    }
    
    // Line 5 - Address
    setTextField('5 Address number street and apt or suite no See instructions', contractorData.address || '');
    
    // Line 6 - City, State, ZIP
    setTextField('6 City state and ZIP code', 
      `${contractorData.city || ''}, ${contractorData.state || ''} ${contractorData.zip || ''}`);
    
    // Part I - TIN (Social Security Number or EIN)
    // The SSN field has 3 parts, EIN has 2 parts
    if (contractorData.ein) {
      // EIN format: XX-XXXXXXX
      const ein = contractorData.ein.replace(/\D/g, '');
      setTextField('Text11', ein.substring(0, 2));
      setTextField('Text12', ein.substring(2));
    } else if (contractorData.ssn) {
      // SSN format: XXX-XX-XXXX  
      const ssn = contractorData.ssn.replace(/\D/g, '');
      setTextField('Social security number', ssn);
    }
    
    // Signature date
    setTextField('Signature of US person Date', new Date().toLocaleDateString());
    
    // Embed signature
    if (signatureDataUrl) {
      try {
        const sigBytes = signatureToBytes(signatureDataUrl);
        const sigImage = await pdfDoc.embedPng(sigBytes);
        
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        // W-9 signature line position (approximate)
        firstPage.drawImage(sigImage, {
          x: 50,
          y: 140,
          width: 180,
          height: 45,
        });
      } catch (sigError) {
        console.log('W-9 signature error:', sigError);
      }
    }
    
    form.flatten();
    const pdfBytes = await pdfDoc.save();
    return btoa(String.fromCharCode(...pdfBytes));
    
  } catch (error) {
    console.error('Error filling W-9:', error);
    throw error;
  }
}

/**
 * Fill MSA with contractor signature
 * Since MSA has no form fields, we'll add text and signature to the signature page
 */
export async function fillMSA(contractorData, signatureDataUrl) {
  try {
    const pdfDoc = await loadPdf(PDF_URLS.MSA);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const pages = pdfDoc.getPages();
    // MSA signature page is typically the last page
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();
    
    // Add contractor information to signature block
    // These positions need to be adjusted based on your actual MSA layout
    const signatureBlockY = 200; // Adjust based on actual position
    
    // Company Name
    lastPage.drawText(contractorData.companyName || '', {
      x: 72,
      y: signatureBlockY + 80,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    
    // Contact Name (Printed Name)
    lastPage.drawText(contractorData.contactName || '', {
      x: 72,
      y: signatureBlockY + 40,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Title
    lastPage.drawText(contractorData.contactTitle || contractorData.title || '', {
      x: 300,
      y: signatureBlockY + 40,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Date
    lastPage.drawText(new Date().toLocaleDateString(), {
      x: 450,
      y: signatureBlockY + 40,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Embed signature
    if (signatureDataUrl) {
      try {
        const sigBytes = signatureToBytes(signatureDataUrl);
        const sigImage = await pdfDoc.embedPng(sigBytes);
        
        lastPage.drawImage(sigImage, {
          x: 72,
          y: signatureBlockY,
          width: 180,
          height: 45,
        });
      } catch (sigError) {
        console.log('MSA signature error:', sigError);
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    return btoa(String.fromCharCode(...pdfBytes));
    
  } catch (error) {
    console.error('Error filling MSA:', error);
    throw error;
  }
}

/**
 * Create a simple PDF for forms that don't have fillable fields
 * (Direct Deposit, Emergency Contact, Safety Acknowledgment, etc.)
 */
export async function createFormPdf(title, sections, signatureDataUrl, signerName) {
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    let y = height - 50;
    
    // Header
    page.drawRectangle({
      x: 0,
      y: height - 60,
      width: width,
      height: 60,
      color: rgb(0, 0.467, 0.714), // #0077B6
    });
    
    page.drawText('LYT Communications, LLC', {
      x: 50,
      y: height - 40,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    
    y = height - 90;
    
    // Title
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
          const text = `${field.label}: ${field.value || ''}`;
          page.drawText(text, {
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
          // Word wrap long paragraphs
          const words = para.split(' ');
          let line = '';
          for (const word of words) {
            const testLine = line + word + ' ';
            if (testLine.length > 85) {
              page.drawText(line.trim(), {
                x: 50,
                y: y,
                size: 9,
                font: font,
                color: rgb(0, 0, 0),
              });
              y -= 12;
              line = word + ' ';
            } else {
              line = testLine;
            }
          }
          if (line.trim()) {
            page.drawText(line.trim(), {
              x: 50,
              y: y,
              size: 9,
              font: font,
              color: rgb(0, 0, 0),
            });
            y -= 12;
          }
          y -= 5;
        }
      }
      
      if (section.checkboxes) {
        for (const cb of section.checkboxes) {
          const checkmark = cb.checked ? '☑' : '☐';
          page.drawText(`${checkmark} ${cb.label}`, {
            x: 50,
            y: y,
            size: 9,
            font: font,
            color: rgb(0, 0, 0),
          });
          y -= 14;
        }
      }
      
      y -= 10;
    }
    
    // E-Sign consent
    y -= 10;
    page.drawLine({
      start: { x: 50, y: y },
      end: { x: width - 50, y: y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 15;
    
    page.drawText('ELECTRONIC SIGNATURE CONSENT', {
      x: 50,
      y: y,
      size: 8,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 10;
    
    const consentText = 'By signing below, I consent to conduct this transaction electronically pursuant to the ESIGN Act and UETA.';
    page.drawText(consentText, {
      x: 50,
      y: y,
      size: 7,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 25;
    
    // Signature section
    page.drawText('Signature:', {
      x: 50,
      y: y,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Embed signature
    if (signatureDataUrl) {
      try {
        const sigBytes = signatureToBytes(signatureDataUrl);
        const sigImage = await pdfDoc.embedPng(sigBytes);
        page.drawImage(sigImage, {
          x: 120,
          y: y - 10,
          width: 150,
          height: 40,
        });
      } catch (e) {
        console.log('Signature error:', e);
      }
    }
    
    y -= 50;
    
    page.drawText(`Printed Name: ${signerName || ''}`, {
      x: 50,
      y: y,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 300,
      y: y,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    y -= 15;
    page.drawText(`Time: ${new Date().toLocaleTimeString()}`, {
      x: 300,
      y: y,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Footer
    page.drawText(`Document ID: LYT-${Date.now()} | Generated: ${new Date().toISOString()}`, {
      x: 50,
      y: 30,
      size: 7,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    const pdfBytes = await pdfDoc.save();
    return btoa(String.fromCharCode(...pdfBytes));
    
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
