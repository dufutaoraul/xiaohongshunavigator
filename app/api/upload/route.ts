import { NextRequest, NextResponse } from 'next/server';
import { tencentStorage } from '@/lib/tencent-storage';
import { sanitizeFileName } from '@/utils/homework-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 文件上传API被调用');

    // 检查环境变量配置
    console.log('🔧 检查腾讯云配置:', {
      TENCENT_SECRET_ID: process.env.TENCENT_SECRET_ID ? '已配置' : '未配置',
      TENCENT_SECRET_KEY: process.env.TENCENT_SECRET_KEY ? '已配置' : '未配置', 
      TENCENT_COS_BUCKET: process.env.TENCENT_COS_BUCKET ? '已配置' : '未配置',
      TENCENT_COS_REGION: process.env.TENCENT_COS_REGION ? '已配置' : '未配置'
    });

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const studentId = formData.get('studentId') as string;

    if (!files.length) {
      return NextResponse.json({ error: '没有选择文件' }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ error: '缺少学生ID' }, { status: 400 });
    }

    console.log(`💾 准备上传 ${files.length} 个文件，学生ID: ${studentId}`);

    const uploadedUrls: string[] = [];
    
    // 并发上传所有文件
    const uploadPromises = files.map(async (file, index) => {
      try {
        console.log(`📄 处理文件 ${index + 1}/${files.length}: ${file.name} (${file.size} bytes)`);

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `homework/${studentId}/${timestamp}_${randomSuffix}_${sanitizedName}`;

        // 读取文件内容
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`☁️ 上传到腾讯云: ${fileName}`);

        // 上传到腾讯云COS
        const publicUrl = await tencentStorage.uploadFile(fileName, buffer, file.type);
        
        console.log(`✅ 文件上传成功: ${file.name} -> ${publicUrl}`);
        
        return publicUrl;
      } catch (error) {
        console.error(`❌ 文件上传失败: ${file.name}`, error);
        throw new Error(`文件 ${file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      uploadedUrls.push(...results);
    } catch (error) {
      console.error('❌ 批量上传失败:', error);
      return NextResponse.json(
        { error: `文件上传失败: ${error instanceof Error ? error.message : '未知错误'}` },
        { status: 500 }
      );
    }

    console.log(`🎉 所有文件上传完成，共 ${uploadedUrls.length} 个文件`);

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length
    });

  } catch (error) {
    console.error('🔥 文件上传API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 支持的配置
export const runtime = 'nodejs';
export const maxDuration = 30; // 30秒超时，适合文件上传