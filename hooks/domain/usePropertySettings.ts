import { PropertySettings } from '../../types';

export const usePropertySettings = (
    settings: PropertySettings,
    setSettings: (settings: PropertySettings) => void
) => {
    const updateSettings = (newSettings: PropertySettings) => {
        setSettings(newSettings);
    };

    return {
        settings,
        updateSettings
    };
};
