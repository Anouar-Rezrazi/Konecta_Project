'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface Preferences {
  language: 'english' | 'spanish' | 'french';
  timezone: string;
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreferences: (newPreferences: Partial<Preferences>) => void;
}

const defaultPreferences: Preferences = {
  language: 'english',
  timezone: 'UTC',
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          setPreferences({ ...defaultPreferences, ...parsed });
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      }
    }
  }, []);

  // Apply language changes (add 'lang' attribute to html element)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const langMap = {
        english: 'en',
        spanish: 'es',
        french: 'fr',
      };
      
      document.documentElement.lang = langMap[preferences.language] || 'en';
      
      // Reset to LTR since we removed Arabic
      document.documentElement.dir = 'ltr';
    }
  }, [preferences.language]);

  const updatePreferences = (newPreferences: Partial<Preferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPreferences', JSON.stringify(updated));
    }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
