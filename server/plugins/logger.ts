/**
 * 日志增强插件（Nitro 插件，服务端启动时执行一次）
 *
 * 1) 全局 console 增强：让所有服务端日志自动带 [时间戳]。
 * 2) 每请求一条 [REQ] 汇总行：带 客户端IP + UA + method + path + status + 耗时。
 *    利用 Nitro 'request' 钩子在请求最早期挂载 res 'close' 监听，
 *    无论后续中间件是否短路（如 silent-drop 直接丢弃），都能记录攻击来源。
 */

import { defineNitroPlugin } from '#imports';
import {
  installConsoleEnhancer,
  formatTimestamp,
  getReqCtx,
  formatLog,
  rawOut
} from '../utils/logger';

export default defineNitroPlugin((nitroApp) => {
  // 1) 全局时间戳
  installConsoleEnhancer();

  // 2) 每请求汇总行（带 IP + UA，最可靠的溯源记录）
  nitroApp.hooks.hook('request', (event) => {
    const start = Date.now();
    const { ip, ua } = getReqCtx(event);

    event.node.res.on('close', () => {
      const ms = Date.now() - start;
      const status = event.node.res.statusCode;
      const line = formatLog(
        formatTimestamp(),
        ip,
        ua,
        'REQ',
        [`${event.method} ${event.path} -> ${status} (${ms}ms)`]
      );
      rawOut(line);
    });
  });
});
