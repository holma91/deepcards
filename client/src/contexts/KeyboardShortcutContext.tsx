import React, { createContext, useContext, useState } from 'react';

interface KeyboardShortcutContextType {
  isCreateDeckModalOpen: boolean;
  setCreateDeckModalOpen: (isOpen: boolean) => void;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextType | undefined>(undefined);

export const KeyboardShortcutProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [isCreateDeckModalOpen, setCreateDeckModalOpen] = useState(false);

  return (
    <KeyboardShortcutContext.Provider value={{ isCreateDeckModalOpen, setCreateDeckModalOpen }}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
};

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutContext);
  if (context === undefined) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutProvider');
  }
  return context;
};
