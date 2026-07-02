# 微信订阅号认证 SDK

轻量级前端认证 SDK — 用户扫码关注公众号 → 输入 6 位验证码 → 认证成功。

基于 Vite 构建，**零依赖，< 15 KB**。

---

## 安装

```bash
npm install wx-auth-sdk
```

---

## 快速开始（零配置）

```typescript
import { WxAuth } from 'wx-auth-sdk';
import 'wx-auth-sdk/dist/wx-auth.css';

WxAuth.init({
  onVerified: (user) => {
    console.log('认证成功', user);
  }
});
```

SDK 会自动：

- 从 `document.referrer` 或当前域名获取 `siteId`
- 从后端拉取公众号名称和二维码
- 使用内置 API 地址

---

## API

### `WxAuth.init(options)`

初始化 SDK。自动检测 Cookie，已登录静默通过，未登录弹出认证窗。

```ts
WxAuth.init({
  siteId?: string,          // 站点标识（可选，自动获取）
  apiBase?: string,         // 后端地址（可选，默认官方服务）
  required?: boolean,       // 是否强制认证（默认 true）
  onVerified?: (user) => void,
  onError?: (err) => void,
  onClose?: () => void,     // required=false 时关闭弹窗的回调
});
```

### `WxAuth.requireAuth()`

手动触发认证（用于"登录"按钮、切换账号）。返回 `Promise<boolean>`。

### `WxAuth.close()`

关闭弹窗。`required=false` 时触发 `onClose` 回调。

---

## 认证流程

```
用户访问
   │
   ▼
初始化 WxAuth.init()
   │
   ▼
读取 Cookie
   │
   ├── 有效 ──────────── onVerified()  ✅ 静默通过
   │
   └── 无效 ──→ 显示弹窗
                    │
                    ▼
              扫码关注公众号
                    │
                    ▼
              公众号回复 6 位验证码
                    │
                    ▼
              用户输入验证码
                    │
                    ▼
              后端校验
                    │
           ┌───────┴────────┐
           │                │
         成功             失败
           │                │
           ▼                ▼
      保存 Cookie      提示错误
      onVerified()    重新输入
```

---

## 两种模式

### 强制认证 `required: true`（默认）

必须完成认证才能继续，关闭按钮隐藏，点击遮罩无效。

```
  弹窗
 ┌──────────────────────────┐
 │  微信认证                │
 │                          │
 │  1. 扫码关注公众号       │
 │     ┌──────┐             │
 │     │ 二维码 │             │
 │     └──────┘             │
 │                          │
 │  2. 发送"验证码"获取     │
 │     取消关注公众号后将被 │ ← 新增提示
 │     取消认证，请保持关注 │
 │     [_][_][_][_][_][_]   │
 │                          │
 │       [ 验证 ]           │
 └──────────────────────────┘
```

### 可选认证 `required: false`

用户可主动关闭弹窗，关闭时执行 `onClose` 回调。

```
  弹窗
 ┌──────────────────────────┐
 │  微信认证             [×] │
 │  ...                     │
 └──────────────────────────┘
    ↓
  用户点击 × 或遮罩
    ↓
  onClose() → 继续浏览受限内容
```

---

## 功能清单

| 功能 | 支持 |
|------|------|
| 自动聚焦第一个输入框 | ✅ |
| 输入一位自动跳到下一格 | ✅ |
| 粘贴 6 位数字自动识别 | ✅ |
| 键盘左右/退格导航 | ✅ |
| 输入完成自动提交 | ✅ |
| 有 Cookie 静默认证 | ✅ |
| F12 删弹窗自动恢复 | ✅ |

---

## 开发

```bash
npm install
npm run build
```
