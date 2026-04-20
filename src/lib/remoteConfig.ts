import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type FeatureFlags = {
  community_search: boolean;
  deals_banner: boolean;
  fuel_type_picker: boolean;
};

export type HomeConfig = {
  show_gas_carousel: boolean;
  show_community_pulse: boolean;
  snapshot_metrics: string[];
};

const DEFAULT_FLAGS: FeatureFlags = {
  community_search: true,
  deals_banner: true,
  fuel_type_picker: true,
};

/**
 * Fetches feature flags from the app_config table (Supabase).
 * Falls back to DEFAULT_FLAGS if the user is offline or the table doesn't exist yet.
 *
 * Usage:
 *   const { flags } = useRemoteConfig();
 *   if (flags.community_search) { ... }
 */
export function useRemoteConfig() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);

  useEffect(() => {
    supabase
      .from('app_config')
      .select('key, value')
      .eq('key', 'feature_flags')
      .single()
      .then(({ data }) => {
        if (data?.value) setFlags(data.value as FeatureFlags);
      });
  }, []);

  return { flags };
}
