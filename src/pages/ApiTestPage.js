/**
 * LYT Communications - API Integration Test Page
 * Version: 1.0
 * Purpose: Test and verify Google Apps Script integration
 * 
 * Location: src/pages/ApiTestPage.js
 * 
 * NOTE: This page should be removed or protected before production deployment.
 * Access via: /api-test
 */

import React, { useState } from 'react';
import { colors } from '../config/constants';
import apiService from '../services/apiService';

const ApiTestPage = ({ darkMode }) => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const addResult = (test, success, message, details = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: API Health Check
  const testHealthCheck = async () => {
    setIsLoading(true);
    try {
      const isHealthy = await apiService.checkApiStatus();
      addResult(
        'API Health Check',
        isHealthy,
        isHealthy ? 'API is running and accessible' : 'API is not responding'
      );
    } catch (error) {
      addResult('API Health Check', false, 'Error: ' + error.message);
    }
    setIsLoading(false);
  };

  // Test 2: Test Submission (creates test folder)
  const testSubmission = async (sendEmail = false) => {
    setIsLoading(true);
    try {
      const result = await apiService.testApiConnection(sendEmail);
      addResult(
        'Test Submission',
        result.success,
        result.success ? 'Test folder created successfully' : 'Failed to create test folder',
        result.success ? {
          folderId: result.testFolderId,
          folderUrl: result.testFolderUrl
        } : null
      );
    } catch (error) {
      addResult('Test Submission', false, 'Error: ' + error.message);
    }
    setIsLoading(false);
  };

  // Test 3: File Upload
  const testFileUpload = async () => {
    if (!selectedFile) {
      addResult('File Upload', false, 'No file selected');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await apiService.uploadFile(selectedFile);
      addResult(
        'File Upload',
        result.success,
        result.success ? 'File uploaded successfully' : 'Failed to upload file',
        result.success ? {
          fileId: result.fileId,
          fileUrl: result.fileUrl,
          fileName: result.fileName
        } : null
      );
    } catch (error) {
      addResult('File Upload', false, 'Error: ' + error.message);
    }
    setIsLoading(false);
  };

  // Test 4: Mock Employee Onboarding
  const testEmployeeOnboarding = async () => {
    setIsLoading(true);
    try {
      const mockData = {
        personalInfo: {
          firstName: 'Test',
          lastName: 'Employee',
          email: 'test@example.com',
          phone: '555-123-4567',
          address: '123 Test St',
          city: 'Webster',
          state: 'TX',
          zip: '77598',
          ssn: '123-45-6789',
          dateOfBirth: '1990-01-01'
        },
        directDeposit: {
          bankName: 'Test Bank',
          routingNumber: '123456789',
          accountNumber: '987654321',
          accountType: 'checking'
        },
        emergencyContact: {
          name: 'Test Contact',
          relationship: 'Spouse',
          phone: '555-987-6543'
        },
        safetyAcknowledgment: {
          acknowledged: true,
          hseManualRead: true
        }
      };
      
      const result = await apiService.submitEmployeeOnboarding(mockData, {});
      addResult(
        'Employee Onboarding',
        result.success,
        result.success ? 'Employee onboarding submitted successfully' : 'Failed to submit',
        result.success ? {
          folderId: result.folderId,
          folderUrl: result.folderUrl,
          filesCreated: result.filesCreated
        } : null
      );
    } catch (error) {
      addResult('Employee Onboarding', false, 'Error: ' + error.message);
    }
    setIsLoading(false);
  };

  // Test 5: Mock Contractor Onboarding
  const testContractorOnboarding = async () => {
    setIsLoading(true);
    try {
      const mockData = {
        companyInfo: {
          companyName: 'Test Contractor LLC',
          contactName: 'Test Contact',
          email: 'test@testcontractor.com',
          phone: '555-111-2222',
          address: '456 Business Blvd',
          city: 'Houston',
          state: 'TX',
          zip: '77001',
          ein: '12-3456789',
          entityType: 'LLC'
        },
        msaAgreement: {
          agreed: true
        },
        insurance: {
          generalLiability: '1000000',
          autoLiability: '1000000',
          workersComp: '500000'
        },
        skillsInventory: {
          aerialConstruction: true,
          fiberSplicing: true,
          hddDrilling: false
        },
        rateCardAcceptance: {
          ratesAccepted: true,
          retainageAccepted: true,
          paymentTermsAccepted: true
        }
      };
      
      const result = await apiService.submitContractorOnboarding(mockData, {});
      addResult(
        'Contractor Onboarding',
        result.success,
        result.success ? 'Contractor onboarding submitted successfully' : 'Failed to submit',
        result.success ? {
          folderId: result.folderId,
          folderUrl: result.folderUrl,
          filesCreated: result.filesCreated
        } : null
      );
    } catch (error) {
      addResult('Contractor Onboarding', false, 'Error: ' + error.message);
    }
    setIsLoading(false);
  };

  // Run all tests
  const runAllTests = async () => {
    clearResults();
    await testHealthCheck();
    await testSubmission(false);
    // Note: Skipping file upload and full onboarding tests in "run all" to avoid clutter
  };

  const styles = {
    container: {
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: darkMode ? colors.dark : colors.white,
      color: darkMode ? colors.white : colors.dark,
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    title: {
      fontSize: '2rem',
      color: colors.blue,
      marginBottom: '0.5rem',
    },
    subtitle: {
      color: darkMode ? colors.grayLight : colors.gray,
    },
    warning: {
      backgroundColor: '#fff3cd',
      border: '1px solid #ffc107',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '2rem',
      color: '#856404',
      textAlign: 'center',
    },
    section: {
      backgroundColor: darkMode ? colors.darkLight : '#f8f9fa',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: darkMode ? colors.white : colors.dark,
    },
    buttonGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    },
    primaryButton: {
      backgroundColor: colors.blue,
      color: colors.white,
    },
    secondaryButton: {
      backgroundColor: colors.teal,
      color: colors.white,
    },
    warningButton: {
      backgroundColor: '#ffc107',
      color: '#212529',
    },
    dangerButton: {
      backgroundColor: '#dc3545',
      color: colors.white,
    },
    successButton: {
      backgroundColor: colors.green,
      color: colors.white,
    },
    disabledButton: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    fileInput: {
      padding: '0.5rem',
      borderRadius: '8px',
      border: `1px solid ${darkMode ? colors.grayDark : colors.grayLight}`,
      backgroundColor: darkMode ? colors.dark : colors.white,
      color: darkMode ? colors.white : colors.dark,
      width: '100%',
      marginBottom: '1rem',
    },
    results: {
      marginTop: '2rem',
    },
    resultItem: {
      backgroundColor: darkMode ? colors.dark : colors.white,
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '0.75rem',
      borderLeft: '4px solid',
    },
    resultSuccess: {
      borderLeftColor: colors.green,
    },
    resultFailure: {
      borderLeftColor: '#dc3545',
    },
    resultHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
    },
    resultTest: {
      fontWeight: '600',
      color: darkMode ? colors.white : colors.dark,
    },
    resultTime: {
      fontSize: '0.875rem',
      color: darkMode ? colors.grayLight : colors.gray,
    },
    resultMessage: {
      color: darkMode ? colors.grayLight : colors.grayDark,
    },
    resultDetails: {
      marginTop: '0.5rem',
      padding: '0.5rem',
      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      borderRadius: '4px',
      fontSize: '0.875rem',
      fontFamily: 'monospace',
      wordBreak: 'break-all',
    },
    statusBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '600',
    },
    successBadge: {
      backgroundColor: colors.green,
      color: colors.white,
    },
    failureBadge: {
      backgroundColor: '#dc3545',
      color: colors.white,
    },
    spinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid transparent',
      borderTopColor: 'currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    clearButton: {
      backgroundColor: 'transparent',
      border: `1px solid ${darkMode ? colors.grayDark : colors.grayLight}`,
      color: darkMode ? colors.grayLight : colors.gray,
    },
    link: {
      color: colors.blue,
      textDecoration: 'underline',
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>
      
      <div style={styles.header}>
        <h1 style={styles.title}>🔧 API Integration Test Page</h1>
        <p style={styles.subtitle}>Test Google Apps Script integration for LYT Onboarding</p>
      </div>

      <div style={styles.warning}>
        ⚠️ <strong>Development Only:</strong> This page should be removed or protected before production deployment.
      </div>

      {/* Basic Tests */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Basic Tests</h2>
        <div style={styles.buttonGrid}>
          <button
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...(isLoading ? styles.disabledButton : {})
            }}
            onClick={testHealthCheck}
            disabled={isLoading}
          >
            {isLoading ? <span style={styles.spinner}></span> : '❤️'} Health Check
          </button>
          
          <button
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              ...(isLoading ? styles.disabledButton : {})
            }}
            onClick={() => testSubmission(false)}
            disabled={isLoading}
          >
            {isLoading ? <span style={styles.spinner}></span> : '📁'} Test Folder Creation
          </button>
          
          <button
            style={{
              ...styles.button,
              ...styles.warningButton,
              ...(isLoading ? styles.disabledButton : {})
            }}
            onClick={() => testSubmission(true)}
            disabled={isLoading}
          >
            {isLoading ? <span style={styles.spinner}></span> : '📧'} Test + Email
          </button>
          
          <button
            style={{
              ...styles.button,
              ...styles.successButton,
              ...(isLoading ? styles.disabledButton : {})
            }}
            onClick={runAllTests}
            disabled={isLoading}
          >
            {isLoading ? <span style={styles.spinner}></span> : '🚀'} Run All Basic Tests
          </button>
        </div>
      </div>

      {/* File Upload Test */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>File Upload Test</h2>
        <input
          type="file"
          style={styles.fileInput}
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button
          style={{
            ...styles.button,
            ...styles.primaryButton,
            ...(isLoading || !selectedFile ? styles.disabledButton : {})
          }}
          onClick={testFileUpload}
          disabled={isLoading || !selectedFile}
        >
          {isLoading ? <span style={styles.spinner}></span> : '📤'} Upload File
        </button>
        {selectedFile && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Onboarding Tests */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Onboarding Submission Tests</h2>
        <p style={{ marginBottom: '1rem', color: darkMode ? colors.grayLight : colors.gray }}>
          These tests will create actual folders and files in Google Drive with mock data.
        </p>
        <div style={styles.buttonGrid}>
          <button
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...(isLoading ? styles.disabledButton : {})
            }}
            onClick={testEmployeeOnboarding}
            disabled={isLoading}
          >
            {isLoading ? <span style={styles.spinner}></span> : '👤'} Test Employee Onboarding
          </button>
          
          <button
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              ...(isLoading ? styles.disabledButton : {})
            }}
            onClick={testContractorOnboarding}
            disabled={isLoading}
          >
            {isLoading ? <span style={styles.spinner}></span> : '🏢'} Test Contractor Onboarding
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={styles.results}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={styles.sectionTitle}>Test Results ({testResults.length})</h2>
          {testResults.length > 0 && (
            <button
              style={{ ...styles.button, ...styles.clearButton }}
              onClick={clearResults}
            >
              Clear Results
            </button>
          )}
        </div>
        
        {testResults.length === 0 ? (
          <p style={{ color: darkMode ? colors.grayLight : colors.gray, textAlign: 'center', padding: '2rem' }}>
            No test results yet. Run a test to see results here.
          </p>
        ) : (
          testResults.map((result, index) => (
            <div
              key={index}
              style={{
                ...styles.resultItem,
                ...(result.success ? styles.resultSuccess : styles.resultFailure)
              }}
            >
              <div style={styles.resultHeader}>
                <span style={styles.resultTest}>{result.test}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(result.success ? styles.successBadge : styles.failureBadge)
                    }}
                  >
                    {result.success ? '✓ PASS' : '✗ FAIL'}
                  </span>
                  <span style={styles.resultTime}>{result.timestamp}</span>
                </div>
              </div>
              <p style={styles.resultMessage}>{result.message}</p>
              {result.details && (
                <div style={styles.resultDetails}>
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong>{' '}
                      {key.includes('Url') ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" style={styles.link}>
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApiTestPage;
