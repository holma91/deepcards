import React, { useState, useRef, useEffect } from 'react';
import { useCreateDeck } from '../../hooks/mutations/useCreateDeck';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateDeckModal: React.FC<CreateDeckModalProps> = ({ isOpen, onClose }) => {
  const [newDeckName, setNewDeckName] = useState('');
  const createDeckMutation = useCreateDeck();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleCreateDeck = () => {
    if (newDeckName.trim()) {
      const newDeckId = uuidv4();
      createDeckMutation.mutate(
        { id: newDeckId, name: newDeckName.trim() },
        {
          onSuccess: () => {
            navigate(`/cards/${newDeckId}`);
            setNewDeckName('');
            onClose();
          },
        }
      );
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCreateDeck();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 sm:px-0">
      <div ref={modalRef} className="bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">Create New Deck</h2>
        <input
          ref={inputRef}
          type="text"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter deck name"
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 mb-4 transition-colors"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateDeck}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Create Deck
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDeckModal;
