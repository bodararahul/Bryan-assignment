import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { Lead, LeadStatus, PaginatedLeads } from './types/lead';
import { leadsApi } from './api/leadsApi';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import Sidebar, { NavTab } from './components/Sidebar';
import TopHeader from './components/TopHeader';
import DashboardView from './components/DashboardView';
import LeadsView from './components/LeadsView';
import CreateLeadView from './components/CreateLeadView';
import LeadDetailsModal from './components/LeadDetailsModal';
import EditLeadModal from './components/EditLeadModal';

/**
 * CrmWorkspace: The authenticated CRM workspace shell with responsive sidebar,
 * top header, dynamic tab title, and nested routes for /dashboard, /leads, /create-lead.
 */
const CrmWorkspace: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadsData, setLeadsData] = useState<PaginatedLeads | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [inspectingLead, setInspectingLead] = useState<Lead | null>(null);
  const [editingLeadFromApp, setEditingLeadFromApp] = useState<Lead | null>(null);

  // Derive active tab from location
  const currentTab: NavTab =
    location.pathname === '/create-lead'
      ? 'create'
      : location.pathname === '/leads'
      ? 'leads'
      : 'dashboard';

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await leadsApi.getLeads({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: pageSize,
      });
      setLeadsData(data);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to load leads from database. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, page, pageSize]);

  useEffect(() => {
    if (token) {
      fetchLeads();
    }
  }, [token, fetchLeads]);

  // Automatically close any open modals when switching tabs or routes
  useEffect(() => {
    setInspectingLead(null);
    setEditingLeadFromApp(null);
  }, [location.pathname]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: LeadStatus | '') => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleLeadCreated = () => {
    setPage(1);
    fetchLeads();
    navigate('/leads');
  };

  const handleUpdateStatus = async (lead: Lead, status: LeadStatus) => {
    try {
      await leadsApi.updateLeadStatus(lead.id, status);
      fetchLeads();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const totalLeads = leadsData?.total ?? 0;
  const newLeadsCount = leadsData
    ? leadsData.leads.filter((l) => l.status === 'New').length
    : 0;

  return (
    <div className="crm-app-container">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar
          currentTab={currentTab}
          onSelectTab={() => setMobileMenuOpen(false)}
          totalLeads={totalLeads}
          newLeadsCount={newLeadsCount}
          user={user}
          onLogout={logout}
        />
      </div>

      {/* Main App Workspace */}
      <div className="main-app-workspace">
        {/* Top Navbar */}
        <TopHeader
          currentTab={currentTab}
          onSelectTab={() => setMobileMenuOpen(false)}
          onRefresh={fetchLeads}
          loading={loading}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          user={user}
          onLogout={logout}
        />

        {/* Workspace Body & Scroll Area */}
        <div className="workspace-scroll-area">
          <main className="workspace-main-content">
            {/* Global Error Alert */}
            {error && (
              <div className="global-error-banner" role="alert">
                <AlertCircle size={18} strokeWidth={2.2} />
                <span>{error}</span>
                <button onClick={fetchLeads} className="error-retry-btn">
                  <RefreshCw size={13} />
                  Retry
                </button>
              </div>
            )}

            {/* Route Content */}
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <DashboardView
                    data={leadsData}
                    loading={loading}
                    onSelectTab={(tab) => {
                      setMobileMenuOpen(false);
                      if (tab === 'leads') navigate('/leads');
                      else if (tab === 'create') navigate('/create-lead');
                      else navigate('/dashboard');
                    }}
                    onOpenLeadDetails={(lead) => setInspectingLead(lead)}
                    onUpdateStatus={handleUpdateStatus}
                  />
                }
              />
              <Route
                path="/leads"
                element={
                  <LeadsView
                    data={leadsData}
                    loading={loading}
                    search={search}
                    statusFilter={statusFilter}
                    page={page}
                    pageSize={pageSize}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize);
                      setPage(1);
                    }}
                    onSearchChange={handleSearchChange}
                    onStatusFilterChange={handleStatusFilterChange}
                    onPageChange={setPage}
                    onRefresh={fetchLeads}
                    onOpenCreate={() => {
                      setMobileMenuOpen(false);
                      navigate('/create-lead');
                    }}
                  />
                }
              />
              <Route
                path="/create-lead"
                element={
                  <CreateLeadView
                    key={location.key}
                    onLeadCreated={handleLeadCreated}
                    onViewLeads={() => {
                      setMobileMenuOpen(false);
                      navigate('/leads');
                    }}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Global Footer */}
          <footer className="crm-global-footer">
            <div className="footer-left">
              <span>LeadManager CRM Enterprise</span>
            </div>
            <div className="footer-right">
              <span>Tenant: {user?.orgName || 'Workspace'}</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Inspect Lead Profile Modal (Read-Only) */}
      {inspectingLead && (
        <LeadDetailsModal
          lead={inspectingLead}
          onClose={() => setInspectingLead(null)}
          onOpenEdit={(lead) => {
            setInspectingLead(null);
            setEditingLeadFromApp(lead);
          }}
        />
      )}

      {/* Edit Lead Modal */}
      {editingLeadFromApp && (
        <EditLeadModal
          key={editingLeadFromApp.id}
          lead={editingLeadFromApp}
          onClose={() => setEditingLeadFromApp(null)}
          onLeadUpdated={() => {
            setEditingLeadFromApp(null);
            fetchLeads();
          }}
        />
      )}
    </div>
  );
};

/**
 * Root App with Toast notification system and top-level Route configuration:
 * /auth -> Sign In & Registration page
 * /* -> Protected CRM workspace
 */
const App: React.FC = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#131d35',
            color: '#f0f4ff',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#131d35' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#131d35' },
          },
        }}
      />
      <Routes>
        <Route path="/auth" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <CrmWorkspace />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
