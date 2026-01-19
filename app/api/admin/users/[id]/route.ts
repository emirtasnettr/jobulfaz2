/**
 * Admin User Update API Route
 * 
 * Admin kullanıcı güncelleme işlemleri (şifre değiştirme, pasif etme)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { Profile } from '@/types/database';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
): Promise<NextResponse> {
  try {
    // Params'ı Promise ise resolve et
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const supabase = await createClient();

    // Admin kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { password, isActive } = body;

    // Şifre değiştirme
    if (password) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: password,
      });

      if (passwordError) {
        return NextResponse.json({ error: passwordError.message }, { status: 500 });
      }
    }

    // Üyeliği pasif/aktif etme
    if (isActive !== undefined) {
      // Profiles tablosunda is_active kolonunu güncelle
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', id);

      if (profileUpdateError) {
        return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
      }

      // Metadata'da da sakla (opsiyonel)
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: {
          is_active: isActive,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
