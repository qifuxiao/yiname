// Vercel API Routes for YiName
// 部署到 Vercel 后自动生效

import { NextResponse } from 'next/server'

// Environment variables
const moliganUrl = process.env.MOLIGAN_URL || 'https://ai.gitee.com/v1/chat/completions'
const moliganKey = process.env.MOLIGAN_API_KEY || 'BSHFXVVPPOBWOPSLKPTBXHATPABANWF0EOO7HB10'
const moliganModel = process.env.MOLIGAN_MODEL || 'Qwen3.5-27B'

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
  const dayStem = stems[(Math.floor(new Date(birthDate).getTime() / 86400000) + 7) % 10]
  const dayBranch = branches[(Math.floor(new Date(birthDate).getTime() / 86400000) + 7) % 12]
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

// Default names based on gender
function getDefaultNames(gender, favored) {
  const maleNames = [
    { name: '浩然', pinyin: 'hào rán', wuxing: '水', meaning: '浩然正气，胸怀宽广，气度不凡', score: 92 },
    { name: '子墨', pinyin: 'zǐ mò', wuxing: '木', meaning: '文雅大方，才华横溢，品德高尚', score: 88 },
    { name: '明轩', pinyin: 'míng xuān', wuxing: '火', meaning: '光明磊落，气宇轩昂，前途似锦', score: 90 },
    { name: '雨泽', pinyin: 'yǔ zé', wuxing: '水', meaning: '恩泽广布，心地善良，福缘深厚', score: 87 },
    { name: '思远', pinyin: 'sī yuǎn', wuxing: '土', meaning: '深思熟虑，远见卓识，志向远大', score: 89 },
    { name: '梓涵', pinyin: 'zǐ hán', wuxing: '木', meaning: '生机勃勃，胸怀宽广，才德兼备', score: 91 },
    { name: '晨熙', pinyin: 'chén xī', wuxing: '火', meaning: '晨光熙暖，朝气蓬勃，前程似锦', score: 88 },
    { name: '铭哲', pinyin: 'míng zhé', wuxing: '金', meaning: '铭记于心，哲思明智，聪慧过人', score: 86 },
  ]
  
  const femaleNames = [
    { name: '诗涵', pinyin: 'shī hán', wuxing: '水', meaning: '诗情画意，内涵丰富，温婉可人', score: 91 },
    { name: '雨萱', pinyin: 'yǔ xuān', wuxing: '木', meaning: '雨露滋润，聪明伶俐，活泼可爱', score: 89 },
    { name: '思琪', pinyin: 'sī qí', wuxing: '金', meaning: '思念如琪，美丽大方，气质优雅', score: 88 },
    { name: '雅婷', pinyin: 'yǎ tíng', wuxing: '火', meaning: '雅致清新，婷婷玉立，温柔贤惠', score: 87 },
    { name: '欣悦', pinyin: 'xīn yuè', wuxing: '金', meaning: '欣喜愉悦，乐观开朗，幸福美满', score: 90 },
    { name: '梦琪', pinyin: 'mèng qí', wuxing: '木', meaning: '梦回千年，琪花瑶草，才情横溢', score: 86 },
    { name: '子晴', pinyin: 'zǐ qíng', wuxing: '火', meaning: '子时之晴，阳光灿烂，积极向上', score: 85 },
    { name: '嘉怡', pinyin: 'jiā yí', wuxing: '土', meaning: '嘉言懿行，怡然自得，温柔善良', score: 88 },
  ]
  
  // 优先选择五行匹配的名字
  const wuxingMap = { '木': 0, '火': 1, '土': 2, '金': 3, '水': 4 }
  const wuxingOrder = [favored]
  
  const names = gender === 'female' ? femaleNames : maleNames
  return names.slice(0, 6)
}

// Call Moligan AI (timeout protected)
async function callAI(prompt) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  
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
        max_tokens: 800
      }),
      signal: controller.signal
    })
    clearTimeout(timeout)
    
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (e) {
    clearTimeout(timeout)
    console.error('AI call error:', e.message)
    return ''
  }
}

// Parse names from AI response
function parseNames(text) {
  try {
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
    let favored = '木'
    
    if (birth_date) {
      const birthDate = new Date(birth_date)
      const hour = birth_hour !== undefined ? birth_hour : 12
      baziData = calculateBaZi(birthDate, hour)
      favored = baziData.wuxing.favored_element
    }
    
    // Generate names
    let names = []
    
    // Try AI first
    if (baziData) {
      const chart = baziData.chart
      const genderText = gender === 'male' ? '男性' : gender === 'female' ? '女性' : '中性'
      
      const prompt = `你是一个专业的周易起名大师。请根据以下信息生成${count || 6}个名字。

八字：年柱${chart.year.stem}${chart.year.branch}，月柱${chart.month.stem}${chart.month.branch}，日柱${chart.day.stem}${chart.day.branch}，时柱${chart.hour.stem}${chart.hour.branch}。喜用神：${favored}。

性别：${genderText}。姓氏：${surname || ''}。

请生成${count || 6}个名字，每个包含：name(名字), pinyin(拼音), wuxing(五行), meaning(含义), score(评分1-100)。

请用JSON数组格式输出，只输出JSON，不要其他内容。`

      const aiResponse = await callAI(prompt)
      names = parseNames(aiResponse)
    }
    
    // Fallback to default names
    if (!names.length) {
      names = getDefaultNames(gender, favored)
    }
    
    // Add surname if provided
    if (surname && names.length > 0) {
      names = names.map(n => ({
        ...n,
        name: surname + n.name
      }))
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
