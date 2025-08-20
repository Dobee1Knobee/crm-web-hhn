/**
 * Утилиты для безопасной работы с sessionStorage
 * С проверкой на доступность в браузере
 */

export const isClient = typeof window !== 'undefined';

export const getSessionStorage = (key: string): string | null => {
    if (!isClient || typeof sessionStorage === 'undefined') {
        return null;
    }
    
    try {
        return sessionStorage.getItem(key);
    } catch (error) {
        console.error(`Error getting from sessionStorage (${key}):`, error);
        return null;
    }
};

export const setSessionStorage = (key: string, value: string): boolean => {
    if (!isClient || typeof sessionStorage === 'undefined') {
        return false;
    }
    
    try {
        sessionStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error(`Error setting to sessionStorage (${key}):`, error);
        return false;
    }
};

export const removeSessionStorage = (key: string): boolean => {
    if (!isClient || typeof sessionStorage === 'undefined') {
        return false;
    }
    
    try {
        sessionStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing from sessionStorage (${key}):`, error);
        return false;
    }
};

export const clearSessionStorage = (): boolean => {
    if (!isClient || typeof sessionStorage === 'undefined') {
        return false;
    }
    
    try {
        sessionStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing sessionStorage:', error);
        return false;
    }
};

export const getSessionStorageJSON = <T>(key: string, defaultValue: T): T => {
    const stored = getSessionStorage(key);
    if (!stored) {
        return defaultValue;
    }
    
    try {
        const parsed = JSON.parse(stored);
        return parsed;
    } catch (error) {
        console.error(`Error parsing JSON from sessionStorage (${key}):`, error);
        return defaultValue;
    }
};

export const setSessionStorageJSON = <T>(key: string, value: T): boolean => {
    try {
        const jsonString = JSON.stringify(value);
        return setSessionStorage(key, jsonString);
    } catch (error) {
        console.error(`Error stringifying JSON for sessionStorage (${key}):`, error);
        return false;
    }
};
