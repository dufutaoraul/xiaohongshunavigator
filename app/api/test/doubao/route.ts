import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🥟 豆包视觉模型测试端点被调用');
    
    const { testImages = [], prompt = "分析这些图片", modelVersion = "doubao-vision-32k" } = await request.json();
    
    // 环境变量检查 - 豆包使用ARK API
    const apiKey = process.env.DOUBAO_API_KEY || process.env.ARK_API_KEY || 'test-key-not-configured';
    const baseUrl = process.env.DOUBAO_API_URL || process.env.ARK_API_URL || 'https://ark.cn-beijing.volces.com';
    
    if (!process.env.DOUBAO_API_KEY && !process.env.ARK_API_KEY) {
      console.warn('⚠️ DOUBAO_API_KEY/ARK_API_KEY 未配置，将返回模拟结果');
      return NextResponse.json({
        success: true,
        isSimulated: true,
        result: {
          model: modelVersion,
          response: "这是一个模拟的豆包视觉模型响应，因为API密钥未配置。实际使用时需要配置DOUBAO_API_KEY或ARK_API_KEY环境变量。",
          imageCount: testImages.length,
          estimatedCost: calculateDoubaoCost(testImages.length, prompt.length),
          costFor1000Images: calculateDoubaoCost(1000, prompt.length)
        }
      });
    }

    console.log(`🥟 使用 ${modelVersion} 进行测试，图片数量: ${testImages.length}`);

    // 构建豆包ARK API请求格式
    const messages = [{
      role: "user",
      content: [
        {
          type: "text",
          text: prompt
        }
      ]
    }] as any;

    // 添加图片内容（豆包支持URL和base64两种方式）
    for (let i = 0; i < testImages.length; i++) {
      console.log(`📥 处理测试图片 ${i + 1}`);
      
      if (testImages[i].startsWith('http')) {
        // URL方式
        messages[0].content.push({
          type: "image_url",
          image_url: {
            url: testImages[i]
          }
        });
      } else {
        // Base64方式 (模拟)
        messages[0].content.push({
          type: "image_url",
          image_url: {
            url: "data:image/jpeg;base64,simulated-base64-image-data"
          }
        });
      }
    }

    const requestBody = {
      model: modelVersion,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.1,
      stream: false
    };

    // 豆包ARK API调用
    const apiUrl = `${baseUrl}/api/v3/chat/completions`;
    
    console.log(`📤 发送请求到豆包ARK API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 豆包API调用失败:', response.status, errorText);
      
      return NextResponse.json({
        success: false,
        error: `豆包API调用失败: ${response.status}`,
        errorDetail: errorText,
        estimatedCost: calculateDoubaoCost(testImages.length, prompt.length),
        costFor1000Images: calculateDoubaoCost(1000, prompt.length)
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ 豆包视觉模型测试成功');

    const aiResponse = result.choices?.[0]?.message?.content || 'No response';

    return NextResponse.json({
      success: true,
      isSimulated: false,
      result: {
        model: modelVersion,
        response: aiResponse,
        imageCount: testImages.length,
        estimatedCost: calculateDoubaoCost(testImages.length, prompt.length),
        costFor1000Images: calculateDoubaoCost(1000, prompt.length),
        fullResponse: result,
        usage: result.usage
      }
    });

  } catch (error) {
    console.error('💥 豆包测试异常:', error);
    
    return NextResponse.json({
      success: false,
      error: '豆包测试失败',
      errorDetail: error instanceof Error ? error.message : 'Unknown error',
      estimatedCost: 0,
      costFor1000Images: 0
    }, { status: 500 });
  }
}

// 豆包成本计算函数
function calculateDoubaoCost(imageCount: number, promptLength: number): {
  inputCost: number;
  outputCost: number; 
  totalCost: number;
  currency: string;
  details: string;
} {
  // 豆包视觉模型定价 (基于ARK API，具体定价请参考官方文档)
  // 输入定价: 视觉模型通常按图片数量计费
  // 假设定价: ¥0.01 / 图片 + ¥0.002 / 1K tokens (文本)
  
  const inputTextTokens = Math.ceil(promptLength / 3); // 中文token估算
  const textCost = (inputTextTokens / 1000) * 0.002; // 文本成本（人民币）
  const imageCost = imageCount * 0.01; // 图片成本（人民币）
  const outputTokens = 300; // 估算输出token数
  const outputCost = (outputTokens / 1000) * 0.004; // 输出成本（人民币）
  
  const totalInputCost = textCost + imageCost;
  const totalCost = totalInputCost + outputCost;

  return {
    inputCost: totalInputCost,
    outputCost: outputCost,
    totalCost: totalCost,
    currency: 'CNY',
    details: `输入成本: ¥${totalInputCost.toFixed(4)} (文本: ¥${textCost.toFixed(4)}, 图片: ¥${imageCost.toFixed(4)}) + 输出成本: ¥${outputCost.toFixed(4)} = 总计: ¥${totalCost.toFixed(4)}`
  };
}

export async function GET() {
  return NextResponse.json({
    message: "豆包视觉模型测试端点",
    usage: "POST /api/test/doubao with { testImages: string[], prompt: string, modelVersion?: string }",
    costCalculation: "自动计算成本信息",
    supportedModels: [
      "doubao-vision-32k",
      "doubao-vision-128k", 
      "doubao-pro-vision"
    ],
    note: "需要配置 DOUBAO_API_KEY 或 ARK_API_KEY 环境变量"
  });
}