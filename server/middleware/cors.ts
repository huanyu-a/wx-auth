// 动态 CORS 中间件 - 解决 credentials:include 与 Access-Control-Allow-Origin:* 冲突
// 浏览器规范要求：当请求携带 credentials 时，不允许使用通配符 *，必须返回具体 origin
export default defineEventHandler((event) => {
  const origin = getRequestHeader(event, 'origin')

  // 有 origin 头说明是跨域请求
  if (origin) {
    // 动态返回请求来源，效果等同于 * 但符合浏览器规范
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
    setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
  }

  // 处理浏览器 OPTIONS 预检请求
  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
