import sys
import os
import json

# 添加 xhs-service 到 Python 路径
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
xhs_service_path = os.path.join(project_root, 'xhs-service')
sys.path.insert(0, xhs_service_path)

try:
    from xhs import XhsClient
    XHS_AVAILABLE = True
except ImportError as e:
    XHS_AVAILABLE = False
    XHS_ERROR = str(e)

def test():
    """
    小红书爬虫测试函数
    返回启动成功的消息和库状态
    """
    # 添加详细的调试信息
    debug_info = {
        "current_dir": os.path.dirname(os.path.abspath(__file__)),
        "project_root": os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "xhs_service_path": os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'xhs-service'),
        "xhs_service_exists": os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'xhs-service')),
        "python_path": sys.path[:3]  # 显示前3个路径
    }
    
    if XHS_AVAILABLE:
        return {
            "message": "小红书爬虫启动成功",
            "xhs_library": "已加载",
            "status": "ready",
            "available_functions": [
                "get_note_by_keyword",
                "get_user_info", 
                "get_note_by_id",
                "search_notes"
            ],
            "debug_info": debug_info
        }
    else:
        return {
            "message": "小红书爬虫启动成功",
            "xhs_library": "未加载",
            "status": "limited",
            "error": XHS_ERROR,
            "note": "基础功能可用，但无法使用高级爬虫功能",
            "debug_info": debug_info
        }

def search_notes_by_keyword(keyword, page=1, page_size=10, *args):
    """
    根据关键词搜索小红书笔记 - 支持灵活参数传递
    
    参数可以是：
    - search_notes_by_keyword(keyword, page, page_size, sort_by)
    - search_notes_by_keyword(keyword, page, page_size, cookies, sort_by)
    
    :param keyword: 搜索关键词
    :param page: 页码，默认为1
    :param page_size: 每页数量，默认为10
    :param args: 可变参数，可以是 (sort_by) 或 (cookies, sort_by)
    :return: 搜索结果
    """
    # 解析参数
    cookies = None
    sort_by = 'general'
    
    if len(args) == 1:
        # 只有 sort_by 参数
        sort_by = args[0]
    elif len(args) == 2:
        # cookies 和 sort_by 参数
        cookies = args[0]
        sort_by = args[1]
    elif len(args) > 2:
        # 过多参数，取前两个
        cookies = args[0]
        sort_by = args[1]
    if not XHS_AVAILABLE:
        return {"error": "XHS库未加载，无法执行搜索功能"}
    
    try:
        # 映射排序参数到XHS库的排序类型
        sort_mapping = {
            'general': 'GENERAL',      # 综合排序
            'time': 'LATEST',          # 最新发布
            'likes': 'MOST_POPULAR'    # 最多点赞
        }
        
        # 验证排序参数
        if sort_by not in sort_mapping:
            return {
                "error": f"不支持的排序方式: {sort_by}",
                "supported_sorts": list(sort_mapping.keys()),
                "keyword": keyword
            }
        
        # 如果提供了cookies，尝试使用真实API
        if cookies:
            # 导入内置签名函数
            from xhs.help import sign
            
            # 创建签名函数适配器
            def custom_sign(uri, data, a1, web_session):
                """
                适配XhsClient期望的签名函数格式
                XhsClient期望: sign(uri, data, a1, web_session)
                内部sign函数: sign(uri, data=None, ctime=None, a1="", b1="")
                """
                try:
                    # 调用内部签名函数，忽略web_session参数
                    return sign(uri, data=data, a1=a1)
                except Exception as e:
                    print(f"签名函数执行失败: {e}")
                    return None
            
            # 创建客户端时添加更多配置
            client = XhsClient(
                cookie=cookies, 
                sign=custom_sign,
                timeout=30,  # 增加超时时间
                proxies=None  # 可以在这里配置代理
            )
            
            # 尝试搜索笔记
            try:
                from xhs import SearchSortType
                
                # 获取对应的排序类型
                sort_type = getattr(SearchSortType, sort_mapping[sort_by])
                
                notes = client.get_note_by_keyword(
                    keyword=keyword,
                    page=page,
                    sort=sort_type
                )
                
                # 处理返回的数据
                if notes and 'items' in notes:
                    processed_notes = []
                    items = notes['items']
                    
                    # 根据排序方式对数据进行二次排序（确保正确排序）
                    if sort_by == 'likes':
                        # 按点赞数降序排序，处理k、w等单位
                        def parse_count(count_str):
                            if not count_str:
                                return 0
                            count_str = str(count_str).lower()
                            if 'w' in count_str:
                                return int(float(count_str.replace('w', '')) * 10000)
                            elif 'k' in count_str:
                                return int(float(count_str.replace('k', '')) * 1000)
                            else:
                                return int(count_str.replace(',', ''))
                        
                        items = sorted(items, key=lambda x: parse_count(x.get('interact_info', {}).get('liked_count', '0')), reverse=True)
                    elif sort_by == 'time':
                        # 按时间排序（如果有时间字段的话）
                        items = sorted(items, key=lambda x: x.get('time', ''), reverse=True)
                    
                    for i, note in enumerate(items[:page_size]):
                        
                        # 尝试多种可能的字段名
                        title = (note.get("display_title") or 
                                note.get("title") or 
                                note.get("note_card", {}).get("display_title") or
                                note.get("note_card", {}).get("title") or
                                "无标题")
                        
                        # 获取描述，如果为空则根据标题生成简单描述
                        desc = (note.get("desc") or 
                               note.get("description") or
                               note.get("note_card", {}).get("desc") or
                               "")
                        
                        # 如果描述为空，根据标题和类型生成简单描述
                        if not desc or desc.strip() == "":
                            note_type = note.get("type", "normal")
                            if note_type == "video":
                                desc = f"关于「{title}」的精彩视频内容，点击查看完整视频。"
                            else:
                                desc = f"分享关于「{title}」的内容，包含图片和详细介绍。"
                        
                        # 用户信息处理
                        user_info = note.get("user") or note.get("note_card", {}).get("user") or {}
                        nickname = user_info.get("nickname") or user_info.get("name") or "未知用户"
                        
                        # 互动信息处理
                        interact_info = note.get("interact_info") or note.get("note_card", {}).get("interact_info") or {}
                        
                        processed_note = {
                            "note_id": note.get("id") or note.get("note_id") or f"unknown_{i}",
                            "title": title,
                            "desc": desc,
                            "type": note.get("type", "normal"),
                            "user": {
                                "nickname": nickname,
                                "user_id": user_info.get("user_id") or user_info.get("id") or ""
                            },
                            "interact_info": {
                                "liked_count": str(interact_info.get("liked_count") or interact_info.get("like_count") or "0"),
                                "comment_count": str(interact_info.get("comment_count") or "0"),
                                "collected_count": str(interact_info.get("collected_count") or interact_info.get("collect_count") or "0")
                            },
                            "cover": note.get("cover", {}).get("url_default", "") if isinstance(note.get("cover"), dict) else "",
                            "raw_data_keys": list(note.keys()) if isinstance(note, dict) else []  # 调试信息
                        }
                        processed_notes.append(processed_note)
                    
                    return {
                        "message": "搜索成功",
                        "keyword": keyword,
                        "page": page,
                        "page_size": page_size,
                        "status": "success",
                        "total_count": len(processed_notes),
                        "notes": processed_notes
                    }
                else:
                    return {
                        "message": "未找到相关笔记",
                        "keyword": keyword,
                        "status": "no_results",
                        "notes": []
                    }
                    
            except Exception as search_error:
                error_msg = str(search_error)
                
                # 检查是否是Cookie过期错误
                if "登录已过期" in error_msg or "-100" in error_msg or "'code': -100" in error_msg:
                    return {
                        "error": "Cookie已过期",
                        "error_code": -100,
                        "error_type": "cookie_expired",
                        "error_details": error_msg,
                        "keyword": keyword,
                        "status": "cookie_expired",
                        "message": "登录状态已过期，请重新获取Cookie。",
                        "warning": "注意：在电脑上登录小红书会导致Cookie失效！",
                        "solutions": [
                            "1. 使用手机浏览器登录小红书获取Cookie",
                            "2. 避免在电脑上登录小红书网站",
                            "3. 如果必须在电脑登录，请重新获取Cookie",
                            "4. 建议使用无痕模式获取Cookie以避免冲突"
                        ],
                        "cookie_guide": {
                            "mobile_steps": [
                                "1. 用手机浏览器打开 www.xiaohongshu.com",
                                "2. 登录账号",
                                "3. 打开浏览器开发者工具获取Cookie",
                                "4. 复制完整Cookie字符串"
                            ],
                            "desktop_steps": [
                                "1. 使用无痕/隐私模式打开浏览器",
                                "2. 访问 www.xiaohongshu.com 并登录",
                                "3. 按F12打开开发者工具",
                                "4. 在Network标签页找到Cookie",
                                "5. 复制Cookie后立即关闭无痕窗口"
                            ]
                        }
                    }
                # 检查是否是验证码错误
                elif "验证码" in error_msg or "Verify" in error_msg or "124" in error_msg:
                    return {
                        "error": "搜索失败: 触发小红书反爬虫验证机制",
                        "error_details": error_msg,
                        "keyword": keyword,
                        "status": "verification_required",
                        "suggestions": [
                            "小红书检测到自动化请求，触发了反爬虫机制",
                            "建议等待10-30分钟后重试",
                            "可以尝试在浏览器中手动访问小红书并完成验证",
                            "完成验证后重新获取Cookie",
                            "降低请求频率可以减少触发验证的概率"
                        ],
                        "next_steps": [
                            "1. 在浏览器中访问 www.xiaohongshu.com",
                            "2. 如果出现验证码，完成人工验证",
                            "3. 重新获取Cookie并更新配置",
                            "4. 等待一段时间后重试"
                        ]
                    }
                else:
                    return {
                        "error": f"搜索执行失败: {error_msg}",
                        "keyword": keyword,
                        "status": "search_failed",
                        "suggestion": "请检查Cookie是否有效，或稍后重试"
                    }
        
        # 如果没有提供cookies，返回模拟数据和配置指南
        else:
            # 生成指定数量的演示数据
            demo_notes = []
            
            # 基础演示数据模板
            base_templates = [
                {
                    "title_template": f"【精选】{keyword}相关优质内容推荐",
                    "desc_template": f"这是关于{keyword}的精选内容，展示了优质的图文分享。配置Cookie后可获取真实数据，包含更多详细信息和互动数据。",
                    "type": "normal",
                    "user": {"nickname": "生活达人", "user_id": "user_001"},
                    "interact_info": {"liked_count": "2.1k", "comment_count": "156", "collected_count": "678"}
                },
                {
                    "title_template": f"超实用{keyword}攻略分享",
                    "desc_template": f"详细的{keyword}使用攻略和心得体会，包含实用技巧和注意事项。这是演示数据，真实内容需要配置Cookie获取。",
                    "type": "normal", 
                    "user": {"nickname": "攻略专家", "user_id": "user_002"},
                    "interact_info": {"liked_count": "1.8k", "comment_count": "234", "collected_count": "892"}
                },
                {
                    "title_template": f"【视频】{keyword}完整教程",
                    "desc_template": f"完整的{keyword}视频教程，从基础到进阶的全面讲解。这是演示视频内容，配置Cookie后可获取真实的视频笔记。",
                    "type": "video",
                    "user": {"nickname": "教程博主", "user_id": "user_003"},
                    "interact_info": {"liked_count": "5.2k", "comment_count": "445", "collected_count": "1.2k"}
                },
                {
                    "title_template": f"我的{keyword}使用心得",
                    "desc_template": f"个人使用{keyword}的真实心得和体验分享，包含优缺点分析。演示数据展示个人体验类内容格式。",
                    "type": "normal",
                    "user": {"nickname": "体验分享者", "user_id": "user_004"},
                    "interact_info": {"liked_count": "956", "comment_count": "78", "collected_count": "234"}
                },
                {
                    "title_template": f"最新{keyword}趋势解析",
                    "desc_template": f"2024年最新的{keyword}发展趋势和市场分析，帮你了解最新动态。这是演示的趋势分析类内容。",
                    "type": "normal",
                    "user": {"nickname": "趋势分析师", "user_id": "user_005"},
                    "interact_info": {"liked_count": "3.4k", "comment_count": "267", "collected_count": "1.1k"}
                }
            ]
            
            # 根据排序方式调整数据
            if sort_by == 'likes':
                # 按点赞数排序，调整点赞数据
                base_templates[0]["interact_info"]["liked_count"] = "8.9k"
                base_templates[1]["interact_info"]["liked_count"] = "6.7k" 
                base_templates[2]["interact_info"]["liked_count"] = "5.2k"
                base_templates[3]["interact_info"]["liked_count"] = "3.4k"
                base_templates[4]["interact_info"]["liked_count"] = "2.1k"
                # 按点赞数排序
                base_templates.sort(key=lambda x: float(x["interact_info"]["liked_count"].replace('k', '000').replace('.', '')), reverse=True)
            elif sort_by == 'time':
                # 最新发布，调整标题
                base_templates[0]["title_template"] = f"【最新】{keyword}今日热门分享"
                base_templates[1]["title_template"] = f"刚刚发布：{keyword}最新动态"
                base_templates[2]["title_template"] = f"【新鲜出炉】{keyword}使用技巧"
            
            # 生成指定数量的笔记
            for i in range(min(page_size, len(base_templates))):
                template = base_templates[i]
                note_id = f"65f8a2b3c4d5e6f7890123{i:02d}"  # 生成看起来真实的ID
                
                demo_note = {
                    "note_id": note_id,
                    "title": template["title_template"],
                    "desc": template["desc_template"],
                    "type": template["type"],
                    "user": template["user"],
                    "interact_info": template["interact_info"],
                    "cover": "",
                    "publish_time": f"2024-01-{20-i} 1{i}:30"
                }
                demo_notes.append(demo_note)
            
            # 如果请求的数量超过模板数量，重复使用模板
            while len(demo_notes) < page_size:
                remaining = page_size - len(demo_notes)
                for i, template in enumerate(base_templates[:remaining]):
                    note_id = f"65f8a2b3c4d5e6f789012{len(demo_notes):03d}"
                    demo_note = {
                        "note_id": note_id,
                        "title": f"{template['title_template']} (第{len(demo_notes)+1}条)",
                        "desc": template["desc_template"],
                        "type": template["type"],
                        "user": template["user"],
                        "interact_info": template["interact_info"],
                        "cover": "",
                        "publish_time": f"2024-01-{20-(len(demo_notes)%20)} 1{len(demo_notes)%24}:30"
                    }
                    demo_notes.append(demo_note)
                    if len(demo_notes) >= page_size:
                        break

            return {
                "message": "XHS库已加载，但需要配置Cookie才能进行实际搜索",
                "keyword": keyword,
                "page": page,
                "page_size": page_size,
                "sort_by": sort_by,
                "sort_name": {
                    'general': '综合排序',
                    'time': '最新发布', 
                    'likes': '最多点赞'
                }.get(sort_by, sort_by),
                "status": "需要配置",
                "notes": demo_notes,
                "cookie_guide": {
                    "steps": [
                        "1. 在浏览器中登录小红书网页版 (www.xiaohongshu.com)",
                        "2. 打开开发者工具 (F12)",
                        "3. 切换到 Network 标签页",
                        "4. 刷新页面或进行搜索操作",
                        "5. 找到请求头中的 Cookie 字段",
                        "6. 复制完整的 Cookie 值",
                        "7. 在API请求中添加 cookies 参数"
                    ],
                    "example_usage": {
                        "method": "POST",
                        "url": "/api/xhs/test",
                        "body": {
                            "action": "search",
                            "keyword": "美食",
                            "cookies": "你的Cookie字符串"
                        }
                    }
                }
            }
            
    except Exception as e:
        return {
            "error": f"搜索功能执行失败: {str(e)}",
            "keyword": keyword,
            "status": "error"
        }

def get_note_info(note_id, cookies=None):
    """
    获取指定笔记的详细信息
    
    :param note_id: 笔记ID
    :param cookies: 用户Cookie（可选）
    :return: 笔记详细信息
    """
    if not XHS_AVAILABLE:
        return {"error": "XHS库未加载，无法获取笔记信息"}
    
    try:
        if cookies:
            # 使用Cookie创建客户端
            from xhs.help import sign
            
            def custom_sign(uri, data, a1, web_session):
                try:
                    return sign(uri, data=data, a1=a1)
                except Exception as e:
                    print(f"签名函数执行失败: {e}")
                    return None
            
            client = XhsClient(cookie=cookies, sign=custom_sign)
            
            try:
                # 尝试获取笔记详情
                note = client.get_note_by_id(note_id)
                
                if note:
                    return {
                        "status": "success",
                        "note_id": note_id,
                        "title": note.get("title", ""),
                        "desc": note.get("desc", ""),
                        "type": note.get("type", "normal"),
                        "user": {
                            "nickname": note.get("user", {}).get("nickname", ""),
                            "user_id": note.get("user", {}).get("user_id", "")
                        },
                        "interact_info": {
                            "liked_count": note.get("interact_info", {}).get("liked_count", "0"),
                            "comment_count": note.get("interact_info", {}).get("comment_count", "0"),
                            "collected_count": note.get("interact_info", {}).get("collected_count", "0")
                        },
                        "tag_list": note.get("tag_list", []),
                        "time": note.get("time", ""),
                        "images": note.get("image_list", [])
                    }
                else:
                    return {"error": "未找到指定笔记", "note_id": note_id}
                    
            except Exception as api_error:
                error_msg = str(api_error)
                if "验证码" in error_msg or "Verify" in error_msg or "124" in error_msg:
                    return {
                        "error": "获取笔记失败: 触发验证机制",
                        "note_id": note_id,
                        "status": "verification_required",
                        "suggestion": "请等待一段时间后重试，或在浏览器中完成验证"
                    }
                else:
                    return {"error": f"获取笔记详情失败: {error_msg}", "note_id": note_id}
        else:
            # 没有Cookie时返回演示数据
            return {
                "status": "demo",
                "note_id": note_id,
                "title": "演示笔记标题",
                "desc": "这是演示笔记内容。配置Cookie后可获取真实笔记详情。",
                "type": "normal",
                "user": {"nickname": "演示用户", "user_id": "demo_user"},
                "interact_info": {"liked_count": "1.2k", "comment_count": "88", "collected_count": "456"},
                "tag_list": ["演示标签"],
                "time": "2024-01-20",
                "message": "需要配置Cookie才能获取真实笔记详情"
            }
        
    except Exception as e:
        return {"error": f"获取笔记信息失败: {str(e)}", "note_id": note_id}
