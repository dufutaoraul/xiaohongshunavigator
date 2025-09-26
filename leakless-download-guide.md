# 手动下载兼容leakless.exe的完整指南

## 方法1：从官方源下载最新版本

### 步骤1：下载最新的leakless.exe
1. **访问GitHub Releases页面**：
   - 打开浏览器，访问：https://github.com/go-rod/leakless/releases
   - 如果页面不存在，尝试：https://github.com/go-rod/rod/releases

2. **下载Windows amd64版本**：
   - 查找最新版本（标记为Latest）
   - 下载 `leakless_windows_amd64.exe` 或类似名称的文件
   - 保存到你的下载文件夹

### 步骤2：替换现有的leakless.exe
1. **找到当前的leakless.exe位置**：
   ```
   C:\Users\杜富陶\AppData\Local\Temp\leakless-amd64-adb80298fa6a3af7ced8b1c9b5f18007\leakless.exe
   ```

2. **备份原文件**：
   ```bash
   # 创建备份
   copy "C:\Users\杜富陶\AppData\Local\Temp\leakless-amd64-adb80298fa6a3af7ced8b1c9b5f18007\leakless.exe" "C:\Users\杜富陶\AppData\Local\Temp\leakless-amd64-adb80298fa6a3af7ced8b1c9b5f18007\leakless.exe.backup"
   ```

3. **替换文件**：
   ```bash
   # 复制新下载的文件，重命名为leakless.exe
   copy "C:\Users\杜富陶\Downloads\leakless_windows_amd64.exe" "C:\Users\杜富陶\AppData\Local\Temp\leakless-amd64-adb80298fa6a3af7ced8b1c9b5f18007\leakless.exe"
   ```

## 方法2：从Chrome浏览器提取（推荐）

由于leakless.exe实际上是Chrome的一个封装，我们可以直接使用系统中的Chrome：

### 步骤1：找到Chrome的位置
```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

### 步骤2：创建Chrome的符号链接
```bash
# 在leakless目录创建指向Chrome的链接
mklink "C:\Users\杜富陶\AppData\Local\Temp\leakless-amd64-adb80298fa6a3af7ced8b1c9b5f18007\leakless.exe" "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

## 方法3：使用PowerShell自动化下载

```powershell
# 下载最新版本
$url = "https://github.com/go-rod/leakless/releases/latest/download/leakless_windows_amd64.exe"
$output = "$env:USERPROFILE\Downloads\leakless_windows_amd64.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# 替换文件
$targetDir = "$env:LOCALAPPDATA\Temp\leakless-amd64-adb80298fa6a3af7ced8b1c9b5f18007"
if (Test-Path $targetDir) {
    Copy-Item $output "$targetDir\leakless.exe" -Force
    Write-Host "leakless.exe 已更新"
} else {
    Write-Host "目标目录不存在，请先运行一次MCP服务"
}
```

## 验证步骤

### 1. 检查文件版本
```bash
# 检查新文件是否可执行
"C:\Users\杜富陶\AppData\Local\Temp\leakless-amd64-adb80298fa6a3af7ced8b1c9b5f18007\leakless.exe" --version
```

### 2. 测试MCP服务
```bash
cd "D:\必要软件\xiaohongshu-mcp-windows-amd64"
./xiaohongshu-mcp-windows-amd64.exe
```

### 3. 验证API调用
```bash
curl -X POST http://localhost:18060/api/v1/user/profile -H "Content-Type: application/json" -d '{"user_id":"656731840000000020034f5d","xsec_token":"test"}'
```

## 故障排除

### 如果还是报错216：
1. **尝试兼容模式**：
   - 右键leakless.exe > 属性 > 兼容性
   - 勾选"以兼容模式运行这个程序"
   - 选择"Windows 10"

2. **尝试不同版本**：
   - 下载旧版本的leakless.exe
   - 从其他成功运行的Windows 11系统复制

3. **替代方案**：
   - 使用方法2直接链接到Chrome
   - 或者联系xiaohongshu-mcp作者更新

## 注意事项
- 每次重新运行MCP服务时，可能需要重新替换leakless.exe
- 建议备份工作的版本
- 如果替换后出现其他问题，可以恢复备份文件