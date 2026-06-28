# 微信订阅号认证系统 🎫

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js)](https://nuxt.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🎯 **一个认证后端服务多个网站** - 基于 Nuxt 4 的微信订阅号认证 SaaS 系统

用户关注公众号后获取验证码，输入即可完成认证。一套部署，多个网站通过 `siteId` 接入。

**项目特性**：
- ✅ **SaaS 架构** - 一套后端服务多个网站，通过 siteId 区分来源
- ✅ **极简接入** - 其他网站只需引入 SDK，配置 apiBase + siteId
- ✅ **自动配置** - wechatName 和 qrcodeUrl 由后端自动下发，接入方无需关心
- ✅ **安全可靠** - AES-256-GCM 加密 Session
- ✅ **轻量 SDK** - < 12KB，零依赖，支持 ES Module 和 UMD
- ✅ **灵活认证** - 支持强制认证（required=true）和可选认证（required=false）
- ✅ **Docker 部署** - push main 自动构建部署

---

## 🏗️ SaaS 架构

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  网站 A      │  │  网站 B      │  │  更多网站... │
│ siteId: blog │  │ siteId: tool │  │             │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │ SDK (apiBase + siteId)
                        ▼
              ┌──────────────────┐
              │  wx-auth 后端    │
              │  auth.           │
              │  shenzjd.com    │
              │                  │
              │  /api/sdk/config │ ← 下发 wechatName、qrcodeUrl
              │  /api/auth/check │ ← 验证码校验
              │  /api/wechat/msg │ ← 微信消息回调
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  微信公众号      │
              │  关注 → 发验证码  │
              └──────────────────┘
```

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，本地开发用原始名称即可（SITE_URL、WECHAT_TOKEN 等）

# 3. 启动
npm run dev
```

访问：http://localhost:3000

### Docker 部署

push 到 main 分支自动触发 GitHub Actions 构建部署，无需手动操作。

只需在服务器上准备 `.env` 文件（见下方环境变量配置），配置好 GitHub Secrets（`DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_PASSWORD`）即可。

---

## 📋 认证流程

```
用户访问网站
    ↓
SDK 初始化（apiBase + siteId）
    ↓
检查 Cookie wxauth-openid
    ↓
已认证？ → 静默通过 → onVerified 回调
    ↓
未认证？ → 自动获取后端配置 → 显示认证弹窗
    ↓
用户扫码关注公众号
    ↓
公众号自动回复验证码
    ↓
用户输入验证码
    ↓
验证成功 → 保存 Cookie → onVerified 回调
```

---

## ⚙️ 微信后台配置

登录公众号平台 → 设置与开发 → 基本配置 → 服务器配置：

| 配置项 | 值 |
|--------|-----|
| **服务器URL** | `https://your-domain.com/api/wechat/message` |
| **Token** | 与 `.env` 中的 `NUXT_WECHAT_TOKEN` 一致 |
| **消息模式** | 明文模式 或 安全模式 |

---

## 🔧 其他网站接入

### 零配置接入（推荐）

**什么都不用配置，一行代码即可完成接入！**

```typescript
import { WxAuth } from 'wx-auth-sdk';
import 'wx-auth-sdk/dist/style.css';

// ✅ 零配置 - SDK 自动获取所有信息
WxAuth.init({
  onVerified: (user) => {
    console.log('认证成功', user);
  }
});
```

**SDK 会自动：**
- ✅ 从 `document.referrer` 或当前域名自动获取 `siteId`
- ✅ 从后端 `/api/sdk/config` 自动获取公众号名称和二维码
- ✅ 使用默认 API 地址 `https://wx-auth.shenzjd.com`

### 自定义配置（可选）

如果需要手动指定配置（可选）：

```typescript
WxAuth.init({
  siteId: 'my-website',     // ← 可选：手动指定站点 ID（不填则自动获取）
  required: false,           // ← 可选：认证模式（默认 true）
  onVerified: (user) => {
    console.log('认证成功', user);
  },
  onClose: () => {
    console.log('用户关闭了认证弹窗');
  }
});
```

> **核心概念：**
> - ✅ 所有接入方共享"神族九帝"公众号
> - ✅ `wechatName` 和 `qrcodeUrl` 从后端自动获取
> - ✅ `apiBase` 已配置默认值，可省略
> - ✅ `siteId` 自动从 referrer/域名获取（可手动指定）

### 认证模式选择

SDK 支持两种认证模式，根据你的业务场景选择：

#### 1. 强制认证模式（`required: true`）

适用于**内容付费、会员系统、内测邀请**等场景，用户必须完成认证才能继续使用：

```typescript
WxAuth.init({
  siteId: 'paid-content',  // ← 可选：手动指定站点 ID
  required: true,  // 强制认证（默认值，可省略）
  onVerified: (user) => {
    console.log('认证成功', user);
    // 解锁付费内容
  }
});
```

**特点：**
- ❌ 不显示关闭按钮
- ❌ 点击遮罩层无效
- ✅ 必须完成认证才能继续操作

#### 2. 可选认证模式（`required: false`）

适用于**博客、资讯、社区**等场景，用户可以选择跳过认证：

```typescript
WxAuth.init({
  siteId: 'my-blog',  // ← 可选：手动指定站点 ID
  required: false,  // 可选认证
  onVerified: (user) => {
    console.log('认证成功', user);
    // 解锁评论、点赞等功能
  },
  onClose: () => {
    console.log('用户关闭了认证弹窗');
    // 处理关闭后的逻辑，如显示受限模式
  }
});
```

**特点：**
- ✅ 显示关闭按钮（右上角 ×）
- ✅ 点击遮罩可关闭弹窗
- ✅ 提示文字"（可点击右上角关闭）"
- ✅ 关闭时触发 `onClose` 回调

### NPM 方式

```bash
npm install wx-auth-sdk
```

```typescript
import { WxAuth } from 'wx-auth-sdk';
import 'wx-auth-sdk/dist/style.css';

// ✅ 最简单的接入方式（一行代码即可）
WxAuth.init({
  onVerified: (user) => {
    console.log('认证成功', user);
  },
  onClose: () => {
    console.log('用户关闭了认证弹窗');
  }
});
```

> **说明：**
> - ✅ **所有参数都无需手动配置**
>   - `siteId`：自动从 `document.referrer` 或当前域名获取
>   - `apiBase`：使用默认值 `https://wx-auth.shenzjd.com`
>   - `wechatName` / `qrcodeUrl`：自动从后端获取
> - ⚠️ 接入方配置自己的公众号名称和二维码**无效**（统一使用"神族九帝"公众号）

```html
<link rel="stylesheet" href="https://unpkg.com/wx-auth-sdk/dist/wx-auth.css">
<script src="https://unpkg.com/wx-auth-sdk/dist/wx-auth.umd.js"></script>
<script>
  WxAuth.init({
    // ✅ 零配置，所有参数自动获取
    onVerified: (user) => {
      console.log('认证成功', user);
    },
    onClose: () => {
      console.log('用户关闭了认证弹窗');
    }
  });
</script>
```

### SDK 配置选项

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `siteId` | `string` | ❌ | **站点唯一标识**（可选，自动从 referrer/域名获取） |
| `apiBase` | `string` | ❌ | 认证服务后端地址（**已有默认值**，可省略） |
| `required` | `boolean` | ❌ | 是否必须认证（默认 `true`，强制认证） |
| `onVerified` | `(user) => void` | ❌ | 验证成功回调 |
| `onError` | `(error) => void` | ❌ | 错误回调 |
| `onClose` | `() => void` | ❌ | 用户关闭弹窗回调（仅在 `required=false` 时触发） |

> **说明：**
> - ✅ **所有参数都无需手动配置**
>   - `siteId`：自动从 `document.referrer` 或当前域名获取
>   - `apiBase`：使用默认值 `https://wx-auth.shenzjd.com`
>   - `wechatName` / `qrcodeUrl`：自动从后端获取
> - ⚠️ 接入方配置自己的公众号名称和二维码**无效**（统一使用"神族九帝"公众号）

> **认证模式说明：**
> - `required: true`（默认）- 强制认证，不显示关闭按钮，必须完成认证
> - `required: false` - 可选认证，显示关闭按钮，可跳过认证


---

## 📁 项目结构

```
wx-auth/
├── server/                          # 后端服务
│   ├── api/
│   │   ├── wechat/
│   │   │   └── message.ts           # 微信消息处理
│   │   ├── auth/
│   │   │   ├── check.ts            # 验证码验证（支持 siteId）
│   │   │   └── session.ts          # Session 管理
│   │   └── sdk/
│   │       └── config.ts           # SDK 配置下发
│   └── utils/
│       ├── wechat.ts               # 微信工具
│       ├── storage.ts              # 存储层（支持 siteId）
│       └── session.ts              # Session 工具
├── pages/
│   ├── index.vue                   # 首页（认证演示）
│   └── sdk/
│       └── demo.vue                # SDK 接入文档
├── wx-auth-sdk/                    # SDK 模块
│   ├── src/
│   │   ├── index.ts                # 入口
│   │   ├── wx-auth.ts              # 核心逻辑
│   │   ├── protection.ts           # 弹窗保护
│   │   └── wx-auth.css             # 样式
│   ├── dist/                       # 构建产物
│   └── vite.config.ts
├── .github/workflows/
│   └── docker.yml                  # 自动构建部署
├── Dockerfile
├── nuxt.config.ts
├── .env.example                    # 环境变量模板
└── package.json
```

---

## 📝 环境变量说明

> **Docker 部署时**：私有配置需加 `NUXT_` 前缀（Nuxt 运行时映射），公开配置加 `NUXT_PUBLIC_` 前缀。
> **本地开发时**：直接使用原始名称即可。

### 必须配置

| Docker 部署 | 本地开发 | 说明 |
|-------------|---------|------|
| `NUXT_PUBLIC_SITE_URL` | `SITE_URL` | 网站地址，微信回调用 |
| `NUXT_WECHAT_TOKEN` | `WECHAT_TOKEN` | 微信后台 Token |
| `NUXT_SESSION_SECRET` | `SESSION_SECRET` | Session 密钥（`openssl rand -hex 32`） |
| `WECHAT_NAME` | `WECHAT_NAME` | 公众号名称（server 直接读取，无需前缀） |
| `WECHAT_QRCODE_URL` | `WECHAT_QRCODE_URL` | 二维码 URL（server 直接读取，无需前缀） |

### 可选配置

| Docker 部署 | 本地开发 | 说明 | 默认值 |
|-------------|---------|------|--------|
| `NUXT_WECHAT_AES_KEY` | `WECHAT_AES_KEY` | 安全模式 AES Key | 空（明文模式） |
| `NUXT_CODE_EXPIRY` | `CODE_EXPIRY` | 验证码有效期（秒） | `300` |
| `NUXT_KEYWORDS` | `KEYWORDS` | 触发关键词（JSON） | `["验证码"]` |

### Docker .env 示例

```env
NUXT_PUBLIC_SITE_URL=https://wx-auth.shenzjd.com
NUXT_WECHAT_TOKEN=your-wechat-token
NUXT_SESSION_SECRET=your-random-secret
NUXT_WECHAT_NAME=神族九帝
NUXT_WECHAT_QRCODE_URL=https://cdn.jsdmirror.com/gh/wu529778790/image@master/blog/qrcode_for_gh_61da24be23ff_258.jpg
```

---

## 🐳 Docker 部署

```bash
docker build -t wx-auth .
docker run -d --name wx-auth --env-file .env -p 3000:3000 -v ./data:/app/data wx-auth
```

查看日志：
```bash
sudo docker logs -f wx-auth
```

---

## 🔒 安全特性

- **AES-256-GCM** — Session 数据加密
- **SHA-1 签名** — 微信消息验证
- **验证码** — 5分钟过期，一次性使用
- **Cookie** — HttpOnly + SameSite=none（支持跨域）+ Secure
- **弹窗保护** — MutationObserver + 定时器双重检测

---

## 📄 许可证

MIT License

---

**版本**: v1.1.0
**状态**: ✅ 生产就绪
