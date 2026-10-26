import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GitBranch,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { AuthUser } from '../api/authApi';
import ConfirmationModal from './ConfirmationModal';

export type NavTab = 'dashboard' | 'leads' | 'create';

interface SidebarProps {
  currentTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  totalLeads: number;
  newLeadsCount: number;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  totalLeads,
  newLeadsCount,
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isDashboard =
    location.pathname === '/' || location.pathname === '/dashboard' || currentTab === 'dashboard';
  const isLeads = location.pathname === '/leads' || currentTab === 'leads';
  const isCreate = location.pathname === '/create-lead' || currentTab === 'create';

  const handleNav = (tab: NavTab, path: string) => {
    navigate(path);
    if (onSelectTab) onSelectTab(tab);
  };
  return (
    <aside className="app-sidebar" role="navigation" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-badge">
          <div className="brand-core-icon">
            <GitBranch size={20} strokeWidth={2.5} />
          </div>
        </div>
        <div className="brand-text-block">
          <div className="brand-title-row">
            <span className="brand-main-name">LeadManager</span>
            <span className="brand-badge-pro">PRO</span>
          </div>
          <span className="brand-sub-tag" title={user?.orgName || 'Enterprise CRM'}>
            {user?.orgName || 'Enterprise CRM'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-group-label">WORKSPACE</div>

        <button
          className={`nav-item-btn ${isDashboard ? 'active' : ''}`}
          onClick={() => handleNav('dashboard', '/dashboard')}
          aria-current={isDashboard ? 'page' : undefined}
        >
          <LayoutDashboard size={18} strokeWidth={2} className="nav-icon" />
          <span className="nav-label">Dashboard</span>
          <ChevronRight size={14} className="nav-arrow" />
        </button>

        <button
          className={`nav-item-btn ${isLeads ? 'active' : ''}`}
          onClick={() => handleNav('leads', '/leads')}
          aria-current={isLeads ? 'page' : undefined}
        >
          <Users size={18} strokeWidth={2} className="nav-icon" />
          <span className="nav-label">All Leads</span>
          {totalLeads > 0 && (
            <span className="nav-badge-count">{totalLeads}</span>
          )}
        </button>

        <button
          className={`nav-item-btn ${isCreate ? 'active' : ''}`}
          onClick={() => handleNav('create', '/create-lead')}
          aria-current={isCreate ? 'page' : undefined}
        >
          <UserPlus size={18} strokeWidth={2} className="nav-icon" />
          <span className="nav-label">Add New Lead</span>
          <span className="nav-badge-pill">New</span>
        </button>
      </nav>

      {/* System Status & User Profile Footer */}
      <div className="sidebar-footer">
        {/* User Profile Card & Logout */}
        <div className="sidebar-user-card" title={`Logged in as ${user?.name || 'Sales Team'}`}>
          <div className="user-avatar-circle">
            {user?.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'AD'}
          </div>
          <div className="user-info-text">
            <span className="user-name-text">{user?.name || 'Admin User'}</span>
            <span className="user-role-text" title={user?.orgName || 'Workspace Admin'}>
              {user?.orgName || (user?.role ? user.role.toUpperCase() : 'ADMIN')}
            </span>
          </div>
          {onLogout && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="sidebar-logout-btn"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <ConfirmationModal
          isOpen={showLogoutConfirm}
          title="Sign Out of Workspace?"
          subtitle="Are you sure you want to end your active session?"
          icon={<LogOut size={24} strokeWidth={2.3} className="text-rose-400" />}
          itemDetails={{
            label: 'Active Workspace User:',
            name: user?.name || 'Admin User',
            subtext: `${user?.email || 'admin@crm.com'} • ${user?.orgName || 'Workspace'}`,
            avatarText: user?.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'AD',
          }}
          message="You will need to sign in again with your credentials to access and manage your workspace leads."
          confirmText="Sign Out"
          confirmIcon={<LogOut size={15} strokeWidth={2.2} />}
          cancelText="Stay Signed In"
          variant="danger"
          onConfirm={() => {
            setShowLogoutConfirm(false);
            if (onLogout) onLogout();
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </aside>
  );
};

export default Sidebar;
