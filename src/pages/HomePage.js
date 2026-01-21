import React, { useState } from 'react';
import { ChevronRight, Shield, Award, Users, Zap, LogIn, UserPlus, CheckCircle, MapPin, Construction, Unplug, Radio, X, Play, Loader } from 'lucide-react';
import { URLS } from '../config/constants';
import { fillW4, fillW9, fillMSA, createFormPdf } from '../services/pdfService';

const HomePage = ({ setCurrentPage, darkMode }) => {
  const bgColor = darkMode ? '#0d1b2a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#0d1b2a';
  const cardBg = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBgAlt = darkMode ? '#112240' : '#ffffff';
  
  // Test panel state
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState(null);
  const [testStatus, setTestStatus] = useState('');
  const [testing, setTesting] = useState(false);
  const [testLog, setTestLog] = useState([]);

  // Triple-click logo to show test panel
  const handleLogoClick = () => {
    if (tapTimer) clearTimeout(tapTimer);
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 3) {
      setShowTestPanel(true);
      setTapCount(0);
    } else {
      const timer = setTimeout(() => setTapCount(0), 500);
      setTapTimer(timer);
    }
  };

  // Generate fake signature as base64 PNG
  const generateSignature = (name) => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 300, 80);
    ctx.font = 'italic 28px "Brush Script MT", cursive, Georgia';
    ctx.fillStyle = '#000066';
    ctx.fillText(name, 20, 50);
    return canvas.toDataURL('image/png');
  };

  // Random data generators
  const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomSSN = () => `${randomNum(100,999)}-${randomNum(10,99)}-${randomNum(1000,9999)}`;
  const randomEIN = () => `${randomNum(10,99)}-${randomNum(1000000,9999999)}`;
  const randomPhone = () => `(${randomNum(200,999)}) ${randomNum(200,999)}-${randomNum(1000,9999)}`;
  const randomRouting = () => String(randomNum(100000000, 999999999));
  const randomAccount = () => String(randomNum(10000000, 9999999999));
  const randomZip = () => String(randomNum(10000, 99999));

  const firstNames = ['James', 'Michael', 'Robert', 'David', 'William', 'Sarah', 'Jennifer', 'Emily', 'Jessica', 'Amanda'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Wilson'];
  const streets = ['123 Main St', '456 Oak Ave', '789 Pine Rd', '321 Elm Blvd', '654 Cedar Ln', '987 Maple Dr'];
  const cities = ['Houston', 'Dallas', 'Austin', 'San Antonio', 'New Orleans', 'Baton Rouge'];
  const states = ['TX', 'TX', 'TX', 'TX', 'LA', 'LA'];
  const banks = ['Chase Bank', 'Wells Fargo', 'Bank of America', 'Capital One', 'USAA', 'Regions Bank'];
  const companies = ['Apex Fiber Solutions', 'Gulf Coast Telecom', 'Bayou Networks', 'Lone Star Communications', 'Delta Cabling'];
  const titles = ['Owner', 'President', 'CEO', 'Operations Manager', 'Project Manager'];

  const log = (msg) => {
    console.log(msg);
    setTestLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // Run Employee Test
  const runEmployeeTest = async () => {
    setTesting(true);
    setTestLog([]);
    setTestStatus('Running Employee Test...');
    
    try {
      const firstName = randomFrom(firstNames);
      const lastName = randomFrom(lastNames) + ' DELETE';
      const fullName = `${firstName} ${lastName}`;
      const cityIdx = randomNum(0, cities.length - 1);
      
      log(`Creating test employee: ${fullName}`);
      
      // Capture IP
      let ipAddress = 'Test-IP';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
        log(`IP captured: ${ipAddress}`);
      } catch (e) {
        log('IP capture failed, using placeholder');
      }
      
      const signatureTimestamp = new Date().toISOString();
      const signature = generateSignature(fullName);
      log('Signature generated');
      
      const formData = {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' delete','')}@test.com`,
        phone: randomPhone(),
        address: randomFrom(streets),
        city: cities[cityIdx],
        state: states[cityIdx],
        zip: randomZip(),
        dateOfBirth: `${randomNum(1970,1995)}-${String(randomNum(1,12)).padStart(2,'0')}-${String(randomNum(1,28)).padStart(2,'0')}`,
        ssn: randomSSN(),
        filingStatus: randomFrom(['single', 'married', 'head']),
        bankName: randomFrom(banks),
        routingNumber: randomRouting(),
        accountNumber: randomAccount(),
        accountType: randomFrom(['checking', 'savings']),
        emergencyName: `${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
        emergencyRelation: randomFrom(['Spouse', 'Parent', 'Sibling', 'Friend']),
        emergencyPhone: randomPhone(),
        emergencyEmail: 'emergency@test.com',
      };
      
      log('Form data prepared');
      
      // Generate PDFs
      log('Generating W-4 PDF...');
      let w4Pdf = null;
      try {
        w4Pdf = await fillW4({
          firstName: formData.firstName,
          middleName: '',
          lastName: formData.lastName,
          ssn: formData.ssn,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          filingStatus: formData.filingStatus,
        }, signature);
        log(w4Pdf ? '✅ W-4 PDF filled successfully!' : '❌ W-4 returned null');
      } catch (e) {
        log(`❌ W-4 ERROR: ${e.message}`);
      }
      
      log('Generating Direct Deposit PDF...');
      let directDepositPdf = null;
      try {
        directDepositPdf = await createFormPdf(
          'Direct Deposit Authorization',
          [
            { title: 'EMPLOYEE', fields: [
              { label: 'Name', value: fullName },
              { label: 'Email', value: formData.email },
            ]},
            { title: 'BANK INFORMATION', fields: [
              { label: 'Bank Name', value: formData.bankName },
              { label: 'Routing Number', value: formData.routingNumber },
              { label: 'Account Number', value: formData.accountNumber },
              { label: 'Account Type', value: formData.accountType },
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          signature,
          fullName
        );
        log(directDepositPdf ? '✅ Direct Deposit PDF created' : '❌ Direct Deposit returned null');
      } catch (e) {
        log(`❌ Direct Deposit ERROR: ${e.message}`);
      }
      
      log('Generating Background Check PDF...');
      let backgroundCheckPdf = null;
      try {
        backgroundCheckPdf = await createFormPdf(
          'Background Check Authorization',
          [
            { title: 'APPLICANT', fields: [
              { label: 'Name', value: fullName },
              { label: 'DOB', value: formData.dateOfBirth },
              { label: 'SSN', value: formData.ssn },
            ]},
            { title: 'AUTHORIZATION', checkboxes: [
              { label: 'I authorize this background check', checked: true }
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          signature,
          fullName
        );
        log(backgroundCheckPdf ? '✅ Background Check PDF created' : '❌ Background Check returned null');
      } catch (e) {
        log(`❌ Background Check ERROR: ${e.message}`);
      }
      
      log('Generating Safety PDF...');
      let safetyPdf = null;
      try {
        safetyPdf = await createFormPdf(
          'HSE Safety Acknowledgment',
          [
            { title: 'EMPLOYEE', fields: [{ label: 'Name', value: fullName }]},
            { title: 'ACKNOWLEDGMENT', checkboxes: [
              { label: 'Follow all safety procedures', checked: true },
              { label: 'Use required PPE', checked: true },
              { label: 'I acknowledge the HSE Manual', checked: true }
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          signature,
          fullName
        );
        log(safetyPdf ? '✅ Safety PDF created' : '❌ Safety returned null');
      } catch (e) {
        log(`❌ Safety ERROR: ${e.message}`);
      }
      
      // Build payload
      const payload = {
        type: 'employee_onboarding',
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
          ipAddress,
          timestamp: signatureTimestamp,
          userAgent: navigator.userAgent,
        },
        filledPdfs: {
          w4: w4Pdf,
          directDeposit: directDepositPdf,
          backgroundCheck: backgroundCheckPdf,
          safety: safetyPdf,
        },
        submittedAt: new Date().toISOString(),
      };
      
      log('Submitting to backend...');
      log(`PDFs included: W4=${!!w4Pdf}, DD=${!!directDepositPdf}, BG=${!!backgroundCheckPdf}, Safety=${!!safetyPdf}`);
      
      const response = await fetch(URLS.appsScript, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      log(`Response: ${JSON.stringify(result)}`);
      
      if (result.success) {
        setTestStatus(`✅ Employee test complete: ${fullName}`);
        log(`✅ SUCCESS! Folder: ${result.folderUrl}`);
      } else {
        setTestStatus(`❌ Failed: ${result.error}`);
        log(`❌ FAILED: ${result.error}`);
      }
      
    } catch (err) {
      log(`❌ EXCEPTION: ${err.message}`);
      setTestStatus(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  // Run Contractor Test
  const runContractorTest = async () => {
    setTesting(true);
    setTestLog([]);
    setTestStatus('Running Contractor Test...');
    
    try {
      const companyName = randomFrom(companies) + ' DELETE';
      const contactFirst = randomFrom(firstNames);
      const contactLast = randomFrom(lastNames);
      const contactName = `${contactFirst} ${contactLast}`;
      const cityIdx = randomNum(0, cities.length - 1);
      
      log(`Creating test contractor: ${companyName}`);
      
      // Capture IP
      let ipAddress = 'Test-IP';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
        log(`IP captured: ${ipAddress}`);
      } catch (e) {
        log('IP capture failed, using placeholder');
      }
      
      const signatureTimestamp = new Date().toISOString();
      const signature = generateSignature(contactName);
      log('Signature generated');
      
      const formData = {
        companyName,
        dba: '',
        contactName,
        contactTitle: randomFrom(titles),
        email: `${contactFirst.toLowerCase()}@${companyName.toLowerCase().replace(/ delete/g,'').replace(/ /g,'')}.com`,
        phone: randomPhone(),
        address: randomFrom(streets),
        city: cities[cityIdx],
        state: states[cityIdx],
        zip: randomZip(),
        entityType: randomFrom(['llc', 'corporation', 'sole_proprietor']),
        taxIdType: 'ein',
        ein: randomEIN(),
        bankName: randomFrom(banks),
        routingNumber: randomRouting(),
        accountNumber: randomAccount(),
        accountType: 'checking',
      };
      
      log('Form data prepared');
      
      // Generate PDFs
      log('Generating W-9 PDF...');
      let w9Pdf = null;
      try {
        w9Pdf = await fillW9({
          companyName: formData.companyName,
          dba: formData.dba,
          entityType: formData.entityType,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          ein: formData.ein,
        }, signature);
        log(w9Pdf ? '✅ W-9 PDF filled successfully!' : '❌ W-9 returned null');
      } catch (e) {
        log(`❌ W-9 ERROR: ${e.message}`);
      }
      
      log('Generating MSA PDF...');
      let msaPdf = null;
      try {
        msaPdf = await fillMSA({
          companyName: formData.companyName,
          contactName: formData.contactName,
          contactTitle: formData.contactTitle,
        }, signature);
        log(msaPdf ? '✅ MSA PDF signed successfully!' : '❌ MSA returned null');
      } catch (e) {
        log(`❌ MSA ERROR: ${e.message}`);
      }
      
      log('Generating Rate Card PDF...');
      let rateCardPdf = null;
      try {
        rateCardPdf = await createFormPdf(
          'Rate Card Acceptance',
          [
            { title: 'CONTRACTOR', fields: [
              { label: 'Company', value: formData.companyName },
              { label: 'Contact', value: formData.contactName },
            ]},
            { title: 'PAYMENT TERMS', checkboxes: [
              { label: 'Net 30 from invoice approval', checked: true },
              { label: '10% retainage until project completion', checked: true },
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          signature,
          formData.contactName
        );
        log(rateCardPdf ? '✅ Rate Card PDF created' : '❌ Rate Card returned null');
      } catch (e) {
        log(`❌ Rate Card ERROR: ${e.message}`);
      }
      
      log('Generating Direct Deposit PDF...');
      let directDepositPdf = null;
      try {
        directDepositPdf = await createFormPdf(
          'Direct Deposit Authorization - Contractor',
          [
            { title: 'COMPANY', fields: [
              { label: 'Company Name', value: formData.companyName },
              { label: 'Contact', value: formData.contactName },
            ]},
            { title: 'BANK INFORMATION', fields: [
              { label: 'Bank Name', value: formData.bankName },
              { label: 'Routing Number', value: formData.routingNumber },
              { label: 'Account Number', value: formData.accountNumber },
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          signature,
          formData.contactName
        );
        log(directDepositPdf ? '✅ Direct Deposit PDF created' : '❌ Direct Deposit returned null');
      } catch (e) {
        log(`❌ Direct Deposit ERROR: ${e.message}`);
      }
      
      log('Generating Safety PDF...');
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
              { label: 'Required PPE at all times', checked: true },
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          signature,
          formData.contactName
        );
        log(safetyPdf ? '✅ Safety PDF created' : '❌ Safety returned null');
      } catch (e) {
        log(`❌ Safety ERROR: ${e.message}`);
      }
      
      // Build payload
      const payload = {
        type: 'contractor_onboarding',
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
          taxIdType: formData.taxIdType,
          ein: formData.ein,
          bankName: formData.bankName,
          routingNumber: formData.routingNumber,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
        },
        signatureVerification: {
          ipAddress,
          timestamp: signatureTimestamp,
          userAgent: navigator.userAgent,
        },
        filledPdfs: {
          w9: w9Pdf,
          msa: msaPdf,
          rateCard: rateCardPdf,
          directDeposit: directDepositPdf,
          safety: safetyPdf,
        },
        submittedAt: new Date().toISOString(),
      };
      
      log('Submitting to backend...');
      log(`PDFs included: W9=${!!w9Pdf}, MSA=${!!msaPdf}, RC=${!!rateCardPdf}, DD=${!!directDepositPdf}, Safety=${!!safetyPdf}`);
      
      const response = await fetch(URLS.appsScript, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      log(`Response: ${JSON.stringify(result)}`);
      
      if (result.success) {
        setTestStatus(`✅ Contractor test complete: ${companyName}`);
        log(`✅ SUCCESS! Folder: ${result.folderUrl}`);
      } else {
        setTestStatus(`❌ Failed: ${result.error}`);
        log(`❌ FAILED: ${result.error}`);
      }
      
    } catch (err) {
      log(`❌ EXCEPTION: ${err.message}`);
      setTestStatus(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };
  
  // Logo - PNG with transparent background
  // Dark mode: pink/purple/orange logo
  // Light mode: blue/teal/green logo (no box needed)
  const logoSrc = darkMode ? '/lyt_logo_dark.png' : '/lyt_logo_light.png';

  // Dynamic accent colors to match logos
  // Light mode: blue/teal/green (matches light logo)
  // Dark mode: pink/purple/orange (matches dark logo)
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';    // Purple/Pink vs Ocean Blue
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';  // Orange vs Teal
  const accentTertiary = darkMode ? '#e85a4f' : '#28a745';   // Coral vs Green
  const gradientColors = darkMode 
    ? 'linear-gradient(135deg, #667eea 0%, #c850c0 50%, #ff6b35 100%)'  // Purple to pink to orange
    : 'linear-gradient(135deg, #0077B6 0%, #00b4d8 50%, #28a745 100%)'; // Blue to teal to green

  // Service icons - matched to services with dynamic colors
  const serviceIcons = [
    { icon: Construction, title: 'HDD Drilling', desc: 'Horizontal Directional Drilling for underground fiber installation with minimal surface disruption.', color: accentPrimary },
    { icon: Unplug, title: 'Fiber Splicing', desc: 'Precision fusion splicing and OTDR testing for optimal network performance.', color: accentSecondary },
    { icon: Radio, title: 'Aerial Construction', desc: 'Pole-to-pole fiber installation, strand mapping, and aerial network builds.', color: accentTertiary },
  ];

  return (
    <div style={{ backgroundColor: bgColor, color: textColor }}>
      
      {/* TEST PANEL - Hidden until triple-click on logo */}
      {showTestPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#1a1a2e',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '2px solid #0077B6',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#0077B6', margin: 0 }}>🧪 LYT Test Panel</h2>
              <button 
                onClick={() => setShowTestPanel(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}
              >
                <X />
              </button>
            </div>
            
            <p style={{ color: '#aaa', marginBottom: '20px' }}>
              Run automated tests with realistic fake data. All test entries will have "DELETE" in the name.
            </p>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <button
                onClick={runEmployeeTest}
                disabled={testing}
                style={{
                  flex: 1,
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: testing ? '#333' : '#0077B6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {testing ? <Loader style={{ animation: 'spin 1s linear infinite' }} size={18} /> : <Play size={18} />}
                Test Employee
              </button>
              
              <button
                onClick={runContractorTest}
                disabled={testing}
                style={{
                  flex: 1,
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: testing ? '#333' : '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {testing ? <Loader style={{ animation: 'spin 1s linear infinite' }} size={18} /> : <Play size={18} />}
                Test Contractor
              </button>
            </div>
            
            {testStatus && (
              <div style={{
                padding: '12px',
                backgroundColor: testStatus.includes('✅') ? 'rgba(40,167,69,0.2)' : testStatus.includes('❌') ? 'rgba(220,53,69,0.2)' : 'rgba(0,119,182,0.2)',
                borderRadius: '8px',
                marginBottom: '15px',
                color: '#fff',
                fontWeight: '500',
              }}>
                {testStatus}
              </div>
            )}
            
            {testLog.length > 0 && (
              <div style={{
                backgroundColor: '#0a0a15',
                borderRadius: '8px',
                padding: '15px',
                maxHeight: '300px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}>
                <div style={{ color: '#666', marginBottom: '10px' }}>Test Log:</div>
                {testLog.map((line, i) => (
                  <div key={i} style={{ 
                    color: line.includes('✅') ? '#28a745' : line.includes('❌') ? '#dc3545' : '#aaa',
                    marginBottom: '4px',
                  }}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section - Logo Centered */}
      <section
        style={{
          position: 'relative',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: bgColor,
        }}
      >
        {/* Animated Background - Fiber Optic Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {/* Gradient Orbs */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '400px',
            height: '400px',
            background: darkMode 
              ? 'radial-gradient(circle, rgba(0,180,216,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0,119,182,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'pulse 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '500px',
            height: '500px',
            background: darkMode
              ? 'radial-gradient(circle, rgba(232,90,79,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(57,181,74,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'pulse 10s ease-in-out infinite reverse',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: darkMode
              ? 'radial-gradient(circle, rgba(0,119,182,0.08) 0%, transparent 60%)'
              : 'radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 60%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }} />
          
          {/* Grid Pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: darkMode
              ? `linear-gradient(rgba(0,180,216,0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0,180,216,0.03) 1px, transparent 1px)`
              : `linear-gradient(rgba(0,119,182,0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0,119,182,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        {/* Hero Content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '40px 20px',
          maxWidth: '900px',
        }}>
          {/* Logo - Click to show test panel */}
          <div 
            onClick={handleLogoClick}
            style={{ 
              marginBottom: '40px',
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            <img 
              src={logoSrc} 
              alt="LYT Communications"
              style={{
                maxWidth: '550px',
                width: '100%',
                height: 'auto',
                filter: darkMode ? 'drop-shadow(0 0 30px rgba(200,80,192,0.3))' : 'drop-shadow(0 0 30px rgba(0,119,182,0.2))',
              }}
            />
          </div>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setCurrentPage('contact')}
              style={{
                padding: '16px 40px',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: gradientColors,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 20px rgba(0,119,182,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,119,182,0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,119,182,0.3)';
              }}
            >
              Get a Quote <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setCurrentPage('services')}
              style={{
                padding: '16px 40px',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: 'transparent',
                color: textColor,
                border: `2px solid ${accentPrimary}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = accentPrimary;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = textColor;
              }}
            >
              Our Services
            </button>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section style={{
        padding: '100px 20px',
        backgroundColor: cardBgAlt,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ 
              fontSize: 'clamp(2rem, 4vw, 2.8rem)', 
              fontWeight: '700',
              marginBottom: '20px',
            }}>
              Expert <span style={{ color: accentPrimary }}>Fiber Optic</span> Solutions
            </h2>
            <p style={{ fontSize: '1.2rem', color: darkMode ? '#94a3b8' : '#64748b', maxWidth: '600px', margin: '0 auto' }}>
              From underground construction to aerial builds, we deliver complete fiber infrastructure.
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
          }}>
            {serviceIcons.map((service, index) => (
              <div
                key={index}
                style={{
                  padding: '40px 30px',
                  backgroundColor: cardBg,
                  borderRadius: '16px',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 20px 40px ${darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => setCurrentPage('services')}
              >
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${service.color}20, ${service.color}40)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '25px',
                }}>
                  <service.icon size={32} style={{ color: service.color }} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '15px' }}>
                  {service.title}
                </h3>
                <p style={{ color: darkMode ? '#94a3b8' : '#64748b', lineHeight: '1.7' }}>
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <button
              onClick={() => setCurrentPage('services')}
              style={{
                padding: '14px 36px',
                fontSize: '1rem',
                fontWeight: '600',
                background: 'transparent',
                color: accentPrimary,
                border: `2px solid ${accentPrimary}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = accentPrimary;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = accentPrimary;
              }}
            >
              View All Services
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '80px 20px',
        background: gradientColors,
      }}>
        <div style={{ 
          maxWidth: '1000px', 
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          textAlign: 'center',
        }}>
          {[
            { value: '500+', label: 'Miles of Fiber Installed' },
            { value: '15+', label: 'Years Experience' },
            { value: '100%', label: 'Safety Record' },
            { value: '24/7', label: 'Emergency Response' },
          ].map((stat, index) => (
            <div key={index}>
              <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '700', color: '#fff' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '100px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '700', marginBottom: '20px' }}>
              Why Choose <span style={{ color: accentPrimary }}>LYT</span>?
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
          }}>
            {[
              { icon: Shield, title: 'Safety First', desc: 'OSHA compliant with zero-incident track record.' },
              { icon: Award, title: 'Certified Team', desc: 'Factory-trained technicians with industry certifications.' },
              { icon: Users, title: 'Local Experts', desc: 'Gulf Coast based, serving TX, LA, MS, FL, and AL.' },
              { icon: Zap, title: 'Fast Turnaround', desc: 'Efficient project delivery without compromising quality.' },
            ].map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px',
                padding: '25px',
                backgroundColor: cardBgAlt,
                borderRadius: '12px',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: `${accentPrimary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <item.icon size={24} style={{ color: accentPrimary }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>{item.title}</h4>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Portal CTA */}
      <section style={{
        padding: '80px 20px',
        backgroundColor: cardBgAlt,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: '700', marginBottom: '20px' }}>
            Team Member?
          </h2>
          <p style={{ fontSize: '1.1rem', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '30px' }}>
            Access your dashboard or start your onboarding process.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentPage('portal-login')}
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: accentPrimary,
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <LogIn size={18} /> Team Login
            </button>
            <button
              onClick={() => setCurrentPage('invite-code')}
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: 'transparent',
                color: accentSecondary,
                border: `2px solid ${accentSecondary}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = accentSecondary;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = accentSecondary;
              }}
            >
              <UserPlus size={18} /> New Onboarding
            </button>
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section style={{ padding: '80px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <MapPin size={40} style={{ color: accentPrimary, marginBottom: '20px' }} />
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: '700', marginBottom: '20px' }}>
            Serving the Gulf Coast
          </h2>
          <p style={{ fontSize: '1.1rem', color: darkMode ? '#94a3b8' : '#64748b', lineHeight: '1.8' }}>
            Texas • Louisiana • Mississippi • Florida • Alabama
          </p>
          <p style={{ fontSize: '1rem', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '15px' }}>
            Houston • Dallas • New Orleans • Baton Rouge • Mobile • Pensacola
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section
        style={{
          padding: '100px 20px',
          background: gradientColors,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>
            Ready to Start Your Project?
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', marginBottom: '40px' }}>
            Contact us today for a free consultation and quote.
          </p>
          <button
            onClick={() => setCurrentPage('contact')}
            style={{
              padding: '18px 48px',
              fontSize: '1.1rem',
              fontWeight: '600',
              background: '#fff',
              color: darkMode ? '#c850c0' : '#0077B6',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 25px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Contact Us Now
          </button>
        </div>
      </section>

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
