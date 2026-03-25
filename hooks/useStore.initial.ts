import { AppData } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

export const APP_STORAGE_KEY = 'rental-tracker-data-v1';

export const INITIAL_DATA: AppData = {
    settings: DEFAULT_SETTINGS,
    records: [],
  propertyExpenses: [],
};
