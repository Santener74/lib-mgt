import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import type { Book, Loan, LoanStatus, Member } from '../types';
import { errorMessage, formatDate } from '../utils';

const filters: Array<{ value: LoanStatus | undefined; label: string }> = [
  { value: undefined, label: 'All' },
  { value: 'active', label: 'On loan' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'returned', label: 'Returned' },
];

export function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [status, setStatus] = useState<LoanStatus | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ memberId: '', bookId: '', loanDays: '14' });

  const load = useCallback(async () => {
    try {
      const [loanList, bookList, memberList] = await Promise.all([
        api.getLoans(status),
        api.getBooks(),
        api.getMembers(),
      ]);
      setLoans(loanList);
      setBooks(bookList);
      setMembers(memberList);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBorrow = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.memberId || !form.bookId) {
      setError('Choose a member and a book');
      return;
    }
    try {
      const loan = await api.borrowBook({
        memberId: Number(form.memberId),
        bookId: Number(form.bookId),
        loanDays: Number(form.loanDays) || 14,
      });
      setNotice(`"${loan.book.title}" issued to ${loan.member.name}, due ${formatDate(loan.dueDate)}`);
      setForm({ ...form, bookId: '' });
      await load();
    } catch (err) {
      setNotice(null);
      setError(errorMessage(err));
    }
  };

  const handleReturn = async (loan: Loan) => {
    try {
      const returned = await api.returnLoan(loan.id);
      setNotice(
        returned.fine > 0
          ? `"${returned.book.title}" returned late. Fine due: ${returned.fine}`
          : `"${returned.book.title}" returned on time`,
      );
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const activeMembers = members.filter((m) => m.active);
  const availableBooks = books.filter((b) => b.availableCopies > 0);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Loans</h1>
      </header>

      <form className="card form issue-form" onSubmit={handleBorrow}>
        <h3>Issue a book</h3>
        <div className="form-grid">
          <label>
            Member
            <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
              <option value="">Select member…</option>
              {activeMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label>
            Book
            <select value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })}>
              <option value="">Select book…</option>
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.availableCopies} available)
                </option>
              ))}
            </select>
          </label>
          <label>
            Loan days
            <input
              type="number"
              min={1}
              max={60}
              value={form.loanDays}
              onChange={(e) => setForm({ ...form, loanDays: e.target.value })}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Issue book</button>
        </div>
      </form>

      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="tabs" role="tablist">
        {filters.map((f) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={status === f.value}
            className={`tab${status === f.value ? ' tab-active' : ''}`}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card table-card">
        {loading ? (
          <p className="muted">Loading loans…</p>
        ) : loans.length === 0 ? (
          <p className="muted">No loans found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Borrowed</th>
                <th>Due</th>
                <th>Returned</th>
                <th>Status</th>
                <th>Fine</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td><strong>{loan.book.title}</strong></td>
                  <td>{loan.member.name}</td>
                  <td>{formatDate(loan.loanDate)}</td>
                  <td>
                    {formatDate(loan.dueDate)}
                    {loan.status === 'overdue' && (
                      <span className="text-danger small"> ({loan.daysOverdue}d late)</span>
                    )}
                  </td>
                  <td>{formatDate(loan.returnDate)}</td>
                  <td><StatusBadge status={loan.status} /></td>
                  <td>{loan.fine > 0 ? loan.fine : '—'}</td>
                  <td className="actions">
                    {loan.status !== 'returned' && (
                      <button className="btn btn-small" onClick={() => handleReturn(loan)}>
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
