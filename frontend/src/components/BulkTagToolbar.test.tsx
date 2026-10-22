import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BulkTagToolbar } from './BulkTagToolbar';

describe('BulkTagToolbar', () => {
  it('renders selected count with singular and plural labels', () => {
    const { rerender } = render(
      <BulkTagToolbar selectedCount={1} onSubmit={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/member selected/i)).toBeInTheDocument();

    rerender(<BulkTagToolbar selectedCount={5} onSubmit={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/members selected/i)).toBeInTheDocument();
  });

  it('shows maximum is 50 warning when selectedCount > 50', () => {
    render(<BulkTagToolbar selectedCount={55} onSubmit={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByText('(maximum is 50)')).toBeInTheDocument();
  });

  it('submits action and tag when Apply is clicked', async () => {
    const onSubmit = vi.fn();
    render(<BulkTagToolbar selectedCount={3} onSubmit={onSubmit} onClear={vi.fn()} />);

    await userEvent.selectOptions(screen.getByLabelText('Tag action'), 'remove');
    await userEvent.type(screen.getByLabelText('Tag name'), 'premium');
    await userEvent.click(screen.getByRole('button', { name: /Apply/i }));

    expect(onSubmit).toHaveBeenCalledWith('remove', 'premium');
  });

  it('calls onClear when Clear selection is clicked', async () => {
    const onClear = vi.fn();
    render(<BulkTagToolbar selectedCount={3} onSubmit={vi.fn()} onClear={onClear} />);

    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('disables controls when loading is true', () => {
    render(<BulkTagToolbar selectedCount={3} onSubmit={vi.fn()} onClear={vi.fn()} loading={true} />);

    expect(screen.getByLabelText('Tag action')).toBeDisabled();
    expect(screen.getByLabelText('Tag name')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Applying/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();
  });
});
