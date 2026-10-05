import type { LoanStatus } from '../types';

const labels: Record<LoanStatus, string> = {
  active: 'On loan',
  overdue: 'Overdue',
  returned: 'Returned',
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
}
