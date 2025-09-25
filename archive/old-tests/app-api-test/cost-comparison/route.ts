import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('💰 成本对比分析端点被调用');
    
    const { 
      testImageCount = 10, 
      prompt = "请分析这张作业截图是否符合要求", 
      includeGemini = true,
      includeDoubao = true,
      scale1000 = true 
    } = await request.json();

    const results = {
      testScenario: {
        imageCount: testImageCount,
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      },
      models: {} as any,
      comparison: {} as any
    };

    // Gemini 2.0 成本计算
    if (includeGemini) {
      const geminiCost = calculateGeminiCost(testImageCount, prompt.length);
      const gemini1000 = scale1000 ? calculateGeminiCost(1000, prompt.length) : null;
      
      results.models.gemini = {
        name: "Gemini 2.0 Flash",
        provider: "Google",
        configured: !!process.env.GEMINI_API_KEY,
        singleBatch: geminiCost,
        scale1000: gemini1000,
        pros: [
          "高质量图像分析能力",
          "快速响应时间",
          "支持多种图像格式",
          "良好的中文理解能力"
        ],
        cons: [
          "美元计费，汇率波动影响",
          "需要翻墙或特殊网络配置",
          "API配额限制"
        ]
      };
    }

    // 豆包成本计算
    if (includeDoubao) {
      const doubaoCost = calculateDoubaoCost(testImageCount, prompt.length);
      const doubao1000 = scale1000 ? calculateDoubaoCost(1000, prompt.length) : null;
      
      results.models.doubao = {
        name: "豆包视觉模型",
        provider: "ByteDance",
        configured: !!(process.env.DOUBAO_API_KEY || process.env.ARK_API_KEY),
        singleBatch: doubaoCost,
        scale1000: doubao1000,
        pros: [
          "国产化服务，网络稳定",
          "人民币计费，无汇率风险",
          "更好的中文语境理解",
          "符合数据合规要求"
        ],
        cons: [
          "相对较新，生态待完善",
          "图像分析能力需要验证",
          "文档和社区支持较少"
        ]
      };
    }

    // 成本对比分析
    if (includeGemini && includeDoubao) {
      const geminiUSD = results.models.gemini.singleBatch.totalCost;
      const doubaoUSD = results.models.doubao.singleBatch.totalCost * 0.14; // 人民币转美元估算
      const gemini1000USD = results.models.gemini.scale1000?.totalCost || 0;
      const doubao1000USD = (results.models.doubao.scale1000?.totalCost || 0) * 0.14;

      results.comparison = {
        singleBatch: {
          geminiCost: geminiUSD,
          doubaoCost: doubaoUSD,
          cheaperModel: geminiUSD < doubaoUSD ? 'Gemini' : '豆包',
          costDifference: Math.abs(geminiUSD - doubaoUSD),
          percentageDifference: ((Math.abs(geminiUSD - doubaoUSD) / Math.min(geminiUSD, doubaoUSD)) * 100).toFixed(2) + '%'
        },
        scale1000: scale1000 ? {
          geminiCost: gemini1000USD,
          doubaoCost: doubao1000USD,
          cheaperModel: gemini1000USD < doubao1000USD ? 'Gemini' : '豆包',
          costDifference: Math.abs(gemini1000USD - doubao1000USD),
          percentageDifference: ((Math.abs(gemini1000USD - doubao1000USD) / Math.min(gemini1000USD, doubao1000USD)) * 100).toFixed(2) + '%',
          monthlyEstimate: {
            gemini: (gemini1000USD * 30).toFixed(4) + ' USD',
            doubao: (doubao1000USD * 30).toFixed(4) + ' USD'
          }
        } : null,
        recommendation: generateRecommendation(geminiUSD, doubaoUSD, results.models)
      };
    }

    console.log('✅ 成本对比分析完成');

    return NextResponse.json({
      success: true,
      analysis: results,
      metadata: {
        exchangeRate: "1 USD = 7.2 CNY (估算)",
        disclaimers: [
          "成本计算基于公开定价信息，实际费用可能因API配额、优惠等因素有所不同",
          "汇率采用估算值，实际汇率请以银行报价为准",
          "建议在小规模测试后再做最终选择"
        ]
      }
    });

  } catch (error) {
    console.error('💥 成本对比分析异常:', error);
    
    return NextResponse.json({
      success: false,
      error: '成本对比分析失败',
      errorDetail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Gemini 成本计算
function calculateGeminiCost(imageCount: number, promptLength: number) {
  const inputTextTokens = Math.ceil(promptLength / 4);
  const inputTextCost = (inputTextTokens / 1000000) * 0.075;
  const imageCost = imageCount * 0.0002;
  const outputTokens = 500;
  const outputCost = (outputTokens / 1000000) * 0.30;
  
  return {
    inputCost: inputTextCost + imageCost,
    outputCost: outputCost,
    totalCost: inputTextCost + imageCost + outputCost,
    currency: 'USD',
    breakdown: {
      textTokens: inputTextTokens,
      textCost: inputTextCost,
      imageCount: imageCount,
      imageCost: imageCost,
      outputTokens: outputTokens,
      outputCost: outputCost
    }
  };
}

// 豆包成本计算
function calculateDoubaoCost(imageCount: number, promptLength: number) {
  const inputTextTokens = Math.ceil(promptLength / 3);
  const textCost = (inputTextTokens / 1000) * 0.002;
  const imageCost = imageCount * 0.01;
  const outputTokens = 300;
  const outputCost = (outputTokens / 1000) * 0.004;
  
  return {
    inputCost: textCost + imageCost,
    outputCost: outputCost,
    totalCost: textCost + imageCost + outputCost,
    currency: 'CNY',
    breakdown: {
      textTokens: inputTextTokens,
      textCost: textCost,
      imageCount: imageCount,
      imageCost: imageCost,
      outputTokens: outputTokens,
      outputCost: outputCost
    }
  };
}

// 生成推荐建议
function generateRecommendation(geminiUSD: number, doubaoUSD: number, models: any) {
  const costDiff = Math.abs(geminiUSD - doubaoUSD);
  const isCostSignificant = costDiff > 0.001; // 超过0.001美元认为是显著差异
  
  if (!isCostSignificant) {
    return {
      primary: "成本差异较小，建议重点考虑服务稳定性和功能特性",
      factors: [
        "网络访问稳定性",
        "数据合规要求",
        "技术团队熟悉度",
        "API功能完整性"
      ]
    };
  }
  
  const cheaperModel = geminiUSD < doubaoUSD ? 'Gemini' : '豆包';
  const expensiveModel = geminiUSD > doubaoUSD ? 'Gemini' : '豆包';
  
  return {
    primary: `${cheaperModel}在成本上更有优势，但需要综合考虑其他因素`,
    costAdvantage: cheaperModel,
    factors: [
      `${cheaperModel}成本优势: ${(costDiff / (cheaperModel === 'Gemini' ? doubaoUSD : geminiUSD) * 100).toFixed(1)}%`,
      "服务稳定性和可用性",
      "图像分析准确率",
      "中文处理能力",
      "长期技术支持"
    ],
    suggestion: `建议先小规模测试两个模型的实际效果，再基于成本和性能综合评估`
  };
}

export async function GET() {
  return NextResponse.json({
    message: "AI模型成本对比分析端点",
    usage: "POST /api/test/cost-comparison with optional parameters",
    parameters: {
      testImageCount: "测试图片数量 (默认: 10)",
      prompt: "测试提示词 (默认: 作业批改提示)",
      includeGemini: "是否包含Gemini分析 (默认: true)",
      includeDoubao: "是否包含豆包分析 (默认: true)", 
      scale1000: "是否计算1000张图片成本 (默认: true)"
    },
    features: [
      "实时成本计算",
      "多模型对比",
      "批量处理成本估算",
      "推荐建议生成"
    ]
  });
}