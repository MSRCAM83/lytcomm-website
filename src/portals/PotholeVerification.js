// PotholeVerification.js v1.0 - Pothole documentation and approval workflow
import React, { useState, useEffect } from 'react';
import { 
  Camera, CheckCircle, XCircle, Clock, MapPin, Upload, 
  Eye, AlertTriangle, Image, Trash2, Send, ChevronDown
} from 'lucide-react';

function PotholeVerification({ darkMode, user, userType }) {
  const [activeTab, setActiveTab] = useState(userType === 'supervisor' ? 'pending' : 'my-potholes');
  const [selectedPothole, setSelectedPothole] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Theme
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  // Mock data
  const [potholes, setPotholes] = useState([
    {
      id: 1,
      section: 'SLPH.01.006',
      location: '30.2270, -93.3780',
      address: 'Navarre St / Sunier St',
      depth: '48"',
      width: '24"',
      locateTicket: '12345',
      utilitiesExposed: ['Gas', 'Telecom'],
      photos: [
        { id: 1, url: '/placeholder-pothole-1.jpg', angle: 'Overview' },
        { id: 2, url: '/placeholder-pothole-2.jpg', angle: 'Utilities Close-up' },
        { id: 3, url: '/placeholder-pothole-3.jpg', angle: 'Depth Measurement' }
      ],
      status: 'pending',
      submittedBy: 'Mike Torres',
      submittedAt: '2026-01-23 08:30 AM',
      contractor: 'Gulf Coast Boring LLC',
      notes: 'Clear separation from gas line. Safe to drill.',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null
    },
    {
      id: 2,
      section: 'SLPH.01.006',
      location: '30.2260, -93.3770',
      address: 'Navarre St / Oak Ave',
      depth: '36"',
      width: '24"',
      locateTicket: '12345',
      utilitiesExposed: ['Electric', 'Water'],
      photos: [
        { id: 3, url: '/placeholder-pothole-3.jpg', angle: 'Overview' },
        { id: 4, url: '/placeholder-pothole-4.jpg', angle: 'Utilities' }
      ],
      status: 'approved',
      submittedBy: 'Mike Torres',
      submittedAt: '2026-01-22 02:15 PM',
      contractor: 'Gulf Coast Boring LLC',
      notes: 'All clear.',
      reviewedBy: 'Donnie Wells',
      reviewedAt: '2026-01-22 03:45 PM',
      rejectionReason: null
    },
    {
      id: 3,
      section: 'SLPH.01.007',
      location: '30.2240, -93.3780',
      address: 'Paicar St / Custer Ave',
      depth: '42"',
      width: '30"',
      locateTicket: '12346',
      utilitiesExposed: ['Gas'],
      photos: [
        { id: 5, url: '/placeholder-pothole-5.jpg', angle: 'Overview' }
      ],
      status: 'rejected',
      submittedBy: 'James Wilson',
      submittedAt: '2026-01-22 10:00 AM',
      contractor: 'XYZ Drilling',
      notes: '',
      reviewedBy: 'Donnie Wells',
      reviewedAt: '2026-01-22 11:30 AM',
      rejectionReason: 'Need more photos showing utility clearance. Depth measurement photo required.'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending Review';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  // Handle approval
  const handleApprove = (potholeId) => {
    setPotholes(prev => prev.map(p => 
      p.id === potholeId 
        ? { ...p, status: 'approved', reviewedBy: user?.name || 'Supervisor', reviewedAt: new Date().toLocaleString() }
        : p
    ));
    setSelectedPothole(null);
  };

  // Handle rejection
  const handleReject = (potholeId, reason) => {
    setPotholes(prev => prev.map(p => 
      p.id === potholeId 
        ? { ...p, status: 'rejected', reviewedBy: user?.name || 'Supervisor', reviewedAt: new Date().toLocaleString(), rejectionReason: reason }
        : p
    ));
    setSelectedPothole(null);
  };

  // Supervisor view - pending approvals
  const renderPendingApprovals = () => {
    const pending = potholes.filter(p => p.status === 'pending');
    
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ 
          backgroundColor: pending.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          border: `1px solid ${pending.length > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {pending.length > 0 ? (
            <>
              <Clock size={24} color="#f59e0b" />
              <div>
                <div style={{ color: '#f59e0b', fontWeight: '600' }}>{pending.length} Pothole(s) Pending Approval</div>
                <div style={{ color: textColor, fontSize: '0.9rem' }}>Crews cannot drill until approved</div>
              </div>
            </>
          ) : (
            <>
              <CheckCircle size={24} color="#10b981" />
              <div>
                <div style={{ color: '#10b981', fontWeight: '600' }}>All Caught Up!</div>
                <div style={{ color: textColor, fontSize: '0.9rem' }}>No pending approvals</div>
              </div>
            </>
          )}
        </div>

        {pending.length > 0 && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {pending.map(pothole => (
              <div 
                key={pothole.id}
                style={{ 
                  backgroundColor: cardBg, 
                  borderRadius: '12px', 
                  border: `1px solid ${borderColor}`,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', color: textColor, fontSize: '1.1rem' }}>{pothole.section}</span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          color: '#f59e0b'
                        }}>
                          Pending
                        </span>
                      </div>
                      <div style={{ color: mutedColor, fontSize: '0.9rem' }}>
                        {pothole.address} • Submitted by {pothole.submittedBy}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', color: mutedColor, fontSize: '0.85rem' }}>
                      {pothole.submittedAt}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ color: mutedColor, fontSize: '0.8rem', marginBottom: '2px' }}>Depth</div>
                      <div style={{ color: textColor, fontWeight: '500' }}>{pothole.depth}</div>
                    </div>
                    <div>
                      <div style={{ color: mutedColor, fontSize: '0.8rem', marginBottom: '2px' }}>Width</div>
                      <div style={{ color: textColor, fontWeight: '500' }}>{pothole.width}</div>
                    </div>
                    <div>
                      <div style={{ color: mutedColor, fontSize: '0.8rem', marginBottom: '2px' }}>Locate #</div>
                      <div style={{ color: textColor, fontWeight: '500' }}>{pothole.locateTicket}</div>
                    </div>
                    <div>
                      <div style={{ color: mutedColor, fontSize: '0.8rem', marginBottom: '2px' }}>Utilities</div>
                      <div style={{ color: textColor, fontWeight: '500' }}>{pothole.utilitiesExposed.join(', ')}</div>
                    </div>
                  </div>

                  {/* Photos */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: mutedColor, fontSize: '0.8rem', marginBottom: '8px' }}>
                      Photos ({pothole.photos.length})
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {pothole.photos.map(photo => (
                        <div 
                          key={photo.id}
                          onClick={() => setSelectedPothole({ ...pothole, viewPhoto: photo })}
                          style={{ 
                            width: '80px', 
                            height: '80px', 
                            backgroundColor: darkMode ? '#374151' : '#e5e7eb',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: `1px solid ${borderColor}`
                          }}
                        >
                          <Image size={24} color={mutedColor} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {pothole.notes && (
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: darkMode ? '#112240' : '#f8fafc', 
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ color: mutedColor, fontSize: '0.8rem', marginBottom: '4px' }}>Crew Notes</div>
                      <div style={{ color: textColor }}>{pothole.notes}</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleApprove(pothole.id)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button
                      onClick={() => setSelectedPothole({ ...pothole, showReject: true })}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Crew view - their submitted potholes
  const renderMyPotholes = () => {
    const myPotholes = potholes.filter(p => p.contractor === 'Gulf Coast Boring LLC'); // Filter by user's company
    
    return (
      <div style={{ padding: '24px' }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: accentPrimary,
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}
        >
          <Camera size={20} /> Log New Pothole
        </button>

        <div style={{ display: 'grid', gap: '16px' }}>
          {myPotholes.map(pothole => (
            <div 
              key={pothole.id}
              style={{ 
                backgroundColor: cardBg, 
                borderRadius: '12px', 
                padding: '20px',
                border: `1px solid ${borderColor}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: textColor }}>{pothole.section}</span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: `${getStatusColor(pothole.status)}15`,
                      color: getStatusColor(pothole.status)
                    }}>
                      {getStatusLabel(pothole.status)}
                    </span>
                  </div>
                  <div style={{ color: mutedColor, fontSize: '0.9rem' }}>{pothole.address}</div>
                </div>
                <div style={{ color: mutedColor, fontSize: '0.85rem' }}>{pothole.submittedAt}</div>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: mutedColor, marginBottom: '12px' }}>
                <span>📏 {pothole.depth} deep</span>
                <span>📐 {pothole.width} wide</span>
                <span>🔌 {pothole.utilitiesExposed.join(', ')}</span>
              </div>

              {pothole.status === 'rejected' && pothole.rejectionReason && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  borderRadius: '8px',
                  marginTop: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <div style={{ color: '#ef4444', fontWeight: '500', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} /> Rejection Reason
                  </div>
                  <div style={{ color: textColor, fontSize: '0.9rem' }}>{pothole.rejectionReason}</div>
                </div>
              )}

              {pothole.status === 'approved' && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: '8px',
                  marginTop: '12px'
                }}>
                  <div style={{ color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Approved by {pothole.reviewedBy} on {pothole.reviewedAt}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // All potholes history
  const renderAllPotholes = () => (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '12px', 
        border: `1px solid ${borderColor}`,
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: darkMode ? '#112240' : '#f8fafc' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Section</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Location</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Contractor</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Utilities</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {potholes.map(pothole => (
              <tr 
                key={pothole.id} 
                style={{ borderBottom: `1px solid ${borderColor}`, cursor: 'pointer' }}
                onClick={() => setSelectedPothole(pothole)}
              >
                <td style={{ padding: '12px 16px', color: accentPrimary, fontWeight: '500' }}>{pothole.section}</td>
                <td style={{ padding: '12px 16px', color: textColor }}>{pothole.address}</td>
                <td style={{ padding: '12px 16px', color: textColor }}>{pothole.contractor}</td>
                <td style={{ padding: '12px 16px', color: textColor }}>{pothole.utilitiesExposed.join(', ')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: `${getStatusColor(pothole.status)}15`,
                    color: getStatusColor(pothole.status)
                  }}>
                    {getStatusLabel(pothole.status)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: mutedColor, fontSize: '0.9rem' }}>{pothole.submittedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const isSupervisor = userType === 'supervisor' || userType === 'admin';

  const tabs = isSupervisor 
    ? [
        { id: 'pending', label: 'Pending Approval', icon: <Clock size={18} />, count: potholes.filter(p => p.status === 'pending').length },
        { id: 'all', label: 'All Potholes', icon: <Eye size={18} /> }
      ]
    : [
        { id: 'my-potholes', label: 'My Potholes', icon: <MapPin size={18} /> }
      ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: cardBg, 
        padding: '16px 24px',
        borderBottom: `1px solid ${borderColor}`
      }}>
        <h2 style={{ color: textColor, margin: 0 }}>Pothole Verification</h2>
        <p style={{ color: mutedColor, fontSize: '0.9rem', margin: '4px 0 0' }}>
          {isSupervisor ? 'Review and approve pothole documentation' : 'Log and track your pothole verifications'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        gap: '4px',
        padding: '0 24px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${accentPrimary}` : '3px solid transparent',
              color: activeTab === tab.id ? accentPrimary : mutedColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: activeTab === tab.id ? '600' : '400'
            }}
          >
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span style={{
                backgroundColor: '#f59e0b',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'pending' && renderPendingApprovals()}
      {activeTab === 'all' && renderAllPotholes()}
      {activeTab === 'my-potholes' && renderMyPotholes()}

      {/* Rejection Modal */}
      {selectedPothole?.showReject && (
        <RejectModal
          darkMode={darkMode}
          pothole={selectedPothole}
          onReject={(reason) => handleReject(selectedPothole.id, reason)}
          onClose={() => setSelectedPothole(null)}
        />
      )}

      {/* Add Pothole Modal */}
      {showAddModal && (
        <AddPotholeModal
          darkMode={darkMode}
          onClose={() => setShowAddModal(false)}
          onSave={(newPothole) => {
            setPotholes([...potholes, { ...newPothole, id: Date.now() }]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// Rejection Modal
function RejectModal({ darkMode, pothole, onReject, onClose }) {
  const [reason, setReason] = useState('');
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: cardBg,
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        padding: '24px'
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#ef4444', marginBottom: '16px' }}>Reject Pothole</h3>
        <p style={{ color: textColor, marginBottom: '16px' }}>
          Rejecting pothole verification for {pothole.section} at {pothole.address}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for rejection (required for crew to fix)..."
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            backgroundColor: '#ffffff',
            color: '#1f2937',
            minHeight: '100px',
            resize: 'vertical',
            marginBottom: '16px'
          }}
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => reason && onReject(reason)}
            disabled={!reason}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: reason ? '#ef4444' : '#9ca3af',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: reason ? 'pointer' : 'not-allowed',
              fontWeight: '600'
            }}
          >
            Reject
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Pothole Modal
function AddPotholeModal({ darkMode, onClose, onSave }) {
  const [formData, setFormData] = useState({
    section: '',
    depth: '',
    width: '',
    locateTicket: '',
    utilities: [],
    notes: '',
    photos: []
  });

  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  const utilityOptions = ['Gas', 'Electric', 'Water', 'Sewer', 'Telecom', 'Cable', 'Unknown'];

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '0.95rem'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      utilitiesExposed: formData.utilities,
      status: 'pending',
      submittedBy: 'Current User',
      submittedAt: new Date().toLocaleString(),
      contractor: 'Gulf Coast Boring LLC',
      address: 'Auto-detected from GPS',
      location: 'GPS coordinates',
      photos: [{ id: 1, url: '/placeholder.jpg', angle: 'Overview' }]
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: cardBg,
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${borderColor}` }}>
          <h2 style={{ color: textColor, margin: 0 }}>Log Pothole</h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Section *
            </label>
            <select
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              style={inputStyle}
              required
            >
              <option value="">Select section...</option>
              <option value="SLPH.01.006">SLPH.01.006</option>
              <option value="SLPH.01.007">SLPH.01.007</option>
              <option value="SLPH.01.008">SLPH.01.008</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                Depth *
              </label>
              <input
                type="text"
                value={formData.depth}
                onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                placeholder='e.g., 48"'
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                Width *
              </label>
              <input
                type="text"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                placeholder='e.g., 24"'
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              811 Locate Ticket # *
            </label>
            <input
              type="text"
              value={formData.locateTicket}
              onChange={(e) => setFormData({ ...formData, locateTicket: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Utilities Exposed *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {utilityOptions.map(util => (
                <button
                  key={util}
                  type="button"
                  onClick={() => {
                    const newUtils = formData.utilities.includes(util)
                      ? formData.utilities.filter(u => u !== util)
                      : [...formData.utilities, util];
                    setFormData({ ...formData, utilities: newUtils });
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${formData.utilities.includes(util) ? accentPrimary : borderColor}`,
                    backgroundColor: formData.utilities.includes(util) ? `${accentPrimary}20` : 'transparent',
                    color: formData.utilities.includes(util) ? accentPrimary : textColor,
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {util}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Photos * (minimum 3 required)
            </label>
            <div style={{ 
              border: `2px dashed ${borderColor}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer'
            }}>
              <Camera size={32} color={mutedColor} style={{ marginBottom: '8px' }} />
              <div style={{ color: textColor, fontWeight: '500' }}>Tap to take photos</div>
              <div style={{ color: mutedColor, fontSize: '0.85rem' }}>Overview, utilities close-up, depth measurement</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any relevant notes about utility clearance, soil conditions, etc."
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: accentPrimary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Submit for Approval
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '14px 24px',
                backgroundColor: 'transparent',
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PotholeVerification;
