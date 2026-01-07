"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { setSettingsCookie, clearSettingsCookie } from '@/app/actions';

interface BotConfig {
    pollInterval: number;
    minEdge: number;
    maxShares: number;
    maxDailyLoss: number;
}

interface SettingsState {
    keyId: string;
    privateKey: string;
    isDemo: boolean;
    botConfig: BotConfig;
    hasKeys: boolean;
}

interface SettingsContextType extends SettingsState {
    updateSettings: (settings: Partial<SettingsState>) => Promise<void>;
    clearSettings: () => Promise<void>;
}

const defaultBotConfig: BotConfig = {
    pollInterval: 60,
    minEdge: 10,
    maxShares: 10,
    maxDailyLoss: 10,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<SettingsState>({
        keyId: '',
        privateKey: '',
        isDemo: true,
        botConfig: defaultBotConfig,
        hasKeys: false,
    });

    const [loaded, setLoaded] = useState(false);

    // Load from local storage on mount (fast client access)
    useEffect(() => {
        const local = localStorage.getItem('kalshi_settings');
        if (local) {
            try {
                const parsed = JSON.parse(local);
                setState(prev => ({ ...prev, ...parsed, hasKeys: !!parsed.keyId }));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
        setLoaded(true);
    }, []);

    const updateSettings = async (newSettings: Partial<SettingsState>) => {
        const updated = { ...state, ...newSettings };
        setState(updated);

        // Persist to Local Storage
        localStorage.setItem('kalshi_settings', JSON.stringify({
            keyId: updated.keyId,
            privateKey: updated.privateKey,
            isDemo: updated.isDemo,
            botConfig: updated.botConfig
        }));

        // Persist to Cookies (Server Action)
        // Only send essential auth data to cookies to minimize overhead
        await setSettingsCookie({
            keyId: updated.keyId,
            privateKey: updated.privateKey,
            isDemo: updated.isDemo,
            botConfig: updated.botConfig
        });
    };

    const clearSettings = async () => {
        localStorage.removeItem('kalshi_settings');
        await clearSettingsCookie();
        setState({
            keyId: '',
            privateKey: '',
            isDemo: true,
            botConfig: defaultBotConfig,
            hasKeys: false
        });
    };

    if (!loaded) return null; // Or a loading spinner

    return (
        <SettingsContext.Provider value={{ ...state, updateSettings, clearSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
