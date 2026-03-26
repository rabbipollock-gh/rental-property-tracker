import { useState, useEffect, useRef } from 'react';
import { AppData, MonthRecord, PropertySettings, ImportResult, Expense, EditTarget } from '../types';
import { APP_STORAGE_KEY, INITIAL_DATA } from './useStore.initial';
import { getStorageData, setStorageData } from '../services/storageService';
import { importData as importDataService } from '../services/importService';
import { usePropertySettings } from './domain/usePropertySettings';
import { useMonthRecords } from './domain/useMonthRecords';
import { usePropertyExpenses } from './domain/usePropertyExpenses';
import { usePortfolio } from './domain/usePortfolio';
import { useVault } from './domain/useVault';
import { fetchAppData, saveAppData } from '../services/supabaseService';

const migrateLegacyData = (data: AppData): AppData => {
  if (!data) return data;
  
  if (!data.propertyExpenses) data.propertyExpenses = [];
  if (!data.documents) data.documents = [];

  // Phase 8 Migration: If no properties exist, seed the new tables from legacy settings
  if (!data.properties || data.properties.length === 0) {
      const propId = crypto.randomUUID();
      const unitId = crypto.randomUUID();
      const tenId = crypto.randomUUID();
      const leaseId = crypto.randomUUID();

      data.properties = [{
          id: propId,
          name: data.settings?.propertyAddress || "My Property",
          address: data.settings?.propertyAddress || "",
          units: [{ id: unitId, name: "Main House" }]
      }];

      data.tenants = [{
          id: tenId,
          name: data.settings?.tenantName || "Tenant",
          email: data.settings?.tenantEmail || "",
          coTenantName: data.settings?.tenantName2,
          coTenantEmail: data.settings?.tenantEmail2,
      }];

      let defaultRent = 1500;
      if (data.records && data.records.length > 0) {
         defaultRent = data.records[0].monthlyRent || 1500;
      }

      data.leases = [{
          id: leaseId,
          propertyId: propId,
          unitId: unitId,
          tenantId: tenId,
          monthlyRent: defaultRent,
          securityDeposit: data.settings?.securityDepositAmount || 0,
          startDate: data.settings?.leaseStartDate || new Date().toISOString().split('T')[0],
          endDate: data.settings?.leaseEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          isActive: true
      }];

      // Backfill foreign keys onto existing ledgers
      if (data.records) {
        data.records.forEach(r => {
          if (!r.leaseId) r.leaseId = leaseId;
        });
      }

      if (data.propertyExpenses) {
        data.propertyExpenses.forEach(e => {
          if (!e.propertyId) e.propertyId = propId;
        });
      }
  }

  return data;
};

export const useStore = () => {
  const [data, setData] = useState<AppData>(() => migrateLegacyData(getStorageData(APP_STORAGE_KEY, INITIAL_DATA)));
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const isFirstMount = useRef(true);

  // Load from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      const remoteData = await fetchAppData();
      if (remoteData) {
        setData(migrateLegacyData(remoteData));
      }
    };
    loadData();
  }, []);

  // Sync to local storage & Supabase
  useEffect(() => {
    // 1. Always sync to local storage immediately
    setStorageData(APP_STORAGE_KEY, data);

    // 2. Debounced sync to Supabase (only if not first mount to avoid overwrite on load)
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveAppData(data);
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [data]);

  const setSettings = (settings: PropertySettings) => {
    setData(prev => ({ ...prev, settings }));
  };

  const setRecords = (records: MonthRecord[]) => {
    setData(prev => ({ ...prev, records }));
  };

  const setPropertyExpenses = (propertyExpenses: Expense[]) => {
    setData(prev => ({ ...prev, propertyExpenses }));
  };

  const propertySettings = usePropertySettings(data.settings, setSettings);
  const monthRecords = useMonthRecords(data.records, setRecords);
  const propertyExpensesHook = usePropertyExpenses(data.propertyExpenses, setPropertyExpenses);
  const portfolioHook = usePortfolio(
    { properties: data.properties, tenants: data.tenants, leases: data.leases },
    (partialData) => setData(prev => ({ ...prev, ...partialData }))
  );
  const vaultHook = useVault(
    data.documents || [],
    (documents) => setData(prev => ({ ...prev, documents }))
  );

  // Auto-process recurring on load once data is available
  useEffect(() => {
    if (data.propertyExpenses && data.propertyExpenses.length > 0) {
        // We only want to trigger this once per session ideally, or just rely on the hook
        propertyExpensesHook.processRecurringExpenses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.propertyExpenses?.length]);

  const importData = (rows: any[]): ImportResult => {
    const result = importDataService(rows, data.records);
    setRecords(result.updatedRecords);
    return {
      success: result.success,
      logs: result.logs,
      rowsProcessed: result.rowsProcessed,
      rowsImported: result.rowsImported
    };
  };

  return {
    data,
    editTarget,
    setEditTarget,
    ...propertySettings,
    ...monthRecords,
    ...propertyExpensesHook,
    ...portfolioHook,
    ...vaultHook,
    importData
  };
};