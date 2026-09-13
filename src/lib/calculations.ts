// ============================================
// Business Logic & Calculations
// ============================================

/**
 * Calculate selling price from purchase price and markup percentage
 */
export function calculateSellingPrice(purchasePrice: number, markupPercent: number): number {
  return Math.round(purchasePrice + (purchasePrice * markupPercent) / 100);
}

/**
 * Calculate profit amount
 */
export function calculateProfit(purchasePrice: number, sellingPrice: number): number {
  return sellingPrice - purchasePrice;
}

/**
 * Calculate monthly installment
 */
export function calculateMonthlyInstallment(sellingPrice: number, advancePayment: number, months: number): number {
  if (months <= 0) return 0;
  const remaining = sellingPrice - advancePayment;
  return Math.ceil(remaining / months);
}

/**
 * Calculate investment used from investor's capital
 * Investment = Purchase Price - Advance Payment (NOT selling price)
 * Because advance goes to investor, only remaining purchase cost comes from investor
 */
export function calculateInvestmentUsed(purchasePrice: number, advancePayment: number): number {
  const investment = purchasePrice - advancePayment;
  return Math.max(0, investment);
}

/**
 * Calculate remaining amount for customer
 */
export function calculateRemainingAmount(sellingPrice: number, totalPaid: number): number {
  return Math.max(0, sellingPrice - totalPaid);
}

/**
 * Calculate referral commission
 */
export function calculateReferralCommission(sellingPrice: number, commissionPercent: number): number {
  return Math.round((sellingPrice * commissionPercent) / 100);
}

/**
 * Split expense by ratio
 */
export function splitByRatio(amount: number, investorRatio: number): { investorShare: number; adminShare: number } {
  const investorShare = Math.round((amount * investorRatio) / 100);
  const adminShare = amount - investorShare;
  return { investorShare, adminShare };
}

/**
 * Calculate profit split between admin and investor
 */
export function splitProfit(
  profitAmount: number,
  investorRatio: number,
  expenses: { amount: number }[] = []
): {
  totalExpenses: number;
  netProfit: number;
  investorProfit: number;
  adminProfit: number;
} {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = profitAmount - totalExpenses;
  const investorProfit = Math.round((netProfit * investorRatio) / 100);
  const adminProfit = netProfit - investorProfit;
  return { totalExpenses, netProfit, investorProfit, adminProfit };
}

/**
 * Calculate next due date from sale date and installment number
 */
export function calculateNextDueDate(saleDate: string, installmentNumber: number): Date {
  const date = new Date(saleDate);
  date.setMonth(date.getMonth() + installmentNumber);
  return date;
}

/**
 * Generate installment schedule
 */
export function generateInstallmentSchedule(
  sellingPrice: number,
  advancePayment: number,
  months: number,
  saleDate: string
): Array<{
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: "pending" | "paid" | "overdue";
}> {
  const monthlyAmount = calculateMonthlyInstallment(sellingPrice, advancePayment, months);
  const remaining = sellingPrice - advancePayment;
  const schedule = [];

  for (let i = 1; i <= months; i++) {
    const dueDate = calculateNextDueDate(saleDate, i);
    // Last installment may be different to handle rounding
    const amount = i === months ? remaining - monthlyAmount * (months - 1) : monthlyAmount;
    schedule.push({
      installmentNumber: i,
      dueDate,
      amount: Math.max(0, amount),
      status: "pending" as const,
    });
  }

  return schedule;
}

/**
 * Calculate withdrawal impact estimate for investor
 */
export function calculateWithdrawalImpact(
  currentBalance: number,
  withdrawalAmount: number,
  activeInstallments: number,
  averageMonthlyReturn: number
): {
  remainingBalance: number;
  canWithdraw: boolean;
  expectedMonthlyEarning: number;
  warningMessage?: string;
} {
  const remainingBalance = currentBalance - withdrawalAmount;
  const canWithdraw = remainingBalance >= 0;
  const ratio = canWithdraw ? remainingBalance / currentBalance : 0;
  const expectedMonthlyEarning = Math.round(averageMonthlyReturn * ratio);

  let warningMessage: string | undefined;
  if (!canWithdraw) {
    warningMessage = "Aapke balance se zyada amount withdraw nahi ho sakta.";
  } else if (remainingBalance < 10000) {
    warningMessage = `Withdrawal ke baad aapka balance sirf Rs. ${remainingBalance.toLocaleString()} bachega. Naye deals ke liye kam balance hoga.`;
  }

  return { remainingBalance, canWithdraw, expectedMonthlyEarning, warningMessage };
}

/**
 * Generate SMS message template
 */
export function generateSmsMessage(
  customerName: string,
  pendingAmount: number,
  installmentNumber: number,
  totalInstallments: number,
  dueDate: string,
  daysOverdue: number,
  companyName: string
): string {
  const dueDateFormatted = new Date(dueDate).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (daysOverdue > 0) {
    return `Assalam o Alaikum ${customerName},\n\nAapki installment #${installmentNumber}/${totalInstallments} ki payment Rs. ${pendingAmount.toLocaleString()} overdue hai. Due date ${dueDateFormatted} thi (${daysOverdue} din hogaye).\n\nBaraye meharbani jaldi az jaldi payment karein.\n\n${companyName}`;
  }

  return `Assalam o Alaikum ${customerName},\n\nYe aapko yaad dilana hai ke aapki installment #${installmentNumber}/${totalInstallments} ki payment Rs. ${pendingAmount.toLocaleString()} ki due date ${dueDateFormatted} hai.\n\nShukriya,\n${companyName}`;
}
