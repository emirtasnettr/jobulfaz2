/**
 * Middleman Yeni Aday Oluşturma API Route
 * 
 * Service Role API kullanarak yeni aday kullanıcısı oluşturur
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { Profile } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // Environment variables kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!supabaseServiceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
      return NextResponse.json(
        { error: 'Service Role Key is not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.' },
        { status: 500 }
      );
    }
    // Middleman kontrolü
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', user.id)
      .single<Profile>();

    if (!profile || profile.role !== 'MIDDLEMAN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    // Request body'den verileri al
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'E-posta, şifre ve ad soyad gereklidir' },
        { status: 400 }
      );
    }

    // Service Role client oluştur (RLS'i bypass eder)
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Yeni kullanıcı oluştur
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Email onayını atla (test için)
      user_metadata: {
        full_name: fullName,
        role: 'CANDIDATE',
      },
    });

    if (authError || !authUser.user) {
      console.error('Error creating user:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Kullanıcı oluşturulamadı' },
        { status: 400 }
      );
    }

    // Trigger otomatik olarak profile oluşturur, middleman_id'yi güncelle
    // Kısa bir bekleme ekleyelim (trigger'ın çalışması için)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        middleman_id: profile.id,
        full_name: fullName,
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Eğer profile yoksa, manuel oluştur
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          full_name: fullName,
          role: 'CANDIDATE',
          middleman_id: profile.id,
        });

      if (insertError) {
        console.error('Error inserting profile:', insertError);
        // Kullanıcıyı sil (rollback)
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json(
          { error: 'Profil oluşturulamadı' },
          { status: 500 }
        );
      }
    }

    // Email'i candidate_info'ya kaydet
    await new Promise((resolve) => setTimeout(resolve, 200));
    const { error: candidateInfoError } = await supabaseAdmin
      .from('candidate_info')
      .upsert({
        profile_id: authUser.user.id,
        email: email,
      }, { onConflict: 'profile_id' });

    if (candidateInfoError) {
      console.error('Error saving email to candidate_info:', candidateInfoError);
      // Hata olsa bile devam et, email olmadan da çalışabilir
    }

    return NextResponse.json({
      success: true,
      userId: authUser.user.id,
      email: authUser.user.email,
    });
  } catch (error: any) {
    console.error('Error in create-candidate API:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
