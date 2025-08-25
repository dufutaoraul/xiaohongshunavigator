#!/usr/bin/env python3
"""
测试小红书Cookie有效性的脚本
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'xhs-service'))

from xhs import XhsClient

def test_cookie(cookie_str):
    """测试Cookie有效性"""
    print("🔍 开始测试Cookie有效性...")
    print(f"🍪 Cookie长度: {len(cookie_str)}")
    print(f"🍪 Cookie前100字符: {cookie_str[:100]}...")
    
    try:
        # 初始化客户端
        client = XhsClient(
            cookie=cookie_str,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
        
        print("✅ 客户端初始化成功")
        
        # 测试搜索功能
        print("🔍 测试搜索功能...")
        result = client.get_note_by_keyword("美食", page=1, page_size=5)
        
        print(f"📊 搜索结果类型: {type(result)}")
        print(f"📊 搜索结果: {result}")
        
        if isinstance(result, dict):
            print(f"📋 结果字段: {list(result.keys())}")
            
            # 检查是否有笔记数据
            if 'data' in result and result['data']:
                print("🎉 找到笔记数据!")
                notes = result['data']
                print(f"📝 笔记数量: {len(notes)}")
                for i, note in enumerate(notes[:3]):
                    print(f"  {i+1}. {note.get('title', '无标题')}")
            elif 'notes' in result and result['notes']:
                print("🎉 找到笔记数据!")
                notes = result['notes']
                print(f"📝 笔记数量: {len(notes)}")
                for i, note in enumerate(notes[:3]):
                    print(f"  {i+1}. {note.get('title', '无标题')}")
            else:
                print("❌ 没有找到笔记数据")
                print("💡 可能的原因:")
                print("  - Cookie已过期")
                print("  - 需要登录状态的Cookie")
                print("  - 需要更完整的请求头")
        
        return result
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        print(f"❌ 错误详情: {traceback.format_exc()}")
        return None

if __name__ == "__main__":
    # 使用测试Cookie
    test_cookie_str = "abRequestId=439a8b17-1b61-5307-87ed-efec8a2a6624; a1=198cba40d8dvnhr0zja9fg4xxx774qgwn8vmhoi1350000400192; webId=a7d40c9b85cc7a55e4f1c58f125a8a8f; gid=yjYSD04JKfIqyjYSD048fYl3YfhIxF8uV0jihyqk4CCCW628W4AkEx888488yjJ8Y04DK8qd; xsecappid=xhs-pc-web; web_session=040069b6d4ee5a7980e15856923a4ba1b28686; webBuild=4.76.0; loadts=1755844574924; unread={%22ub%22:%2268a33e99000000001c037165%22%2C%22ue%22:%2268a334e8000000001c00bc87%22%2C%22uc%22:29}; acw_tc=0a0bb0f117558702752177785e6aa85b5fa299e3e52b7b3e6b161fea9a55f7; websectiga=6169c1e84f393779a5f7de7303038f3b47a78e47be716e7bec57ccce17d45f99; sec_poison_id=2631f9cc-0c39-4a18-a832-70200805113e"
    
    result = test_cookie(test_cookie_str)
    
    if result:
        print("\n" + "="*50)
        print("🎯 测试结论:")
        if isinstance(result, dict) and ('data' in result or 'notes' in result):
            notes = result.get('data', result.get('notes', []))
            if notes:
                print("✅ Cookie有效，可以获取真实数据")
            else:
                print("⚠️ Cookie可能有效，但没有返回笔记数据")
        else:
            print("❌ Cookie可能无效或需要更新")
    else:
        print("❌ 测试失败，Cookie无效")