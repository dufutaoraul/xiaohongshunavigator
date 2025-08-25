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
    print(f"✅ XhsClient初始化成功: {type(client)}")
    
    # 检查属性
    print(f"🔍 external_sign: {getattr(client, 'external_sign', 'NOT_FOUND')}")
    print(f"🔍 cookie: {client.cookie}")
    
    # 检查方法
    if hasattr(client, 'get_note_by_keyword'):
        print("✅ get_note_by_keyword 方法存在")
        method = getattr(client, 'get_note_by_keyword')
        print(f"📝 方法类型: {type(method)}")
        print(f"📝 方法是否可调用: {callable(method)}")
    else:
        print("❌ get_note_by_keyword 方法不存在")
    
    print("🎉 基础测试完成")
    
except ImportError as e:
    print(f"❌ 导入XhsClient失败: {e}")
except Exception as e:
    print(f"❌ 初始化失败: {e}")
    import traceback
    print(f"❌ 完整错误: {traceback.format_exc()}")