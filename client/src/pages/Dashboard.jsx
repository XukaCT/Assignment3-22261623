import { useEffect, useState } from 'react';
import { api } from '../api.js';
import CapsuleForm from '../components/CapsuleForm.jsx';
import CapsuleRow from '../components/CapsuleRow.jsx';

// Auth state: 'checking' | 'authed' | 'anonymous'
export default function Dashboard() {
  const [authState, setAuthState] = useState('checking');
  const [capsules, setCapsules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    const res = await api.listCapsules();
    if (res.status === 401) {
      setAuthState('anonymous');
      return;
    }
    if (!res.ok) {
      setLoadError('Could not load your capsules. Please try again.');
      return;
    }
    setCapsules(Array.isArray(res.body) ? res.body : []);
    setAuthState('authed');
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (values) => {
    const res = await api.createCapsule(values);
    if (res.ok) {
      setShowForm(false);
      await load();
    } else {
      throw new Error(res.body?.error || 'Failed to create capsule');
    }
  };

  const handleUpdate = async (id, values) => {
    const res = await api.updateCapsule(id, values);
    if (res.ok) {
      await load();
    } else {
      throw new Error(res.body?.error || 'Failed to update capsule');
    }
  };

  const handleDelete = async (id) => {
    const res = await api.deleteCapsule(id);
    if (res.ok) {
      setCapsules((c) => c.filter((cap) => cap.id !== id));
    } else {
      throw new Error(res.body?.error || 'Failed to delete capsule');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setAuthState('anonymous');
  };

  if (authState === 'checking') {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <p style={{ color: 'var(--muted)' }}>Checking your session…</p>
      </div>
    );
  }

  if (authState === 'anonymous') {
    return (
      <div className="container" style={{ paddingTop: 40, maxWidth: 480 }}>
        <h1 style={{ fontSize: 26 }}>You're not signed in</h1>
        <p style={{ marginTop: 12, color: 'var(--muted)' }}>
          Your session has ended or you haven't logged in yet. Sign in with GitHub to view your
          capsule log.
        </p>
        <a className="btn" style={{ marginTop: 20 }} href={api.loginUrl}>
          Sign in with GitHub
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 28,
          borderBottom: '1px solid var(--line)',
          paddingBottom: 20
        }}
      >
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
            AI CAPSULE
          </span>
          <h1 style={{ fontSize: 28, marginTop: 4 }}>Your capsule log</h1>
          <p style={{ marginTop: 6, color: 'var(--muted)', fontSize: 14 }}>
            {capsules.length} {capsules.length === 1 ? 'entry' : 'entries'} saved
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close form' : 'New entry'}
          </button>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      {loadError && <p style={{ color: 'var(--danger)', marginBottom: 20 }}>{loadError}</p>}

      {showForm && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: 20,
            marginBottom: 24
          }}
        >
          <CapsuleForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {capsules.length === 0 && !showForm ? (
        <div
          style={{
            border: '1px dashed var(--line)',
            borderRadius: 4,
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--muted)'
          }}
        >
          <p>No capsules logged yet.</p>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}>
            Log your first prompt
          </button>
        </div>
      ) : (
        capsules.map((capsule) => (
          <CapsuleRow
            key={capsule.id}
            capsule={capsule}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
}
