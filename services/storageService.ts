import { APP_STORAGE_KEY } from '../constants';

export const getStorageData = <T>(key: string, defaultValue: T): T => {
    const storageKey = (import.meta as any).env?.VITE_APP_STORAGE_KEY || key;
    try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.warn("Storage access failed", e);
        return defaultValue;
    }
};

export const setStorageData = <T>(key: string, data: T): void => {
    const storageKey = (import.meta as any).env?.VITE_APP_STORAGE_KEY || key;
    try {
        localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
        console.warn("Storage write failed", e);
    }
};
