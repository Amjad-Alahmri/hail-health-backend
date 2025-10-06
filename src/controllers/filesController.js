const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// جلب جميع الملفات
exports.getAllFiles = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) throw error;

    res.json({ 
      success: true, 
      count: data.length, 
      files: data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب الملفات', 
      error: error.message 
    });
  }
};

// جلب الملفات حسب القسم
exports.getFilesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('department', department)
      .order('upload_date', { ascending: false });

    if (error) throw error;

    res.json({ 
      success: true, 
      department, 
      count: data.length, 
      files: data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب الملفات', 
      error: error.message 
    });
  }
};

// رفع ملف جديد
exports.uploadFile = async (req, res) => {
  try {
    const { original_name, custom_name, department, file_url } = req.body;

    if (!original_name || !custom_name || !department || !file_url) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول مطلوبة' 
      });
    }

    const { data, error } = await supabase
      .from('uploaded_files')
      .insert([{ 
        original_name, 
        custom_name, 
        department, 
        file_url 
      }])
      .select()
      .single();

    if (error) throw error;

    // إضافة نشاط
    await supabase
      .from('activities')
      .insert([{ 
        activity: `تم رفع ملف: ${custom_name} في قسم ${department}` 
      }]);

    res.status(201).json({ 
      success: true, 
      message: 'تم رفع الملف بنجاح', 
      file: data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في رفع الملف', 
      error: error.message 
    });
  }
};

// تحديث ملف
exports.updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { custom_name, department } = req.body;

    const { data, error } = await supabase
      .from('uploaded_files')
      .update({ custom_name, department })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // إضافة نشاط
    await supabase
      .from('activities')
      .insert([{ 
        activity: `تم تحديث ملف: ${custom_name}` 
      }]);

    res.json({ 
      success: true, 
      message: 'تم تحديث الملف بنجاح', 
      file: data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في تحديث الملف', 
      error: error.message 
    });
  }
};

// حذف ملف
exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    // جلب اسم الملف قبل الحذف
    const { data: file, error: fetchError } = await supabase
      .from('uploaded_files')
      .select('custom_name')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // حذف الملف
    const { error } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // إضافة نشاط
    await supabase
      .from('activities')
      .insert([{ 
        activity: `تم حذف ملف: ${file.custom_name}` 
      }]);

    res.json({ 
      success: true, 
      message: 'تم حذف الملف بنجاح' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في حذف الملف', 
      error: error.message 
    });
  }
};

// ✅ جديد - جلب الأنشطة الحديثة
exports.getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ 
      success: true, 
      count: data.length,
      activities: data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب الأنشطة', 
      error: error.message 
    });
  }
}; 