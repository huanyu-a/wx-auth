// 认证状态检查 API - 极简版
// 路由: /api/auth/check

import { eventHandler, getQuery, setHeader } from 'h3';
import {
  getUserByAuthCode,
  deleteAuthCode,
  isUserAuthenticated,
  getAuthenticatedUser,
  markUserAuthenticated
} from '~/server/utils/storage';
import { getClientIp, checkRateLimit } from '~/server/utils/rate-limit';
import { signOpenid, verifySignedToken } from '~/server/utils/token';

export default eventHandler(async (event) => {
  const config = useRuntimeConfig();

  // 校验服务端配置
  if (!config.session?.secret || config.session.secret.length < 16) {
    console.error('[Auth] session.secret 配置无效或过短，Token 功能不可用');
    return {
      authenticated: false,
      error: 'server_config_error',
      message: '服务端配置错误，请联系管理员'
    };
  }

  const { authToken, openid, siteId, token } = getQuery(event);

  // 速率限制：防止暴力枚举和信息探测
  // 对所有请求都进行限流，但认证尝试使用更严格的限制
  const isAuthAttempt = !!authToken;
  const clientIp = getClientIp(event);
  const rateLimitKey = `auth-check:${clientIp}${isAuthAttempt ? ':auth' : ':query'}`;

  const rateLimit = checkRateLimit(rateLimitKey, {
    maxAttempts: isAuthAttempt ? 10 : 30, // 认证尝试 10 次，常规查询 30 次
    windowMs: 60 * 1000,
    blockMs: 5 * 60 * 1000
  });

  if (!rateLimit.allowed) {
    setHeader(event, 'Retry-After', String(rateLimit.retryAfter));
    return {
      authenticated: false,
      error: 'rate_limited',
      message: `请求过于频繁，请 ${rateLimit.retryAfter} 秒后重试`
    };
  }

  // 1. 检查签名 Token（优先）或 openid（向后兼容）
  let resolvedOpenid: string | null = null;

  if (token) {
    // 新方案：验证签名 Token
    resolvedOpenid = verifySignedToken(
      token as string,
      config.session.secret
    );
  } else if (openid) {
    // 向后兼容：明文 openid（老版本 SDK Cookie）
    resolvedOpenid = openid as string;
  }

  if (resolvedOpenid) {
    const user = getAuthenticatedUser(resolvedOpenid);
    if (user) {
      // 如果是通过明文 openid 验证的，返回签名 Token 供 SDK 升级存储
      const responseToken = token
        ? (token as string)
        : signOpenid(resolvedOpenid, config.session.secret);
      return {
        authenticated: true,
        token: responseToken,
        user: {
          openid: resolvedOpenid,
          unionid: user.unionid,
          nickname: user.nickname,
          headimgurl: user.headimgurl,
          authenticatedAt: user.authenticatedAt
        }
      };
    }
  }

  // 2. 检查认证码（用户输入验证码）
  if (authToken) {
    const authData = getUserByAuthCode(authToken as string);

    if (authData) {
      // 认证成功，标记用户
      markUserAuthenticated(authData.openid, {
        nickname: authData.nickname,
        headimgurl: authData.headimgurl,
        unionid: authData.unionid,
        siteId: siteId as string | undefined
      }, event);

      // 删除已使用的认证码
      deleteAuthCode(authToken as string);

      // 生成签名 Token 供 SDK 存储
      const signedToken = signOpenid(authData.openid, config.session.secret);

      return {
        authenticated: true,
        token: signedToken,
        user: {
          openid: authData.openid,
          unionid: authData.unionid,
          nickname: authData.nickname,
          headimgurl: authData.headimgurl,
          authenticatedAt: new Date().toISOString()
        }
      };
    } else {
      return {
        authenticated: false,
        error: 'invalid_or_expired'
      };
    }
  }

  // 3. 未提供任何认证信息
  return { authenticated: false };
});
