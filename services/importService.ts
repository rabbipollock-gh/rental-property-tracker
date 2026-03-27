import { MonthRecord, ImportResult, ImportLog } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const importData = (rows: any[], currentRecords: MonthRecord[], propertyId: string): ImportResult & { updatedRecords: MonthRecord[] } => {
  const logs: ImportLog[] = [];
  let rowsImported = 0;

  const recordsMap = new Map<string, MonthRecord>();
  
  // Deep copy existing records
  currentRecords.forEach(r => {
    recordsMap.set(r.id, {
      ...r,
      payments: [...r.payments],
      manualFees: [...r.manualFees],
      adjustments: [...r.adjustments],
      expenses: [...(r.expenses || [])],
      notices: [...(r.notices || [])]
    });
  });

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header row
    const dateStr = row.Date?.trim();
    
    if (!dateStr) {
      const msg = 'Missing Date column';
      logs.push({ type: 'warning', message: msg, row: rowNum, data: row });
      return;
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const msg = `Invalid Date format: ${dateStr}. Expected YYYY-MM-DD`;
      logs.push({ type: 'warning', message: msg, row: rowNum, data: row });
      return; 
    }
    
    const parseAmount = (val: any) => {
      if (!val) return 0;
      const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g,""));
      return isNaN(parsed) ? 0 : parsed;
    };

    const charge = parseAmount(row.Charge);
    const payment = parseAmount(row.Payment);

    const category = String(row.Category || '').toLowerCase().trim();
    const description = row.Description?.trim() || '';

    const monthId = dateStr.substring(0, 7); // YYYY-MM
    // We append propertyId to the ID so multiple properties can share the same month!
    const uniqueRecordId = `${monthId}_${propertyId}`;
    
    let record = recordsMap.get(uniqueRecordId);
    if (!record) {
      const [yearStr, monthStr] = monthId.split('-');
      
      record = {
        id: uniqueRecordId,
        year: Number(yearStr),
        month: Number(monthStr),
        propertyId: propertyId, // Force mapping to the property
        monthlyRent: 0,
        dueDate: `${monthId}-01`,
        payments: [],
        manualFees: [],
        adjustments: [],
        expenses: [],
        notices: []
      };
      recordsMap.set(uniqueRecordId, record);
      logs.push({ type: 'info', message: `Created new month record for ${monthId}`, row: rowNum });
    }

    let imported = false;

    if (category.includes('rent')) {
      if (charge > 0) {
        record.monthlyRent = charge;
        record.dueDate = dateStr;
        imported = true;
        logs.push({ type: 'info', message: `Updated rent to ${charge} due on ${dateStr}`, row: rowNum });
      } else {
        logs.push({ type: 'warning', message: `Rent category found but Charge is 0 or invalid`, row: rowNum, data: row });
      }
    } else if (category.includes('payment')) {
      if (payment > 0) {
        record.payments.push({ id: generateId(), date: dateStr, amount: payment, note: description });
        imported = true;
        logs.push({ type: 'info', message: `Added payment of ${payment}`, row: rowNum });
      } else {
        logs.push({ type: 'warning', message: `Payment category found but Payment amount is 0 or invalid`, row: rowNum, data: row });
      }
    } else if (category.includes('fee')) {
      if (charge > 0) {
        record.manualFees.push({ id: generateId(), date: dateStr, amount: charge, description: description });
        imported = true;
        logs.push({ type: 'info', message: `Added fee of ${charge}`, row: rowNum });
      } else {
        logs.push({ type: 'warning', message: `Fee category found but Charge amount is 0 or invalid`, row: rowNum, data: row });
      }
    } else if (category.includes('adjust') || category.includes('credit')) {
      const adjAmount = charge > 0 ? charge : -payment;
      if (adjAmount !== 0) {
        record.adjustments.push({ id: generateId(), date: dateStr, amount: adjAmount, reason: description });
        imported = true;
        logs.push({ type: 'info', message: `Added adjustment of ${adjAmount}`, row: rowNum });
      } else {
        logs.push({ type: 'warning', message: `Adjustment category found but both Charge and Payment are 0 or invalid`, row: rowNum, data: row });
      }
    } else {
      logs.push({ type: 'warning', message: `Unrecognized category: "${row.Category}"`, row: rowNum, data: row });
    }

    if (imported) {
      rowsImported++;
    }
  });

  const updatedRecords = Array.from(recordsMap.values()).sort((a, b) => b.id.localeCompare(a.id));

  return {
    success: true,
    logs,
    rowsProcessed: rows.length,
    rowsImported,
    updatedRecords
  };
};
