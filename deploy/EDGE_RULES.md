# wx-auth 边缘拦截规则使用说明

把扫描器流量在**到达应用之前**就丢弃，省掉 Nuxt SSR 算力，也比应用层拦截更隐蔽。
本目录的 `edge-rules.conf` 与 `server/middleware/silent-drop.ts` 是**两层互补**的防护：

| 层 | 位置 | 作用 |
|---|---|---|
| 边缘层（本文件） | OpenResty / Nginx / CDN | 请求还没进容器就 `444` 断开，零 SSR 开销 |
| 应用层 | `silent-drop.ts` | 边缘漏过的、以及需要按业务白名单判断的，在 Nuxt 内兜底 |

边缘层只挡"应用绝不提供的路径"（脚本扩展名、WordPress、密钥文件），不做业务白名单判断，
因此**不会误伤真实路由**，配置也简单（无需重复 `proxy_pass`）。

---

## 一、OpenResty / 1Panel（你的部署方式）

站点 `wx-auth.bx9y.com.cn` 由宝塔面板 Nginx 反代到容器 `127.0.0.1:6702`。

1. 打开 **宝塔面板 → 网站 → wx-auth.bx9y.com.cn → 配置文件**。
2. 在 `server {` 内部、**现有的 `location / { proxy_pass ... }` 之前**，粘贴 `edge-rules.conf` 的全部内容。
3. 点击"保存"后，1Panel 会自动做配置检查并重载；若手动操作则：
   ```bash
   nginx -t        # 语法校验
   nginx -s reload  # 平滑重载（OpenResty 同样适用）
   ```

---

## 二、Cloudflare WAF

在 **Security → WAF → Custom rules** 新建规则，多条条件任选/组合，动作选 **Block**：

| 字段 | 运算符 | 值 |
|---|---|---|
| URI | matches regex | `\.(php|asp|aspx|jsp|jspx|do|cgi|pl|py|sh)$` |
| URI | starts with | `//` |
| URI | matches regex | `^/(wp-admin|wp-content|wp-includes|wp-json|wp-login)` |
| URI | matches regex | `(\.env|/\.aws/|/\.git/|/\.ssh/|/\.terraform/|aws/credentials|terraform\.tfstate)` |

> Cloudflare 免费版 Custom Rules 条数有限，挑命中率最高的（`.php`、`^//`、WP）即可。

---

## 三、EdgeOne（腾讯云）

**站点 → 安全防护 → Web 防护 → 自定义规则（或访问管控）** 新建规则：

- 匹配条件（任选）：
  - 请求 URI 正则：`\.(php|asp|aspx|jsp|jspx|do|cgi|pl|py|sh)$`
  - 请求 URI 前缀：`//`
  - 请求 URI 正则：`^/(wp-admin|wp-content|wp-includes|wp-json|wp-login)`
  - 请求 URI 正则：`(\.env|/\.aws/|/\.git/|/\.ssh/|aws/credentials|terraform\.tfstate)`
- 处置动作：**拦截**（或"挑战"）。

---

## 四、验证是否生效

上线后观察：

1. **容器日志**：Vue Router 的 `No match found for location` 警告应断崖式下降（边缘已挡掉绝大多数 `.php` / `//` / WP 探测，不再打到 Nuxt）。
2. **边缘访问日志**：OpenResty 访问日志里对应请求状态应为 `444`。
3. **真实用户无感**：`/`、`/admin`、`/sdk`、`/_nuxt`、`/api/auth|wechat|sdk|admin` 正常。

> 提示：应用层 `silent-drop.ts` 的 allowlist 仍保留，作为边缘规则万一被绕过时的兜底。
> 两者规则保持一致即可；若调整了其中一处，记得同步另一处。

---

## 五、真实客户端 IP

无论哪一层拦截，溯源都依赖真实 IP。你的部署链路是
`客户端 → OpenResty(1Panel) → Docker 容器`，反代会带上 `X-Forwarded-For`。
应用层日志（`server/plugins/logger.ts`）已用 `getRequestIP(event, { xForwardedFor: true })`
读取该头；边缘层（Cloudflare/EdgeOne）也默认注入 `X-Forwarded-For`，
因此最终落到日志里的 IP 就是真实访客 IP。
