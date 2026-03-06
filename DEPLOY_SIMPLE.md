# YiName 部署指南（简化版 - 只需 Vercel）

## 前后端一体部署 - 全部免费！

---

## 第1步：创建 Supabase 数据库（可选）

如果你想保存用户数据：
1. 打开 https://supabase.com
2. 创建免费项目
3. 记录 URL 和 anon key

如果暂时不需要，可以跳过这一步，API 会返回默认名字。

---

## 第2步：部署到 Vercel

1. 打开 https://vercel.com
2. 用 GitHub 登录
3. 点击 **Add New** → **Project**
4. 选择 `qifuxiao/yiname`
5. **Import Project** → 设置：

   | 设置 | 值 |
   |------|-----|
   | Framework Preset | Next.js |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | `.next` |

6. **环境变量**（在 Vercel 后台 Settings → Environment Variables）：

   ```
   # 如果有 Supabase（可选）
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   
   # AI 配置（已有）
   MOLIGAN_URL=https://ai.gitee.com/v1/chat/completions
   MOLIGAN_API_KEY=BSHFXVVPPOBWOPSLKPTBXHATPABANWF0EOO7HB10
   MOLIGAN_MODEL=Qwen3.5-27B
   ```

7. 点击 **Deploy**

---

## 第3步：完成！

部署成功后，Vercel 会给你一个 URL，比如：
`https://yiname.vercel.app`

打开即可使用！

---

## 技术说明

- **后端**：使用 Vercel Serverless Functions (API Routes)
- **前端**：Next.js + Chakra UI
- **AI**：魔力方舟 Qwen3.5-27B
- **数据库**：可选（当前版本使用内置默认数据）

---

## 测试

部署后访问：`https://your-vercel-url/api/names`

应该返回：
```json
{
  "names": [...],
  "bazi_chart": {...},
  "wuxing_analysis": {...}
}
```
