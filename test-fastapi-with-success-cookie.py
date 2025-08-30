#!/usr/bin/env python3
"""
FastAPI测试 - 使用测试成功的Cookie
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'xhs-service'))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
from xhs import XhsClient
import asyncio
import requests
import re

app = FastAPI()

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js开发服务器
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 默认Cookie - 需要用户更新为有效的Cookie
DEFAULT_COOKIE = ""

# Cookie配置文件路径
COOKIE_FILE = "xhs_cookie.txt"

def load_cookie():
    """从文件加载Cookie"""
    try:
        if os.path.exists(COOKIE_FILE):
            with open(COOKIE_FILE, 'r', encoding='utf-8') as f:
                cookie = f.read().strip()
                if cookie:
                    print(f"✅ 从文件加载Cookie，长度: {len(cookie)}")
                    return cookie
    except Exception as e:
        print(f"⚠️ 加载Cookie文件失败: {e}")

    print("⚠️ 未找到有效Cookie，将返回演示数据")
    return DEFAULT_COOKIE

def save_cookie(cookie):
    """保存Cookie到文件"""
    try:
        with open(COOKIE_FILE, 'w', encoding='utf-8') as f:
            f.write(cookie)
        print(f"✅ Cookie已保存到文件，长度: {len(cookie)}")
        return True
    except Exception as e:
        print(f"❌ 保存Cookie失败: {e}")
        return False

# 加载Cookie
SUCCESS_COOKIE = load_cookie()

class SearchRequest(BaseModel):
    keyword: str
    page: Optional[int] = 1
    page_size: Optional[int] = 10
    sort: Optional[str] = "general"
    cookie: Optional[str] = ""

class CookieRequest(BaseModel):
    cookie: str

# 添加详情页代理接口
@app.get("/xhs/detail")
async def get_note_detail_proxy(note_id: str):
    """
    代理获取小红书笔记详情页HTML内容
    使用移动端UA和登录Cookie来绕过扫码限制
    """
    print("=" * 80)
    print(f"📱 代理获取笔记详情页: {note_id}")
    
    try:
        # 构建小红书笔记URL
        note_url = f"https://www.xiaohongshu.com/explore/{note_id}"
        print(f"🔗 目标URL: {note_url}")
        
        # 移动端User-Agent
        mobile_ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 XHSAndroid/8.3.0 (Linux; Android 10)"
        
        # 请求头
        headers = {
            'User-Agent': mobile_ua,
            'Cookie': SUCCESS_COOKIE,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        print("📱 使用移动端UA发送请求...")
        response = requests.get(note_url, headers=headers, timeout=10)
        
        print(f"📊 响应状态码: {response.status_code}")
        print(f"📊 响应内容长度: {len(response.text)}")
        
        if response.status_code == 200:
            html_content = response.text
            
            # 检查是否包含二维码相关内容
            qr_indicators = ['扫码', '二维码', 'qrcode', 'scan', '登录', 'login']
            has_qr = any(indicator in html_content.lower() for indicator in qr_indicators)
            
            if has_qr:
                print("⚠️ 检测到可能需要扫码登录")
                return HTMLResponse(
                    content=f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>需要扫码登录</title>
                        <style>
                            body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                            .qr-notice {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; }}
                        </style>
                    </head>
                    <body>
                        <div class="qr-notice">
                            <h2>🔒 需要扫码登录</h2>
                            <p>当前无法直接访问笔记内容，请使用小红书App扫码登录</p>
                            <p><a href="{note_url}" target="_blank">点击前往原页面</a></p>
                        </div>
                    </body>
                    </html>
                    """,
                    status_code=200
                )
            else:
                print("✅ 成功获取笔记内容")
                # 对HTML内容进行一些处理，确保在新窗口中正常显示
                processed_html = html_content.replace('<base href="https://www.xiaohongshu.com/">', '')
                processed_html = processed_html.replace('href="/', 'href="https://www.xiaohongshu.com/')
                processed_html = processed_html.replace('src="/', 'src="https://www.xiaohongshu.com/')
                
                return HTMLResponse(content=processed_html, status_code=200)
        else:
            print(f"❌ 请求失败，状态码: {response.status_code}")
            raise HTTPException(status_code=response.status_code, detail="无法获取笔记内容")
            
    except requests.RequestException as e:
        print(f"❌ 网络请求异常: {e}")
        return HTMLResponse(
            content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>网络错误</title>
                <style>
                    body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                    .error-notice {{ background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; }}
                </style>
            </head>
            <body>
                <div class="error-notice">
                    <h2>🌐 网络连接错误</h2>
                    <p>无法连接到小红书服务器</p>
                    <p>错误信息: {str(e)}</p>
                    <p><a href="https://www.xiaohongshu.com/explore/{note_id}" target="_blank">点击前往原页面</a></p>
                </div>
            </body>
            </html>
            """,
            status_code=500
        )
    except Exception as e:
        print(f"❌ 其他异常: {e}")
        return HTMLResponse(
            content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>服务器错误</title>
                <style>
                    body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                    .error-notice {{ background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; }}
                </style>
            </head>
            <body>
                <div class="error-notice">
                    <h2>⚠️ 服务器错误</h2>
                    <p>处理请求时发生错误</p>
                    <p>错误信息: {str(e)}</p>
                    <p><a href="https://www.xiaohongshu.com/explore/{note_id}" target="_blank">点击前往原页面</a></p>
                </div>
            </body>
            </html>
            """,
            status_code=500
        )

@app.post("/search")
async def search_notes(request: SearchRequest):
    print("=" * 80)
    print("🔍 FastAPI搜索请求开始")
    print(f"📝 关键词: {request.keyword}")
    print(f"📄 页码: {request.page}")
    print(f"🔢 页面大小: {request.page_size}")
    print(f"📊 排序: {request.sort}")
    
    try:
        # 强制使用测试成功的Cookie
        print("🍪 使用测试成功的Cookie")
        print(f"🍪 Cookie长度: {len(SUCCESS_COOKIE)}")
        
        # 初始化客户端
        print("🚀 初始化XhsClient...")
        client = XhsClient(cookie=SUCCESS_COOKIE)
        print("✅ 客户端初始化成功")
        
        # 调用搜索
        print("🔍 开始搜索...")
        result = client.get_note_by_keyword(request.keyword)
        
        print(f"📊 搜索结果类型: {type(result)}")
        print(f"📊 搜索结果键: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if isinstance(result, dict) and 'items' in result:
            items = result['items']
            print(f"🎉 找到items字段，长度: {len(items)}")
            
            # 处理笔记数据 - 限制为10条
            notes = []
            count = 0
            for item in items:
                if count >= request.page_size:  # 限制数量
                    break
                    
                if item.get('model_type') == 'note':
                    # 调试：打印第一个笔记的完整结构
                    if count == 0:
                        print("🔍 调试：第一个笔记的完整数据结构:")
                        print(f"📊 item keys: {list(item.keys())}")
                        note_card = item.get('note_card', {})
                        print(f"📊 note_card keys: {list(note_card.keys())}")
                        if 'cover' in note_card:
                            print(f"📊 cover type: {type(note_card['cover'])}")
                            print(f"📊 cover content: {note_card['cover']}")
                        if 'image_list' in note_card:
                            print(f"📊 image_list type: {type(note_card['image_list'])}")
                            print(f"📊 image_list length: {len(note_card['image_list']) if isinstance(note_card['image_list'], list) else 'Not a list'}")
                            if isinstance(note_card['image_list'], list) and note_card['image_list']:
                                print(f"📊 first image keys: {list(note_card['image_list'][0].keys()) if isinstance(note_card['image_list'][0], dict) else 'Not a dict'}")
                                print(f"📊 first image content: {note_card['image_list'][0]}")
                    note_card = item.get('note_card', {})
                    user_info = note_card.get('user', {})
                    interact_info = note_card.get('interact_info', {})
                    
                    # 获取真实的封面图片 - 多种方式尝试
                    cover_url = "https://via.placeholder.com/300x400/6366f1/ffffff?text=小红书"
                    
                    # 尝试多种图片字段
                    image_sources = [
                        note_card.get('cover'),
                        note_card.get('image_list', [{}])[0] if note_card.get('image_list') else None,
                        item.get('cover'),
                    ]
                    
                    for source in image_sources:
                        if source:
                            if isinstance(source, dict):
                                # 尝试多种URL字段
                                url_fields = ['url_default', 'url', 'trace_id', 'info_list']
                                for field in url_fields:
                                    if source.get(field):
                                        if isinstance(source[field], str):
                                            cover_url = source[field]
                                            break
                                        elif isinstance(source[field], list) and source[field]:
                                            cover_url = source[field][0].get('url', cover_url) if isinstance(source[field][0], dict) else str(source[field][0])
                                            break
                                if cover_url != "https://via.placeholder.com/300x400/6366f1/ffffff?text=小红书":
                                    break
                            elif isinstance(source, str):
                                cover_url = source
                                break
                    
                    # 构建小红书链接
                    note_url = f"https://www.xiaohongshu.com/explore/{item.get('id', '')}" if item.get('id') else ""
                    
                    # 尝试获取笔记详细内容
                    content_preview = ""
                    xsec_token = item.get('xsec_token', '')
                    if xsec_token:
                        try:
                            print(f"🔍 尝试获取笔记详情: {item.get('id')}")
                            note_detail = client.get_note_by_id(item.get('id'), xsec_token)
                            if isinstance(note_detail, dict):
                                full_content = note_detail.get('desc', '')
                                if full_content:
                                    # 取前100个字符作为预览
                                    content_preview = full_content[:100] + "..." if len(full_content) > 100 else full_content
                                    print(f"✅ 获取到内容预览: {len(full_content)} 字符")
                        except Exception as e:
                            print(f"⚠️ 获取笔记详情失败: {e}")
                    
                    note = {
                        "note_id": item.get('id', ''),
                        "title": note_card.get('display_title', ''),
                        "desc": note_card.get('desc', ''),
                        "content_preview": content_preview,  # 添加内容预览
                        "type": note_card.get('type', 'normal'),
                        "url": note_url,  # 添加小红书链接
                        "user": {
                            "nickname": user_info.get('nickname', ''),
                            "user_id": user_info.get('user_id', '')
                        },
                        "interact_info": {
                            "liked_count": str(interact_info.get('liked_count', '0')),
                            "comment_count": str(interact_info.get('comment_count', '0')),
                            "collected_count": str(interact_info.get('collected_count', '0'))
                        },
                        "cover": cover_url
                    }
                    notes.append(note)
                    count += 1
            
            print(f"📝 处理后的笔记数量: {len(notes)}")
            
            return {
                "success": True,
                "data": {
                    "message": "XHS搜索成功，返回真实数据",
                    "keyword": request.keyword,
                    "page": request.page,
                    "page_size": request.page_size,
                    "status": "real",
                    "total_count": len(notes),
                    "notes": notes
                }
            }
        else:
            print("❌ 没有找到items字段或结果为空")
            print(f"📊 原始结果: {result}")
            
            # 返回演示数据
            return {
                "success": True,
                "data": {
                    "message": "XHS搜索失败，返回演示数据",
                    "keyword": request.keyword,
                    "page": request.page,
                    "page_size": request.page_size,
                    "status": "demo",
                    "total_count": 3,
                    "notes": [
                        {
                            "note_id": "demo_001",
                            "title": f"关于'{request.keyword}'的示例笔记1",
                            "desc": f"这是一个关于{request.keyword}的示例笔记描述...",
                            "type": "normal",
                            "user": {"nickname": "示例用户1", "user_id": "demo_user_1"},
                            "interact_info": {"liked_count": "100", "comment_count": "20", "collected_count": "50"},
                            "cover": "https://via.placeholder.com/300x400?text=Demo+1"
                        }
                    ]
                }
            }
            
    except Exception as e:
        print(f"❌ 搜索异常: {e}")
        import traceback
        print(f"❌ 错误详情: {traceback.format_exc()}")
        
        return {
            "success": False,
            "error": str(e),
            "data": {
                "message": "XHS搜索异常，返回演示数据",
                "keyword": request.keyword,
                "status": "error"
            }
        }

@app.post("/cookie/update")
async def update_cookie(request: CookieRequest):
    """更新Cookie配置"""
    print("=" * 80)
    print("🍪 更新Cookie请求")
    print(f"🍪 新Cookie长度: {len(request.cookie)}")

    try:
        # 测试Cookie有效性
        print("🧪 测试Cookie有效性...")
        client = XhsClient(cookie=request.cookie)
        test_result = client.get_note_by_keyword("测试", page=1, page_size=1)

        if isinstance(test_result, dict) and 'items' in test_result:
            print("✅ Cookie测试成功，有效")
            # 保存Cookie
            if save_cookie(request.cookie):
                global SUCCESS_COOKIE
                SUCCESS_COOKIE = request.cookie
                return {
                    "success": True,
                    "message": "Cookie更新成功，已通过有效性测试",
                    "status": "valid"
                }
            else:
                return {
                    "success": False,
                    "message": "Cookie有效但保存失败",
                    "status": "save_failed"
                }
        else:
            print("❌ Cookie测试失败，可能已过期")
            return {
                "success": False,
                "message": "Cookie无效或已过期，请重新获取",
                "status": "invalid"
            }
    except Exception as e:
        print(f"❌ Cookie测试异常: {e}")
        return {
            "success": False,
            "message": f"Cookie测试失败: {str(e)}",
            "status": "error"
        }

@app.get("/cookie/status")
async def get_cookie_status():
    """获取当前Cookie状态"""
    try:
        if not SUCCESS_COOKIE:
            return {
                "has_cookie": False,
                "status": "no_cookie",
                "message": "未配置Cookie"
            }

        # 测试当前Cookie
        client = XhsClient(cookie=SUCCESS_COOKIE)
        test_result = client.get_note_by_keyword("测试", page=1, page_size=1)

        if isinstance(test_result, dict) and 'items' in test_result:
            return {
                "has_cookie": True,
                "status": "valid",
                "message": "Cookie有效",
                "cookie_length": len(SUCCESS_COOKIE)
            }
        else:
            return {
                "has_cookie": True,
                "status": "invalid",
                "message": "Cookie已过期",
                "cookie_length": len(SUCCESS_COOKIE)
            }
    except Exception as e:
        return {
            "has_cookie": bool(SUCCESS_COOKIE),
            "status": "error",
            "message": f"Cookie状态检查失败: {str(e)}",
            "cookie_length": len(SUCCESS_COOKIE) if SUCCESS_COOKIE else 0
        }

if __name__ == "__main__":
    print("🚀 启动FastAPI测试服务...")
    print("🔗 服务地址: http://localhost:8002")
    uvicorn.run(app, host="0.0.0.0", port=8002)