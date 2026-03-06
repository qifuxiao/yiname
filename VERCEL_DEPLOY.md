# YiName Frontend - Vercel 部署配置

## 部署步骤

### 1. 登录 Vercel
打开 https://vercel.com，用 GitHub 账号登录

### 2. 添加项目
- 点击 "Add New..." → "Project"
- 选择 GitHub 仓库: `qifuxiao/yiname`
- 点击 "Import"

### 3. 配置

| 设置 | 值 |
|------|-----|
| Framework Preset | Next.js |
| Root Directory | frontend |
| Build Command | npm run build |
| Output Directory | .next |

### 4. 环境变量
添加环境变量：

```
NEXT_PUBLIC_API_URL=https://yiname-api.onrender.com/api/v1
```
（把 `yiname-api.onrender.com` 改成你 Render 部署后得到的实际 URL）

### 5. 部署
点击 "Deploy"，等待部署完成！

---

## 部署后

- 前端 URL: `https://yiname.vercel.app`（或自定义域名）
- 后端 API: `https://yiname-api.onrender.com/api/v1`

测试一下：
```
curl https://yiname-api.onrender.com/health
```

应该返回：`{"status":"healthy","version":"1.0.0","service":"YiName Backend"}`
