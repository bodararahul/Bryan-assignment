import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RotateCw,
  FileSpreadsheet,
  Plus,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit3,
  X,
} from 'lucide-react';
import type { Lead, LeadStatus, PaginatedLeads } from '../types/lead';
import { leadsApi } from '../api/leadsApi';
import DeleteConfirmModal from './DeleteConfirmModal';
import LeadDetailsModal from './LeadDetailsModal';
import EditLeadModal from './EditLeadModal';
import { exportLeadsToCsv } from '../utils/exportCsv';
import toast from 'react-hot-toast';

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Closed'];

interface LeadsViewProps {
  data: PaginatedLeads | null;
  loading: boolean;
  search: string;
  statusFilter: LeadStatus | '';
  page: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (val: LeadStatus | '') => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const LeadsView: React.FC<LeadsViewProps> = ({
  data,
  loading,
  search,
  statusFilter,
  page,
  pageSize = 10,
  onPageSizeChange,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onRefresh,
  onOpenCreate,
}) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(searchTimer.current);
    const val = e.target.value;
    searchTimer.current = setTimeout(() => onSearchChange(val), 350);
  };

  useEffect(() => {
    return () => clearTimeout(searchTimer.current);
  }, []);

  const handleStatusChange = useCallback(
    async (lead: Lead, newStatus: LeadStatus) => {
      if (newStatus === lead.status) return;
      setUpdatingId(lead.id);
      try {
        await leadsApi.updateLeadStatus(lead.id, newStatus);
        toast.success(`Status updated to "${newStatus}"`);
        if (selectedLead && selectedLead.id === lead.id) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
        onRefresh();
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || 'Failed to update status');
      } finally {
        setUpdatingId(null);
      }
    },
    [onRefresh, selectedLead]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal) return;
    setDeletingId(deleteModal.id);
    try {
      await leadsApi.deleteLead(deleteModal.id);
      toast.success('Lead permanently deleted');
      setDeleteModal(null);
      if (selectedLead && selectedLead.id === deleteModal.id) {
        setSelectedLead(null);
      }
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to delete lead');
    } finally {
      setDeletingId(null);
    }
  }, [deleteModal, onRefresh, selectedLead]);

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleExportCsv = () => {
    exportLeadsToCsv(leads, `leads_page_${page}.csv`);
    toast.success('Exported leads to CSV spreadsheet! 📄');
  };

  const handleClearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('');
    if (searchRef.current) {
      searchRef.current.value = '';
    }
  };

  return (
    <div className="leads-view-layout">
      {/* Table Card */}
      <div className="card leads-table-card">
        {/* Toolbar Header */}
        <div className="table-top-bar">
          <div className="toolbar-search-group">
            <div className="search-wrapper">
              <Search size={16} strokeWidth={2.2} className="search-icon-svg" />
              <input
                id="search-input"
                ref={searchRef}
                type="search"
                className="search-input"
                placeholder="Search by name or email…"
                defaultValue={search}
                onChange={handleSearchInput}
                aria-label="Search leads"
              />
              {search && (
                <button
                  className="search-clear-btn"
                  onClick={() => {
                    onSearchChange('');
                    if (searchRef.current) searchRef.current.value = '';
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="filter-wrapper">
              <Filter size={14} className="filter-icon-svg" />
              <select
                id="status-filter"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value as LeadStatus | '')}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="select-chevron-svg" />
            </div>

            {(search || statusFilter) && (
              <button
                className="btn btn-ghost btn-sm clear-filters-btn"
                onClick={handleClearFilters}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="toolbar-actions-group">
            <button
              className="btn btn-ghost btn-sm export-csv-btn"
              onClick={handleExportCsv}
              disabled={leads.length === 0}
              title="Download CSV file for spreadsheet"
            >
              <FileSpreadsheet size={15} />
              <span>Export<span className="btn-label-extra"> CSV</span></span>
            </button>

            <button
              id="refresh-btn"
              className="btn btn-ghost btn-sm refresh-btn"
              onClick={onRefresh}
              title="Refresh database"
              disabled={loading}
            >
              <RotateCw size={14} strokeWidth={2.2} className={loading ? 'spin-anim' : ''} />
              <span>Refresh</span>
            </button>

            <button
              className="btn btn-primary btn-sm add-lead-toolbar-btn"
              onClick={onOpenCreate}
              title="Create New Lead"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span><span className="btn-label-extra">New </span>Lead</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="table-wrapper">
          <table className="leads-table" aria-label="Customer Leads Table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Discovery Notes</th>
                <th>Pipeline Stage</th>
                <th>Recorded At</th>
                <th aria-label="Actions" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && leads.length === 0 ? (
                <tr className="loading-row">
                  <td colSpan={7}>
                    <div className="loading-indicator">
                      <RotateCw size={20} className="spin-anim" />
                      <span>Fetching leads from Supabase PostgreSQL…</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon-box">
                        <Inbox size={32} strokeWidth={1.8} className="empty-svg" />
                      </div>
                      <div className="empty-title">
                        {search || statusFilter ? 'No leads matched your criteria' : 'No customer leads in database yet'}
                      </div>
                      <div className="empty-desc">
                        {search || statusFilter
                          ? 'Try resetting the search keyword or change the status filter.'
                          : 'Get started by creating your first business lead opportunity.'}
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        {search || statusFilter ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={handleClearFilters}
                          >
                            Reset Search & Filter
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={onOpenCreate}
                          >
                            <Plus size={14} />
                            <span>Capture First Lead</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`lead-row-enter ${updatingId === lead.id ? 'badge-updating' : ''}`}
                    onClick={() => setSelectedLead(lead)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="lead-name-cell">
                        <div className="lead-avatar-sm">
                          {lead.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="lead-name" title={lead.name}>
                          {lead.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <a
                        href={`mailto:${lead.email}`}
                        className="lead-email"
                        title={lead.email}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td>
                      <span className="lead-phone">
                        {lead.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </span>
                    </td>
                    <td>
                      <span className="lead-notes" title={lead.notes || ''}>
                        {lead.notes || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className={`status-select-wrapper status-${lead.status}`}>
                        <span className={`status-dot status-dot-${lead.status.toLowerCase()}`} />
                        <select
                          id={`pipeline-stage-${lead.id}`}
                          className={`status-select status-${lead.status}`}
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                          disabled={updatingId === lead.id}
                          aria-label={`Change pipeline stage for ${lead.name}`}
                          title="Click to update pipeline stage"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="status-select-chevron" />
                      </div>
                    </td>
                    <td>
                      <span className="lead-date">{formatDate(lead.created_at)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        className="actions-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="icon-action-btn"
                          title="View lead profile"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          id={`edit-btn-${lead.id}`}
                          className="icon-action-btn edit-lead-action-btn"
                          title={`Edit ${lead.name}`}
                          onClick={() => setEditingLead(lead)}
                          aria-label={`Edit lead ${lead.name}`}
                        >
                          <Edit3 size={15} strokeWidth={2} />
                        </button>
                        <button
                          id={`delete-btn-${lead.id}`}
                          className="delete-btn"
                          title={`Delete ${lead.name}`}
                          onClick={() => setDeleteModal({ id: lead.id, name: lead.name })}
                          disabled={deletingId === lead.id}
                          aria-label={`Delete lead ${lead.name}`}
                        >
                          <Trash2 size={15} strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="pagination">
            <div className="pagination-left">
              <span className="pagination-info">
                Showing {(page - 1) * (data?.limit ?? pageSize) + 1}–
                {Math.min(page * (data?.limit ?? pageSize), total)} of <strong>{total}</strong> leads
              </span>

              {onPageSizeChange && (
                <div className="page-size-selector">
                  <span>Per page:</span>
                  <select
                    className="page-size-select"
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    disabled={loading}
                    aria-label="Select number of leads per page"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn page-arrow"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => onPageChange(p)}
                    disabled={loading}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                className="page-btn page-arrow"
                disabled={page >= totalPages || loading}
                onClick={() => onPageChange(page + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteConfirmModal
          leadName={deleteModal.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal(null)}
          isDeleting={deletingId === deleteModal.id}
        />
      )}

      {/* Lead Details Modal / Profile (Read-Only) */}
      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onOpenEdit={(lead) => {
            setSelectedLead(null);
            setEditingLead(lead);
          }}
        />
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal
          key={editingLead.id}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onLeadUpdated={(updated) => {
            setEditingLead(null);
            if (selectedLead && selectedLead.id === updated.id) {
              setSelectedLead(updated);
            }
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default LeadsView;
