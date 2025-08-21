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

def search_notes_by_keyword(keyword, page=1, page_size=10):
    """
    根据关键词搜索小红书笔记
    
    :param keyword: 搜索关键词
    :param page: 页码，默认为1
    :param page_size: 每页数量，默认为10
    :return: 搜索结果
    """
    if not XHS_AVAILABLE:
        return {"error": "XHS库未加载，无法执行搜索功能"}
    
    try:
        # 创建客户端实例（无需登录即可搜索公开内容）
        client = XhsClient()
        
        # 搜索笔记
        result = client.get_note_by_keyword(
            keyword=keyword,
            page=page,
            page_size=page_size
        )
        
        # 简化返回数据
        simplified_result = {
            "keyword": keyword,
            "page": page,
            "page_size": page_size,
            "has_more": result.get("has_more", False),
            "notes": []
        }
        
        for item in result.get("items", []):
            note = item.get("note_card", {})
            simplified_note = {
                "note_id": note.get("note_id"),
                "title": note.get("title"),
                "desc": note.get("desc", "")[:100] + "..." if len(note.get("desc", "")) > 100 else note.get("desc", ""),
                "type": note.get("type"),
                "user": {
                    "nickname": note.get("user", {}).get("nickname"),
                    "user_id": note.get("user", {}).get("user_id")
                },
                "interact_info": note.get("interact_info", {}),
                "cover": note.get("cover", {}).get("url_default") if note.get("cover") else None
            }
            simplified_result["notes"].append(simplified_note)
        
        return simplified_result
        
    except Exception as e:
        return {"error": f"搜索失败: {str(e)}"}

def get_note_info(note_id):
    """
    获取指定笔记的详细信息
    
    :param note_id: 笔记ID
    :return: 笔记详细信息
    """
    if not XHS_AVAILABLE:
        return {"error": "XHS库未加载，无法获取笔记信息"}
    
    try:
        client = XhsClient()
        
        # 获取笔记详情（需要xsec_token，这里使用空字符串尝试）
        note = client.get_note_by_id_from_html(note_id, "")
        
        # 简化返回数据
        simplified_note = {
            "note_id": note.get("note_id"),
            "title": note.get("title"),
            "desc": note.get("desc"),
            "type": note.get("type"),
            "user": note.get("user", {}),
            "interact_info": note.get("interact_info", {}),
            "tag_list": note.get("tag_list", []),
            "time": note.get("time"),
            "last_update_time": note.get("last_update_time")
        }
        
        return simplified_note
        
    except Exception as e:
        return {"error": f"获取笔记信息失败: {str(e)}"}
