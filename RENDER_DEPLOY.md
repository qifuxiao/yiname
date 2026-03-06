# YiName Backend - Render 部署配置

## 部署步骤

### 1. 登录 Render
打开 https://dashboard.render.com，创建免费账号

### 2. 创建 Web Service
- 点击 "New" → "Web Service"
- 连接到你的 GitHub 仓库: qifuxiao/yiname
- 选择 `backend` 文件夹
- 配置：

| 设置 | 值 |
|------|-----|
| Name | yiname-api |
| Environment | Python |
| Build Command | pip install -r requirements.txt |
| Start Command | uvicorn app.main:app --host 0.0.0.0 --port $PORT |

### 3. 环境变量
在 Render 后台添加以下环境变量：

```
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
SECRET_KEY=生成一个随机密钥
MOLIGAN_URL=https://ai.gitee.com/v1/chat/completions
MOLIGAN_API_KEY=你的API密钥
MOLIGAN_MODEL=Qwen3.5-27B
CORS_ORIGINS=https://yiname.vercel.app
```

### 4. 部署
点击 "Create Web Service"，等待部署完成

### 5. 获取 API URL
部署完成后，Render 会给你一个 URL，比如：`https://yiname-api.onrender.com`

---

## 数据库设置 (Supabase)

1. 打开 https://supabase.com
2. 创建免费项目
3. 在 Settings → Database 获取连接信息
4. 把 URL 填入上面的 DATABASE_URL
