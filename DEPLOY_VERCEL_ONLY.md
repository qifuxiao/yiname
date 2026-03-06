# YiName 部署方案（Vercel 免费版）

## 方案：前后端都用 Vercel

Vercel 的免费层完全够用：
- 每月 100GB 流量
- Serverless Functions
- 无需信用卡

---

## 新的部署步骤

### 第1步：创建 Supabase 数据库

1. 打开 https://supabase.com
2. 创建免费项目（需要验证邮箱）
3. 记住你的数据库密码

### 第2步：部署到 Vercel

1. 打开 https://vercel.com
2. 导入项目 `qifuxiao/yiname`
3. **重要：Frontend 和 Backend 分开部署**

#### 方式A：直接在 Vercel 上配置（推荐）

1. 在 Vercel 上创建 2 个项目：
   - `yiname` (frontend) - 指向 `frontend` 目录
   - `yiname-api` (backend) - 指向 `backend` 目录

2. **Backend 环境变量：**
   ```
   DATABASE_URL=postgresql://postgres:[密码]@db.[项目ID].supabase.co:5432/postgres
   SECRET_KEY=yiname-secret-key-123
   MOLIGAN_URL=https://ai.gitee.com/v1/chat/completions
   MOLIGAN_API_KEY=BSHFXVVPPOBWOPSLKPTBXHATPABANWF0EOO7HB10
   MOLIGAN_MODEL=Qwen3.5-27B
   ```

3. **Frontend 环境变量：**
   ```
   NEXT_PUBLIC_API_URL=https://yiname-api.vercel.app/api/v1
   ```

---

## 等一下！还有一个更简单的方案

**直接用 Vercel 的 Serverless API！**

我帮你把后端代码改成 Vercel API 格式，这样只需要部署一次。
