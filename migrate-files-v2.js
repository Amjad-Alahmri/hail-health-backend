require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const departmentMapping = {
  'nursing': 'التمريض',
  'finance': 'المالية',
  'emergency': 'الطوارئ',
  'human-resources': 'الموارد البشرية',
  'operations': 'التشغيل',
  'cybersecurity': 'الأمن السيبراني',
  'diabetes-center': 'مركز السكري',
  'oncology-center': 'مركز الأورام',
  'home-healthcare': 'الرعاية الصحية المنزلية',
  'primary-care-population-health': 'الرعاية الأولية والصحة السكانية',
  'quality-management': 'إدارة الجودة',
  'patient-safety-risk-management': 'سياسات إدارة المخاطر وسلامة المرضى',
  'infection-control': 'مكافحة العدوى',
  'institutional-excellence': 'ادارة التميز المؤسسي',
  'corporate-communication': 'التواصل المؤسسي',
  'legal-affairs-compliance': 'الشؤون القانونية والالتزام',
  'research-academic-affairs': 'الشؤون الاكاديميه والابحاث',
  'medical-management': 'إدارة الخدمات الطبية',
  'medical-affairs': 'الخدمات الطبية المساندة',
  'health-information-management': 'التقنية والتحول الرقمي',
  'public-services-policies': 'سياسات الخدمات العامة',
  'accountable-care-organization': 'نموذج الرعاية للخدمات الطبيه',
  'clinical-nutrition': 'سياسات الخدمات العلاجية'
};

async function migrateFilesFromFolders() {
  try {
    console.log('🔄 جاري جلب الملفات من داخل المجلدات...\n');

    // أولاً: حذف الإدخالات الخاطئة (المجلدات)
    const { error: deleteError } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('department', 'غير محدد');

    if (deleteError) console.log('⚠️ خطأ في الحذف:', deleteError.message);

    let totalAdded = 0;

    // لكل مجلد، جلب الملفات بداخله
    for (const [folderName, arabicDept] of Object.entries(departmentMapping)) {
      console.log(`\n📂 معالجة مجلد: ${folderName} → ${arabicDept}`);

      const { data: files, error } = await supabase.storage
        .from('policies-files')
        .list(folderName, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.log(`❌ خطأ في ${folderName}:`, error.message);
        continue;
      }

      console.log(`   📄 عدد الملفات: ${files.length}`);

      for (const file of files) {
        // تخطي المجلدات الفرعية
        if (file.name === '.emptyFolderPlaceholder' || !file.name) continue;

        const filePath = `${folderName}/${file.name}`;
        const fileUrl = supabase.storage
          .from('policies-files')
          .getPublicUrl(filePath)
          .data.publicUrl;

        // إضافة للـ Database
        const { error: insertError } = await supabase
          .from('uploaded_files')
          .insert([{
            original_name: file.name,
            custom_name: file.name.replace(/\.(pdf|docx|doc|xlsx)$/i, ''),
            department: arabicDept,
            file_url: fileUrl,
          }]);

        if (insertError) {
          console.log(`   ❌ فشل: ${file.name}`);
        } else {
          console.log(`   ✅ ${file.name}`);
          totalAdded++;
        }
      }
    }

    console.log(`\n📊 إجمالي الملفات المضافة: ${totalAdded}`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

migrateFilesFromFolders(); 