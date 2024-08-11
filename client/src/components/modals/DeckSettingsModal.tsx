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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        {!isConfirmingDelete ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Deck Settings</h2>
            <div className="mb-4">
              <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 mb-1">
                Deck Name
              </label>
              <input
                type="text"
                id="deckName"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
              >
                Delete Deck
              </button>
              <div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300 mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition duration-300"
                >
                  Save
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Delete Deck</h2>
            <p className="mb-6">Are you sure you want to delete the deck "{deckName}"? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
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
