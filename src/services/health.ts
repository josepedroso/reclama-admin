import { API_BASE_URL } from '../config/api';

export type HealthStatus = 'checking' | 'ok' | 'offline';

export async function fetchHealthStatus(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      return 'offline';
    }
    const data = await response.json();
    return data.status === 'ok' ? 'ok' : 'offline';
  } catch {
    return 'offline';
  }
}
