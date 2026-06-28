# 微信订阅号认证 SDK

基于 Vite 构建的轻量级微信订阅号认证 SDK，支持 TypeScript 和多种模块格式。

## 📦 安装

### NPM 方式（推荐）
```bash
npm install wx-auth-sdk
```

### CDN 方式
```html
<link rel="stylesheet" href="https://cdn.example.com/wx-auth.css">
<script src="https://cdn.example.com/wx-auth.umd.js"></script>
```

## 🚀 极简接入

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

就是这么简单！✅

### 自定义配置

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

### 认证模式选择

SDK 支持两种认证模式：

#### 强制认证模式（默认）

适用于**内容付费、会员系统、内测邀请**等场景，用户必须完成认证才能继续使用：

```typescript
WxAuth.init({
  siteId: 'paid-content',
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

#### 可选认证模式

适用于**博客、资讯、社区**等场景，用户可以选择跳过认证：

```typescript
WxAuth.init({
  siteId: 'my-blog',
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
- ✅ 关闭时触发 `onClose` 回调

## ⚙️ 配置说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `siteId` | `string` | ❌ | **站点唯一标识**（可选，自动从 referrer/域名获取） |
| `apiBase` | `string` | ❌ | 后端 API 地址（**默认值已配置**，可省略） |
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


## 🔧 API 方法

### `WxAuth.init(options)`
初始化 SDK，自动检测 Cookie 并静默认证。

**行为：**
- 检查 `wxauth-openid` Cookie
- 已认证 → 触发 `onVerified` 回调（静默通过）
- 未认证 → 显示认证弹窗

### `WxAuth.requireAuth()`
手动触发认证流程（用于重新认证、切换账号）。

**返回：** `Promise<boolean>` - 验证成功返回 `true`

### `WxAuth.close()`
关闭认证弹窗。

**场景：**
- 用户手动关闭弹窗 → 触发 `onClose` 回调
- 调用 `requireAuth()` 后关闭 → Promise resolve(false)

## 🎨 用户体验特性

- ✅ **自动聚焦** - 首个输入框自动获得焦点
- ✅ **粘贴支持** - 自动识别 6 位数字粘贴
- ✅ **键盘导航** - 支持退格、方向键
- ✅ **自动验证** - 输入完成自动提交
- ✅ **静默认证** - 有 Cookie 时不显示弹窗
- ✅ **灵活认证** - 支持强制/可选认证模式
- ✅ **防删除保护** - MutationObserver + 定时器

## 📦 构建产物

```
dist/
├── wx-auth.js         # ES Module (7.1 kB)
├── wx-auth.umd.js     # UMD (11 kB)
├── wx-auth.css        # 样式 (3.4 kB)
└── index.d.ts         # TypeScript 类型声明
```

**总计：** < 12 KB（零依赖）

## 🔨 开发构建

```bash
# 安装依赖
npm install

# 构建 SDK
npm run build

# 类型检查
npm run type-check
```

## 📝 认证流程

```
用户访问网站
    ↓
SDK 初始化
    ↓
检查 Cookie wxauth-openid
    ↓
已认证？ → 静默通过 → onVerified 回调
    ↓
未认证？ → 显示弹窗（二维码 + 6位输入框）
    ↓
用户扫码关注公众号（神族九帝）
    ↓
公众号自动回复验证码
    ↓
用户输入验证码
    ↓
验证成功 → 保存 Cookie → onVerified 回调
```

## 🔒 安全特性

- **验证码**：5分钟过期，一次性使用
- **Session**：AES-256-GCM 加密
- **Cookie**：HttpOnly + SameSite=Lax
- **防删除**：双重保护机制

## 💡 使用场景

### 场景 1：零配置接入（推荐）

```typescript
// ✅ 什么都不用配置，一行代码即可
WxAuth.init({
  onVerified: (user) => {
    console.log('认证成功', user);
  }
});
```

SDK 会自动获取 `siteId`、`apiBase`、公众号名称和二维码。

### 场景 2：强制认证（内容付费）

```typescript
WxAuth.init({
  required: true,  // 必须认证（也可省略，true 为默认值）
  onVerified: (user) => {
    // 解锁付费内容
    unlockPremiumContent();
  }
});
```

### 场景 3：可选认证（博客/资讯）

```typescript
WxAuth.init({
  required: false,  // 可选认证
  onVerified: (user) => {
    // 解锁评论、点赞等功能
    enableSocialFeatures();
  },
  onClose: () => {
    // 用户跳过认证，显示受限内容
    showLimitedMode();
  }
});
```

### 场景 3：按需触发认证

```typescript
// 用户点击"登录"或"切换账号"时触发
async function handleLogin() {
  const success = await WxAuth.requireAuth();
  if (success) {
    // 认证成功，继续登录流程
    await login();
  } else {
    // 用户关闭弹窗，取消登录
    console.log('用户取消认证');
  }
}
```

### 场景 4：切换账号

```typescript
// 用户点击"切换账号"时触发
async function handleSwitchAccount() {
  // 删除旧 Cookie
  document.cookie = 'wxauth-openid=; path=/; max-age=0';
  // 重新认证
  await WxAuth.requireAuth();
}
```

## 📚 完整文档

完整的项目文档请参考项目根目录的 `README.md`，包含：
- 后端 API 详细配置
- 微信后台配置指南
- Docker 部署方案
- 环境变量说明
- 常见问题解答

## 🤝 依赖

**零依赖** - 纯原生 JavaScript + TypeScript

## 📄 许可证

MIT License

---

**版本**: 1.2.0
**构建时间**: 2025-06-28
**状态**: ✅ 生产就绪
