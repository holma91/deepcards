import { useEffect, useRef, useState } from 'react';
import { useUpdateDeckName } from '../../hooks/mutations/useUpdateDeckName';

const DeckSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  deckId: string | undefined;
  deckName: string;
}> = ({ isOpen, onClose, onDelete, deckId, deckName }) => {
  const [newDeckName, setNewDeckName] = useState(deckName);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const updateDeckNameMutation = useUpdateDeckName();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleRename = () => {
    if (deckId && newDeckName !== deckName) {
      updateDeckNameMutation.mutate({ deckId, newName: newDeckName });
      onClose();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 sm:px-0">
      <div ref={modalRef} className="bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-sm w-full">
        {!isConfirmingDelete ? (
          <>
            <h2 className="text-lg font-semibold mb-4">Deck Settings</h2>
            <div className="mb-4">
              <label htmlFor="deckName" className="block text-sm text-gray-700 mb-1">
                Deck Name
              </label>
              <input
                type="text"
                id="deckName"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full sm:w-auto px-3 py-1 text-sm text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 rounded transition-colors"
              >
                Delete Deck
              </button>
              <div className="flex w-full sm:w-auto space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">Delete Deck</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete the deck "{deckName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeckSettingsModal;
