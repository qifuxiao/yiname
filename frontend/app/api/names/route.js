// Vercel API Routes for YiName
// 部署到 Vercel 后自动生效

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY
const moliganUrl = process.env.MOLIGAN_URL || 'https://ai.gitee.com/v1/chat/completions'
const moliganKey = process.env.MOLIGAN_API_KEY || 'BSHFXVVPPOBWOPSLKPTBXHATPABANWF0EOO7HB10'
const moliganModel = process.env.MOLIGAN_MODEL || 'Qwen3.5-27B'

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// ============ Utils ============

// BaZi calculation (simplified)
function calculateBaZi(birthDate, birthHour = 12) {
  const year = birthDate.getFullYear()
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()
  
  // Heavenly Stems
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  // Earthly Branches
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  // Elements
  const elements = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' }
  
  // Simplified calculation
  const yearStem = stems[(year - 1984) % 10]
  const yearBranch = branches[(year - 1984) % 12]
  const monthStem = stems[((year - 1984) * 2 + month) % 10]
  const monthBranch = branches[(month - 1) % 12]
  const dayStem = stems[(new Date(birthDate).getTime() / 86400000 + 7) % 10]
  const dayBranch = branches[(new Date(birthDate).getTime() / 86400000 + 7) % 12]
  const hourBranch = branches[Math.floor((birthHour + 1) / 2) % 12]
  const hourStem = stems[((year - 1984) * 2 + Math.floor((birthHour + 1) / 2)) % 10]
  
  // Calculate five elements
  const wuxingCounts = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  const stemElements = [yearStem, monthStem, dayStem, hourStem]
  stemElements.forEach(s => { if (elements[s]) wuxingCounts[elements[s]]++ })
  
  const dayElement = elements[dayStem]
  const favored = wuxingCounts['木'] < 2 ? '木' : dayElement
  
  return {
    chart: {
      year: { stem: yearStem, branch: yearBranch, element: elements[yearStem] },
      month: { stem: monthStem, branch: monthBranch, element: elements[monthStem] },
      day: { stem: dayStem, branch: dayBranch, element: elements[dayStem] },
      hour: { stem: hourStem, branch: hourBranch, element: elements[hourStem] },
    },
    wuxing: {
      counts: wuxingCounts,
      day_master_element: dayElement,
      favored_element: favored
    }
  }
}

// Call Moligan AI
async function callAI(prompt) {
  try {
    const response = await fetch(moliganUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${moliganKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: moliganModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1000
      })
    })
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (e) {
    console.error('AI call error:', e)
    return ''
  }
}

// Parse names from AI response
function parseNames(text) {
  try {
    // Try to extract JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return []
  } catch (e) {
    return []
  }
}

// ============ API Routes ============

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'YiName API is running',
    version: '1.0.0'
  })
}

// Generate names
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      birth_date, 
      birth_hour, 
      gender, 
      surname, 
      style, 
      count 
    } = body
    
    // Calculate BaZi
    let baziData = null
    if (birth_date) {
      const birthDate = new Date(birth_date)
      const hour = birth_hour !== undefined ? birth_hour : 12
      baziData = calculateBaZi(birthDate, hour)
    }
    
    // Generate names with AI
    let names = []
    if (baziData) {
      const chart = baziData.chart
      const wuxing = baziData.wuxing
      const favored = wuxing.favored_element
      
      const genderText = gender === 'male' ? '男性' : gender === 'female' ? '女性' : '中性'
      
      const prompt = `你是一个专业的周易起名大师。请根据以下信息生成${count || 10}个名字。

【八字信息】
- 年柱: ${chart.year.stem}${chart.year.branch}
- 月柱: ${chart.month.stem}${chart.month.branch}
- 日柱: ${chart.day.stem}${chart.day.branch}
- 时柱: ${chart.hour.stem}${chart.hour.branch}
- 喜用神: ${favored}

【用户偏好】
- 性别: ${genderText}
- 姓氏: ${surname || ''}
- 风格: ${style || 'classical'}

请生成${count || 10}个名字，每个名字包含：name(名字), pinyin(拼音), wuxing(五行), meaning(含义), score(评分1-100)。

请用JSON数组格式输出，只输出JSON。`

      const aiResponse = await callAI(prompt)
      names = parseNames(aiResponse)
    }
    
    // If no AI response, generate sample names
    if (!names.length) {
      const sampleNames = [
        { name: '浩然', pinyin: 'hào rán', wuxing: '水', meaning: '浩然正气，胸怀宽广', score: 92 },
        { name: '子墨', pinyin: 'zǐ mò', wuxing: '木', meaning: '文雅大方，才华横溢', score: 88 },
        { name: '明轩', pinyin: 'míng xuān', wuxing: '火', meaning: '光明磊落，气宇轩昂', score: 90 },
        { name: '雨泽', pinyin: 'yǔ zé', wuxing: '水', meaning: '恩泽广布，心地善良', score: 87 },
        { name: '思远', pinyin: 'sī yuǎn', wuxing: '土', meaning: '深思熟虑，远见卓识', score: 89 },
      ]
      names = sampleNames
    }
    
    return NextResponse.json({
      names,
      bazi_chart: baziData?.chart || {},
      wuxing_analysis: baziData?.wuxing || {}
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
