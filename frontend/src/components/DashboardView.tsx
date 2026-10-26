import React from 'react';
import {
  Users,
  UserPlus,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Plus,
  Sparkles,
  Clock,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import type { Lead, LeadStatus, PaginatedLeads } from '../types/lead';
import type { NavTab } from './Sidebar';
import { exportLeadsToCsv } from '../utils/exportCsv';

interface DashboardViewProps {
  data: PaginatedLeads | null;
  loading: boolean;
  onSelectTab: (tab: NavTab) => void;
  onOpenLeadDetails: (lead: Lead) => void;
  onUpdateStatus: (lead: Lead, status: LeadStatus) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  loading,
  onSelectTab,
  onOpenLeadDetails,
  onUpdateStatus,
}) => {
  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;

  // ─── Use server-computed counts (accurate across ALL leads, not just this page) ─
  // Previously this filtered `leads` (current page only) which gave wrong numbers
  // when there was more than one page of data. The backend now returns statusCounts
  // from a full GROUP BY query, independent of pagination.
  const newCount       = data?.statusCounts?.New       ?? 0;
  const contactedCount = data?.statusCounts?.Contacted ?? 0;
  const qualifiedCount = data?.statusCounts?.Qualified ?? 0;
  const closedCount    = data?.statusCounts?.Closed    ?? 0;

  // Conversion rate based on full dataset
  const convertedCount = qualifiedCount + closedCount;
  const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;


  const recentLeads = leads.slice(0, 5);

  const stats = [
    {
      label: 'Total Leads',
      value: total,
      sublabel: 'All time pipeline',
      icon: <Users size={20} strokeWidth={2.2} />,
      colorClass: 'purple',
    },
    {
      label: 'New Leads',
      value: newCount,
      sublabel: 'Needs first touch',
      icon: <UserPlus size={20} strokeWidth={2.2} />,
      colorClass: 'blue',
    },
    {
      label: 'Contacted',
      value: contactedCount,
      sublabel: 'In communication',
      icon: <PhoneCall size={20} strokeWidth={2.2} />,
      colorClass: 'amber',
    },
    {
      label: 'Qualified',
      value: qualifiedCount,
      sublabel: 'High intent prospect',
      icon: <ShieldCheck size={20} strokeWidth={2.2} />,
      colorClass: 'green',
    },
    {
      label: 'Closed',
      value: closedCount,
      sublabel: 'Converted / Finalized',
      icon: <CheckCircle2 size={20} strokeWidth={2.2} />,
      colorClass: 'slate',
    },
  ];

  return (
    <div className="dashboard-view-layout">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-text-col">
          <div className="welcome-badge">
            <Sparkles size={13} className="sparkle-svg" />
            <span>CRM Pipeline Active</span>
          </div>
          <h2 className="welcome-heading">Welcome back to LeadManager 👋</h2>
          <p className="welcome-desc">
            You currently have <strong className="highlight-text">{total} total leads</strong> recorded in your Supabase PostgreSQL database, with <strong className="highlight-text">{newCount} awaiting contact</strong>.
          </p>
        </div>

        <div className="welcome-actions-col">
          <button
            className="btn btn-primary welcome-cta-btn"
            onClick={() => onSelectTab('create')}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create New Lead</span>
          </button>
          <button
            className="btn btn-ghost welcome-secondary-btn"
            onClick={() => onSelectTab('leads')}
          >
            <span>View All Leads</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="stats-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card-icon ${s.colorClass}`}>{s.icon}</div>
            <div className="stat-card-content">
              <div className="stat-card-val">{s.value}</div>
              <div className="stat-card-lbl">{s.label}</div>
              <div className="stat-card-sub">{s.sublabel}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel & Stage Breakdown */}
      <div className="card pipeline-card">
        <div className="section-header">
          <div className="section-header-title-group">
            <TrendingUp size={18} className="title-icon-svg text-purple" />
            <h3 className="section-title">Pipeline Conversion & Distribution</h3>
          </div>
          <div className="conversion-rate-pill">
            <span className="rate-num">{conversionRate}%</span>
            <span className="rate-lbl">Qualification Rate</span>
          </div>
        </div>

        {/* Multi-segment visual bar */}
        <div className="pipeline-bar-wrapper">
          <div className="pipeline-bar-track">
            <div
              className="bar-segment seg-new"
              style={{ width: `${total > 0 ? (newCount / total) * 100 : 25}%` }}
              title={`New: ${newCount}`}
            />
            <div
              className="bar-segment seg-contacted"
              style={{ width: `${total > 0 ? (contactedCount / total) * 100 : 25}%` }}
              title={`Contacted: ${contactedCount}`}
            />
            <div
              className="bar-segment seg-qualified"
              style={{ width: `${total > 0 ? (qualifiedCount / total) * 100 : 25}%` }}
              title={`Qualified: ${qualifiedCount}`}
            />
            <div
              className="bar-segment seg-closed"
              style={{ width: `${total > 0 ? (closedCount / total) * 100 : 25}%` }}
              title={`Closed: ${closedCount}`}
            />
          </div>
        </div>

        {/* Stage Legend Cards */}
        <div className="stage-legend-grid">
          <div className="legend-chip">
            <span className="legend-dot dot-new" />
            <span className="legend-name">New:</span>
            <strong className="legend-val">{newCount}</strong>
            <span className="legend-pct">({total > 0 ? Math.round((newCount / total) * 100) : 0}%)</span>
          </div>

          <div className="legend-chip">
            <span className="legend-dot dot-contacted" />
            <span className="legend-name">Contacted:</span>
            <strong className="legend-val">{contactedCount}</strong>
            <span className="legend-pct">({total > 0 ? Math.round((contactedCount / total) * 100) : 0}%)</span>
          </div>

          <div className="legend-chip">
            <span className="legend-dot dot-qualified" />
            <span className="legend-name">Qualified:</span>
            <strong className="legend-val">{qualifiedCount}</strong>
            <span className="legend-pct">({total > 0 ? Math.round((qualifiedCount / total) * 100) : 0}%)</span>
          </div>

          <div className="legend-chip">
            <span className="legend-dot dot-closed" />
            <span className="legend-name">Closed:</span>
            <strong className="legend-val">{closedCount}</strong>
            <span className="legend-pct">({total > 0 ? Math.round((closedCount / total) * 100) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Leads & Quick Actions */}
      <div className="dashboard-bottom-grid">
        {/* Recent Leads Widget */}
        <div className="card recent-leads-card">
          <div className="section-header">
            <div className="section-header-title-group">
              <Clock size={17} className="title-icon-svg text-blue" />
              <h3 className="section-title">Recent Incoming Leads</h3>
            </div>
            <button
              className="btn btn-ghost btn-sm view-all-link-btn"
              onClick={() => onSelectTab('leads')}
            >
              <span>View All ({total})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {leads.length === 0 ? (
            <div className="empty-recent-state">
              <Users size={32} className="empty-svg" />
              <p>No leads found in database yet.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onSelectTab('create')}
              >
                <Plus size={14} />
                <span>Create First Lead</span>
              </button>
            </div>
          ) : (
            <div className="recent-leads-list">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="recent-lead-item">
                  <div className="lead-avatar-sm">
                    {lead.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="lead-item-details">
                    <span className="recent-lead-name">{lead.name}</span>
                    <span className="recent-lead-email">{lead.email}</span>
                  </div>

                  <div className="lead-item-stage">
                    <span className={`status-pill-badge status-${lead.status}`}>
                      <span className={`status-dot status-dot-${lead.status.toLowerCase()}`} />
                      {lead.status}
                    </span>
                  </div>

                  <div className="lead-item-actions">
                    <button
                      className="icon-action-btn"
                      onClick={() => onOpenLeadDetails(lead)}
                      title="View lead profile"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tools & Database Card */}
        <div className="card quick-actions-card">
          <div className="section-header">
            <h3 className="section-title">Quick Actions & Export</h3>
          </div>

          <div className="quick-actions-list">
            <button
              className="quick-action-row"
              onClick={() => onSelectTab('create')}
            >
              <div className="action-row-icon purple">
                <Plus size={18} />
              </div>
              <div className="action-row-text">
                <strong>New Lead Intake</strong>
                <span>Open lead creation form</span>
              </div>
              <ArrowRight size={15} className="action-row-arrow" />
            </button>

            <button
              className="quick-action-row"
              onClick={() => onSelectTab('leads')}
            >
              <div className="action-row-icon blue">
                <Users size={18} />
              </div>
              <div className="action-row-text">
                <strong>Manage Customer Leads</strong>
                <span>Filter, search & batch view table</span>
              </div>
              <ArrowRight size={15} className="action-row-arrow" />
            </button>

            <button
              className="quick-action-row"
              onClick={() => exportLeadsToCsv(leads, 'crm_leads_export.csv')}
              disabled={leads.length === 0}
            >
              <div className="action-row-icon green">
                <FileSpreadsheet size={18} />
              </div>
              <div className="action-row-text">
                <strong>Export CSV Spreadsheet</strong>
                <span>Download records for Excel / Reporting</span>
              </div>
              <ArrowRight size={15} className="action-row-arrow" />
            </button>
          </div>

          <div className="pro-tip-box">
            <span className="tip-title">💡 Sales Best Practice</span>
            <p className="tip-text">
              Contacting incoming prospects within the first 60 minutes yields up to 7x higher qualification rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
