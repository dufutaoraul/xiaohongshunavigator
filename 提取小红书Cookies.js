// 小红书Cookies提取工具
// 在小红书页面的浏览器控制台中运行此代码

console.log('=== 小红书Cookies提取工具 ===');
console.log('请确保您当前在 xiaohongshu.com 页面上');

// 提取当前页面的所有cookies
const cookies = document.cookie.split(';').map(cookie => {
    const [name, value] = cookie.trim().split('=');
    return {
        name: name || '',
        value: value || '',
        domain: '.xiaohongshu.com',
        path: '/',
        secure: true,
        httpOnly: false
    };
}).filter(c => c.name && c.value && c.name.length > 0);

// 转换为JSON格式
const cookieJson = JSON.stringify(cookies, null, 2);

console.log('🔍 找到', cookies.length, '个有效cookies');
console.log('📋 Cookies JSON格式:');
console.log(cookieJson);

// 尝试复制到剪贴板
if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cookieJson).then(() => {
        console.log('✅ Cookies已成功复制到剪贴板！');
        console.log('🚀 请将剪贴板内容发送给开发者');
    }).catch(err => {
        console.log('❌ 自动复制失败:', err);
        console.log('📝 请手动选择上面的JSON内容并复制');
    });
} else {
    console.log('📝 请手动选择上面的JSON内容并复制');
}

// 显示主要cookie名称用于验证
const cookieNames = cookies.map(c => c.name).join(', ');
console.log('🏷️  主要Cookie名称:', cookieNames);

console.log('=== 提取完成 ===');