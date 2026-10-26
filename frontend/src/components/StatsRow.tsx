import React from 'react';
import {
  Users,
  UserPlus,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { PaginatedLeads, LeadStatus } from '../types/lead';

interface StatsRowProps {
  data: PaginatedLeads | null;
}

const StatsRow: React.FC<StatsRowProps> = ({ data }) => {
  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;

  const countByStatus = (s: LeadStatus) =>
    leads.filter((l) => l.status === s).length;

  const stats = [
    {
      label: 'Total Leads',
      value: total,
      icon: <Users size={18} strokeWidth={2.2} />,
      colorClass: 'purple',
    },
    {
      label: 'New',
      value: countByStatus('New'),
      icon: <UserPlus size={18} strokeWidth={2.2} />,
      colorClass: 'blue',
    },
    {
      label: 'Contacted',
      value: countByStatus('Contacted'),
      icon: <PhoneCall size={18} strokeWidth={2.2} />,
      colorClass: 'amber',
    },
    {
      label: 'Qualified',
      value: countByStatus('Qualified'),
      icon: <ShieldCheck size={18} strokeWidth={2.2} />,
      colorClass: 'green',
    },
    {
      label: 'Closed',
      value: countByStatus('Closed'),
      icon: <CheckCircle2 size={18} strokeWidth={2.2} />,
      colorClass: 'slate',
    },
  ];

  return (
    <div className="stats-row" role="region" aria-label="Lead statistics">
      {stats.map((s) => (
        <div key={s.label} className="stat-card">
          <div className={`stat-card-icon ${s.colorClass}`}>{s.icon}</div>
          <div className="stat-card-content">
            <div className="stat-card-val">{s.value}</div>
            <div className="stat-card-lbl">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;
