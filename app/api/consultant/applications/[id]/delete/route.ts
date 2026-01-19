/**
 * Consultant Application Delete API Route
 * 
 * Başvuruyu, belgelerini ve bilgilerini siler, adayı NEW_APPLICATION statüsüne döndürür
 * Service Role Key kullanarak RLS'yi bypass eder
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Params'ı Promise ise resolve et
    const resolvedParams = await Promise.resolve(params);
    const profileId = resolvedParams.id;

    console.log('Delete request for profileId:', profileId);

    if (!profileId) {
      return NextResponse.json({ error: 'Profil ID gerekli' }, { status: 400 });
    }

    const supabase = await createClient();

    // Kullanıcı kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY bulunamadı');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = getAdminClient();

    // Consultant veya Admin kontrolü (RLS bypass)
    const { data: consultantProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!consultantProfile || !['CONSULTANT', 'ADMIN'].includes(consultantProfile.role)) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Profil kontrolü (RLS bypass) - sadece profil var mı kontrol ediyoruz
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError) {
      console.error('Profil sorgu hatası:', profileError);
      return NextResponse.json({ 
        error: `Profil sorgulanırken hata: ${profileError.message}` 
      }, { status: 500 });
    }

    if (!profileData) {
      console.error('Profil bulunamadı, profileId:', profileId);
      return NextResponse.json({ 
        error: `Profil bulunamadı (ID: ${profileId})` 
      }, { status: 404 });
    }

    console.log('Profil bulundu:', profileData.id, profileData.full_name);

    // 1. Belgeleri al ve kontrol et - RLS bypass
    const { data: documents, error: documentsFetchError } = await supabaseAdmin
      .from('documents')
      .select('id, file_path, status')
      .eq('profile_id', profileId);

    if (documentsFetchError) {
      console.error('Error fetching documents:', documentsFetchError);
      return NextResponse.json({ 
        error: documentsFetchError.message || 'Belgeler alınırken hata oluştu' 
      }, { status: 500 });
    }

    // Tüm belgelerin reddedilmiş olup olmadığını kontrol et
    if (documents && documents.length > 0) {
      const allDocumentsRejected = documents.every((doc) => doc.status === 'REJECTED');
      
      if (!allDocumentsRejected) {
        const nonRejectedCount = documents.filter((doc) => doc.status !== 'REJECTED').length;
        return NextResponse.json({ 
          error: `Silme işlemi için önce tüm belgelerin reddedilmesi gerekmektedir. ${nonRejectedCount} belge henüz reddedilmemiş.` 
        }, { status: 400 });
      }
    }

    // 2. Storage'dan belgeleri sil (eğer belge varsa)
    if (documents && documents.length > 0) {
      const filePaths = documents
        .map((doc) => doc.file_path)
        .filter((path) => path && path.trim() !== '');

      if (filePaths.length > 0) {
        console.log('Deleting files from storage:', filePaths);
        
        // Storage'dan belgeleri sil - Service Role ile
        const { error: storageError, data: storageResult } = await supabaseAdmin.storage
          .from('documents')
          .remove(filePaths);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Hata olsa bile devam et, veritabanı kayıtlarını sil
          console.warn('Warning: Some files could not be deleted from storage');
        } else {
          console.log(`Successfully deleted ${filePaths.length} file(s) from storage`);
        }
      }
    }

    // 3. Documents tablosundan kayıtları sil (RLS bypass)
    const { error: documentsDeleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('profile_id', profileId);

    if (documentsDeleteError) {
      console.error('Documents table deletion error:', documentsDeleteError);
      return NextResponse.json({ 
        error: documentsDeleteError.message || 'Belgeler silinirken hata oluştu' 
      }, { status: 500 });
    }

    console.log(`Deleted ${documents?.length || 0} document records from database`);

    // 4. Candidate_info tablosundan kayıtları sil (RLS bypass)
    const { error: candidateInfoDeleteError } = await supabaseAdmin
      .from('candidate_info')
      .delete()
      .eq('profile_id', profileId);

    if (candidateInfoDeleteError) {
      console.error('Candidate info deletion error:', candidateInfoDeleteError);
      return NextResponse.json({ 
        error: candidateInfoDeleteError.message || 'Aday bilgileri silinirken hata oluştu' 
      }, { status: 500 });
    }

    console.log('Deleted candidate_info record from database');

    // 5. Profil statüsünü NEW_APPLICATION'a döndür (RLS bypass)
    const { error: statusUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        application_status: 'NEW_APPLICATION',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (statusUpdateError) {
      console.error('Status update error:', statusUpdateError);
      return NextResponse.json({ 
        error: statusUpdateError.message || 'Profil güncellenirken hata oluştu' 
      }, { status: 500 });
    }

    console.log(`Successfully reset profile ${profileId} to NEW_APPLICATION status`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete application error:', error);
    return NextResponse.json({ 
      error: error.message || 'Bir hata oluştu' 
    }, { status: 500 });
  }
}
