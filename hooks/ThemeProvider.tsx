import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme colors
export const lightTheme = {
    background: '#f5f5f5',
    cardBackground: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    primary: '#6EC1E4',
    accent: '#4A90E2',
    shadow: '#000000',
    overlayBackground: 'rgba(0, 0, 0, 0.5)',
    inputBackground: '#ffffff',
    buttonText: '#ffffff',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    sectionBackground: '#f8f8f8',
    borderSecondary: '#f0f0f0',
};

export const darkTheme = {
    background: '#121212',
    cardBackground: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    primary: '#6EC1E4',
    accent: '#4A90E2',
    shadow: '#000000',
    overlayBackground: 'rgba(0, 0, 0, 0.8)',
    inputBackground: '#2C2C2C',
    buttonText: '#ffffff',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    sectionBackground: '#2C2C2C',
    borderSecondary: '#404040',
};

type Theme = typeof lightTheme;

interface ThemeContextType {
    theme: Theme;
    isDarkMode: boolean;
    toggleTheme: () => void;
    setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Load theme preference on app start
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const settings = await AsyncStorage.getItem('userSettings');
            if (settings) {
                const parsedSettings = JSON.parse(settings);
                setIsDarkMode(parsedSettings.darkMode ?? false);
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
        }
    };

    const saveThemePreference = async (isDark: boolean) => {
        try {
            const settings = await AsyncStorage.getItem('userSettings');
            let parsedSettings = {};

            if (settings) {
                parsedSettings = JSON.parse(settings);
            }

            const newSettings = {
                ...parsedSettings,
                darkMode: isDark,
            };

            await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        saveThemePreference(newMode);
    };

    const setDarkMode = (isDark: boolean) => {
        setIsDarkMode(isDark);
        saveThemePreference(isDark);
    };

    const theme = isDarkMode ? darkTheme : lightTheme;

    const value: ThemeContextType = {
        theme,
        isDarkMode,
        toggleTheme,
        setDarkMode,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
