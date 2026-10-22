import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { member } from '../test/fixtures';
import { MembersPage } from './MembersPage';

vi.mock('../api', () => ({
  api: {
    getMembers: vi.fn(),
    createMember: vi.fn(),
    updateMember: vi.fn(),
    deleteMember: vi.fn(),
    bulkUpdateMemberTags: vi.fn(),
    bulkUpdateTags: vi.fn(),
  },
}));

const mocked = vi.mocked(api);

describe('MembersPage', () => {
  beforeEach(() => {
    mocked.getMembers.mockReset().mockResolvedValue([
      member({ id: 1, name: 'Aarav Sharma', email: 'aarav@example.com', active: true, tags: ['vip'] }),
      member({ id: 2, name: 'Diya Patel', email: 'diya@example.com', active: true }),
      member({ id: 3, name: 'Kabir Singh', email: 'kabir@example.com', active: false }),
    ]);
    mocked.bulkUpdateMemberTags.mockReset();
  });

  it('lists members with status badges and checkboxes', async () => {
    render(<MembersPage />);

    expect(await screen.findByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getByText('Diya Patel')).toBeInTheDocument();
    expect(screen.getByText('Kabir Singh')).toBeInTheDocument();

    // Active/Inactive badges
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    // Aarav has tag 'vip'
    expect(screen.getByText('vip')).toBeInTheDocument();

    // Checkboxes for active members are enabled; inactive member checkbox is disabled
    expect(screen.getByLabelText('Select Aarav Sharma')).not.toBeDisabled();
    expect(screen.getByLabelText('Select Diya Patel')).not.toBeDisabled();
    expect(screen.getByLabelText('Select Kabir Singh')).toBeDisabled();
  });

  it('selects active members with the master checkbox, ignoring inactive ones', async () => {
    render(<MembersPage />);
    await screen.findByText('Aarav Sharma');

    const selectAll = screen.getByLabelText('Select all active members');
    await userEvent.click(selectAll);

    expect(screen.getByLabelText('Select Aarav Sharma')).toBeChecked();
    expect(screen.getByLabelText('Select Diya Patel')).toBeChecked();
    expect(screen.getByLabelText('Select Kabir Singh')).not.toBeChecked();

    // Toolbar appears showing 2 members selected
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/members selected/i)).toBeInTheDocument();

    // Clicking master checkbox again clears selection
    await userEvent.click(selectAll);
    expect(screen.getByLabelText('Select Aarav Sharma')).not.toBeChecked();
    expect(screen.getByLabelText('Select Diya Patel')).not.toBeChecked();
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument();
  });

  it('applies bulk tag add to selected active members via API and shows confirmation', async () => {
    mocked.bulkUpdateMemberTags.mockResolvedValue({ updatedCount: 2 });
    render(<MembersPage />);
    await screen.findByText('Aarav Sharma');

    // Select two active members
    await userEvent.click(screen.getByLabelText('Select Aarav Sharma'));
    await userEvent.click(screen.getByLabelText('Select Diya Patel'));

    // Bulk toolbar appears
    expect(screen.getByRole('region', { name: 'Bulk actions' })).toBeInTheDocument();

    // Set tag name and apply
    await userEvent.selectOptions(screen.getByLabelText('Tag action'), 'add');
    await userEvent.type(screen.getByLabelText('Tag name'), 'premium');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    // Verifies API call to bulk update
    await waitFor(() =>
      expect(mocked.bulkUpdateMemberTags).toHaveBeenCalledWith({
        memberIds: [1, 2],
        action: 'add',
        tag: 'premium',
      }),
    );

    // Shows confirmation message with count
    expect(await screen.findByRole('status')).toHaveTextContent('Successfully updated 2 members.');

    // Clears selection and reloads member list
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument();
    expect(mocked.getMembers.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('applies bulk tag remove to selected active members via API', async () => {
    mocked.bulkUpdateMemberTags.mockResolvedValue({ count: 1 });
    render(<MembersPage />);
    await screen.findByText('Aarav Sharma');

    await userEvent.click(screen.getByLabelText('Select Aarav Sharma'));
    await userEvent.selectOptions(screen.getByLabelText('Tag action'), 'remove');
    await userEvent.type(screen.getByLabelText('Tag name'), 'vip');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(mocked.bulkUpdateMemberTags).toHaveBeenCalledWith({
        memberIds: [1],
        action: 'remove',
        tag: 'vip',
      }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent('Successfully updated 1 member.');
  });

  it('prevents submission and shows validation error stating maximum is 50 when > 50 members are selected', async () => {
    // Generate 55 active members
    const manyMembers = Array.from({ length: 55 }, (_, i) =>
      member({ id: i + 1, name: `Member ${i + 1}`, email: `m${i + 1}@example.com`, active: true }),
    );
    mocked.getMembers.mockResolvedValue(manyMembers);

    render(<MembersPage />);
    await screen.findByText('Member 1');

    // Select all 55 members using master checkbox
    await userEvent.click(screen.getByLabelText('Select all active members'));

    // Check toolbar shows count and maximum is 50 notice
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('(maximum is 50)')).toBeInTheDocument();

    // Enter a tag and attempt submission
    await userEvent.type(screen.getByLabelText('Tag name'), 'alumni');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    // Verifies submission was prevented (no API call)
    expect(mocked.bulkUpdateMemberTags).not.toHaveBeenCalled();

    // Verifies validation error is displayed stating the maximum is 50
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/maximum is 50/i);
  });

  it('shows error if tag name is empty when applying bulk tag update', async () => {
    render(<MembersPage />);
    await screen.findByText('Aarav Sharma');

    await userEvent.click(screen.getByLabelText('Select Aarav Sharma'));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(mocked.bulkUpdateMemberTags).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Tag name is required');
  });

  it('shows error alert when bulk tag update API fails', async () => {
    mocked.bulkUpdateMemberTags.mockRejectedValue(new Error('Server error updating tags'));
    render(<MembersPage />);
    await screen.findByText('Aarav Sharma');

    await userEvent.click(screen.getByLabelText('Select Aarav Sharma'));
    await userEvent.type(screen.getByLabelText('Tag name'), 'vip');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error updating tags');
  });

  it('clears selection when Clear selection button is clicked', async () => {
    render(<MembersPage />);
    await screen.findByText('Aarav Sharma');

    await userEvent.click(screen.getByLabelText('Select Aarav Sharma'));
    expect(screen.getByRole('region', { name: 'Bulk actions' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Select Aarav Sharma')).not.toBeChecked();
  });
});
