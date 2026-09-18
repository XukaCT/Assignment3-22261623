import { useState } from 'react';
import CapsuleForm from './CapsuleForm.jsx';

export default function CapsuleRow({ capsule, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async (values) => {
    await onUpdate(capsule.id, values);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${capsule.prompt_title}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await onDelete(capsule.id);
    } catch {
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--teal)',
          borderRadius: 4,
          padding: 20,
          marginBottom: 12
        }}
      >
        <CapsuleForm
          initial={capsule}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Update entry"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 4,
        marginBottom: 12,
        opacity: deleting ? 0.4 : 1
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '14px 18px',
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: 16,
          alignItems: 'center',
          textAlign: 'left'
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16.5 }}>
            {capsule.prompt_title}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            {capsule.project_name}
          </div>
        </div>
        <span className="tag">{capsule.prompt_version || 'v1'}</span>
        {capsule.category && <span className="tag tag-amber">{capsule.category}</span>}
        <span
          className={`tag ${capsule.usefulness === 'Good' ? 'tag-teal' : ''}`}
          style={{ justifySelf: 'end' }}
        >
          {capsule.usefulness || 'unrated'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--line)' }}>
          <div style={{ marginTop: 14, display: 'grid', gap: 10, fontSize: 14.5 }}>
            <div>
              <span style={{ color: 'var(--muted)' }}>Prompt: </span>
              {capsule.prompt_text}
            </div>
            {capsule.response_summary && (
              <div>
                <span style={{ color: 'var(--muted)' }}>Response summary: </span>
                {capsule.response_summary}
              </div>
            )}
            {capsule.notes && (
              <div>
                <span style={{ color: 'var(--muted)' }}>Notes: </span>
                {capsule.notes}
              </div>
            )}
            {capsule.screenshot_url && (
              <div>
                <span style={{ color: 'var(--muted)' }}>Screenshot: </span>
                <a href={capsule.screenshot_url} target="_blank" rel="noreferrer">
                  {capsule.screenshot_url}
                </a>
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--muted)' }}>
              <span>reviewed: {capsule.reviewed ? 'yes' : 'no'}</span>
              <span>improved: {capsule.improved ? 'yes' : 'no'}</span>
              {capsule.created_at && <span>logged: {capsule.created_at}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
