import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Gemini 2.0 测试端点被调用');
    
    const { testImages = [], prompt = "分析这些图片", modelVersion = "gemini-2.0-flash-exp" } = await request.json();
    
    // 环境变量检查
    const apiKey = process.env.GEMINI_API_KEY || 'test-key-not-configured';
    const baseUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com';
    
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY 未配置，将返回模拟结果');
      return NextResponse.json({
        success: true,
        isSimulated: true,
        result: {
          model: modelVersion,
          response: "这是一个模拟的Gemini 2.0响应，因为API密钥未配置。实际使用时需要配置GEMINI_API_KEY环境变量。",
          imageCount: testImages.length,
          estimatedCost: calculateGeminiCost(testImages.length, prompt.length),
          costFor1000Images: calculateGeminiCost(1000, prompt.length)
        }
      });
    }

    console.log(`🔥 使用 ${modelVersion} 进行测试，图片数量: ${testImages.length}`);

    // 构建请求体
    const parts = [{ text: prompt }];

    // 模拟添加图片（在真实环境中需要下载图片并转换为base64）
    for (let i = 0; i < testImages.length; i++) {
      console.log(`📥 处理测试图片 ${i + 1}`);
      // 这里应该下载真实图片，但为了测试我们用模拟数据
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: "simulated-base64-image-data"
        }
      });
    }

    const requestBody = {
      contents: [{
        role: 'user',
        parts: parts
      }],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.1,
      }
    };

    const apiUrl = `${baseUrl}/v1beta/models/${modelVersion}:generateContent`;
    
    console.log(`📤 发送请求到: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API调用失败:', response.status, errorText);
      
      return NextResponse.json({
        success: false,
        error: `Gemini API调用失败: ${response.status}`,
        errorDetail: errorText,
        estimatedCost: calculateGeminiCost(testImages.length, prompt.length),
        costFor1000Images: calculateGeminiCost(1000, prompt.length)
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Gemini 2.0 测试成功');

    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    return NextResponse.json({
      success: true,
      isSimulated: false,
      result: {
        model: modelVersion,
        response: aiResponse,
        imageCount: testImages.length,
        estimatedCost: calculateGeminiCost(testImages.length, prompt.length),
        costFor1000Images: calculateGeminiCost(1000, prompt.length),
        fullResponse: result
      }
    });

  } catch (error) {
    console.error('💥 Gemini 2.0 测试异常:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Gemini 2.0 测试失败',
      errorDetail: error instanceof Error ? error.message : 'Unknown error',
      estimatedCost: 0,
      costFor1000Images: 0
    }, { status: 500 });
  }
}

// Gemini 成本计算函数
function calculateGeminiCost(imageCount: number, promptLength: number): {
  inputCost: number;
  outputCost: number; 
  totalCost: number;
  currency: string;
  details: string;
} {
  // Gemini 2.0 Flash 定价 (2024年数据，实际定价可能有变化)
  // 输入定价: 文本 $0.075 / 1M tokens, 图片 $0.0002 / image
  // 输出定价: $0.30 / 1M tokens
  
  const inputTextTokens = Math.ceil(promptLength / 4); // 估算token数
  const inputTextCost = (inputTextTokens / 1000000) * 0.075; // 文本输入成本
  const imageCost = imageCount * 0.0002; // 图片输入成本
  const outputTokens = 500; // 估算输出token数
  const outputCost = (outputTokens / 1000000) * 0.30; // 输出成本
  
  const totalInputCost = inputTextCost + imageCost;
  const totalCost = totalInputCost + outputCost;

  return {
    inputCost: totalInputCost,
    outputCost: outputCost,
    totalCost: totalCost,
    currency: 'USD',
    details: `输入成本: $${totalInputCost.toFixed(6)} (文本: $${inputTextCost.toFixed(6)}, 图片: $${imageCost.toFixed(6)}) + 输出成本: $${outputCost.toFixed(6)} = 总计: $${totalCost.toFixed(6)}`
  };
}

export async function GET() {
  return NextResponse.json({
    message: "Gemini 2.0 测试端点",
    usage: "POST /api/test/gemini-2 with { testImages: string[], prompt: string, modelVersion?: string }",
    costCalculation: "自动计算成本信息",
    supportedModels: [
      "gemini-2.0-flash-exp", 
      "gemini-1.5-flash", 
      "gemini-1.5-pro"
    ]
  });
}