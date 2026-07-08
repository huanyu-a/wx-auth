/**
 * 统一日志工具
 *
 * 目标：让服务端每一条日志都自带
 *   [本地时间+时区] [客户端IP] [User-Agent] [级别] 消息
 * 方便在没有逐行时间戳的原始日志里溯源攻击来源。
 *
 * 设计：
 *  - 全局 console.* 增强（server/plugins/logger.ts 调用 installConsoleEnhancer）
 *    让所有既有的 console.log('[Storage] ...') / console.error('[WeChat] ...')
 *    以及 Vue Router 的警告，自动带上时间戳（无请求上下文时 IP/UA 为 -）。
 *  - makeLogger(event) 绑定某个请求，业务日志额外带上该请求的 IP + UA。
 *  - 所有输出都走 orig（原生 console），避免递归。
 */

import { getRequestHeader, getRequestIP, type H3Event } from 'h3';

// 在模块加载时捕获原生 console（只捕获一次），供增强与业务 logger 共用，避免递归。
const orig = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

export type LogLevel = 'LOG' | 'INFO' | 'WARN' | 'ERROR' | 'REQ';

/**
 * 本地时区时间，显式标注时区偏移（避免 UTC 歧义）。
 * 例：2026-07-07 22:36:02.123 +08:00
 */
export function formatTimestamp(d: Date = new Date()): string {
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const da = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const oh = pad(Math.floor(Math.abs(off) / 60));
  const om = pad(Math.abs(off) % 60);
  return `${y}-${mo}-${da} ${h}:${mi}:${s}.${ms} ${sign}${oh}:${om}`;
}

/**
 * 从请求中提取客户端 IP 与 UA。
 * 走反向代理（OpenResty / Cloudflare / EdgeOne）时优先读 X-Forwarded-For。
 */
export function getReqCtx(event?: H3Event): { ip: string; ua: string } {
  if (!event) return { ip: '-', ua: '-' };
  let ip = '-';
  try {
    ip = getRequestIP(event, { xForwardedFor: true }) || '-';
  } catch {
    /* 非请求上下文，留 - */
  }
  let ua = '-';
  try {
    ua = getRequestHeader(event, 'user-agent') || '-';
  } catch {
    /* ignore */
  }
  if (ua.length > 200) ua = ua.slice(0, 200) + '…';
  return { ip, ua };
}

function stringify(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.stack || arg.message;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

export function formatLog(
  time: string,
  ip: string,
  ua: string,
  level: LogLevel,
  args: unknown[]
): string {
  const safe = Array.isArray(args) ? args : [args];
  const msg = safe.map(stringify).join(' ');
  return `${time} [${ip}] [${ua}] [${level}] ${msg}`;
}

/** 绕过全局增强，直接输出已格式化的整行（避免重复时间戳）。 */
export function rawOut(line: string): void {
  orig.info(line);
}

/**
 * 业务 logger：绑定某个请求 event，日志自动带 IP + UA。
 * 不传 event（如定时任务、模块初始化）则 IP/UA 为 -。
 */
export function makeLogger(event?: H3Event) {
  const { ip, ua } = getReqCtx(event);
  const fire =
    (method: 'log' | 'info' | 'warn' | 'error', level: LogLevel) =>
    (...args: unknown[]) =>
      orig[method](formatLog(formatTimestamp(), ip, ua, level, args));
  return {
    log: fire('log', 'LOG'),
    info: fire('info', 'INFO'),
    warn: fire('warn', 'WARN'),
    error: fire('error', 'ERROR')
  };
}

let installed = false;

/**
 * 全局 console 增强：所有服务端 console.* 自动带 [时间戳]（IP/UA 默认为 -）。
 * 必须在 Nitro 插件里尽早调用一次。幂等。
 */
export function installConsoleEnhancer(): void {
  if (installed) return;
  installed = true;
  console.log = (...args: unknown[]) =>
    orig.log(formatLog(formatTimestamp(), '-', '-', 'LOG', args));
  console.info = (...args: unknown[]) =>
    orig.info(formatLog(formatTimestamp(), '-', '-', 'INFO', args));
  console.warn = (...args: unknown[]) =>
    orig.warn(formatLog(formatTimestamp(), '-', '-', 'WARN', args));
  console.error = (...args: unknown[]) =>
    orig.error(formatLog(formatTimestamp(), '-', '-', 'ERROR', args));
}
