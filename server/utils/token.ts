/**
 * 签名 Token 工具
 *
 * 对 openid 进行 HMAC 签名，生成不可伪造的 Token。
 * SDK 将 Token 存入 Cookie 而非明文 openid。
 * 服务端验证 Token 签名后才提取 openid 查询用户。
 */

import crypto from 'crypto';

/**
 * 生成签名 Token
 * 格式：openid.timestamp.signature
 * signature = HMAC-SHA256(secret, openid.timestamp)
 */
export function signOpenid(openid: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${openid}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

/**
 * 验证签名 Token 并提取 openid
 * @returns openid 验证成功；null 验证失败或过期
 */
export function verifySignedToken(
  token: string,
  secret: string,
  maxAgeSeconds: number = 365 * 24 * 60 * 60 // 默认 1 年
): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [openid, timestampStr, signature] = parts;

  // 严格校验 openid 格式
  if (!openid || typeof openid !== 'string' || openid.length === 0 || openid.length > 128) {
    return null;
  }

  const timestamp = parseInt(timestampStr, 10);

  // 校验时间戳有效性
  if (isNaN(timestamp) || timestamp < 0 || timestamp > Math.floor(Date.now() / 1000) + 3600) {
    return null; // 时间戳不能是未来时间（允许 1 小时误差）
  }

  // 校验签名长度（SHA256 hex = 64 字符）
  if (signature.length !== 64) return null;

  // 检查是否过期
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > maxAgeSeconds) return null;

  // 验证签名（恒定时间比较，防止时序攻击）
  const expectedPayload = `${openid}.${timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(expectedPayload)
    .digest('hex');

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  return openid;
}
