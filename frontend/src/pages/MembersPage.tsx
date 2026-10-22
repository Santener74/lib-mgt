import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { BulkTagToolbar } from '../components/BulkTagToolbar';
import { MemberForm } from '../components/MemberForm';
import type { Member, MemberInput, TagAction } from '../types';
import { errorMessage, formatDate } from '../utils';

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | 'new' | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (term: string) => {
    try {
      setMembers(await api.getMembers(term));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 250);
    return () => clearTimeout(timer);
  }, [search, load]);

  const activeMembers = members.filter((m) => m.active);
  const isAllActiveSelected =
    activeMembers.length > 0 &&
    activeMembers.every((m) => selectedIds.includes(m.id));
  const isIndeterminate =
    activeMembers.some((m) => selectedIds.includes(m.id)) && !isAllActiveSelected;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleSelectAll = () => {
    setNotice(null);
    if (isAllActiveSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeMembers.map((m) => m.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setNotice(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleApplyBulkTag = async (action: TagAction, tag: string) => {
    setError(null);
    setNotice(null);

    if (selectedIds.length === 0) {
      setError('Please select at least one active member.');
      return;
    }

    if (selectedIds.length > 50) {
      setError('Cannot update tags: maximum is 50 members.');
      return;
    }

    const cleanTag = tag.trim();
    if (!cleanTag) {
      setError('Tag name is required.');
      return;
    }

    setBulkSubmitting(true);
    try {
      const res = await api.bulkUpdateMemberTags({
        memberIds: selectedIds,
        action,
        tag: cleanTag,
      });
      const count = res?.updatedCount ?? res?.updated ?? res?.count ?? selectedIds.length;
      setNotice(`Successfully updated ${count} member${count === 1 ? '' : 's'}.`);
      setSelectedIds([]);
      await load(search);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleSubmit = async (input: MemberInput) => {
    if (editing && editing !== 'new') {
      await api.updateMember(editing.id, input);
    } else {
      await api.createMember(input);
    }
    setEditing(null);
    await load(search);
  };

  const handleDelete = async (member: Member) => {
    if (!window.confirm(`Delete member "${member.name}"?`)) return;
    try {
      await api.deleteMember(member.id);
      setSelectedIds((prev) => prev.filter((id) => id !== member.id));
      await load(search);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Members</h1>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add member
        </button>
      </header>

      {editing && (
        <MemberForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      )}

      <input
        className="search"
        type="search"
        placeholder="Search by name, email or phone…"
        aria-label="Search members"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setNotice(null);
        }}
      />

      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {selectedIds.length > 0 && (
        <BulkTagToolbar
          selectedCount={selectedIds.length}
          onSubmit={handleApplyBulkTag}
          onClear={() => setSelectedIds([])}
          loading={bulkSubmitting}
        />
      )}

      <div className="card table-card">
        {loading ? (
          <p className="muted">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="muted">No members found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    aria-label="Select all active members"
                    checked={isAllActiveSelected}
                    ref={masterCheckboxRef}
                    disabled={activeMembers.length === 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${member.name}`}
                      checked={selectedIds.includes(member.id)}
                      disabled={!member.active}
                      title={member.active ? undefined : 'Only active members can be selected'}
                      onChange={() => handleToggleSelect(member.id)}
                    />
                  </td>
                  <td>
                    <strong>{member.name}</strong>
                    {member.tags && member.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        {member.tags.map((t) => (
                          <span key={t} className="pill">{t}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{member.email}</td>
                  <td>{member.phone ?? '—'}</td>
                  <td>{formatDate(member.joinedAt)}</td>
                  <td>
                    <span className={`badge ${member.active ? 'badge-active' : 'badge-inactive'}`}>
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn btn-small" onClick={() => setEditing(member)}>Edit</button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(member)}>Delete</button>
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
