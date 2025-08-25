#!/usr/bin/env python3
"""
直接HTTP请求测试小红书搜索API
绕过XHS库，直接模拟浏览器请求
"""

import requests
import json
import time
import hashlib
import random
import string

def generate_search_id():
    """生成搜索ID"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

def generate_signature(uri, data, a1=""):
    """简化的签名生成"""
    timestamp = str(int(time.time() * 1000))
    raw_str = f"{timestamp}test{uri}{json.dumps(data, separators=(',', ':'), ensure_ascii=False) if data else ''}"
    md5_hash = hashlib.md5(raw_str.encode('utf-8')).hexdigest()
    
    # 简化的x-s生成
    x_s = md5_hash[:32]  # 简化处理
    
    return {
        'x-s': x_s,
        'x-t': timestamp,
        'x-s-common': 'base64encodedcommon'  # 简化处理
    }

def test_direct_request(cookie_str, keyword="美食"):
    """直接HTTP请求测试"""
    print("🌐 开始直接HTTP请求测试...")
    
    # 完整的请求头
    headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json;charset=UTF-8',
        'Cookie': cookie_str,
        'Origin': 'https://www.xiaohongshu.com',
        'Pragma': 'no-cache',
        'Referer': 'https://www.xiaohongshu.com/',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    # 请求数据
    data = {
        "keyword": keyword,
        "page": 1,
        "page_size": 10,
        "search_id": generate_search_id(),
        "sort": "general",
        "note_type": 0
    }
    
    print(f"📝 请求数据: {data}")
    
    # API端点
    url = "https://edith.xiaohongshu.com/api/sns/web/v1/search/notes"
    
    try:
        # 尝试不同的请求方式
        
        # 方式1: 不带签名的直接请求
        print("\n🔍 方式1: 直接请求（无签名）")
        response1 = requests.post(url, headers=headers, json=data, timeout=10)
        print(f"状态码: {response1.status_code}")
        print(f"响应头: {dict(response1.headers)}")
        print(f"响应内容: {response1.text[:500]}...")
        
        # 方式2: 带简化签名的请求
        print("\n🔍 方式2: 带签名请求")
        uri = "/api/sns/web/v1/search/notes"
        signature = generate_signature(uri, data)
        headers_with_sign = headers.copy()
        headers_with_sign.update(signature)
        
        response2 = requests.post(url, headers=headers_with_sign, json=data, timeout=10)
        print(f"状态码: {response2.status_code}")
        print(f"响应头: {dict(response2.headers)}")
        print(f"响应内容: {response2.text[:500]}...")
        
        # 方式3: 尝试GET请求
        print("\n🔍 方式3: GET请求")
        params = {
            'keyword': keyword,
            'page': 1,
            'page_size': 10,
            'sort': 'general'
        }
        response3 = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"状态码: {response3.status_code}")
        print(f"响应内容: {response3.text[:500]}...")
        
        # 方式4: 尝试不同的API端点
        print("\n🔍 方式4: 尝试不同端点")
        alt_urls = [
            "https://www.xiaohongshu.com/api/sns/web/v1/search/notes",
            "https://edith.xiaohongshu.com/api/sns/web/v2/search/notes",
            "https://edith.xiaohongshu.com/api/sns/web/v1/search",
        ]
        
        for alt_url in alt_urls:
            try:
                print(f"  尝试: {alt_url}")
                response = requests.post(alt_url, headers=headers, json=data, timeout=5)
                print(f"  状态码: {response.status_code}")
                if response.status_code == 200:
                    print(f"  响应: {response.text[:200]}...")
            except Exception as e:
                print(f"  错误: {e}")
        
        return response1, response2, response3
        
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return None, None, None

if __name__ == "__main__":
    # 使用测试Cookie
    test_cookie = "abRequestId=439a8b17-1b61-5307-87ed-efec8a2a6624; a1=198cba40d8dvnhr0zja9fg4xxx774qgwn8vmhoi1350000400192; webId=a7d40c9b85cc7a55e4f1c58f125a8a8f; gid=yjYSD04JKfIqyjYSD048fYl3YfhIxF8uV0jihyqk4CCCW628W4AkEx888488yjJ8Y04DK8qd; xsecappid=xhs-pc-web; web_session=040069b6d4ee5a7980e15856923a4ba1b28686; webBuild=4.76.0; loadts=1755936043438; unread={%22ub%22:%226895cafe000000000004000df2%22%2C%22ue%22:%22689b4bcf000000001c03106e%22%2C%22uc%22:27}; acw_tc=0a0bb0cb17559377408002091e0a75566c149b85df44e4e12fd59d89056b24; websectiga=7750c37de43b7be9de8ed9ff8ea0e576519e8cd2157322eb972ecb429a7735d4; sec_poison_id=542a9a7c-2864-4bbf-9a85-0b68ffd4d100"
    
    print("🚀 开始直接HTTP请求测试")
    print("=" * 80)
    
    responses = test_direct_request(test_cookie, "美食")
    
    print("\n" + "=" * 80)
    print("🎯 测试总结:")
    print("如果所有方式都失败，说明小红书API可能:")
    print("1. 需要更复杂的签名算法")
    print("2. 已经更改了API端点")
    print("3. 增加了新的反爬虫机制")
    print("4. 需要特定的浏览器环境或JS执行")