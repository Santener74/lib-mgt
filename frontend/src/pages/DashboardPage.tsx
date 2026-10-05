import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import type { DashboardStats } from '../types';
import { errorMessage, formatDate } from '../utils';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboard().then(setStats).catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!stats) return <p className="muted">Loading dashboard…</p>;

  const cards = [
    { label: 'Book titles', value: stats.totalTitles, hint: `${stats.totalCopies} copies in total` },
    { label: 'Available copies', value: stats.availableCopies, hint: 'Ready to borrow' },
    { label: 'Members', value: stats.totalMembers, hint: `${stats.activeMembers} active` },
    { label: 'Books on loan', value: stats.activeLoans, hint: 'Currently borrowed' },
    { label: 'Overdue', value: stats.overdueLoans, hint: 'Past due date', danger: stats.overdueLoans > 0 },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
      </header>

      <section className="stats">
        {cards.map((card) => (
          <div key={card.label} className={`card stat${card.danger ? ' stat-danger' : ''}`}>
            <span className="stat-label">{card.label}</span>
            <strong className="stat-value" data-testid={`stat-${card.label}`}>{card.value}</strong>
            <span className="muted">{card.hint}</span>
          </div>
        ))}
      </section>

      <div className="two-col">
        <section className="card">
          <h2>Recent loans</h2>
          {stats.recentLoans.length === 0 ? (
            <p className="muted">No loans yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Borrowed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.book.title}</td>
                    <td>{loan.member.name}</td>
                    <td>{formatDate(loan.loanDate)}</td>
                    <td><StatusBadge status={loan.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2>Most borrowed</h2>
          {stats.topBooks.length === 0 ? (
            <p className="muted">No loans yet.</p>
          ) : (
            <ol className="top-books">
              {stats.topBooks.map((book) => (
                <li key={book.id}>
                  <div>
                    <strong>{book.title}</strong>
                    <span className="muted"> by {book.author}</span>
                  </div>
                  <span className="pill">{book.loanCount}×</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
