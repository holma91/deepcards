import React, { createContext, useContext } from 'react';
import { useProfile, Profile } from '../hooks/useProfile';
import { useUpdateProfile } from '../hooks/mutations/useUpdateProfile';

interface ProfileContextType {
  profile: Profile | undefined;
  updateProfile: (updates: Partial<Profile>) => void;
  isLoading: boolean;
  error: Error | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const updateProfile = (updates: Partial<Profile>) => {
    updateProfileMutation.mutate(updates);
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, isLoading, error }}>{children}</ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};
