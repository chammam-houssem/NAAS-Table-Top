export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SyncResult {
  conflicts: string[];
  success: boolean;
}

export function createSupabaseClient(_config: SupabaseConfig) {
  console.warn('Supabase sync is optional and not enabled by default.');
  return {
    async sync(): Promise<SyncResult> {
      return { conflicts: [], success: true };
    },
  };
}
