export interface FirebaseConnectionStatus {
  configured: boolean;
  connected: boolean;
  schema_ready: boolean;
  mode: 'firebase_cloud' | 'configured_offline' | 'local_sqlite_fallback';
  project_id: string;
  project_masked: string;
  latency_ms: number | null;
  last_error: string | null;
  last_checked_at: string | null;
  synced_records: number;
  last_sync_at: string | null;
  collections: string[];
}

export const DEFAULT_FIREBASE_STATUS: FirebaseConnectionStatus = {
  configured: false,
  connected: false,
  schema_ready: false,
  mode: 'local_sqlite_fallback',
  project_id: '',
  project_masked: '',
  latency_ms: null,
  last_error: null,
  last_checked_at: null,
  synced_records: 0,
  last_sync_at: null,
  collections: ['users', 'production_sites', 'telemetry', 'alarm_events'],
};

async function fetchJsonWithBackendFallback<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(path, init);
    if (res.ok) return (await res.json()) as T;
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.detail || `HTTP_${res.status}`);
  } catch (err) {
    if (err instanceof TypeError) {
      const alt = await fetch(`http://localhost:8000${path}`, init);
      if (alt.ok) return (await alt.json()) as T;
      const altErr = await alt.json().catch(() => ({}));
      throw new Error(altErr?.detail || `HTTP_${alt.status}`);
    }
    throw err;
  }
}

export async function fetchFirebaseStatus(
  refresh = false
): Promise<FirebaseConnectionStatus> {
  try {
    return await fetchJsonWithBackendFallback<FirebaseConnectionStatus>(
      `/api/cloud/firebase/status${refresh ? '?refresh=true' : ''}`
    );
  } catch {
    return DEFAULT_FIREBASE_STATUS;
  }
}

export async function configureFirebaseProject(
  projectId: string,
  apiKey = '',
  authToken = ''
): Promise<FirebaseConnectionStatus> {
  return fetchJsonWithBackendFallback<FirebaseConnectionStatus>(
    '/api/cloud/firebase/configure',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        api_key: apiKey,
        auth_token: authToken,
      }),
    }
  );
}

export async function syncBaselineToFirebase(): Promise<{
  success: boolean;
  synced_sites: number;
  synced_users: number;
  synced_telemetry: number;
  status: FirebaseConnectionStatus;
}> {
  return fetchJsonWithBackendFallback('/api/cloud/firebase/sync-baseline', {
    method: 'POST',
  });
}

