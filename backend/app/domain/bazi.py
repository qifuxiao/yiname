# -*- coding: utf-8 -*-
"""
BaZi (八字) Calculator - Eight Characters for Destiny
Calculate Chinese birth chart based on birth date and time
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json


# Heavenly Stems (天干)
HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]

# Earthly Branches (地支)
EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

# Zodiac animals
ZODIAC_ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"]

# Five Elements mapping (五行)
WUXING_MAP = {
    "甲": "木", "乙": "木",
    "丙": "火", "丁": "火",
    "戊": "土", "己": "土",
    "庚": "金", "辛": "金",
    "壬": "水", "癸": "水",
}

# Earthly branch to zodiac
BRANCH_TO_ZODIAC = {
    "子": "鼠", "丑": "牛", "寅": "虎", "卯": "兔",
    "辰": "龙", "巳": "蛇", "午": "马", "未": "羊",
    "申": "猴", "酉": "鸡", "戌": "狗", "亥": "猪"
}

# Branch to five elements
BRANCH_WUXING = {
    "子": "水", "丑": "土", "寅": "木", "卯": "木",
    "辰": "土", "巳": "火", "午": "火", "未": "土",
    "申": "金", "酉": "金", "戌": "土", "亥": "水"
}

# Time branch mapping (时辰)
TIME_BRANCHES = [
    "子",  # 23:00-01:00
    "丑",  # 01:00-03:00
    "寅",  # 03:00-05:00
    "卯",  # 05:00-07:00
    "辰",  # 07:00-09:00
    "巳",  # 09:00-11:00
    "午",  # 11:00-13:00
    "未",  # 13:00-15:00
    "申",  # 15:00-17:00
    "酉",  # 17:00-19:00
    "戌",  # 19:00-21:00
    "亥",  # 21:00-23:00
]


def get_stem_branch_year(year: int) -> Tuple[str, str]:
    """Get Heavenly Stem and Earthly Branch for a year"""
    # Base year: 1984 is甲子 (Jia Zi)
    base_year = 1984
    base_stem = 0  # 甲
    base_branch = 0  # 子
    
    offset = year - base_year
    stem_index = (base_stem + offset) % 10
    branch_index = (base_branch + offset) % 12
    
    return HEAVENLY_STEMS[stem_index], EARTHLY_BRANCHES[branch_index]


def get_stem_branch_month(year_stem: int, month: int) -> Tuple[str, str]:
    """Get Heavenly Stem and Earthly Branch for a month"""
    # Month calculation based on year stem
    # Formula: (year_stem * 2 + month) % 10
    month_stem = (year_stem * 2 + month) % 10
    month_branch = (month - 1) % 12
    
    return HEAVENLY_STEMS[month_stem], EARTHLY_BRANCHES[month_branch]


def get_stem_branch_day(date: datetime) -> Tuple[str, str]:
    """Get Heavenly Stem and Earthly Branch for a day"""
    # Using the "Li Chun" method (立春)
    # Reference date: 1900-01-01 is 辛丑 (Xin Chou)
    base_date = datetime(1900, 1, 1)
    days = (date.date() - base_date.date()).days
    
    # 1900-01-01 is 辛丑 (Xin Chou) - stem 7, branch 0
    base_stem = 7  # 辛
    base_branch = 0  # 丑
    
    stem_index = (base_stem + days) % 10
    branch_index = (base_branch + days) % 12
    
    return HEAVENLY_STEMS[stem_index], EARTHLY_BRANCHES[branch_index]


def get_time_branch(hour: int) -> str:
    """Get Earthly Branch for hour"""
    index = ((hour + 1) // 2) % 12
    return TIME_BRANCHES[index]


def get_stem_branch_time(year_stem: int, time_branch: str) -> str:
    """Get Heavenly Stem for time branch"""
    # Formula: (year_stem * 2 + time_branch_index) % 10
    time_branch_index = EARTHLY_BRANCHES.index(time_branch)
    time_stem = (year_stem * 2 + time_branch_index) % 10
    return HEAVENLY_STEMS[time_stem]


def calculate_bazi(birth_date: datetime, birth_hour: Optional[int] = None) -> Dict:
    """
    Calculate BaZi (Eight Characters) chart
    
    Args:
        birth_date: Birth datetime
        birth_hour: Birth hour (0-23), if None, will extract from birth_date
    
    Returns:
        Dictionary containing BaZi chart
    """
    year = birth_date.year
    month = birth_date.month
    day = birth_date.day
    
    if birth_hour is None:
        birth_hour = birth_date.hour
    
    # Get year stem and branch
    year_stem, year_branch = get_stem_branch_year(year)
    
    # Get month stem and branch
    year_stem_index = HEAVENLY_STEMS.index(year_stem)
    month_stem, month_branch = get_stem_branch_month(year_stem_index, month)
    
    # Get day stem and branch
    day_stem, day_branch = get_stem_branch_day(birth_date)
    
    # Get time stem and branch
    time_branch = get_time_branch(birth_hour)
    time_stem = get_stem_branch_time(year_stem_index, time_branch)
    
    # Build the chart
    chart = {
        "year": {"stem": year_stem, "branch": year_branch, "element": WUXING_MAP[year_stem]},
        "month": {"stem": month_stem, "branch": month_branch, "element": WUXING_MAP[month_stem]},
        "day": {"stem": day_stem, "branch": day_branch, "element": WUXING_MAP[day_stem]},
        "hour": {"stem": time_stem, "branch": time_branch, "element": WUXING_MAP[time_stem]},
    }
    
    # Calculate five elements
    wuxing = calculate_wuxing(chart)
    
    # Calculate day master
    day_master = day_stem
    
    return {
        "chart": chart,
        "wuxing": wuxing,
        "day_master": day_master,
        "birth_info": {
            "year": year,
            "month": month,
            "day": day,
            "hour": birth_hour,
            "time_branch": time_branch
        }
    }


def calculate_wuxing(chart: Dict) -> Dict:
    """Calculate Five Elements statistics"""
    elements = {"木": 0, "火": 0, "土": 0, "金": 0, "水": 0}
    
    # Count from stems and branches
    for position, data in chart.items():
        stem_element = data.get("element", "")
        branch_element = BRANCH_WUXING.get(data.get("branch", ""), "")
        
        if stem_element:
            elements[stem_element] = elements.get(stem_element, 0) + 1
        if branch_element:
            elements[branch_element] = elements.get(branch_element, 0) + 1
    
    # Calculate day master's element
    day_stem = chart.get("day", {}).get("stem", "")
    day_master_element = WUXING_MAP.get(day_stem, "")
    
    # Determine favored element (喜用神) - simplified logic
    # In real practice, this requires complex analysis
    favored = analyze_favored(elements, day_master_element)
    
    return {
        "counts": elements,
        "day_master_element": day_master_element,
        "favored_element": favored
    }


def analyze_favored(elements: Dict, day_master_element: str) -> str:
    """
    Analyze the favored element (喜用神)
    This is a simplified version - real analysis is more complex
    """
    # Find the weakest element (most needed)
    min_count = min(elements.values())
    weakest = [k for k, v in elements.items() if v == min_count][0]
    
    # Find the element that generates the day master
    generating_map = {
        "木": "火", "火": "土", "土": "金", "金": "水", "水": "木"
    }
    
    generated = generating_map.get(day_master_element, "")
    
    # Return the element that helps
    if elements[weakest] < 2:
        return weakest
    
    return generated if generated else weakest


def get_zodiac(birth_year: int) -> str:
    """Get Chinese zodiac animal"""
    index = (birth_year - 1900) % 12
    return ZODIAC_ANIMALS[index]


def get_gender_traditional(gender: str) -> str:
    """Get traditional gender terms"""
    return "乾造" if gender == "male" else "坤造"


def format_bazi_readable(bazi_data: Dict) -> str:
    """Format BaZi data into readable Chinese text"""
    chart = bazi_data["chart"]
    wuxing = bazi_data["wuxing"]
    birth_info = bazi_data["birth_info"]
    
    lines = []
    lines.append(f"【八字排盘】")
    lines.append(f"年柱: {chart['year']['stem']}{chart['year']['branch']} ({chart['year']['element']})")
    lines.append(f"月柱: {chart['month']['stem']}{chart['month']['branch']} ({chart['month']['element']})")
    lines.append(f"日柱: {chart['day']['stem']}{chart['day']['branch']} ({chart['day']['element']})")
    lines.append(f"时柱: {chart['hour']['stem']}{chart['hour']['branch']} ({chart['hour']['element']})")
    lines.append("")
    lines.append(f"【五行分布】")
    for element, count in wuxing["counts"].items():
        lines.append(f"{element}: {count}个")
    lines.append("")
    lines.append(f"【喜用神】: {wuxing['favored_element']}")
    lines.append(f"【日主】: {wuxing['day_master_element']}命")
    
    return "\n".join(lines)


# Test
if __name__ == "__main__":
    # Test: 1990-01-15 08:30
    test_date = datetime(1990, 1, 15, 8, 30)
    result = calculate_bazi(test_date)
    print(format_bazi_readable(result))
    print(json.dumps(result, ensure_ascii=False, indent=2))
