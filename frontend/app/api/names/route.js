// YiName API with User Auth and Payment
// Now uses Supabase for authentication

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Payment config
const PAYMENT_PRICE = 9.9 // RMB
const PAYMENT_QR_URL = 'https://your-domain.com/payment-qr.jpg' // 你的收款码

// ============ BaZi Utils ============

function calculateBaZi(birthDate, birthHour = 12) {
  const year = birthDate.getFullYear()
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()
  
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const elements = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' }
  
  const yearStem = stems[(year - 1984) % 10]
  const yearBranch = branches[(year - 1984) % 12]
  const monthStem = stems[((year - 1984) * 2 + month) % 10]
  const monthBranch = branches[(month - 1) % 12]
  const dayStem = stems[(Math.floor(new Date(birthDate).getTime() / 86400000) + 7) % 10]
  const dayBranch = branches[(Math.floor(new Date(birthDate).getTime() / 86400000) + 7) % 12]
  const hourBranch = branches[Math.floor((birthHour + 1) / 2) % 12]
  const hourStem = stems[((year - 1984) * 2 + Math.floor((birthHour + 1) / 2)) % 10]
  
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

async function callAI(prompt, retries = 2) {
  const moliganUrl = process.env.MOLIGAN_URL || 'https://api.lkeap.cloud.tencent.com/coding/v3/chat/completions'
  const moliganKey = process.env.MOLIGAN_API_KEY || 'sk-sp-DvdNe2fyNJJ0'
  const moliganModel = process.env.MOLIGAN_MODEL || 'hunyuan-2.0-instruct'
  
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25000)
      
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
        }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    } catch (e) {
      console.error(`AI call failed:`, e.message)
      if (i === retries - 1) return ''
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return ''
}

function parseNames(text) {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return []
  } catch (e) { return [] }
}

// ============ Auth Helpers ============

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.replace('Bearer ', '')
  
  if (!supabase) {
    // No Supabase - use simple token validation
    return { id: token, email: 'demo@yiname.app' }
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  
  return user
}

async function checkUserPayment(userId) {
  if (!supabase) return { can_use: true, remaining: 999 }
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (!profile) {
    // New user - give 1 free try
    return { can_use: true, remaining: 1, is_trial: true }
  }
  
  return {
    can_use: profile.remaining_tries > 0,
    remaining: profile.remaining_tries,
    is_trial: profile.is_trial
  }
}

async function decrementTries(userId) {
  if (!supabase) return
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (!profile) {
    // Create new profile
    await supabase.from('user_profiles').insert({
      user_id: userId,
      remaining_tries: 0,
      is_trial: false
    })
  } else {
    // Decrement
    await supabase
      .from('user_profiles')
      .update({ remaining_tries: Math.max(0, profile.remaining_tries - 1) })
      .eq('user_id', userId)
  }
}

// ============ API Routes ============

// Health check
export async function GET(request) {
  return NextResponse.json({
    status: 'ok',
    version: '2.0.0',
    auth: !!supabase
  })
}

// Main API - Generate names
export async function POST(request) {
  try {
    // Get user
    const user = await getUserFromRequest(request)
    
    // Check payment/quota
    const payment = await checkUserPayment(user?.id || 'anonymous')
    
    if (!payment.can_use) {
      return NextResponse.json({
        error: 'NO_QUOTA',
        message: '您的免费次数已用完，请先充值',
        remaining: 0,
        price: PAYMENT_PRICE
      }, { status: 402 })
    }
    
    const body = await request.json()
    const { birth_date, birth_hour, gender, surname, style, count } = body
    
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
    
    if (baziData) {
      const chart = baziData.chart
      const genderText = gender === 'male' ? '男性' : gender === 'female' ? '女性' : '中性'
      
      const prompt = `你是一个专业的周易起名大师。请根据以下信息生成${count || 6}个名字。

八字：年柱${chart.year.stem}${chart.year.branch}，月柱${chart.month.stem}${chart.month.branch}，日柱${chart.day.stem}${chart.day.branch}，时柱${chart.hour.stem}${chart.hour.branch}。喜用神：${favored}。

性别：${genderText}。姓氏：${surname || ''}。

请生成${count || 6}个名字，每个包含：name(名字), pinyin(拼音), wuxing(五行), meaning(含义), score(评分1-100)。

请用JSON数组格式输出，只输出JSON，不要其他内容。`

      names = await callAI(prompt)
      names = parseNames(names)
    }
    
    if (!names.length) {
      return NextResponse.json(
        { error: 'AI生成失败，请稍后重试' },
        { status: 500 }
      )
    }
    
    // Add surname
    if (surname && names.length > 0) {
      names = names.map(n => ({ ...n, name: surname + n.name }))
    }
    
    // Decrement tries
    await decrementTries(user?.id || 'anonymous')
    
    return NextResponse.json({
      names,
      bazi_chart: baziData?.chart || {},
      wuxing_analysis: baziData?.wuxing || {},
      remaining: payment.remaining - 1
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
