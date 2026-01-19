/**
 * Supabase Query Helpers
 * 
 * Type-safe Supabase query helper'ları
 */

import type { Database } from './types';
import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { PostgrestError } from '@supabase/supabase-js';

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

/**
 * Type-safe insert query
 */
export async function insertRow<T extends TableName>(
  client: SupabaseClientType<Database>,
  tableName: T,
  data: TableInsert<T>
): Promise<{ data: TableRow<T> | null; error: PostgrestError | null }> {
  const result = await client
    .from(tableName)
    .insert(data)
    .select()
    .single();
  
  if (result.error) {
    return { data: null, error: result.error };
  }
  return { data: result.data as TableRow<T>, error: null };
}

/**
 * Type-safe update query
 */
export async function updateRow<T extends TableName>(
  client: SupabaseClientType<Database>,
  tableName: T,
  id: string,
  data: TableUpdate<T>
): Promise<{ data: TableRow<T> | null; error: PostgrestError | null }> {
  const result = await client
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (result.error) {
    return { data: null, error: result.error };
  }
  return { data: result.data as TableRow<T>, error: null };
}

/**
 * Type-safe upsert query
 */
export async function upsertRow<T extends TableName>(
  client: SupabaseClientType<Database>,
  tableName: T,
  data: TableInsert<T>,
  onConflict?: string
): Promise<{ data: TableRow<T> | null; error: PostgrestError | null }> {
  const result = await client
    .from(tableName)
    .upsert(data, onConflict ? { onConflict } : undefined)
    .select()
    .single();
  
  if (result.error) {
    return { data: null, error: result.error };
  }
  return { data: result.data as TableRow<T>, error: null };
}
