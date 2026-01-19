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
import { upsertRow } from '@/lib/supabase/helpers';

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
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

    // Kullanıcı zaten var mı kontrol et (listUsers ile)
    try {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (!listError && usersData?.users) {
        const existingUser = usersData.users.find(u => u.email === email);
        if (existingUser) {
          return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }
      }
    } catch (error) {
      // Kullanıcı listesi alınamadıysa devam et (yeni kullanıcı oluşturulabilir)
      console.log('Could not check existing users, proceeding with creation');
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
    const { data: profileData, error: profileCreateError } = await upsertRow(
      supabaseAdmin,
      'profiles',
      {
        id: userId,
        full_name: full_name,
        role: 'CUSTOMER',
        middleman_id: null,
        is_active: true,
        application_status: null,
      },
      'id'
    );

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
  } catch (error) {
    console.error('Error in create-customer API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
