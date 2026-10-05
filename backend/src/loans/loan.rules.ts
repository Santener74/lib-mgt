import { Loan } from './loan.entity';

export const DEFAULT_LOAN_DAYS = 14;
export const MAX_ACTIVE_LOANS = 5;
export const FINE_PER_DAY = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

export type LoanStatus = 'active' | 'overdue' | 'returned';

export type LoanView = Loan & { status: LoanStatus; daysOverdue: number };

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function startOfDay(date: Date): number {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole calendar days past the due date; a loan is due until the end of its due day. */
export function daysOverdue(dueDate: Date, at: Date = new Date()): number {
  const days = Math.round((startOfDay(at) - startOfDay(dueDate)) / DAY_MS);
  return days > 0 ? days : 0;
}

export function calculateFine(dueDate: Date, returnedAt: Date = new Date()): number {
  return daysOverdue(dueDate, returnedAt) * FINE_PER_DAY;
}

export function loanStatus(loan: Pick<Loan, 'dueDate' | 'returnDate'>, at: Date = new Date()): LoanStatus {
  if (loan.returnDate) return 'returned';
  return daysOverdue(loan.dueDate, at) > 0 ? 'overdue' : 'active';
}

export function toLoanView(loan: Loan, at: Date = new Date()): LoanView {
  return {
    ...loan,
    status: loanStatus(loan, at),
    daysOverdue: daysOverdue(loan.dueDate, loan.returnDate ?? at),
  };
}
