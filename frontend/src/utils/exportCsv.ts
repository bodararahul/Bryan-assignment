import type { Lead } from '../types/lead';

export const exportLeadsToCsv = (leads: Lead[], filename = 'leads_export.csv'): void => {
  if (!leads || leads.length === 0) {
    alert('No leads to export');
    return;
  }

  const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Notes', 'Created At', 'Updated At'];
  const rows = leads.map((l) => [
    `"${l.id}"`,
    `"${l.name.replace(/"/g, '""')}"`,
    `"${l.email.replace(/"/g, '""')}"`,
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${l.status}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`,
    `"${l.created_at}"`,
    `"${l.updated_at}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
