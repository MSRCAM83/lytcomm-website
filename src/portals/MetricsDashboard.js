// MetricsDashboard.js v2.0 - Connected to Real Backend
// Production & Safety Metrics from Google Sheets
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Activity, Shield, Users, Truck,
  Calendar, MapPin, Clock, AlertTriangle, CheckCircle, FileText,
  DollarSign, Target, Award, Zap, ChevronDown, Download, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, ArrowLeft, Loader
} from 'lucide-react';
import { colors } from '../config/constants';

// API URLs
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const ONBOARDING_SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';

// Helper to handle GAS redirects
const fetchWithRedirect = async (url, options = {}) => {
  try {
    const response = await fetch(url, { ...options, redirect: 'follow' });
    const text = await response.text();
    if (text.trim().startsWith('<')) {
      const match = text.match(/HREF="([^"]+)"/i);
      if (match) {
        const redirectUrl = match[1].replace(/&amp;/g, '&');
        const redirectResponse = await fetch(redirectUrl);
        return redirectResponse.text();
      }
    }
    return text;
  } catch (err) {
    console.error('Fetch error:', err);
    throw err;
  }
};

const MetricsDashboard = ({ darkMode, setCurrentPage }) => {
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    employees: 0,
    contractors: 0,
    admins: 0,
    onboardingSubmissions: 0,
    pendingOnboarding: 0,
    activeThisWeek: 0
  });
  const [showVersion, setShowVersion] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersText = await fetchWithRedirect(PORTAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listUsers' })
      });
      const usersResult = JSON.parse(usersText);
      
      // Fetch onboarding
      const onboardingText = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsRead',
          params: {
            spreadsheetId: ONBOARDING_SHEET_ID,
            range: 'A1:Z200'
          }
        })
      });
      const onboardingResult = JSON.parse(onboardingText);

      if (usersResult.success) {
        const users = usersResult.users || [];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        setMetrics(prev => ({
          ...prev,
          totalUsers: users.length,
          employees: users.filter(u => u.role === 'employee').length,
          contractors: users.filter(u => u.role === 'contractor').length,
          admins: users.filter(u => u.role === 'admin').length,
          activeThisWeek: users.filter(u => u.lastLogin && new Date(u.lastLogin) > oneWeekAgo).length
        }));
      }

      if (onboardingResult.success && onboardingResult.data?.data) {
        const rows = onboardingResult.data.data;
        const submissions = rows.slice(1).filter(r => r[0]);
        const pending = submissions.filter(r => r[14] !== 'Approved' && r[14] !== 'Rejected');
        
        setMetrics(prev => ({
          ...prev,
          onboardingSubmissions: submissions.length,
          pendingOnboarding: pending.length
        }));
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
    setLoading(false);
  };

  const StatCard = ({ label, value, icon: Icon, color, trend, subtext }) => (
    <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : mutedColor }}>
            {trend > 0 ? <ArrowUpRight size={16} /> : trend < 0 ? <ArrowDownRight size={16} /> : <Minus size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: '700', color: textColor }}>{loading ? '...' : value}</div>
      <div style={{ fontSize: '0.9rem', color: mutedColor }}>{label}</div>
      {subtext && <div style={{ fontSize: '0.75rem', color: mutedColor, marginTop: '4px' }}>{subtext}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '32px' }} onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={() => setCurrentPage('admin-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>Metrics Dashboard</h1>
            <p style={{ color: mutedColor }}>Overview of operations and performance</p>
          </div>
          <button onClick={fetchMetrics} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader size={18} /> : <RefreshCw size={18} />}
            Refresh
          </button>
        </div>

        {/* Main Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard label="Total Users" value={metrics.totalUsers} icon={Users} color={accentPrimary} />
          <StatCard label="Employees" value={metrics.employees} icon={Users} color="#10b981" />
          <StatCard label="Contractors" value={metrics.contractors} icon={Truck} color="#3b82f6" />
          <StatCard label="Admins" value={metrics.admins} icon={Shield} color="#8b5cf6" />
        </div>

        {/* Activity Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard 
            label="Active This Week" 
            value={metrics.activeThisWeek} 
            icon={Activity} 
            color={accentSecondary} 
            subtext="Users who logged in"
          />
          <StatCard 
            label="Onboarding Submissions" 
            value={metrics.onboardingSubmissions} 
            icon={FileText} 
            color="#f59e0b" 
          />
          <StatCard 
            label="Pending Review" 
            value={metrics.pendingOnboarding} 
            icon={Clock} 
            color="#ef4444" 
            subtext="Awaiting approval"
          />
        </div>

        {/* Charts Placeholder */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor, marginBottom: '16px' }}>User Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>
                    {metrics.employees}
                  </div>
                  <div style={{ marginTop: '8px', color: textColor }}>Employees</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>
                    {metrics.contractors}
                  </div>
                  <div style={{ marginTop: '8px', color: textColor }}>Contractors</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>
                    {metrics.admins}
                  </div>
                  <div style={{ marginTop: '8px', color: textColor }}>Admins</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor, marginBottom: '16px' }}>Onboarding Pipeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: mutedColor }}>Total Submissions</span>
                  <span style={{ color: textColor, fontWeight: '500' }}>{metrics.onboardingSubmissions}</span>
                </div>
                <div style={{ height: '8px', backgroundColor: borderColor, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', backgroundColor: accentPrimary, borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: mutedColor }}>Pending Review</span>
                  <span style={{ color: textColor, fontWeight: '500' }}>{metrics.pendingOnboarding}</span>
                </div>
                <div style={{ height: '8px', backgroundColor: borderColor, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: metrics.onboardingSubmissions > 0 ? `${(metrics.pendingOnboarding / metrics.onboardingSubmissions) * 100}%` : '0%', backgroundColor: '#f59e0b', borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: mutedColor }}>Approved</span>
                  <span style={{ color: textColor, fontWeight: '500' }}>{metrics.onboardingSubmissions - metrics.pendingOnboarding}</span>
                </div>
                <div style={{ height: '8px', backgroundColor: borderColor, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: metrics.onboardingSubmissions > 0 ? `${((metrics.onboardingSubmissions - metrics.pendingOnboarding) / metrics.onboardingSubmissions) * 100}%` : '0%', backgroundColor: accentSecondary, borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version */}
      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>
          MetricsDashboard v2.0
        </div>
      )}
    </div>
  );
};

export default MetricsDashboard;
