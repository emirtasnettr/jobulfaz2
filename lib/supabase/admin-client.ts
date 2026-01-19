/**
 * Supabase Admin Client Cache
 * 
 * Service role key ile oluşturulan admin client'ı cache'ler
 * Her API route'da yeni client oluşturmak yerine cache'lenmiş client kullanılır
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';

let cachedAdminClient: ReturnType<typeof createServiceClient> | null = null;

/**
 * Cache'lenmiş admin client'ı döndürür
 * İlk çağrıda oluşturur, sonraki çağrılarda cache'den döner
 */
export function getAdminClient() {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('Supabase admin credentials not configured');
  }

  cachedAdminClient = createServiceClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return cachedAdminClient;
}
