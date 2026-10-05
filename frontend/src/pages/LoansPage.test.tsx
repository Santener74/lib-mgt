import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { book, loan, member } from '../test/fixtures';
import { LoansPage } from './LoansPage';

vi.mock('../api', () => ({
  api: {
    getLoans: vi.fn(),
    getBooks: vi.fn(),
    getMembers: vi.fn(),
    borrowBook: vi.fn(),
    returnLoan: vi.fn(),
  },
}));

const mocked = vi.mocked(api);

describe('LoansPage', () => {
  beforeEach(() => {
    mocked.getLoans.mockReset().mockResolvedValue([
      loan(),
      loan({ id: 2, book: book({ id: 2, title: 'Dune' }), status: 'overdue', daysOverdue: 4 }),
      loan({ id: 3, book: book({ id: 3, title: 'Sapiens' }), status: 'returned', returnDate: '2026-01-10T00:00:00.000Z' }),
    ]);
    mocked.getBooks.mockReset().mockResolvedValue([book(), book({ id: 4, title: 'Out of stock', availableCopies: 0 })]);
    mocked.getMembers.mockReset().mockResolvedValue([member(), member({ id: 2, name: 'Inactive Ivan', active: false })]);
  });

  it('shows loans with status and only offers return for unreturned ones', async () => {
    render(<LoansPage />);

    const overdueRow = (await screen.findByText('Dune')).closest('tr')!;
    expect(within(overdueRow).getByText('Overdue')).toBeInTheDocument();
    expect(within(overdueRow).getByText('(4d late)')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Return' })).toHaveLength(2);
  });

  it('only lists active members and available books in the issue form', async () => {
    render(<LoansPage />);
    await screen.findByText('Dune');

    const memberSelect = screen.getByLabelText('Member');
    const bookSelect = screen.getByLabelText('Book');
    expect(within(memberSelect).queryByText('Inactive Ivan')).not.toBeInTheDocument();
    expect(within(bookSelect).queryByText(/Out of stock/)).not.toBeInTheDocument();
  });

  it('issues a book', async () => {
    mocked.borrowBook.mockResolvedValue(loan({ id: 9 }));
    render(<LoansPage />);
    await screen.findByText('Dune');

    await userEvent.selectOptions(screen.getByLabelText('Member'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Book'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Issue book' }));

    expect(mocked.borrowBook).toHaveBeenCalledWith({ memberId: 1, bookId: 1, loanDays: 14 });
    expect(await screen.findByRole('status')).toHaveTextContent('"Clean Code" issued to Aarav Sharma');
  });

  it('returns a loan and reports the fine', async () => {
    mocked.returnLoan.mockResolvedValue(loan({ id: 2, book: book({ title: 'Dune' }), status: 'returned', fine: 40 }));
    render(<LoansPage />);

    const row = (await screen.findByText('Dune')).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Return' }));

    expect(mocked.returnLoan).toHaveBeenCalledWith(2);
    expect(await screen.findByRole('status')).toHaveTextContent('Fine due: 40');
  });

  it('filters by status', async () => {
    render(<LoansPage />);
    await screen.findByText('Dune');

    await userEvent.click(screen.getByRole('tab', { name: 'Overdue' }));

    await waitFor(() => expect(mocked.getLoans).toHaveBeenLastCalledWith('overdue'));
  });
});
