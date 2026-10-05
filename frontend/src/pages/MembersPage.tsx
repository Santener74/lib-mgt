import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { MemberForm } from '../components/MemberForm';
import type { Member, MemberInput } from '../types';
import { errorMessage, formatDate } from '../utils';

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | 'new' | null>(null);

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
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="card table-card">
        {loading ? (
          <p className="muted">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="muted">No members found.</p>
        ) : (
          <table>
            <thead>
              <tr>
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
                  <td><strong>{member.name}</strong></td>
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
