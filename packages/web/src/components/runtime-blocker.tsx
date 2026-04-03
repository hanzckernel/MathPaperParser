export function RuntimeBlockerPage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main
      data-runtime-blocker="true"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background:
          'radial-gradient(circle at top, rgba(234, 179, 8, 0.14), transparent 30%), radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.12), transparent 25%), #0f172a',
        color: '#e5eef9',
        fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          width: 'min(720px, 100%)',
          border: '1px solid rgba(248, 113, 113, 0.24)',
          borderRadius: '22px',
          background: 'rgba(15, 23, 42, 0.82)',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.35)',
          padding: '1.5rem',
          display: 'grid',
          gap: '0.9rem',
        }}
      >
        <div style={{ textTransform: 'uppercase', letterSpacing: '0.16em', color: '#fca5a5', fontSize: '0.82rem', fontWeight: 700 }}>
          Unsupported runtime
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.9rem, 4vw, 2.8rem)' }}>{title}</h1>
        <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>{message}</p>
        <div
          style={{
            borderRadius: '16px',
            background: 'rgba(2, 6, 23, 0.72)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            padding: '1rem',
            overflowX: 'auto',
          }}
        >
          <code style={{ color: '#f8fafc', fontSize: '0.95rem' }}>python3 -m http.server 8000</code>
        </div>
      </section>
    </main>
  );
}
