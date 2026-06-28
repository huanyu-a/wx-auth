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

## 🚀 快速开始

### ES Module
```typescript
import { WxAuth } from 'wx-auth-sdk';
import 'wx-auth-sdk/dist/style.css';

// 强制认证模式（默认）
WxAuth.init({
  apiBase: 'https://auth.shenzjd.com',
  siteId: 'my-website',  // 可选，标识你的网站
  required: true,  // 必须认证，不显示关闭按钮
  // wechatName 和 qrcodeUrl 会自动从后端获取，也可以手动指定
  onVerified: (user) => {
    console.log('认证成功', user);
  },
  onError: (error) => {
    console.error('认证失败', error);
  }
});

// 可选认证模式
WxAuth.init({
  apiBase: 'https://auth.shenzjd.com',
  siteId: 'my-blog',
  required: false,  // 可选认证，显示关闭按钮
  onVerified: (user) => {
    console.log('认证成功', user);
  },
  onClose: () => {
    console.log('用户关闭了认证弹窗');
    // 处理用户关闭后的逻辑
  }
});
```

### UMD（浏览器脚本）
```html
<link rel="stylesheet" href="./dist/wx-auth.css">
<script src="./dist/wx-auth.umd.js"></script>
<script>
  // 强制认证模式
  WxAuth.init({
    apiBase: 'https://auth.shenzjd.com',
    siteId: 'my-website',
    required: true,  // 必须认证
    onVerified: (user) => {
      console.log('认证成功', user);
    }
  });

  // 可选认证模式
  WxAuth.init({
    apiBase: 'https://auth.shenzjd.com',
    siteId: 'my-blog',
    required: false,  // 可选认证
    onVerified: (user) => {
      console.log('认证成功', user);
    },
    onClose: () => {
      console.log('用户关闭了认证弹窗');
    }
  });
</script>
```

## ⚙️ 配置选项

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `apiBase` | `string` | ✅ | 后端 API 地址 |
| `siteId` | `string` | ❌ | 站点标识，用于区分不同接入网站 |
| `wechatName` | `string` | ❌ | 公众号名称（可选，自动从后端获取） |
| `qrcodeUrl` | `string` | ❌ | 二维码图片 URL（可选，自动从后端获取） |
| `required` | `boolean` | ❌ | 是否必须认证（默认 true，强制认证） |
| `onVerified` | `(user) => void` | ❌ | 验证成功回调 |
| `onError` | `(error) => void` | ❌ | 错误回调 |
| `onClose` | `() => void` | ❌ | 用户关闭弹窗回调（仅在 required=false 时触发） |

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
关闭认证弹窗。此方法会：
1. 隐藏弹窗
2. 触发 `onClose` 回调（如果已配置）
3. 如果是通过 `requireAuth()` 调用的，会返回 `false`

**场景：**
- 用户手动关闭弹窗 → 触发 `onClose` 回调
- 调用 `requireAuth()` 后关闭 → Promise resolve(false)

## 🎨 用户体验特性

- ✅ **自动聚焦** - 首个输入框自动获得焦点
- ✅ **粘贴支持** - 自动识别 6 位数字粘贴
- ✅ **键盘导航** - 支持退格、方向键
- ✅ **自动验证** - 输入完成自动提交
- ✅ **静默认证** - 有 Cookie 时不显示弹窗
- ✅ **灵活配置** - 支持强制/可选认证模式
- ✅ **关闭回调** - 可选认证时支持关闭事件监听
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
pnpm install

# 构建 SDK
pnpm build

# 类型检查
pnpm type-check
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
用户扫码关注公众号
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

## 🎯 使用场景

### 1. 独立网站集成
```typescript
import { WxAuth } from 'wx-auth-sdk';

// 强制认证模式（默认）
WxAuth.init({
  apiBase: 'https://auth.shenzjd.com',
  siteId: 'my-blog',  // 标识你的网站
  required: true,  // 必须认证，不显示关闭按钮
  onVerified: (user) => {
    // 认证成功，允许访问内容
    showContent();
  }
});

// 可选认证模式
WxAuth.init({
  apiBase: 'https://auth.shenzjd.com',
  siteId: 'my-blog',
  required: false,  // 可选认证，显示关闭按钮
  onVerified: (user) => {
    // 认证成功，允许访问内容
    showContent();
  },
  onClose: () => {
    // 用户关闭弹窗，可以显示提示或执行其他逻辑
    console.log('用户取消了认证');
    showMessage('您已取消认证，部分功能可能受限');
  }
});
```

### 2. 现有系统集成

```typescript
// 在用户点击"登录"时触发
loginButton.onclick = async () => {
  const success = await WxAuth.requireAuth();
  if (success) {
    // 继续原有登录流程
  }
};
```

### 2.1 监听关闭事件

```typescript
WxAuth.init({
  apiBase: 'https://auth.shenzjd.com',
  required: false,  // 必须设置为 false 才能关闭
  onVerified: (user) => {
    // 认证成功，允许访问内容
    showContent();
  },
  onClose: () => {
    // 用户关闭弹窗，可以显示提示或执行其他逻辑
    console.log('用户取消了认证');
    showMessage('您已取消认证，部分功能可能受限');
  }
});
```

### 2.2 使用 requireAuth + onClose

```typescript
// 在需要认证的页面中
async function accessProtectedContent() {
  // 如果用户关闭弹窗，返回 false
  const authenticated = await WxAuth.requireAuth();
  if (!authenticated) {
    // 用户关闭弹窗，显示受限内容或提示
    showLimitedContent();
    return;
  }
  // 认证成功，显示完整内容
  showFullContent();
}
```

### 3. 重新认证/切换账号
```typescript
// 用户点击"切换账号"
switchAccountButton.onclick = async () => {
  await WxAuth.requireAuth();
};
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

**版本**: 1.1.0
**构建时间**: 2025-12-30
**状态**: ✅ 生产就绪
