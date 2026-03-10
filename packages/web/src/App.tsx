export function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '3rem',
        background:
          'radial-gradient(circle at top, rgba(88,166,255,0.16), transparent 45%), #0d1117',
        color: '#e6edf3',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: '#8b949e' }}>
        PaperParser v2
      </p>
      <h1 style={{ marginTop: '0.5rem', fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
        React workspace shell is ready.
      </h1>
      <p style={{ maxWidth: '48rem', lineHeight: 1.7, color: '#c9d1d9' }}>
        Batch 1 only bootstraps the React app. The data stores, page shell, and D3 components land in
        later batches after the core graph and bundle pipeline exist.
      </p>
    </main>
  );
}
