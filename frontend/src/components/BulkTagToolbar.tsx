import { useState, type FormEvent } from 'react';
import type { TagAction } from '../types';

interface Props {
  selectedCount: number;
  onSubmit: (action: TagAction, tag: string) => Promise<void> | void;
  onClear: () => void;
  loading?: boolean;
}

export function BulkTagToolbar({ selectedCount, onSubmit, onClear, loading = false }: Props) {
  const [action, setAction] = useState<TagAction>('add');
  const [tag, setTag] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(action, tag);
  };

  return (
    <form className="card bulk-toolbar" onSubmit={handleSubmit} role="region" aria-label="Bulk actions">
      <div className="bulk-toolbar-info">
        <span>
          <strong>{selectedCount}</strong> {selectedCount === 1 ? 'member' : 'members'} selected
        </span>
        {selectedCount > 50 && (
          <span className="text-danger small">(maximum is 50)</span>
        )}
      </div>

      <div className="bulk-toolbar-actions">
        <label className="bulk-toolbar-label">
          <span className="sr-only">Tag action</span>
          <select
            aria-label="Tag action"
            value={action}
            onChange={(e) => setAction(e.target.value as TagAction)}
            disabled={loading}
          >
            <option value="add">Add tag</option>
            <option value="remove">Remove tag</option>
          </select>
        </label>

        <label className="bulk-toolbar-label">
          <span className="sr-only">Tag name</span>
          <input
            type="text"
            placeholder="Enter tag name…"
            aria-label="Tag name"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            disabled={loading}
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Applying…' : 'Apply'}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={onClear}
          disabled={loading}
        >
          Clear selection
        </button>
      </div>
    </form>
  );
}
