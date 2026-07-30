import { useEffect, useState } from 'react';
import { fetchHealthStatus, type HealthStatus } from './services/health';

function App() {
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    fetchHealthStatus().then(setStatus);
  }, []);

  const statusLabel = status === 'checking' ? 'verificando...' : status === 'ok' ? 'ok' : 'offline';

  return (
    <>
      <h1>Painel de Moderação — ReclamaApp</h1>
      <p>API: {statusLabel}</p>
    </>
  );
}

export default App;
