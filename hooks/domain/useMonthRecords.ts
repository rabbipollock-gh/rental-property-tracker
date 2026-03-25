import { MonthRecord, Payment, Fee, Adjustment, Expense, Notice } from '../../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useMonthRecords = (
    records: MonthRecord[],
    setRecords: (records: MonthRecord[]) => void
) => {
    const addMonth = (year: number, month: number, rent: number, dueDate: string) => {
        const id = `${year}-${String(month).padStart(2, '0')}`;
        if (records.find(r => r.id === id)) {
            alert("Month already exists!");
            return;
        }
        const newRecord: MonthRecord = {
            id,
            year,
            month,
            monthlyRent: rent,
            dueDate,
            payments: [],
            manualFees: [],
            adjustments: [],
            expenses: [],
            notices: []
        };
        setRecords([...records, newRecord].sort((a, b) => b.id.localeCompare(a.id)));
    };

    const deleteMonth = (id: string) => {
        if (confirm("Are you sure you want to delete this month? All data will be lost.")) {
            setRecords(records.filter(r => r.id !== id));
        }
    };

    const updateMonthRent = (id: string, rent: number, dueDate: string) => {
        setRecords(records.map(r => r.id === id ? { ...r, monthlyRent: rent, dueDate } : r));
    }

    const setLateFeeOverride = (id: string, amount: number | undefined) => {
        setRecords(records.map(r => r.id === id ? { ...r, lateFeeOverride: amount } : r));
    }

    const updateRecord = (monthId: string, updater: (record: MonthRecord) => MonthRecord) => {
        setRecords(records.map(r => r.id === monthId ? updater(r) : r));
    };

    // CRUD actions for sub-items...
    const addPayment = (monthId: string, payment: Omit<Payment, 'id'>) => {
        updateRecord(monthId, r => ({ ...r, payments: [...r.payments, { ...payment, id: generateId() }] }));
    };
    const editPayment = (monthId: string, payment: Payment) => {
        updateRecord(monthId, r => ({ ...r, payments: r.payments.map(p => p.id === payment.id ? payment : p) }));
    };
    const deletePayment = (monthId: string, paymentId: string) => {
        updateRecord(monthId, r => ({ ...r, payments: r.payments.filter(p => p.id !== paymentId) }));
    };

    const addFee = (monthId: string, fee: Omit<Fee, 'id'>) => {
        updateRecord(monthId, r => ({ ...r, manualFees: [...r.manualFees, { ...fee, id: generateId() }] }));
    };
    const editFee = (monthId: string, fee: Fee) => {
        updateRecord(monthId, r => ({ ...r, manualFees: r.manualFees.map(f => f.id === fee.id ? fee : f) }));
    };
    const deleteFee = (monthId: string, feeId: string) => {
        updateRecord(monthId, r => ({ ...r, manualFees: r.manualFees.filter(f => f.id !== feeId) }));
    };

    const addAdjustment = (monthId: string, adj: Omit<Adjustment, 'id'>) => {
        updateRecord(monthId, r => ({ ...r, adjustments: [...r.adjustments, { ...adj, id: generateId() }] }));
    };
    const editAdjustment = (monthId: string, adj: Adjustment) => {
        updateRecord(monthId, r => ({ ...r, adjustments: r.adjustments.map(a => a.id === adj.id ? adj : a) }));
    };
    const deleteAdjustment = (monthId: string, adjId: string) => {
        updateRecord(monthId, r => ({ ...r, adjustments: r.adjustments.filter(a => a.id !== adjId) }));
    };

    const addExpense = (monthId: string, expense: Omit<Expense, 'id'>) => {
        updateRecord(monthId, r => ({ ...r, expenses: [...r.expenses, { ...expense, id: generateId() }] }));
    };
    const editExpense = (monthId: string, expense: Expense) => {
        updateRecord(monthId, r => ({ ...r, expenses: r.expenses.map(e => e.id === expense.id ? expense : e) }));
    };
    const deleteExpense = (monthId: string, expenseId: string) => {
        updateRecord(monthId, r => ({ ...r, expenses: r.expenses.filter(e => e.id !== expenseId) }));
    };

    const addNotice = (monthId: string, notice: Omit<Notice, 'id'>) => {
        updateRecord(monthId, r => ({ ...r, notices: [...r.notices, { ...notice, id: generateId() }] }));
    };
    const editNotice = (monthId: string, notice: Notice) => {
        updateRecord(monthId, r => ({ ...r, notices: r.notices.map(n => n.id === notice.id ? notice : n) }));
    };
    const deleteNotice = (monthId: string, noticeId: string) => {
        updateRecord(monthId, r => ({ ...r, notices: r.notices.filter(n => n.id !== noticeId) }));
    };

    const getMonth = (id: string) => records.find(r => r.id === id);

    return {
        records,
        addMonth,
        deleteMonth,
        updateMonthRent,
        setLateFeeOverride,
        addPayment,
        editPayment,
        deletePayment,
        addFee,
        editFee,
        deleteFee,
        addAdjustment,
        editAdjustment,
        deleteAdjustment,
        addExpense,
        editExpense,
        deleteExpense,
        addNotice,
        editNotice,
        deleteNotice,
        getMonth
    };
};
