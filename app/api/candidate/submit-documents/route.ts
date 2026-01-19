/**
 * Aday Belgeleri Onaya Gönderme API Route
 * 
 * Adayların yüklediği DRAFT belgeleri PENDING durumuna getirir
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Profile } from '@/types/database';

export async function POST() {
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

    // Profil kontrolü - sadece CANDIDATE belgelerini gönderebilir
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile || profile.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Kullanıcının DRAFT belgelerini ve henüz consultant tarafından incelenmemiş PENDING belgelerini al
    const { data: allDocuments, error: fetchError } = await supabase
      .from('documents')
      .select('id, document_type, status, reviewed_by')
      .eq('profile_id', user.id)
      .in('status', ['DRAFT', 'PENDING']);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Sadece DRAFT veya reviewed_by null olan PENDING belgeleri filtrele
    const documentsToSubmit = allDocuments?.filter((doc) => 
      doc.status === 'DRAFT' || (doc.status === 'PENDING' && !doc.reviewed_by)
    ) || [];

    if (documentsToSubmit.length === 0) {
      return NextResponse.json({ 
        error: 'Gönderilecek belge bulunamadı. Tüm belgeler zaten gönderilmiş veya incelenmiş.',
        submitted: 0 
      }, { status: 400 });
    }

    // Tüm DRAFT belgeleri ve henüz incelenmemiş PENDING belgeleri PENDING durumuna getir
    const documentIds = documentsToSubmit.map(doc => doc.id);
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: 'PENDING',
        reviewed_by: null, // Güvence için null yap
        reviewed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', user.id)
      .in('id', documentIds);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      submitted: documentsToSubmit.length,
      message: `${documentsToSubmit.length} belge onaya gönderildi`
    });
  } catch (error: any) {
    console.error('Error submitting documents:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}
