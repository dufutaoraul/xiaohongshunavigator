#!/usr/bin/env python3
"""
回到最初的简单实现 - 尝试恢复能获取真实数据的版本
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'xhs-service'))

from xhs import XhsClient

def test_original_simple():
    """最简单的原始测试"""
    print("🔍 开始最简单的原始测试...")
    
    # 使用最新Cookie
    cookie = "abRequestId=439a8b17-1b61-5307-87ed-efec8a2a6624; a1=198cba40d8dvnhr0zja9fg4xxx774qgwn8vmhoi1350000400192; webId=a7d40c9b85cc7a55e4f1c58f125a8a8f; gid=yjYSD04JKfIqyjYSD048fYl3YfhIxF8uV0jihyqk4CCCW628W4AkEx888488yjJ8Y04DK8qd; xsecappid=xhs-pc-web; web_session=040069b6d4ee5a7980e15856923a4ba1b28686; webBuild=4.76.0; loadts=1755936043438; unread={%22ub%22:%226895cafe000000000004000df2%22%2C%22ue%22:%22689b4bcf000000001c03106e%22%2C%22uc%22:27}; acw_tc=0a0bb0cb17559377408002091e0a75566c149b85df44e4e12fd59d89056b24; websectiga=7750c37de43b7be9de8ed9ff8ea0e576519e8cd2157322eb972ecb429a7735d4; sec_poison_id=542a9a7c-2864-4bbf-9a85-0b68ffd4d100"
    
    try:
        # 最简单的初始化
        print("🚀 初始化XhsClient...")
        client = XhsClient(cookie=cookie)
        print("✅ 初始化成功")
        
        # 最简单的搜索调用
        print("🔍 开始搜索...")
        result = client.get_note_by_keyword("美食")
        
        print(f"📊 结果类型: {type(result)}")
        print(f"📊 结果内容: {result}")
        
        # 检查结果结构
        if isinstance(result, dict):
            print(f"📋 字典键: {list(result.keys())}")
            
            # 检查是否有数据
            if 'items' in result:
                items = result['items']
                print(f"🎉 找到items字段，长度: {len(items)}")
                if items:
                    print(f"📝 第一个item: {items[0]}")
                    return True
            elif 'data' in result:
                data = result['data']
                print(f"🎉 找到data字段: {data}")
                if isinstance(data, list) and data:
                    print(f"📝 第一个data: {data[0]}")
                    return True
            else:
                print("❌ 没有找到items或data字段")
        
        return False
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        print(f"❌ 错误详情: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🔄 尝试恢复原始工作版本")
    print("=" * 60)
    
    success = test_original_simple()
    
    print("=" * 60)
    if success:
        print("🎉 成功！找到了能获取真实数据的方法")
    else:
        print("❌ 仍然无法获取真实数据")
    print("=" * 60)