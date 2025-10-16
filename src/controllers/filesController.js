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

// رفع ملف جديد أو فيديو يوتيوب
exports.uploadFile = async (req, res) => {
  try {
    const { original_name, custom_name, department, file_url, youtube_url } = req.body;

    console.log('📥 Received:', { custom_name, department, file_url, youtube_url });

    // التحقق من الحقول الأساسية
    if (!custom_name || !department) {
      return res.status(400).json({ 
        success: false, 
        message: 'custom_name و department مطلوبة' 
      });
    }

    // تحديد نوع الملف
    const isYouTube = youtube_url && youtube_url.trim() !== '';
    
    if (!isYouTube && !file_url) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى إدخال file_url أو youtube_url' 
      });
    }

    const fileType = isYouTube ? 'youtube' : 'file';
    const finalFileUrl = isYouTube ? youtube_url : file_url;
    const finalOriginalName = isYouTube ? youtube_url : (original_name || 'file');

    console.log('✅ Processing:', { isYouTube, fileType, finalFileUrl });

    // بناء البيانات
    const insertData = {
      original_name: finalOriginalName,
      custom_name: custom_name,
      department: department,
      file_url: finalFileUrl,
      file_type: fileType
    };

    if (isYouTube) {
      insertData.youtube_url = youtube_url;
    }

    const { data, error } = await supabase
      .from('uploaded_files')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    // إضافة نشاط
    const activityMessage = isYouTube 
      ? `تم إضافة فيديو: ${custom_name} في قسم ${department}`
      : `تم رفع ملف: ${custom_name} في قسم ${department}`;

    await supabase
      .from('activities')
      .insert([{ activity: activityMessage }]);

    console.log('✅ Success:', isYouTube ? 'YouTube video added' : 'File uploaded');

    res.status(201).json({ 
      success: true, 
      message: isYouTube ? 'تم إضافة الفيديو بنجاح' : 'تم رفع الملف بنجاح',
      file: data 
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
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

    const { data: file, error: fetchError } = await supabase
      .from('uploaded_files')
      .select('custom_name')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('id', id);

    if (error) throw error;

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

// جلب الأنشطة الحديثة
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