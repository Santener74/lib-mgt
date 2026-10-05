import { Loan } from './loan.entity';
import { FINE_PER_DAY, addDays, calculateFine, daysOverdue, loanStatus, toLoanView } from './loan.rules';

describe('loan rules', () => {
  const now = new Date(2026, 0, 15, 12, 0, 0);
  const DAY_MS = 86_400_000;

  it('addDays adds whole days', () => {
    expect(addDays(now, 14).getTime() - now.getTime()).toBe(14 * DAY_MS);
    expect(addDays(now, -1).getTime() - now.getTime()).toBe(-DAY_MS);
  });

  it('daysOverdue is 0 before or on the due date', () => {
    expect(daysOverdue(addDays(now, 3), now)).toBe(0);
    expect(daysOverdue(now, now)).toBe(0);
  });

  it('daysOverdue counts whole calendar days, ignoring time of day', () => {
    expect(daysOverdue(addDays(now, -2), now)).toBe(2);
    expect(daysOverdue(new Date(now.getTime() - 60 * 1000), now)).toBe(0);
    expect(daysOverdue(addDays(now, -3), new Date(now.getTime() + 5000))).toBe(3);
  });

  it('calculateFine charges per overdue day', () => {
    expect(calculateFine(addDays(now, -4), now)).toBe(4 * FINE_PER_DAY);
    expect(calculateFine(addDays(now, 1), now)).toBe(0);
  });

  it('loanStatus distinguishes active, overdue and returned', () => {
    expect(loanStatus({ dueDate: addDays(now, 1), returnDate: null }, now)).toBe('active');
    expect(loanStatus({ dueDate: addDays(now, -1), returnDate: null }, now)).toBe('overdue');
    expect(loanStatus({ dueDate: new Date(now.getTime() - 1000), returnDate: null }, now)).toBe('active');
    expect(loanStatus({ dueDate: addDays(now, -1), returnDate: now }, now)).toBe('returned');
  });

  it('toLoanView adds status and days overdue', () => {
    const loan = { id: 1, dueDate: addDays(now, -3), returnDate: null } as Loan;
    expect(toLoanView(loan, now)).toMatchObject({ id: 1, status: 'overdue', daysOverdue: 3 });
  });
});
