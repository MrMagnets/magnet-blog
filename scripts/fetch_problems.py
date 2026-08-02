import json
import random
import requests
from datetime import datetime

PROBLEM_POOL = [
    "P1001", "P1002", "P1003", "P1008", "P1011", "P1012", "P1014",
    "P1015", "P1016", "P1017", "P1018", "P1019", "P1020", "P1021",
    "P1022", "P1023", "P1024", "P1025", "P1026", "P1028", "P1029",
    "P1030", "P1031", "P1032", "P1035", "P1036", "P1037", "P1038",
    "P1039", "P1040", "P1041", "P1042", "P1043", "P1044", "P1045",
    "P1046", "P1047", "P1048", "P1049", "P1050", "P1051", "P1055",
    "P1056", "P1057", "P1058", "P1059", "P1060", "P1061", "P1067",
    "P1068", "P1071", "P1072", "P1075", "P1076", "P1077", "P1078",
    "P1079", "P1080", "P1081", "P1082", "P1083", "P1085", "P1086",
    "P1087", "P1088", "P1089", "P1090", "P1091", "P1092", "P1093",
    "P1094", "P1095", "P1096", "P1097", "P1098", "P1099", "P1100"
]

def fetch_problem_from_luogu(pid):
    """使用洛谷官方 API 获取题目"""
    # 方法1: 使用洛谷 API
    url = f"https://www.luogu.com.cn/api/problem/detail/{pid}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://www.luogu.com.cn/"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 200:
                problem = data.get("data", {})
                return {
                    "pid": pid,
                    "title": problem.get("title", pid),
                    "url": f"https://www.luogu.com.cn/problem/{pid}",
                    "difficulty": problem.get("difficulty", "未知"),
                    "tags": problem.get("tags", []),
                    "content": problem.get("content", "暂无描述")[:500],
                    "input_format": problem.get("input_format", ""),
                    "output_format": problem.get("output_format", ""),
                    "samples": problem.get("samples", [])
                }
    except:
        pass
    
    # 方法2: 如果 API 失败，使用爬虫
    url = f"https://www.luogu.com.cn/problem/{pid}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cookie": "_uid=; __client_id=;"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            html = response.text
            import re
            # 尝试提取标题
            title_match = re.search(r'<title>(.*?)</title>', html)
            title = title_match.group(1).replace(' - 洛谷', '').strip() if title_match else pid
            
            # 提取题目内容
            content_match = re.search(r'<article>(.*?)</article>', html, re.DOTALL)
            content = content_match.group(1) if content_match else "暂无描述"
            content = re.sub(r'<[^>]+>', '', content)[:500]
            
            return {
                "pid": pid,
                "title": title,
                "url": f"https://www.luogu.com.cn/problem/{pid}",
                "difficulty": "未知",
                "tags": [],
                "content": content,
                "input_format": "",
                "output_format": "",
                "samples": []
            }
    except:
        pass
    
    # 方法3: 返回基本信息
    return {
        "pid": pid,
        "title": pid,
        "url": f"https://www.luogu.com.cn/problem/{pid}",
        "difficulty": "未知",
        "tags": [],
        "content": f"题目 {pid}，请访问洛谷查看完整内容",
        "input_format": "",
        "output_format": "",
        "samples": []
    }

def main():
    selected = random.sample(PROBLEM_POOL, 3)
    problems = []
    for pid in selected:
        print(f"正在获取 {pid}...")
        info = fetch_problem_from_luogu(pid)
        problems.append(info)
        print(f"  ✅ {pid} 获取完成")
    
    output = {
        "date": datetime.now().isoformat(),
        "problems": problems
    }
    
    with open("content/problems.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 已更新 3 道题目: {', '.join([p['pid'] for p in problems])}")

if __name__ == "__main__":
    main()