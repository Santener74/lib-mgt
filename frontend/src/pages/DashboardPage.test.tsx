import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { loan } from '../test/fixtures';
import { DashboardPage } from './DashboardPage';

vi.mock('../api', () => ({ api: { getDashboard: vi.fn() } }));

const mocked = vi.mocked(api);

describe('DashboardPage', () => {
  it('renders statistics, recent loans and top books', async () => {
    mocked.getDashboard.mockResolvedValue({
      totalTitles: 16,
      totalCopies: 55,
      availableCopies: 46,
      totalMembers: 8,
      activeMembers: 7,
      activeLoans: 9,
      overdueLoans: 2,
      recentLoans: [loan()],
      topBooks: [{ id: 2, title: '1984', author: 'George Orwell', loanCount: 2 }],
    });

    render(<DashboardPage />);

    expect(await screen.findByTestId('stat-Book titles')).toHaveTextContent('16');
    expect(screen.getByTestId('stat-Overdue')).toHaveTextContent('2');
    expect(screen.getByText('7 active')).toBeInTheDocument();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('1984')).toBeInTheDocument();
  });

  it('shows an error if the API fails', async () => {
    mocked.getDashboard.mockRejectedValue(new Error('Network down'));
    render(<DashboardPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
  });
});
