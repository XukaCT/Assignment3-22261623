import { useEffect, useState } from 'react';
import { api } from '../api.js';

const SAMPLE_ENTRIES = [
  {
    project: 'SmartFarm Irrigation',
    title: 'Debug cloud deployment',
    version: 'v3',
    category: 'Coding',
    rotate: '-1.1deg'
  },
  {
    project: 'CSE3CWA Essay',
    title: 'Tighten thesis paragraph',
    version: 'v1',
    category: 'Writing',
    rotate: '0.8deg'
  },
  {
    project: 'Thesis Lit Review',
    title: 'Summarise 6 papers on RAG',
    version: 'v2',
    category: 'Research',
    rotate: '-0.4deg'
  }
];

export default function Landing() {
  const [health, setHealth] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    api.health().then((res) => {
      if (cancelled) return;
      setHealth(res.ok && res.body?.status === 'ok' ? 'ok' : 'unreachable');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <header className="container" style={{ paddingTop: 28, paddingBottom: 8 }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
            AI CAPSULE
          </span>
          <span
            className={`tag ${health === 'ok' ? 'tag-teal' : ''}`}
            title="Live status of GET /api/health"
          >
            api: {health}
          </span>
        </nav>
      </header>

      <main className="container" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
            gap: 64,
            alignItems: 'start'
          }}
        >
          <section>
            <h1 style={{ fontSize: 44, lineHeight: 1.15, maxWidth: 480 }}>
              Keep the prompts that actually worked.
            </h1>
            <p style={{ marginTop: 20, color: 'var(--muted)', fontSize: 17, maxWidth: 440 }}>
              You already spend hours refining prompts in ChatGPT, Copilot, Gemini and Claude.
              AI Capsule is a private log for the ones worth keeping — the project it was for,
              what version it reached, whether it was actually useful, and what you'd change
              next time.
            </p>

            <div style={{ marginTop: 32, display: 'flex', gap: 12, alignItems: 'center' }}>
              <a className="btn" href={api.loginUrl}>
                Sign in with GitHub
              </a>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                Opens GitHub OAuth, then returns you to your dashboard
              </span>
            </div>

            <dl
              style={{
                marginTop: 56,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, auto)',
                gap: 28,
                borderTop: '1px solid var(--line)',
                paddingTop: 20,
                maxWidth: 440
              }}
            >
              <div>
                <dt style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                  01
                </dt>
                <dd style={{ margin: '4px 0 0', fontSize: 14 }}>Log a prompt after it works</dd>
              </div>
              <div>
                <dt style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                  02
                </dt>
                <dd style={{ margin: '4px 0 0', fontSize: 14 }}>Rate, review, and iterate</dd>
              </div>
              <div>
                <dt style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                  03
                </dt>
                <dd style={{ margin: '4px 0 0', fontSize: 14 }}>Reuse it on the next project</dd>
              </div>
            </dl>
          </section>

          <section aria-hidden="true" style={{ paddingTop: 12 }}>
            {SAMPLE_ENTRIES.map((entry) => (
              <div
                key={entry.title}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  padding: '16px 18px',
                  marginBottom: 16,
                  transform: `rotate(${entry.rotate})`,
                  boxShadow: '0 1px 0 var(--line)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{entry.project}</span>
                  <span className="tag">{entry.version}</span>
                </div>
                <p style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontSize: 17 }}>
                  {entry.title}
                </p>
                <span className="tag tag-amber" style={{ marginTop: 10, display: 'inline-block' }}>
                  {entry.category}
                </span>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
