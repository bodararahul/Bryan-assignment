import React from 'react';
import { User, Trash2, AlertTriangle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export interface DeleteConfirmModalProps {
  leadName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * DeleteConfirmModal
 * Thin wrapper around the generic ConfirmationModal component,
 * preserving existing prop interfaces and markup for lead deletion.
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  leadName,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  return (
    <ConfirmationModal
      isOpen={true}
      title="Delete Lead?"
      subtitle="This action is permanent and cannot be undone."
      icon={<AlertTriangle size={24} strokeWidth={2.3} className="text-rose-400" />}
      itemDetails={{
        label: 'Record to delete:',
        name: `"${leadName}"`,
        avatarIcon: <User size={15} className="text-rose-400" />,
      }}
      message="All discovery notes, pipeline status, and contact history for this lead will be immediately removed from CRM storage."
      confirmText="Delete Lead"
      confirmIcon={<Trash2 size={15} strokeWidth={2.2} />}
      cancelText="Cancel"
      variant="danger"
      isLoading={isDeleting}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default DeleteConfirmModal;
