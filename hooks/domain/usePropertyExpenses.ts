import { Expense } from '../../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const usePropertyExpenses = (
    expenses: Expense[],
    setExpenses: (expenses: Expense[]) => void
) => {
    
    // Auto-generate recurring expenses
    const processRecurringExpenses = () => {
        if (!expenses) return;
        let newExpenses = [...expenses];
        let changed = false;
        
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-11

        expenses.forEach(expense => {
            if (expense.isRecurring) {
                const expDate = new Date(expense.date);
                
                // If it's a monthly recurring expense
                if (expense.recurringInterval === 'monthly') {
                    // Check if there's an expense for the current month
                    const currentMonthDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;
                    
                    // Look for an expense with the same original description, category, AND in the current month+year
                    const alreadyGenerated = newExpenses.some(e => {
                        if (!e.date) return false;
                        const d = new Date(e.date);
                        return d.getFullYear() === currentYear && 
                               d.getMonth() === currentMonth && 
                               e.category === expense.category && 
                               e.description === expense.description && 
                               e.amount === expense.amount;
                    });
                    
                    if (!alreadyGenerated) {
                        // We must generate it for the current month
                        newExpenses.push({
                            ...expense,
                            id: generateId(),
                            date: currentMonthDateStr,
                            // Inherit the recurring flag so it becomes the new template, or keep the original as the only template
                            isRecurring: false // Only original is templates
                        });
                        changed = true;
                    }
                }
            }
        });
        
        if (changed) {
            setExpenses(newExpenses.sort((a, b) => b.date.localeCompare(a.date)));
        }
    };

    const addPropertyExpense = (expense: Omit<Expense, 'id'>) => {
        setExpenses([...(expenses || []), { ...expense, id: generateId() }].sort((a, b) => b.date.localeCompare(a.date)));
    };

    const editPropertyExpense = (expense: Expense) => {
        setExpenses((expenses || []).map(e => e.id === expense.id ? expense : e).sort((a, b) => b.date.localeCompare(a.date)));
    };

    const deletePropertyExpense = (expenseId: string) => {
        setExpenses((expenses || []).filter(e => e.id !== expenseId));
    };

    return {
        propertyExpenses: expenses || [],
        addPropertyExpense,
        editPropertyExpense,
        deletePropertyExpense,
        processRecurringExpenses
    };
};
