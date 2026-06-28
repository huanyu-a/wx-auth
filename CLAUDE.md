# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个**微信订阅号认证系统**，核心功能是通过微信扫码关注公众号获取验证码，输入6位验证码完成认证。认证成功后保存状态，下次访问自动认证（无需重复操作）。

**技术栈：**
- **前端**: Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS
- **后端**: Nitro Server API (Node.js)
- **SDK**: 原生 JavaScript + Vite 构建（< 12KB，零依赖）
- **存储**: JSON 文件 / SQLite 双支持

## 目录结构

```
wx-auth/
├── server/                    # 后端 API
│   ├── api/wechat/message.ts  # 微信消息处理（接收/回复）
│   ├── api/auth/check.ts      # 认证状态检查
│   ├── api/auth/session.ts    # Session 管理
│   └── utils/                 # 工具函数（微信加解密、存储、Session）
├── pages/                     # 前端页面
│   └── index.vue              # 认证演示页面
├── wx-auth-sdk/               # 独立 SDK 模块
│   ├── src/
│   │   ├── index.ts           # SDK 入口
│   │   ├── wx-auth.ts         # SDK 核心逻辑
│   │   └── wx-auth.css        # SDK 样式
│   └── vite.config.ts         # SDK 构建配置
├── data/                      # 数据存储目录
│   └── auth-data.json         # JSON 存储文件
├── nuxt.config.ts             # Nuxt 配置
├── package.json               # 项目依赖
└── .env.example               # 环境变量模板
```

## 开发命令

### 主项目
```bash
npm install          # 安装依赖
npm run dev          # 开发模式（http://localhost:3000）
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run generate     # 生成静态站点
```

### SDK 开发
```bash
cd wx-auth-sdk
npm install          # 安装依赖
npm run build        # 构建 SDK（输出到 dist/）
npm run type-check   # TypeScript 类型检查
```

## 核心架构

### 前端（pages/index.vue）
- 集成 SDK，自动初始化
- 提供重新认证和清空状态按钮
- 自动检测 Cookie 并静默认证
- 认证成功后不显示提示（静默通过）

### 后端 API 端点
1. **`/api/wechat/message`** - 微信消息处理（GET/POST）
2. **`/api/auth/check`** - 认证检查（参数：`authToken` 或 `openid`，可选 `siteId`）
3. **`/api/auth/session`** - Session 管理（POST/GET/DELETE）
4. **`/api/sdk/config`** - SDK 配置下发（返回 wechatName、qrcodeUrl）

### SDK 工作流程
1. 检查 Cookie `wxauth-openid`
2. 已认证 → 静默通过
3. 未认证 → 显示弹窗（二维码 + 6位输入框）
4. 用户扫码 + 输入验证码
5. 验证成功 → 保存 Cookie + 回调
6. 用户关闭弹窗 → 触发 `onClose` 回调

## 关键配置

### 环境变量（.env）
```bash
# 必须（Docker 部署必须加 NUXT_ 前缀，否则构建时被内联为空值）
NUXT_PUBLIC_SITE_URL=https://wx-auth.shenzjd.com
NUXT_WECHAT_TOKEN=your-wechat-token
NUXT_SESSION_SECRET=dev-secret-change-in-production
NUXT_WECHAT_NAME=神族九帝
NUXT_WECHAT_QRCODE_URL=https://your-site.com/qrcode.jpg

# 可选（个人订阅号留空）
NUXT_WECHAT_AES_KEY=
NUXT_CODE_EXPIRY=300
NUXT_KEYWORDS=["验证码"]
STORAGE_TYPE=file  # 或 sqlite
```

### SDK 配置
```typescript
// ✅ 零配置接入（推荐）
WxAuth.init({
  onVerified: (user) => { ... },  // ← 唯一必填：验证成功回调
  onClose: () => { ... }          // ← 可选：关闭弹窗回调
});

// 或手动指定配置（可选）
WxAuth.init({
  siteId: 'my-website',                // ← 可选：站点唯一标识（不填则自动获取）
  apiBase: 'https://wx-auth.shenzjd.com',  // 后端 API 地址（可选，有默认值）
  required: false,                     // 是否必须认证（默认 true）
  // wechatName 和 qrcodeUrl 无需配置，自动从后端获取
  // 接入方配置自己的公众号名称和二维码无效（统一使用"神族九帝"）
  onVerified: (user) => { ... },       // 验证成功回调
  onError: (error) => { ... },        // 错误回调
  onClose: () => { ... }               // 关闭弹窗回调（仅 required=false 时触发）
});
```

**核心概念：**
- ✅ **所有参数都无需手动配置**
  - `siteId`：自动从 `document.referrer` 或当前域名获取
  - `apiBase`：使用默认值 `https://wx-auth.shenzjd.com`
  - `wechatName` / `qrcodeUrl`：自动从后端获取
- ✅ 所有接入方共享"神族九帝"公众号
- ✅ 认证流程统一走后端配置的公众号

### required 模式
- **true（默认）** - 强制认证，不显示关闭按钮，点击遮罩无效
- **false** - 可选认证，显示关闭按钮，点击遮罩可关闭，支持 `onClose` 回调


## 核心特性

### 安全性
- AES-256-GCM 加密 Session
- 验证码 5 分钟过期，一次性使用
- 微信消息签名验证
- 支持安全模式（加密消息）

### 用户体验
- 自动聚焦第一个输入框
- 支持粘贴 6 位数字
- 键盘导航（退格、方向键）
- 输入完成自动验证
- 微信原生风格 UI（#07C160）
- 自动认证（无需重复操作）

### 存储层
- **JSON 文件**（默认）：`data/auth-data.json`，内存缓存 + 节流写入
- **SQLite**（可选）：`data/auth.db`，Better-SQLite3，支持 WAL 模式

## SDK 构建产物

`wx-auth-sdk/dist/`:
- `wx-auth.js` - ES Module (7.1 kB)
- `wx-auth.umd.js` - UMD (11 kB)
- `wx-auth.css` - 样式 (3.4 kB)
- `index.d.ts` - TypeScript 类型声明

## 认证流程

### 强制认证模式（required=true，默认）

```
用户访问 → 检查 Cookie
    ↓
已认证？ → 静默通过
    ↓
未认证？ → 显示弹窗（无关闭按钮）
    ↓
用户扫码关注公众号 → 公众号自动回复验证码
    ↓
用户输入 6 位验证码 → 验证
    ↓
成功 → 保存 Cookie + 回调
```

### 可选认证模式（required=false）

```
用户访问 → 检查 Cookie
    ↓
已认证？ → 静默通过
    ↓
未认证？ → 显示弹窗（有关闭按钮）
    ↓
用户选择：
    - 扫码认证 → 完成验证 → 保存 Cookie
    - 关闭弹窗 → 触发 onClose 回调 → 继续浏览
```

## 注意事项

1. **微信配置**：个人订阅号只需 `WECHAT_TOKEN`，服务号才需要 `WECHAT_APPID`/`WECHAT_APPSECRET`
2. **Session 密钥**：生产环境必须使用随机字符串（`openssl rand -hex 32`）
3. **网站地址**：`SITE_URL` 必须与微信后台配置的回调地址一致
4. **SDK 导入**：开发时从 `../wx-auth-sdk/src/index` 导入，生产时从 NPM 包导入
5. **公众号配置**：接入方无需配置 `wechatName` 和 `qrcodeUrl`，配置也无效（统一使用后端配置的"神族九帝"公众号）
6. **siteId 自动获取**：SDK 会自动从 `document.referrer` 或当前域名获取 `siteId`，无需手动配置
