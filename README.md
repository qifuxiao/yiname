# YiName - 易名云

AI + 周易起名应用 | 基于八字五行 | 智能名字生成

![Vercel](https://vercel.com/) ![Next.js](https://img.shields.io/badge/Next.js-14-black)

## 简介

YiName（易名云）是一个 AI 驱动的周易起名应用，帮助用户根据生辰八字和五行分析生成合适的名字。

## 功能

- 🎯 **智能起名**：基于八字五行分析生成名字
- 📊 **八字排盘**：自动计算年柱、月柱、日柱、时柱
- 🔥 **五行分析**：统计五行分布，推荐喜用神
- 🤖 **AI 解读**：使用大模型生成名字含义和评分
- 📱 **响应式设计**：支持手机和桌面访问

## 技术栈

- **前端框架**: Next.js 14
- **UI 组件**: Chakra UI
- **API**: Vercel Serverless Functions
- **AI**: 魔力方舟 (Qwen3.5-27B)

## 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/qifuxiao/yiname.git
cd yiname/frontend

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local

# 运行开发服务器
npm run dev
```

### 部署到 Vercel

1. 打开 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库 `qifuxiao/yiname`
3. 设置 Root Directory 为 `frontend`
4. 添加环境变量（可选）
5. Deploy!

## 项目结构

```
yiname/
├── frontend/                 # Next.js 前端
│   ├── app/
│   │   ├── api/             # API 路由
│   │   ├── page.tsx         # 主页面
│   │   └── layout.tsx       # 布局
│   ├── components/          # 组件
│   ├── package.json
│   └── next.config.js
├── DEPLOY_SIMPLE.md         # 部署指南
└── README.md
```

## API

### 生成名字

```bash
POST /api/names
Content-Type: application/json

{
  "birth_date": "1990-01-15T08:30:00",
  "birth_hour": 8,
  "gender": "male",
  "surname": "张",
  "style": "classical",
  "count": 10
}
```

响应：
```json
{
  "names": [
    {
      "name": "浩然",
      "pinyin": "hào rán",
      "wuxing": "水",
      "meaning": "浩然正气，胸怀宽广",
      "score": 92
    }
  ],
  "bazi_chart": {...},
  "wuxing_analysis": {...}
}
```

## 许可证

MIT License
