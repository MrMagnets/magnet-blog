import json
import random
import re
import requests
import time
from datetime import datetime

# 题目池（你可以自由增删）
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
    url = f"https://www.luogu.com.cn/problem/{pid}"
    # 使用更完整、更像真实浏览器的请求头
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }
    
    try:
        # 增加随机延迟，模拟人类浏览行为，降低被封风险
        time.sleep(random.uniform(1.0, 2.5))
        response = requests.get(url, headers=headers, timeout=20)
        response.encoding = "utf-8"
        
        if response.status_code != 200:
            return {"pid": pid, "error": f"HTTP {response.status_code}"}
        
        html = response.text
        # 尝试提取包含题目信息的 JSON 数据
        match = re.search(r'window\._feInjection\s*=\s*({.*?});\s*</script>', html, re.DOTALL)
        if not match:
            return {"pid": pid, "error": "未找到题目数据"}
        
        data = json.loads(match.group(1))
        problem_data = data.get("currentData", {}).get("problem", {})
        if not problem_data:
            return {"pid": pid, "error": "题目数据为空"}
        
        # 清理题目内容中的 HTML 标签
        content = problem_data.get("content", "")
        content = re.sub(r'<[^>]+>', '', content)
        content = re.sub(r'\s+', ' ', content).strip()
        
        input_format = problem_data.get("inputFormat", "")
        input_format = re.sub(r'<[^>]+>', '', input_format).strip()
        
        output_format = problem_data.get("outputFormat", "")
        output_format = re.sub(r'<[^>]+>', '', output_format).strip()
        
        samples = problem_data.get("samples", [])
        
        # 转换难度等级
        difficulty_map = {
            1: "入门", 2: "普及-", 3: "普及/提高-",
            4: "普及+/提高", 5: "提高+/省选-",
            6: "省选/NOI-", 7: "NOI/NOI+/CTSC"
        }
        difficulty_level = problem_data.get("difficulty", 0)
        difficulty = difficulty_map.get(difficulty_level, "未知")
        
        tags = problem_data.get("tags", [])
        
        return {
            "pid": pid,
            "title": problem_data.get("title", pid),
            "url": f"https://www.luogu.com.cn/problem/{pid}",
            "difficulty": difficulty,
            "tags": tags,
            "content": content[:3000] if content else "暂无描述",
            "input_format": input_format or "暂无",
            "output_format": output_format or "暂无",
            "samples": samples
        }
        
    except Exception as e:
        return {"pid": pid, "error": str(e)}

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
