import { MonthRecord, MonthStats } from '../types';
import { parseISO, isAfter, isValid, startOfDay, addDays, endOfMonth } from 'date-fns';

export const calculateMonthStats = (record: MonthRecord): MonthStats => {
  const { monthlyRent, dueDate, payments, manualFees, adjustments } = record;

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalManualFees = manualFees.reduce((sum, f) => sum + f.amount, 0);
  const totalEvictionFees = manualFees
    .filter(f => f.category?.toLowerCase().includes('evict') || f.description.toLowerCase().includes('evict'))
    .reduce((sum, f) => sum + f.amount, 0);
  const totalOtherFees = totalManualFees - totalEvictionFees;
  
  const totalAdjustments = adjustments.reduce((sum, a) => sum + a.amount, 0);

  // --- Late Fee Logic ---
  let flatLateFee = 0;
  let dailyLateFee = 0;
  let daysLate = 0;

  const dueDateObj = parseISO(dueDate);
  const today = startOfDay(new Date());

  // Only calculate if due date is valid
  if (isValid(dueDateObj)) {
    // 1. Check for Flat Late Fee (10% of unpaid rent on day after due date)
    // Find payments made ON or BEFORE due date
    const paymentsByDueDate = payments
      .filter(p => {
        const pDate = parseISO(p.date);
        return isValid(pDate) && !isAfter(pDate, dueDateObj);
      })
      .reduce((sum, p) => sum + p.amount, 0);
    
    const unpaidRentAtDueDate = Math.max(0, monthlyRent - paymentsByDueDate);

    // If unpaid rent exists and we are past the due date
    if (unpaidRentAtDueDate > 0 && isAfter(today, dueDateObj)) {
        flatLateFee = unpaidRentAtDueDate * 0.10;
    }

    // 2. Check for Daily Late Fee ($5/day)
    // Accrues for every day past due date where PRINCIPAL (Rent) is still unpaid.
    // It stops when principal is fully paid.
    
    const sortedPayments = [...payments].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });
    
    // Start checking from day after due date
    let currentCheckDate = addDays(dueDateObj, 1);
    
    let paymentIndex = 0;
    let paymentsUntilNow = 0;
    
    // Pre-calculate payments made before the check start date
    while (paymentIndex < sortedPayments.length) {
      const pDate = parseISO(sortedPayments[paymentIndex].date);
      if (isValid(pDate) && !isAfter(pDate, dueDateObj)) {
        paymentsUntilNow += sortedPayments[paymentIndex].amount;
        paymentIndex++;
      } else {
        break;
      }
    }
    
    // Max iterations: 3650 (10 years) to prevent infinite loops in extreme edge cases
    let iterations = 0;
    const MAX_ITERATIONS = 3650;

    const monthEnd = endOfMonth(new Date(record.year, record.month - 1));
    const maxCheckDate = isAfter(today, monthEnd) ? monthEnd : today;

    while (!isAfter(currentCheckDate, maxCheckDate) && iterations < MAX_ITERATIONS) {
      // Add any payments made on this check date
      while (paymentIndex < sortedPayments.length) {
        const pDate = parseISO(sortedPayments[paymentIndex].date);
        if (isValid(pDate) && !isAfter(pDate, currentCheckDate)) {
          paymentsUntilNow += sortedPayments[paymentIndex].amount;
          paymentIndex++;
        } else {
          break;
        }
      }

      const principalRemaining = Math.max(0, monthlyRent - paymentsUntilNow);

      if (principalRemaining > 0) {
        dailyLateFee += 5;
        daysLate++;
      } else {
        // Principal is paid off, stop accruing daily fees
        break; 
      }
      
      currentCheckDate = addDays(currentCheckDate, 1);
      iterations++;
    }
  }

  const totalLateFees = record.lateFeeOverride !== undefined ? record.lateFeeOverride : flatLateFee + dailyLateFee;

  // Total Charges = Rent + Manual Fees + Late Fees + Adjustments (Adjustments can be negative)
  // Note: Adjustments usually reduce what is owed if negative, or add if positive.
  // We will assume 'amount' in adjustment is signed correctly.
  
  const totalCharges = monthlyRent + totalManualFees + totalLateFees + totalAdjustments;
  const remainingBalance = totalCharges - totalPayments;

  // Calculate breakdown of owed amounts
  // Apply adjustments to rent first
  const adjustedRent = Math.max(0, monthlyRent + totalAdjustments);
  
  // Apply payments in order: Rent -> Late Fees -> Manual Fees
  let remainingPayments = totalPayments;
  
  const rentOwed = Math.max(0, adjustedRent - remainingPayments);
  remainingPayments = Math.max(0, remainingPayments - adjustedRent);
  
  const lateFeesOwed = Math.max(0, totalLateFees - remainingPayments);
  remainingPayments = Math.max(0, remainingPayments - totalLateFees);
  
  const manualFeesOwed = Math.max(0, totalManualFees - remainingPayments);
  
  // Split manual fees owed proportionally or just apply remaining payments to other fees first
  // Let's apply payments to other fees first, then eviction fees
  let remainingPaymentsForManual = Math.max(0, remainingPayments);
  const otherFeesOwed = Math.max(0, totalOtherFees - remainingPaymentsForManual);
  remainingPaymentsForManual = Math.max(0, remainingPaymentsForManual - totalOtherFees);
  const evictionFeesOwed = Math.max(0, totalEvictionFees - remainingPaymentsForManual);

  return {
    totalRent: monthlyRent,
    totalPayments,
    totalManualFees,
    totalAdjustments,
    flatLateFee,
    dailyLateFee,
    totalLateFees,
    totalOwed: totalCharges,
    remainingBalance,
    rentOwed,
    lateFeesOwed,
    manualFeesOwed,
    evictionFeesOwed,
    otherFeesOwed,
    isPaidOff: remainingBalance <= 0,
    daysLate
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export const formatDate = (dateStr: string) => {
    if(!dateStr) return '-';
    const date = parseISO(dateStr);
    return isValid(date) ? date.toLocaleDateString() : dateStr;
}