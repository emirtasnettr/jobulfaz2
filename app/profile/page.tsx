/**
 * Profil Sayfası (Profilim)
 * 
 * Kullanıcının tüm profil bilgilerini görüntüleyip yönetebileceği sayfa
 * Temel Bilgiler, Aday Bilgileri ve Belgeler bölümleri
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/logout-button';
import DocumentRow from '@/components/document-row';
import SubmitApplicationButton from '@/components/submit-application-button';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Profil bilgilerini al
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/login');
  }

  // Aday bilgilerini al (varsa)
  const { data: candidateInfo } = await supabase
    .from('candidate_info')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  // Belgeleri al (her zaman güncel veriyi almak için)
  const { data: documents, error: documentsError } = await supabase
    .from('documents')
    .select('*')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false }); // En son güncellenen önce gelsin

  // Belge türlerini tanımla (sıra önemli)
  const documentTypes = [
    { type: 'KIMLIK', label: 'Kimlik Belgesi', icon: '🆔' },
    { type: 'RESIDENCE', label: 'İkametgah', icon: '🏠' },
    { type: 'POLICE', label: 'Sabıka Kaydı', icon: '🔒' },
    { type: 'CV', label: 'CV', icon: '📄' },
    { type: 'DIPLOMA', label: 'Diploma', icon: '🎓' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/${profile.role.toLowerCase()}`}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Ana Sayfa
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">Profilim</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profilim</h1>

        {/* Başvuru Durumu Göstergesi */}
        {profile.role === 'CANDIDATE' && profile.application_status && (
          <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Başvuru Durumu</h3>
                <p className={`text-sm font-medium ${
                  profile.application_status === 'NEW_APPLICATION' ? 'text-blue-600' :
                  profile.application_status === 'EVALUATION' ? 'text-yellow-600' :
                  profile.application_status === 'APPROVED' ? 'text-green-600' :
                  profile.application_status === 'REJECTED' ? 'text-red-600' :
                  'text-orange-600'
                }`}>
                  {profile.application_status === 'NEW_APPLICATION' ? '🆕 Yeni Başvuru' :
                   profile.application_status === 'EVALUATION' ? '⏳ Değerlendirme Aşamasında' :
                   profile.application_status === 'APPROVED' ? '✅ Onaylı' :
                   profile.application_status === 'REJECTED' ? '❌ Reddedildi' :
                   '📝 Bilgi/Evrak Güncelleme Gerekli'}
                </p>
              </div>
              {profile.application_status === 'EVALUATION' && (
                <div className="text-sm text-gray-600">
                  Başvurunuz değerlendirme aşamasında. Profil bilgileriniz bu aşamada düzenlenemez.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profil Bilgileri (Birleştirilmiş) */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Profil Bilgileri</h2>
            {profile.role === 'CANDIDATE' && (profile.application_status === 'NEW_APPLICATION' || profile.application_status === 'UPDATE_REQUIRED') && (
              <Link
                href="/profile/edit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Düzenle
              </Link>
            )}
          </div>

          <div className="space-y-6">
            {/* Temel Bilgiler */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Temel Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad
                  </label>
                  <p className="text-gray-900">{profile.full_name || 'Belirtilmemiş'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon Numarası
                  </label>
                  <p className="text-gray-900">{candidateInfo?.phone || 'Belirtilmemiş'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TC Kimlik No
                  </label>
                  <p className="text-gray-900">{candidateInfo?.national_id || 'Belirtilmemiş'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doğum Tarihi
                  </label>
                  <p className="text-gray-900">
                    {candidateInfo?.date_of_birth
                      ? new Date(candidateInfo.date_of_birth).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Belirtilmemiş'}
                  </p>
                </div>
              </div>
            </div>

            {/* Aday Bilgileri (Eğer CANDIDATE ise) */}
            {profile.role === 'CANDIDATE' && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Aday Bilgileri
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-posta
                      </label>
                      <p className="text-gray-900">{user.email || candidateInfo?.email || 'Belirtilmemiş'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kayıt Tarihi
                      </label>
                      <p className="text-gray-900">
                        {new Date(profile.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adres
                      </label>
                      <p className="text-gray-900">{candidateInfo?.address || 'Belirtilmemiş'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Eğitim Seviyesi
                      </label>
                      <p className="text-gray-900">{candidateInfo?.education_level || 'Belirtilmemiş'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deneyim Yılı
                      </label>
                      <p className="text-gray-900">{candidateInfo?.experience_years || 0} yıl</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beceriler
                    </label>
                    {candidateInfo?.skills && candidateInfo.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {candidateInfo.skills.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-900">Belirtilmemiş</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Belgeler Bölümü */}
        <div id="documents" className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Belgelerim</h2>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Bilgi:</strong> Her belge türünden bir belge yükleyebilirsiniz. 
              Belgeler yüklendikten sonra consultant'lar tarafından incelenecek ve Kabul veya Red olarak işaretlenecektir.
            </p>
          </div>

          {/* Belge Satırları */}
          <div className="space-y-4">
            {documentTypes.map((docType) => {
              const document = documents?.find((doc) => doc.document_type === docType.type);
              return (
                <DocumentRow
                  key={docType.type}
                  documentType={docType.type as 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA'}
                  documentTypeLabel={docType.label}
                  documentTypeIcon={docType.icon}
                  document={document}
                  profileId={user.id}
                  canEdit={profile.role === 'CANDIDATE' && (profile.application_status === 'NEW_APPLICATION' || profile.application_status === 'UPDATE_REQUIRED')}
                  applicationStatus={profile.application_status || undefined}
                />
              );
            })}
          </div>

          {/* Başvurumu Değerlendirmeye Gönder Butonu */}
          {profile.role === 'CANDIDATE' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <SubmitApplicationButton
                profileId={user.id}
                applicationStatus={profile.application_status}
                candidateInfo={candidateInfo}
                documents={documents || []}
                requiredDocumentTypes={documentTypes.map((dt) => dt.type)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
