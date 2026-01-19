/**
 * Admin Sliders API Route
 * 
 * Admin'lerin slider yönetimi için API route
 * Service role key kullanarak RLS'yi bypass eder
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { Profile, HeroSlider } from '@/types/database';

// GET: Tüm sliderları getir
export async function GET() {
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

    // Admin kontrolü (service role key ile RLS bypass)
    const supabaseAdmin = getAdminClient();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Tüm sliderları getir
    const { data: sliders, error: slidersError } = await (supabaseAdmin
      .from('hero_sliders') as any)
      .select('*')
      .order('display_order', { ascending: true });

    if (slidersError) {
      return NextResponse.json(
        { error: `Sliderlar yüklenirken hata: ${slidersError.message}` },
        { status: 500 }
      );
    }

    // Type assertion for sliders array
    const typedSliders = (sliders || []) as HeroSlider[];

    return NextResponse.json({ sliders: typedSliders });
  } catch (error: any) {
    console.error('Sliders GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST: Yeni slider ekle
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Kullanıcı kontrolü
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin kontrolü (service role key ile RLS bypass)
    let supabaseAdmin;
    try {
      // Service role key kontrolü
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable tanımlı değil!');
        return NextResponse.json(
          { 
            error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY environment variable tanımlı değil. Lütfen .env.local dosyanızı kontrol edin.',
            code: 'MISSING_SERVICE_ROLE_KEY'
          },
          { status: 500 }
        );
      }
      
      supabaseAdmin = getAdminClient();
      console.log('✅ Admin client başarıyla oluşturuldu');
    } catch (adminClientError: any) {
      console.error('❌ Admin client error:', adminClientError);
      return NextResponse.json(
        { 
          error: 'Server configuration error: ' + adminClientError.message,
          code: 'ADMIN_CLIENT_ERROR'
        },
        { status: 500 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, image_url, link_url, display_order, is_active } = body;

    // Yeni slider ekle
    console.log('Inserting slider with data:', {
      title,
      description: description || null,
      image_url: image_url || null,
      link_url: link_url || null,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : true,
    });

    // Service role key ile insert yap (RLS bypass)
    console.log('About to insert slider with supabaseAdmin client');
    console.log('Service role key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const insertData = {
      title,
      description: description || null,
      image_url: image_url || null,
      link_url: link_url || null,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : true,
    };
    
    console.log('Insert data:', insertData);

    const { data: newSlider, error: insertError } = await (supabaseAdmin
      .from('hero_sliders') as any)
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ INSERT ERROR:', insertError);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      console.error('Error hint:', insertError.hint);
      
      // Eğer RLS hatası ise, daha açıklayıcı mesaj ver
      if (insertError.code === '42501' || insertError.message?.includes('row-level security')) {
        return NextResponse.json(
          { 
            error: 'RLS hatası: Service role key düzgün yapılandırılmamış olabilir. Lütfen SUPABASE_SERVICE_ROLE_KEY environment variable\'ını kontrol edin.',
            details: insertError.message,
            code: insertError.code
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `Slider eklenirken hata: ${insertError.message}`, 
          details: insertError,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    console.log('✅ Slider başarıyla eklendi:', newSlider);

    return NextResponse.json({ success: true, slider: newSlider });
  } catch (error: any) {
    console.error('Slider POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT: Slider güncelle
export async function PUT(request: Request) {
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

    // Admin kontrolü (service role key ile RLS bypass)
    const supabaseAdmin = getAdminClient();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, image_url, link_url, display_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Slider ID gerekli' }, { status: 400 });
    }

    // Sadece gönderilen alanları güncelle
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (link_url !== undefined) updateData.link_url = link_url || null;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Slider güncelle
    const { data: updatedSlider, error: updateError } = await (supabaseAdmin
      .from('hero_sliders') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Slider güncellenirken hata: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, slider: updatedSlider });
  } catch (error: any) {
    console.error('Slider PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE: Slider sil
export async function DELETE(request: Request) {
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

    // Admin kontrolü (service role key ile RLS bypass)
    const supabaseAdmin = getAdminClient();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Slider ID gerekli' }, { status: 400 });
    }

    // Slider sil
    const { error: deleteError } = await supabaseAdmin
      .from('hero_sliders')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: `Slider silinirken hata: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Slider DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
