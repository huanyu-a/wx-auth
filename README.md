# 微信订阅号认证系统

> 一个公众号认证后端，服务多个网站。用户扫码关注 → 输入验证码 → 完成认证。

技术栈：**Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS**

---

## 认证流程

```
用户访问任意接入网站
        │
        ▼
SDK 检查 Cookie
        │
        ├── 有效 ──── 静默通过
        │
        └── 无效
             │
             ▼
        SDK 拉取后端配置（公众号名称 + 二维码）
             │
             ▼
        弹窗展示
             │
             ▼
        用户扫码关注公众号
             │
             ▼
        公众号自动回复 6 位验证码
             │
             ▼
        用户输入 → 后端校验
             │
      ┌──────┴──────┐
      │             │
    成功          失败
      │             │
      ▼             ▼
  保存 Cookie   提示错误
  onVerified()  重新输入
```

**取关后**：服务端检测到取关事件 → 立即清除该 openid 认证记录，下次校验时弹窗重新弹出。

---

## SaaS 架构

一套后端，多个接入方，通过 `siteId` 区分来源：

```
  ┌────────────┐   ┌────────────┐   ┌────────────┐
  │ site: blog │   │ site: pan  │   │ site: ...  │
  └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
        │                │                │
        └────────────────┴────────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  wx-auth 后端      │
              │  (apiBase + 签名)  │
              └────────┬───────────┘
                       │
                       ▼
              ┌────────────────────┐
              │ 微信公众号"神族九帝" │
              └────────────────────┘
```

---

## 快速开始

### 本地开发

```bash
cp .env.example .env   # 填你的配置
npm install
npm run dev            # http://localhost:3000
```

### 接入方（SDK）

```typescript
import { WxAuth } from 'wx-auth-sdk';
import 'wx-auth-sdk/dist/wx-auth.css';

WxAuth.init({
  onVerified: (user) => { /* 解锁内容 */ }
});
```

零配置 — `siteId`、公众号名称、二维码全部自动获取。

#### 延迟弹窗 (`silent` 模式)

```typescript
WxAuth.init({
  silent: true,       // init 不调弹窗，只静默校验 cookie
  required: false,
  onVerified: (user) => { /* 标注已认证 */ },
});

// 后续由业务代码自行控制弹窗时机
// 例：await WxAuth.requireAuth();
```

### Docker 部署

```bash
docker build -t wx-auth .
docker run -d --name wx-auth --env-file .env -p 6702:3000 -v ./data:/app/data wx-auth
```

push 到 `main` 分支自动触发 GitHub Actions 构建 + 部署。

---

## 环境变量

### 必须配置

| 名称 | 说明 |
|------|------|
| `NUXT_PUBLIC_SITE_URL` | 网站地址，微信回调用 |
| `NUXT_WECHAT_TOKEN` | 微信后台 Token |
| `NUXT_SESSION_SECRET` | Session 密钥（`openssl rand -hex 32`） |
| `WECHAT_NAME` | 公众号名称 |
| `WECHAT_QRCODE_URL` | 二维码图片 URL |

> 本地开发用原始名称（`WECHAT_TOKEN` 等），Docker 必须加 `NUXT_` 前缀。

### 可选配置

| 名称 | 默认 | 说明 |
|------|------|------|
| `NUXT_WECHAT_AES_KEY` | 空 | 安全模式 AES Key（明文模式留空） |
| `NUXT_CODE_EXPIRY` | `300` | 验证码有效期（秒） |
| `NUXT_KEYWORDS` | `["验证码"]` | 触发关键词 |

---

## 微信后台配置

登录公众平台 → **设置与开发 → 基本配置 → 服务器配置**：

| 配置项 | 值 |
|--------|-----|
| URL | `https://your-domain.com/api/wechat/message` |
| Token | 与 `.env` 中的 `NUXT_WECHAT_TOKEN` 一致 |
| 消息模式 | 明文模式（或安全模式） |

---

## 安全机制

- **验证码**：6 位数字，5 分钟过期，一次性使用
- **Session**：AES-256-GCM 加密
- **Cookie**：HttpOnly + SameSite=Strict + Secure
- **弹窗保护**：MutationObserver + 60Hz requestAnimationFrame 轮询；F12 删弹窗立即恢复
- **全局防篡改**：`Object.freeze(WxAuth)`，控制台无法覆盖 SDK 方法

---

## 相关资源

- **SDK 文档**：`wx-auth-sdk/README.md`
- **GitHub**：https://github.com/wu529778790/wx-auth
- **NPM 包**：https://www.npmjs.com/package/wx-auth-sdk
- **生产地址**：https://wx-auth.shenzjd.com

---

**版本**: v1.2.6 | **状态**: ✅ 生产就绪
