import { useState } from 'react';

const EMPTY = {
  project_name: '',
  prompt_title: '',
  prompt_version: 'v1',
  prompt_text: '',
  response_summary: '',
  category: '',
  usefulness: 'Good',
  reviewed: false,
  improved: false,
  screenshot_url: '',
  notes: ''
};

export default function CapsuleForm({ initial, onSubmit, onCancel, submitLabel = 'Save entry' }) {
  const [values, setValues] = useState({ ...EMPTY, ...initial });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.project_name || !values.prompt_title || !values.prompt_text) {
      setError('Project name, prompt title, and prompt text are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 14 }}>
        <div className="field">
          <label htmlFor="project_name">Project name</label>
          <input id="project_name" value={values.project_name} onChange={update('project_name')} />
        </div>
        <div className="field">
          <label htmlFor="prompt_title">Prompt title</label>
          <input id="prompt_title" value={values.prompt_title} onChange={update('prompt_title')} />
        </div>
        <div className="field">
          <label htmlFor="prompt_version">Version</label>
          <input id="prompt_version" value={values.prompt_version} onChange={update('prompt_version')} />
        </div>
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="prompt_text">Prompt text</label>
        <textarea id="prompt_text" value={values.prompt_text} onChange={update('prompt_text')} />
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="response_summary">Response summary</label>
        <textarea
          id="response_summary"
          value={values.response_summary}
          onChange={update('response_summary')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="field">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            placeholder="Coding / Writing / Research"
            value={values.category}
            onChange={update('category')}
          />
        </div>
        <div className="field">
          <label htmlFor="usefulness">Usefulness</label>
          <select id="usefulness" value={values.usefulness} onChange={update('usefulness')}>
            <option>Good</option>
            <option>Needs Improvement</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="screenshot_url">Screenshot URL</label>
          <input id="screenshot_url" value={values.screenshot_url} onChange={update('screenshot_url')} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={!!values.reviewed} onChange={update('reviewed')} />
          Reviewed
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={!!values.improved} onChange={update('improved')} />
          Improved
        </label>
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" value={values.notes} onChange={update('notes')} />
      </div>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 13.5, marginTop: 14 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button type="submit" className="btn btn-sm" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
