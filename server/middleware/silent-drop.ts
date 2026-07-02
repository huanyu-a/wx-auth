/**
 * 静默拦截中间件
 *
 * 在请求到达 Nuxt/Vue Router 之前，直接关闭扫描器连接。
 * 效果：
 *   1. 消除 Vue Router 404 warn（日志噪音降低 ~96%）
 *   2. 不返回 404 响应体，避免泄露"路径不存在"信息
 *   3. 不走到 Nuxt SSR，节省渲染资源
 *
 * 设计原则：
 *   - 高危特征（RCE/穿越）→ 直接断开 TCP 连接
 *   - 已知攻击路径清单 → 空 200（让对方摸不清是拦截还是文件不存在）
 *   - 绝不拦截自身真实路径：/api/auth/*、/api/wechat/*、/api/sdk/*
 */

// ===== 高危 → destroy()，不给任何响应 =====
const DEADLY_PATTERNS = [
  /\/vendor\/phpunit\/phpunit\/src\/Util\/PHP\/eval-stdin\.php/i,
  // 路径穿越 — URL 编码或原生
  /%2e%2e/i,
  /\/\.\.\//,
  // 反斜杠穿越 (Windows 风格) — URL 编码 %5C 和原生反斜杠
  /\.{2}%5c/i,
  /%5c\.{2}/i,
]

// ===== 敏感文件/配置窃取 → 空 200 =====
const SENSITIVE_FILE_PATTERNS = [
  /^\/\.env?(\.[a-z]+)?$/i,
  /^\/\.(npmrc|yarnrc|pypirc|pgpass|user\.ini|spring-boot-devtools\.properties)$/,
  /^\/\.(git|svn|hg)\//,
  /^\/\.(bzr|travis\.yml|drone\.yml|semaphore|buildkite|digitalocean)/,
  /^\/(__nextjs_action|_next|\.next|\.nuxt|\.output)\//,
  /\.js\.map$/,
  /^\/\.well-known\//,
]

// ===== 敏感文件名关键词匹配 =====
const SENSITIVE_NAME_PATTERNS = [
  /(config|keys|credentials|secrets|token|stripe|twilio|slack|sendgrid|webhook|pay|oauth)\.(json|ya?ml|log|txt|ini|env|cfg|conf)$/i,
  /^\/var\//,
  /^\/logs?\/(\w+\/)?(access|app|application|error)\.log$/i,
  /^\/(app|application|access|error)\.log$/i,
]

// ===== 接口字典扫描 → 空 200（精确路径，不误杀自己） =====
// 维护提示：小写即可；实际判断同时检查 Math.random 时的原值和 toLowerCase 版本
const BLOCKED_API_PATHS = new Set([
  '/api/login',
  '/api/admin',
  '/api/swagger',
  '/api/health',
  '/rest/login',
  '/rest/logout',
  '/rest/oauth1-credential/auth',
  '/rest/oauth2-credential/auth',
  '/auth/login',
  '/oauth/authorize',
  '/oauth/token',
  '/login',
  '/logout',
  '/admin',
  '/admin.html',
  '/administrator/',
  '/administrator',
  '/phpmyadmin',
  '/phpMyAdmin',
  '/dbadmin',
  '/__debug',
  '/graphql',
  '/v1/graphql',
  '/v2/graphql',
  '/adminer.php',
  '/solr/admin',
  '/actuator',
  '/actuator/health',
  '/actuator/info',
  '/actuator/metrics',
  '/debug',
  '/debug/pprof',
  '/debug/vars',
  '/health',
  '/healthz',
  '/metrics',
  '/openapi.json',
  '/openapi.yaml',
  '/swagger',
  '/swagger-ui.html',
  '/swagger.json',
])

// ===== 业务字典扫描（contact/about/team/pricing/... 多语言） =====
const BIZ_DICT_PATTERN = /^\/(contact[a-z]*|contatt[io]s?|kontakt|get-in-touch|reach-us|sobre-nosotros|[a-z]{2}\/[a-z\-]+contact[a-z]*|about(-us)?|help|support|team|company|impressum|legal|privacy|pricing|terms|sitemap\.xml|forum|blog|\.buildkite|\.digitalocean|\.drone|\.semaphore|\.travis|\.cache|\.hg|\.svn|\.bzr|\.pypirc|\.npmrc|\.yarnrc|\.pgpass|\.user\.ini)$/i

function matchAny(path: string, patterns: RegExp[]): boolean {
  for (const re of patterns) {
    if (re.test(path)) return true
  }
  return false
}

function isOwnApi(path: string): boolean {
  // 自身真实 API，绝对不能拦截
  if (path.startsWith('/api/auth/')) return true
  if (path.startsWith('/api/wechat/')) return true
  if (path.startsWith('/api/sdk/')) return true
  // 微信验证文件 prefix 也放行
  if (path.startsWith('/MP_verify_')) return true
  return false
}

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  let path = url.pathname

  // 根路径直接放行
  if (path === '/') return

  // 自身 API / 验证文件始终放行（黑名单之前先确认是白名单）
  if (isOwnApi(path)) return

  // 1) 高危特征 → 直接断开 TCP
  if (matchAny(path, DEADLY_PATTERNS)) {
    event.node.res.destroy()
    return
  }

  // 2) 敏感文件名 → 空 200
  if (matchAny(path, SENSITIVE_FILE_PATTERNS) || matchAny(path, SENSITIVE_NAME_PATTERNS)) {
    setResponseStatus(event, 200)
    return ''
  }

  // 3) 精确接口/后台路径
  const lower = path.toLowerCase()
  if (BLOCKED_API_PATHS.has(lower) || BLOCKED_API_PATHS.has(path)) {
    setResponseStatus(event, 200)
    return ''
  }

  // 4) 业务字典 / 数字开头伪文章路径
  if (BIZ_DICT_PATTERN.test(path)) {
    setResponseStatus(event, 200)
    return ''
  }
  // /2024/06/... 这种日历格式
  if (/^\/\d{4}\/\d{1,2}(\/|$)/.test(path)) {
    setResponseStatus(event, 200)
    return ''
  }
  // Nuxt 生成的动态路由片段 [id] [slug]
  if (/^\/[^/]*%5B\w+%5D/.test(path)) {
    setResponseStatus(event, 200)
    return ''
  }
})
