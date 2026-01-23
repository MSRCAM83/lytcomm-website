// MetricsDashboard.js v1.0 - Production & Safety Metrics Dashboard
// Comprehensive analytics for admin oversight
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Activity, Shield, Users, Truck,
  Calendar, MapPin, Clock, AlertTriangle, CheckCircle, FileText,
  DollarSign, Target, Award, Zap, ChevronDown, Download, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

const MetricsDashboard = ({ darkMode, user }) => {
  // Theme colors
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(false);

  // Mock metrics data
  const productionMetrics = {
    totalFootage: { value: 12450, change: 8.5, trend: 'up' },
    totalSplices: { value: 342, change: -2.3, trend: 'down' },
    totalPoles: { value: 28, change: 15.2, trend: 'up' },
    hddBores: { value: 8920, change: 12.1, trend: 'up' },
    conduitInstalled: { value: 11200, change: 6.8, trend: 'up' },
  };

  const safetyMetrics = {
    daysWithoutIncident: 47,
    openSafetyIssues: 2,
    toolboxTalksCompleted: 23,
    equipmentInspections: 156,
    nearMissReports: 3,
  };

  const complianceMetrics = {
    activeCertifications: 45,
    expiringCerts30Days: 4,
    validCOIs: 12,
    expiringCOIs30Days: 1,
    valid811Tickets: 18,
    expired811Tickets: 0,
  };

  const projectMetrics = [
    { name: 'Sulphur Area 1', footage: 4500, target: 5000, revenue: 38250, cost: 28500 },
    { name: 'Sulphur Area 2', footage: 3200, target: 4000, revenue: 27200, cost: 21000 },
    { name: 'Lake Charles Ph1', footage: 2800, target: 3500, revenue: 23800, cost: 18200 },
    { name: 'Westlake Expansion', footage: 1950, target: 2500, revenue: 16575, cost: 12800 },
  ];

  const weeklyProduction = [
    { day: 'Mon', footage: 1850, splices: 48 },
    { day: 'Tue', footage: 2100, splices: 52 },
    { day: 'Wed', footage: 1920, splices: 45 },
    { day: 'Thu', footage: 2280, splices: 61 },
    { day: 'Fri', footage: 2150, splices: 55 },
    { day: 'Sat', footage: 1200, splices: 42 },
    { day: 'Sun', footage: 950, splices: 39 },
  ];

  const topCrews = [
    { name: 'Gulf Coast Boring', footage: 3200, efficiency: 94 },
    { name: 'XYZ Drilling', footage: 2850, efficiency: 91 },
    { name: 'ABC Underground', footage: 2400, efficiency: 88 },
    { name: 'Delta Fiber', footage: 2100, efficiency: 85 },
    { name: 'Premier Contractors', footage: 1900, efficiency: 82 },
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <ArrowUpRight size={16} color="#10b981" />;
    if (trend === 'down') return <ArrowDownRight size={16} color="#ef4444" />;
    return <Minus size={16} color={mutedColor} />;
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return '#10b981';
    if (trend === 'down') return '#ef4444';
    return mutedColor;
  };

  // Simple bar chart renderer
  const renderBarChart = (data, maxValue, color) => {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                height: `${(item.footage / maxValue) * 100}px`,
                backgroundColor: color,
                borderRadius: '4px 4px 0 0',
                minHeight: '4px',
                transition: 'height 0.3s ease'
              }}
            />
            <span style={{ fontSize: '0.7rem', color: mutedColor, marginTop: '4px' }}>{item.day}</span>
          </div>
        ))}
      </div>
    );
  };

  // Progress bar renderer
  const renderProgressBar = (value, max, color) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: darkMode ? '#374151' : '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '4px',
          transition: 'width 0.5s ease'
        }} />
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: bgColor, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart3 size={28} color={accentPrimary} />
            Metrics Dashboard
          </h1>
          <p style={{ color: mutedColor }}>Production, safety, and compliance analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              backgroundColor: '#ffffff',
              color: '#1f2937',
              cursor: 'pointer'
            }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            style={{
              padding: '10px 16px',
              backgroundColor: accentPrimary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Production KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {[
          { label: 'Total Footage', value: productionMetrics.totalFootage.value.toLocaleString() + ' ft', icon: MapPin, ...productionMetrics.totalFootage },
          { label: 'Total Splices', value: productionMetrics.totalSplices.value.toLocaleString(), icon: Zap, ...productionMetrics.totalSplices },
          { label: 'Poles Completed', value: productionMetrics.totalPoles.value, icon: Activity, ...productionMetrics.totalPoles },
          { label: 'HDD Bores', value: productionMetrics.hddBores.value.toLocaleString() + ' ft', icon: Truck, ...productionMetrics.hddBores },
          { label: 'Conduit Installed', value: productionMetrics.conduitInstalled.value.toLocaleString() + ' ft', icon: Target, ...productionMetrics.conduitInstalled },
        ].map((metric, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: cardBg,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${borderColor}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <metric.icon size={24} color={accentPrimary} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {getTrendIcon(metric.trend)}
                <span style={{ fontSize: '0.8rem', color: getTrendColor(metric.trend) }}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: textColor, marginBottom: '4px' }}>
              {metric.value}
            </div>
            <div style={{ fontSize: '0.85rem', color: mutedColor }}>{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Weekly Production Chart */}
        <div style={{ 
          backgroundColor: cardBg, 
          borderRadius: '16px', 
          padding: '24px',
          border: `1px solid ${borderColor}`
        }}>
          <h3 style={{ color: textColor, marginBottom: '20px', fontWeight: '600' }}>
            Weekly Production
          </h3>
          {renderBarChart(weeklyProduction, Math.max(...weeklyProduction.map(d => d.footage)), accentPrimary)}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: mutedColor }}>Total: {weeklyProduction.reduce((s, d) => s + d.footage, 0).toLocaleString()} ft</span>
            <span style={{ color: mutedColor }}>Avg: {Math.round(weeklyProduction.reduce((s, d) => s + d.footage, 0) / 7).toLocaleString()} ft/day</span>
          </div>
        </div>

        {/* Safety Overview */}
        <div style={{ 
          backgroundColor: cardBg, 
          borderRadius: '16px', 
          padding: '24px',
          border: `1px solid ${borderColor}`
        }}>
          <h3 style={{ color: textColor, marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="#10b981" /> Safety Overview
          </h3>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: darkMode ? '#064e3b' : '#d1fae5', 
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '3rem', fontWeight: '700', color: '#10b981' }}>
              {safetyMetrics.daysWithoutIncident}
            </div>
            <div style={{ color: darkMode ? '#6ee7b7' : '#047857', fontWeight: '500' }}>
              Days Without Incident
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Open Issues', value: safetyMetrics.openSafetyIssues, color: safetyMetrics.openSafetyIssues > 0 ? '#f59e0b' : '#10b981' },
              { label: 'Toolbox Talks', value: safetyMetrics.toolboxTalksCompleted, color: '#10b981' },
              { label: 'Equipment Checks', value: safetyMetrics.equipmentInspections, color: '#10b981' },
              { label: 'Near Misses', value: safetyMetrics.nearMissReports, color: safetyMetrics.nearMissReports > 2 ? '#f59e0b' : '#10b981' },
            ].map((item, idx) => (
              <div key={idx} style={{ 
                padding: '12px', 
                backgroundColor: darkMode ? '#111827' : '#f8fafc', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.75rem', color: mutedColor }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Project Progress */}
        <div style={{ 
          backgroundColor: cardBg, 
          borderRadius: '16px', 
          padding: '24px',
          border: `1px solid ${borderColor}`
        }}>
          <h3 style={{ color: textColor, marginBottom: '20px', fontWeight: '600' }}>
            Project Progress
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {projectMetrics.map((project, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>{project.name}</span>
                  <span style={{ color: mutedColor, fontSize: '0.85rem' }}>
                    {project.footage.toLocaleString()} / {project.target.toLocaleString()} ft
                  </span>
                </div>
                {renderProgressBar(project.footage, project.target, accentPrimary)}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem', color: mutedColor }}>
                  <span>{Math.round((project.footage / project.target) * 100)}% complete</span>
                  <span style={{ color: project.revenue - project.cost > 0 ? '#10b981' : '#ef4444' }}>
                    Margin: ${(project.revenue - project.cost).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Crews */}
        <div style={{ 
          backgroundColor: cardBg, 
          borderRadius: '16px', 
          padding: '24px',
          border: `1px solid ${borderColor}`
        }}>
          <h3 style={{ color: textColor, marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#f59e0b" /> Top Performing Crews
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topCrews.map((crew, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: darkMode ? '#111827' : '#f8fafc',
                  borderRadius: '8px'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: idx === 0 ? '#f59e0b' : idx === 1 ? '#9ca3af' : idx === 2 ? '#cd7f32' : accentPrimary,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>{crew.name}</div>
                  <div style={{ color: mutedColor, fontSize: '0.8rem' }}>{crew.footage.toLocaleString()} ft this week</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    color: crew.efficiency >= 90 ? '#10b981' : crew.efficiency >= 80 ? '#f59e0b' : '#ef4444',
                    fontWeight: '600'
                  }}>
                    {crew.efficiency}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: mutedColor }}>Efficiency</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Status */}
        <div style={{ 
          backgroundColor: cardBg, 
          borderRadius: '16px', 
          padding: '24px',
          border: `1px solid ${borderColor}`
        }}>
          <h3 style={{ color: textColor, marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color={accentSecondary} /> Compliance Status
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Active Certifications', value: complianceMetrics.activeCertifications, icon: Award, color: '#10b981' },
              { label: 'Expiring (30 days)', value: complianceMetrics.expiringCerts30Days, icon: AlertTriangle, color: complianceMetrics.expiringCerts30Days > 0 ? '#f59e0b' : '#10b981' },
              { label: 'Valid COIs', value: complianceMetrics.validCOIs, icon: Shield, color: '#10b981' },
              { label: 'COIs Expiring', value: complianceMetrics.expiringCOIs30Days, icon: AlertTriangle, color: complianceMetrics.expiringCOIs30Days > 0 ? '#f59e0b' : '#10b981' },
              { label: 'Active 811 Tickets', value: complianceMetrics.valid811Tickets, icon: CheckCircle, color: '#10b981' },
              { label: 'Expired 811', value: complianceMetrics.expired811Tickets, icon: AlertTriangle, color: complianceMetrics.expired811Tickets > 0 ? '#ef4444' : '#10b981' },
            ].map((item, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '16px',
                  backgroundColor: darkMode ? '#111827' : '#f8fafc',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <item.icon size={20} color={item.color} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '0.75rem', color: mutedColor }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '16px', 
        padding: '24px',
        border: `1px solid ${borderColor}`
      }}>
        <h3 style={{ color: textColor, marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={20} color="#10b981" /> Financial Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Total Revenue', value: '$' + projectMetrics.reduce((s, p) => s + p.revenue, 0).toLocaleString(), color: '#10b981' },
            { label: 'Total Costs', value: '$' + projectMetrics.reduce((s, p) => s + p.cost, 0).toLocaleString(), color: '#ef4444' },
            { label: 'Gross Margin', value: '$' + (projectMetrics.reduce((s, p) => s + p.revenue, 0) - projectMetrics.reduce((s, p) => s + p.cost, 0)).toLocaleString(), color: '#10b981' },
            { label: 'Margin %', value: Math.round(((projectMetrics.reduce((s, p) => s + p.revenue, 0) - projectMetrics.reduce((s, p) => s + p.cost, 0)) / projectMetrics.reduce((s, p) => s + p.revenue, 0)) * 100) + '%', color: '#10b981' },
            { label: 'Pending Invoices', value: '$24,500', color: '#f59e0b' },
            { label: 'Avg $/Foot', value: '$8.50', color: accentPrimary },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '20px',
                backgroundColor: darkMode ? '#111827' : '#f8fafc',
                borderRadius: '10px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
