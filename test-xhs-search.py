#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os

# 添加xhs模块到路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'xhs-service'))

try:
    from xhs import XhsClient
    print("✅ XhsClient导入成功")
    
    # 测试初始化
    print("🚀 开始初始化XhsClient...")
    client = XhsClient()
    print(f"✅ XhsClient初始化成功")
    print(f"🔍 external_sign: {getattr(client, 'external_sign', 'NOT_FOUND')}")
    
    # 尝试搜索
    print("🔍 开始测试搜索功能...")
    try:
        result = client.get_note_by_keyword(
            keyword="美食",
            page=1,
            page_size=5
        )
        print(f"✅ 搜索成功！结果类型: {type(result)}")
        if isinstance(result, dict):
            print(f"📊 结果键: {list(result.keys())}")
            if 'items' in result:
                print(f"📝 找到 {len(result['items'])} 条结果")
        else:
            print(f"📝 结果内容: {result}")
            
    except Exception as e:
        print(f"❌ 搜索失败: {e}")
        print(f"❌ 错误类型: {type(e)}")
        import traceback
        print(f"❌ 完整错误堆栈:")
        print(traceback.format_exc())
    
except ImportError as e:
    print(f"❌ 导入XhsClient失败: {e}")
except Exception as e:
    print(f"❌ 初始化失败: {e}")
    import traceback
    print(f"❌ 完整错误: {traceback.format_exc()}")