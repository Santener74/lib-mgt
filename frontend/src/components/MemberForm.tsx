import { useState, type FormEvent } from 'react';
import type { Member, MemberInput } from '../types';
import { errorMessage, validateMember, type MemberFormValues } from '../utils';

interface Props {
  initial?: Member | null;
  onSubmit: (input: MemberInput) => Promise<void> | void;
  onCancel: () => void;
}

export function MemberForm({ initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<MemberFormValues>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    active: initial?.active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateMember(values);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        active: values.active,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h3>{initial ? 'Edit member' : 'Register a new member'}</h3>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className="form-grid">
        <label>
          Name
          <input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
        </label>
        <label>
          Email
          <input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
        </label>
        <label>
          Phone
          <input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(e) => setValues({ ...values, active: e.target.checked })}
          />
          Active member
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add member'}
        </button>
      </div>
    </form>
  );
}
