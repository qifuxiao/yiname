# -*- coding: utf-8 -*-
"""
AI Service - Integration with Moligan (魔力方舟) API
"""

import httpx
import os
import json
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()


class AIService:
    """AI service for name generation and analysis"""
    
    def __init__(self):
        self.url = os.getenv("MOLIGAN_URL", "https://ai.gitee.com/v1/chat/completions")
        self.api_key = os.getenv("MOLIGAN_API_KEY", "")
        self.model = os.getenv("MOLIGAN_MODEL", "Qwen3.5-27B")
    
    async def generate_names(
        self,
        bazi_data: Dict,
        gender: Optional[str] = None,
        surname: str = "",
        style: str = "classical",
        count: int = 10
    ) -> List[Dict]:
        """
        Generate names based on BaZi data
        
        Args:
            bazi_data: BaZi calculation result
            gender: male/female
            surname: Family name
            style: classical/modern/creative
            count: Number of names to generate
            
        Returns:
            List of generated names with analysis
        """
        # Build prompt
        prompt = self._build_name_prompt(bazi_data, gender, surname, style, count)
        
        # Call AI
        response = await self._call_ai(prompt)
        
        # Parse response
        names = self._parse_names_response(response)
        
        return names
    
    def _build_name_prompt(
        self,
        bazi_data: Dict,
        gender: Optional[str],
        surname: str,
        style: str,
        count: int
    ) -> str:
        """Build prompt for name generation"""
        chart = bazi_data.get("chart", {})
        wuxing = bazi_data.get("wuxing", {})
        favored = wuxing.get("favored_element", "木")
        
        gender_text = "男性" if gender == "male" else "女性" if gender == "female" else "中性"
        
        prompt = f"""你是一个专业的周易起名大师。请根据以下信息生成{count}个名字。

【八字信息】
- 年柱: {chart.get('year', {}).get('stem', '')}{chart.get('year', {}).get('branch', '')}
- 月柱: {chart.get('month', {}).get('stem', '')}{chart.get('month', {}).get('branch', '')}
- 日柱: {chart.get('day', {}).get('stem', '')}{chart.get('day', {}).get('branch', '')}
- 时柱: {chart.get('hour', {}).get('stem', '')}{chart.get('hour', {}).get('branch', '')}
- 五行分布: 木{_wuxing_count(wuxing, '木')}个, 火{_wuxing_count(wuxing, '火')}个, 土{_wuxing_count(wuxing, '土')}个, 金{_wuxing_count(wuxing, '金')}个, 水{_wuxing_count(wuxing, '水')}个
- 喜用神: {favored}
- 日主: {wuxing.get('day_master_element', '')}命

【用户偏好】
- 性别: {gender_text}
- 姓氏: {surname}
- 风格: {style}

【输出要求】
请生成{count}个名字，每个名字包含：
1. 名字（如果提供了姓氏，则包含姓氏）
2. 拼音
3. 五行属性
4. 名字含义解释
5. 与八字的匹配度评分（1-100）

请用JSON格式输出，格式如下：
[
  {{
    "name": "xxx",
    "pinyin": "xxx",
    "wuxing": "xxx",
    "meaning": "xxx",
    "score": 95
  }}
]

只输出JSON，不要其他内容。"""
        
        return prompt
    
    def _wuxing_count(wuxing: Dict, element: str) -> int:
        """Get count of specific element"""
        counts = wuxing.get("counts", {})
        return counts.get(element, 0)
    
    async def _call_ai(self, prompt: str) -> str:
        """Call AI API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.8,
            "max_tokens": 2000
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    def _parse_names_response(self, response: str) -> List[Dict]:
        """Parse AI response to names list"""
        try:
            # Try to extract JSON from response
            # Sometimes AI adds markdown code blocks
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            
            names = json.loads(response.strip())
            return names
        except json.JSONDecodeError:
            # If parsing fails, return empty list
            return []
    
    async def analyze_name(
        self,
        name: str,
        bazi_data: Dict
    ) -> str:
        """
        Generate detailed analysis for a specific name
        
        Args:
            name: Name to analyze
            bazi_data: BaZi data
            
        Returns:
            Detailed analysis text
        """
        chart = bazi_data.get("chart", {})
        wuxing = bazi_data.get("wuxing", {})
        
        prompt = f"""你是一个专业的周易命理师。请详细分析以下名字与八字的匹配度。

【名字】: {name}

【八字信息】
- 年柱: {chart.get('year', {}).get('stem', '')}{chart.get('year', {}).get('branch', '')}
- 月柱: {chart.get('month', {}).get('stem', '')}{chart.get('month', {}).get('branch', '')}
- 日柱: {chart.get('day', {}).get('stem', '')}{chart.get('day', {}).get('branch', '')}
- 时柱: {chart.get('hour', {}).get('stem', '')}{chart.get('hour', {}).get('branch', '')}
- 喜用神: {wuxing.get('favored_element', '')}
- 日主: {wuxing.get('day_master_element', '')}命

【分析要求】
请从以下几个方面进行分析：
1. 名字的五行属性
2. 名字与八字的匹配程度
3. 名字的音韵美感
4. 名字的寓意
5. 总体评分和建议

请用流畅的中文输出，200-400字。"""
        
        response = await self._call_ai(prompt)
        return response


# Singleton instance
ai_service = AIService()
