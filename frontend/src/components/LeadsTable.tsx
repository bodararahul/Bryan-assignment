import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  RotateCw,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
} from 'lucide-react';
import type { Lead, LeadStatus, PaginatedLeads } from '../types/lead';
import { leadsApi } from '../api/leadsApi';
import DeleteConfirmModal from './DeleteConfirmModal';
import toast from 'react-hot-toast';

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Closed'];

interface LeadsTableProps {
  data: PaginatedLeads | null;
  loading: boolean;
  search: string;
  statusFilter: LeadStatus | '';
  page: number;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (val: LeadStatus | '') => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
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

const LeadsTable: React.FC<LeadsTableProps> = ({
  data,
  loading,
  search,
  statusFilter,
  page,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onRefresh,
}) => {
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
        onRefresh();
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || 'Failed to update status');
      } finally {
        setUpdatingId(null);
      }
    },
    [onRefresh]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal) return;
    setDeletingId(deleteModal.id);
    try {
      await leadsApi.deleteLead(deleteModal.id);
      toast.success('Lead deleted');
      setDeleteModal(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to delete lead');
    } finally {
      setDeletingId(null);
    }
  }, [deleteModal, onRefresh]);

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
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

        <button
          id="refresh-btn"
          className="btn btn-ghost btn-sm refresh-btn"
          onClick={onRefresh}
          title="Refresh leads"
          disabled={loading}
        >
          <RotateCw size={14} strokeWidth={2.2} className={loading ? 'spin-anim' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="leads-table" aria-label="Leads list">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Created</th>
              <th aria-label="Actions" style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && leads.length === 0 ? (
              <tr className="loading-row">
                <td colSpan={7}>
                  <div className="loading-indicator">
                    <RotateCw size={18} className="spin-anim" />
                    <span>Loading leads…</span>
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
                      {search || statusFilter ? 'No leads match your filter' : 'No leads recorded yet'}
                    </div>
                    <div className="empty-desc">
                      {search || statusFilter
                        ? 'Try adjusting your search query or clear the status filter.'
                        : 'Capture incoming leads using the form on the left.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`lead-row-enter ${updatingId === lead.id ? 'badge-updating' : ''}`}
                >
                  <td>
                    <div className="lead-name" title={lead.name}>
                      {lead.name}
                    </div>
                  </td>
                  <td>
                    <a
                      href={`mailto:${lead.email}`}
                      className="lead-email"
                      title={lead.email}
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
                  <td>
                    <div className="status-cell-wrapper">
                      <span className={`status-dot status-dot-${lead.status.toLowerCase()}`} />
                      <select
                        id={`status-select-${lead.id}`}
                        className={`status-select status-${lead.status}`}
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(lead, e.target.value as LeadStatus)
                        }
                        disabled={updatingId === lead.id}
                        aria-label={`Change status for ${lead.name}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="status-chevron" />
                    </div>
                  </td>
                  <td>
                    <span className="lead-date">{formatDate(lead.created_at)}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell">
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

      {/* Pagination */}
      {total > 0 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {(page - 1) * (data?.limit ?? 20) + 1}–
            {Math.min(page * (data?.limit ?? 20), total)} of {total} lead
            {total !== 1 ? 's' : ''}
          </span>

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

      {/* Delete Modal */}
      {deleteModal && (
        <DeleteConfirmModal
          leadName={deleteModal.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal(null)}
          isDeleting={deletingId === deleteModal.id}
        />
      )}
    </div>
  );
};

export default LeadsTable;
