// src/components/modals/DeleteChatModal.tsx
import React, { useCallback, useEffect } from 'react';

interface DeleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chatTitle: string;
}

const DeleteChatModal: React.FC<DeleteChatModalProps> = ({ isOpen, onClose, onConfirm, chatTitle }) => {
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Delete Chat</h2>
        <p className="mb-6">Are you sure you want to delete the chat "{chatTitle}"? This action cannot be undone.</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteChatModal;
