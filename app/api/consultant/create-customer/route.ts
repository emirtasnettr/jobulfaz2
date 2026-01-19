/**
 * Consultant Create Customer API Route
 * 
 * Consultant'ların müşteri hesabı oluşturması için API endpoint'i
 * Service role key kullanarak RLS'yi bypass eder
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { Profile } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Kullanıcı kontrolü
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Consultant kontrolü
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile || !['CONSULTANT', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Only consultants can create customers' }, { status: 403 });
    }

    // Request body'den verileri al
    const body = await request.json();
    const { email, password, full_name } = body;

    // Validasyon
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password and full_name are required' }, { status: 400 });
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Şifre uzunluk kontrolü
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Kullanıcı zaten var mı kontrol et
    try {
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      if (existingUser?.user) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
      }
    } catch (error) {
      // Kullanıcı bulunamadıysa devam et (yeni kullanıcı oluşturulabilir)
    }

    // Supabase Auth API ile müşteri kullanıcısı oluştur
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Email'i otomatik onayla
      user_metadata: {
        full_name: full_name,
        role: 'CUSTOMER',
      },
      app_metadata: {
        role: 'CUSTOMER',
      },
    });

    if (createUserError || !authUser?.user) {
      console.error('Error creating user:', createUserError);
      return NextResponse.json(
        { error: createUserError?.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    const userId = authUser.user.id;

    // Profile oluştur veya güncelle (RLS bypass ile)
    const { data: profileData, error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: full_name,
          role: 'CUSTOMER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      )
      .select()
      .single();

    if (profileCreateError || !profileData) {
      console.error('Error creating profile:', profileCreateError);
      // Rollback: Auth'dan oluşturulan kullanıcıyı sil
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        console.error('Error deleting user after profile creation failure:', deleteError);
      }
      return NextResponse.json(
        { error: profileCreateError?.message || 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email,
        full_name: full_name,
        role: 'CUSTOMER',
      },
      message: 'Customer created successfully',
    });
  } catch (error: any) {
    console.error('Error in create-customer API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
