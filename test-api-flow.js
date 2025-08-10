// 测试整个API生成流程的脚本
async function testAPIFlow() {
    console.log('🔄 开始测试 API 生成流程...');

    const testData = {
        student_id: 'AXCF2025040088',
        user_input: '如何用AI提升工作效率',
        angle: 'efficiency',
        day_number: 15
    };

    try {
        console.log('📤 发送测试请求:', testData);
        
        const response = await fetch('http://localhost:3001/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        console.log('📥 响应状态:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API 调用失败:', errorText);
            return;
        }

        const result = await response.json();
        
        console.log('✅ API 调用成功!');
        console.log('📊 响应数据分析:');
        console.log('- 数据来源:', result.dify ? 'Dify AI' : (result.mock ? '模拟数据' : '未知'));
        console.log('- 标题数量:', result.titles ? result.titles.length : 0);
        console.log('- 正文数量:', result.bodies ? result.bodies.length : 0);
        console.log('- 固定标签数量:', result.hashtags?.fixed?.length || 0);
        console.log('- 生成标签数量:', result.hashtags?.generated?.length || 0);
        console.log('- 图片建议数量:', result.visuals?.images?.length || 0);
        console.log('- 视频建议数量:', result.visuals?.videos?.length || 0);

        console.log('📋 完整响应数据:');
        console.log(JSON.stringify(result, null, 2));

        // 验证数据结构
        console.log('\n🔍 数据结构验证:');
        
        // 检查标题结构
        if (result.titles && Array.isArray(result.titles)) {
            console.log('✅ titles 是数组');
            result.titles.forEach((title, index) => {
                if (title.content) {
                    console.log(`✅ titles[${index}] 包含 content`);
                } else {
                    console.log(`❌ titles[${index}] 缺少 content`);
                }
                if (title.id) {
                    console.log(`✅ titles[${index}] 包含 id: ${title.id}`);
                }
            });
        } else {
            console.log('❌ titles 不是有效数组');
        }

        // 检查正文结构
        if (result.bodies && Array.isArray(result.bodies)) {
            console.log('✅ bodies 是数组');
            result.bodies.forEach((body, index) => {
                if (body.content) {
                    console.log(`✅ bodies[${index}] 包含 content`);
                } else {
                    console.log(`❌ bodies[${index}] 缺少 content`);
                }
                if (body.style) {
                    console.log(`✅ bodies[${index}] 包含 style: ${body.style}`);
                } else {
                    console.log(`❌ bodies[${index}] 缺少 style`);
                }
                if (body.id) {
                    console.log(`✅ bodies[${index}] 包含 id: ${body.id}`);
                }
            });
        } else {
            console.log('❌ bodies 不是有效数组');
        }

        // 检查标签结构
        if (result.hashtags && typeof result.hashtags === 'object') {
            console.log('✅ hashtags 是对象');
            if (Array.isArray(result.hashtags.fixed)) {
                console.log(`✅ hashtags.fixed 是数组，包含 ${result.hashtags.fixed.length} 个标签`);
            } else {
                console.log('❌ hashtags.fixed 不是数组');
            }
            if (Array.isArray(result.hashtags.generated)) {
                console.log(`✅ hashtags.generated 是数组，包含 ${result.hashtags.generated.length} 个标签`);
            } else {
                console.log('❌ hashtags.generated 不是数组');
            }
        } else {
            console.log('❌ hashtags 不是有效对象');
        }

        // 检查视觉建议结构
        if (result.visuals && typeof result.visuals === 'object') {
            console.log('✅ visuals 是对象');
            if (Array.isArray(result.visuals.images)) {
                console.log(`✅ visuals.images 是数组，包含 ${result.visuals.images.length} 个建议`);
            } else {
                console.log('❌ visuals.images 不是数组');
            }
            if (Array.isArray(result.visuals.videos)) {
                console.log(`✅ visuals.videos 是数组，包含 ${result.visuals.videos.length} 个建议`);
            } else {
                console.log('❌ visuals.videos 不是数组');
            }
        } else {
            console.log('❌ visuals 不是有效对象');
        }

        console.log('\n🎯 测试完成! 数据已验证，可以用于结果页面显示。');
        
    } catch (error) {
        console.error('💥 测试过程中发生错误:', error);
        console.error('错误详情:', error.message);
    }
}

// Node.js 环境检测
if (typeof fetch === 'undefined') {
    console.log('⚠️  检测到 Node.js 环境，正在导入 fetch...');
    // 如果在 Node.js 环境中运行，需要安装 node-fetch
    // npm install node-fetch
    try {
        const fetch = require('node-fetch');
        global.fetch = fetch;
        testAPIFlow();
    } catch (error) {
        console.log('❌ 请先安装 node-fetch: npm install node-fetch');
        console.log('或者在浏览器控制台中运行此脚本');
    }
} else {
    // 浏览器环境直接运行
    testAPIFlow();
}