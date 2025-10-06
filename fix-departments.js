require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// خريطة ربط أسماء الملفات بالأقسام العربية
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

async function fixDepartments() {
  try {
    console.log('🔄 جاري تحديث الأقسام...\n');

    // جلب جميع الملفات
    const { data: files, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('department', 'غير محدد');

    if (error) throw error;

    console.log(`📁 عدد الملفات التي تحتاج تحديث: ${files.length}\n`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const file of files) {
      let departmentFound = false;
      let newDepartment = 'غير محدد';

      // البحث في اسم الملف الأصلي أو المخصص
      const fileName = file.original_name.toLowerCase();

      for (const [englishName, arabicName] of Object.entries(departmentMapping)) {
        if (fileName.includes(englishName)) {
          newDepartment = arabicName;
          departmentFound = true;
          break;
        }
      }

      if (departmentFound) {
        // تحديث القسم
        const { error: updateError } = await supabase
          .from('uploaded_files')
          .update({ department: newDepartment })
          .eq('id', file.id);

        if (updateError) {
          console.log(`❌ فشل تحديث: ${file.original_name}`);
        } else {
          console.log(`✅ ${file.original_name} → ${newDepartment}`);
          updatedCount++;
        }
      } else {
        console.log(`⚠️  لم يُعثر على قسم لـ: ${file.original_name}`);
        notFoundCount++;
      }
    }

    console.log('\n📊 النتائج النهائية:');
    console.log(`✅ تم التحديث: ${updatedCount}`);
    console.log(`⚠️  لم يُعثر على قسم: ${notFoundCount}`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

fixDepartments();