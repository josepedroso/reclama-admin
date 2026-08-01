import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchHealthStatus } from './health';

describe('fetchHealthStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
  }

  it('retorna "ok" quando a API responde 200 com status ok', async () => {
    mockFetch({ ok: true, json: async () => ({ status: 'ok' }) });

    await expect(fetchHealthStatus()).resolves.toBe('ok');
  });

  it('retorna "offline" quando a resposta não é ok', async () => {
    mockFetch({ ok: false, json: async () => ({}) });

    await expect(fetchHealthStatus()).resolves.toBe('offline');
  });

  it('retorna "offline" quando o corpo não tem status ok', async () => {
    mockFetch({ ok: true, json: async () => ({ status: 'down' }) });

    await expect(fetchHealthStatus()).resolves.toBe('offline');
  });

  it('retorna "offline" quando a requisição falha (rede)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    await expect(fetchHealthStatus()).resolves.toBe('offline');
  });
});
