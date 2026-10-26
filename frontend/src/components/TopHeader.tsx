import React, { useState } from 'react';
import {
  Menu,
  Plus,
  RotateCw,
  LogOut,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { NavTab } from './Sidebar';
import type { AuthUser } from '../api/authApi';
import ConfirmationModal from './ConfirmationModal';

interface TopHeaderProps {
  currentTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  onRefresh: () => void;
  loading: boolean;
  onToggleMobileMenu: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onSelectTab,
  onRefresh,
  loading,
  onToggleMobileMenu,
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const activeTab: NavTab =
    location.pathname === '/create-lead'
      ? 'create'
      : location.pathname === '/leads'
      ? 'leads'
      : currentTab || 'dashboard';

  const getTabTitles = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'CRM Dashboard', subtitle: 'Pipeline metrics, conversions & recent activity' };
      case 'leads':
        return { title: 'All Customer Leads', subtitle: 'Manage, search, qualify & track leads database' };
      case 'create':
        return { title: 'Create New Lead', subtitle: 'Capture and validate incoming business opportunities' };
      default:
        return { title: 'Lead Manager', subtitle: 'Business CRM System' };
    }
  };

  const { title } = getTabTitles();

  const handleNavigate = (tab: NavTab, path: string) => {
    navigate(path);
    if (onSelectTab) onSelectTab(tab);
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-toggle"
          onClick={onToggleMobileMenu}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <div className="topbar-title-block">
          <div className="breadcrumb-line">
            <span
              className="crumb-link"
              onClick={() => handleNavigate('dashboard', '/dashboard')}
              style={{ cursor: 'pointer' }}
              title="Go to Dashboard"
            >
              {user?.orgName || 'Workspace'}
            </span>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">
              {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'leads' ? 'All Leads' : 'Add New Lead'}
            </span>
          </div>
          <h1 className="topbar-page-title" title={title}>{title}</h1>
        </div>
      </div>

      <div className="topbar-right">
        {/* Refresh Action */}
        <button
          className="topbar-action-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh CRM Data"
        >
          <RotateCw size={15} className={loading ? 'spin-anim' : ''} />
          <span className="btn-label-desktop">Refresh</span>
        </button>

        {/* Add Lead Button */}
        {activeTab !== 'create' && (
          <button
            className="btn btn-primary btn-sm topbar-create-btn"
            onClick={() => handleNavigate('create', '/create-lead')}
            title="Create New Lead"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="btn-label-desktop">Add Lead</span>
          </button>
        )}

        {/* User Profile & Logout Action */}
        {onLogout && (
          <button
            className="topbar-action-btn topbar-logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
            title={`Signed in as ${user?.email || 'Admin'} - Click to Sign Out`}
          >
            <LogOut size={15} />
            <span className="btn-label-desktop">Logout</span>
          </button>
        )}
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
    </header>
  );
};

export default TopHeader;
