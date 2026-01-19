/**
 * Admin Users API Route
 * 
 * Admin kullanıcılar için tüm kullanıcıları ve email bilgilerini döndürür
 * Service role key kullanarak RLS'yi bypass eder
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { Profile } from '@/types/database';

export async function GET() {
  try {
    const supabase = await createClient();

    // Kullanıcı kontrolü (sadece auth kontrolü, RLS bypass için service role kullanacağız)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Service role key ile admin kontrolü yap (RLS bypass)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY bulunamadı');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = getAdminClient();

    // Admin kontrolü service role key ile (RLS bypass)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Tüm profilleri al (RLS bypass)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Email bilgilerini almak için auth.users tablosuna eriş
    // Service role key ile auth.users'a erişebiliriz
    const userIds = profiles.map(p => p.id);
    
    // Her kullanıcı için email bilgisini al
    const usersWithEmail = await Promise.all(
      profiles.map(async (prof) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(prof.id);
          return {
            ...prof,
            email: authUser?.user?.email || '-',
            is_active: prof.is_active !== undefined ? prof.is_active : true,
          };
        } catch (error) {
          return {
            ...prof,
            email: '-',
            is_active: prof.is_active !== undefined ? prof.is_active : true,
          };
        }
      })
    );
    return NextResponse.json({ 
      users: usersWithEmail,
      adminProfile: profile
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
