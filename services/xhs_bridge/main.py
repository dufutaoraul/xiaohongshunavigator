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
    
    # 暂时返回模拟数据，因为XHS库需要签名函数才能正常工作
    return {
        "message": "XHS库已加载，但需要配置签名函数才能进行实际搜索",
        "keyword": keyword,
        "page": page,
        "page_size": page_size,
        "status": "需要配置",
        "notes": [
            {
                "note_id": "demo_001",
                "title": f"关于'{keyword}'的示例笔记1",
                "desc": "这是一个示例笔记，展示搜索功能的数据结构。实际使用需要配置XHS的签名函数。",
                "type": "normal",
                "user": {
                    "nickname": "示例用户1",
                    "user_id": "demo_user_001"
                },
                "interact_info": {
                    "liked_count": "1.2k",
                    "comment_count": "88",
                    "collected_count": "456"
                }
            },
            {
                "note_id": "demo_002", 
                "title": f"关于'{keyword}'的示例笔记2",
                "desc": "这是第二个示例笔记。要获取真实数据，需要提供有效的Cookie和签名函数。",
                "type": "video",
                "user": {
                    "nickname": "示例用户2",
                    "user_id": "demo_user_002"
                },
                "interact_info": {
                    "liked_count": "2.5k",
                    "comment_count": "156",
                    "collected_count": "789"
                }
            }
        ],
        "next_steps": [
            "1. 获取小红书登录Cookie",
            "2. 配置签名函数或使用第三方签名服务",
            "3. 更新XhsClient初始化参数"
        ]
    }

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
