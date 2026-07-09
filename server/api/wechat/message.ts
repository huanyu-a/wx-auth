// 微信消息处理 API - 支持安全模式（加密消息）
// 路由: /api/wechat/message

import { eventHandler, getMethod, getQuery, readBody } from 'h3';
import {
  validateWeChatSignature,
  parseWeChatMessage,
  generateWeChatReply,
  generateVerificationCode,
  containsAuthKeyword,
  generateWelcomeMessage,
  generateCodeMessage,
  decryptWeChatMessage,
  encryptWeChatReply,
  generateEncryptedWeChatReply,
  generateSignature
} from '../../utils/wechat';
import {
  saveAuthCode,
  getUserByAuthCode,
  deleteAuthCode,
  markUserAuthenticated,
  clearUserAuthentication
} from '../../utils/storage';
import { makeLogger } from '../../utils/logger';

export default eventHandler(async (event) => {
  const method = getMethod(event);
  const log = makeLogger(event);
  // 运行时环境变量直接读取（解决 Nuxt 构建时固化空值的问题）
  const config = {
    token: process.env.NUXT_WECHAT_TOKEN || useRuntimeConfig().wechat?.token || '',
    appId: process.env.NUXT_WECHAT_APPID || useRuntimeConfig().wechat?.appId || '',
    aesKey: process.env.NUXT_WECHAT_AES_KEY || useRuntimeConfig().wechat?.aesKey || '',
    name: process.env.NUXT_WECHAT_NAME || useRuntimeConfig().wechat?.name || '公众号',
    qrcodeUrl: process.env.NUXT_WECHAT_QRCODE_URL || useRuntimeConfig().wechat?.qrcodeUrl || ''
  };

  // 验证配置
  if (!config.token) {
    log.error('[WeChat] WECHAT_TOKEN 未设置');
    return 'Invalid configuration';
  }

  // 1. 微信服务器验证（GET请求）
  if (method === 'GET') {
    const { signature, timestamp, nonce, echostr } = getQuery(event);

    if (!signature || !timestamp || !nonce || !echostr) {
      return 'Invalid parameters';
    }

    const isValid = validateWeChatSignature(
      signature as string,
      timestamp as string,
      nonce as string,
      config.token
    );

    return isValid ? echostr : 'Invalid signature';
  }

  // 2. 处理消息（POST请求）
  if (method === 'POST') {
    const { signature, timestamp, nonce, encrypt_type, msg_signature } = getQuery(event);

    try {
      const body = await readBody(event);
      if (!body) {
        log.error('[WeChat] Empty body');
        return 'Empty body';
      }

      log.log('[WeChat] 收到消息, encrypt_type=' + encrypt_type + ', body type=' + typeof body);

      // 判断是否是加密消息（安全模式）
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      const isEncrypted = encrypt_type === 'aes' || bodyStr.includes('<Encrypt>');

      log.log('[WeChat] isEncrypted=' + isEncrypted);

      let message: any;
      let needEncrypt = false;

      if (isEncrypted) {
        // ========== 安全模式（加密消息）==========
        const encryptMatch = bodyStr.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/);
        if (!encryptMatch) {
          log.error('[WeChat] 未找到Encrypt节点, body=' + bodyStr.substring(0, 200));
          return 'Invalid encrypted message';
        }

        const encryptMsg = encryptMatch[1];
        log.log('[WeChat] encryptMsg length=' + encryptMsg.length + ', first20=' + encryptMsg.substring(0, 20));

        // 微信安全模式签名验证
        const expectedSignature = generateSignature(
          config.token,
          timestamp as string,
          nonce as string,
          encryptMsg
        );

        if (!msg_signature || msg_signature !== expectedSignature) {
          log.error('[WeChat] 消息签名验证失败, expected=' + expectedSignature + ', got=' + msg_signature);
          return 'Invalid signature';
        }

        log.log('[WeChat] 开始解密, aesKey=' + (config.aesKey ? '已设置(' + config.aesKey.length + '字符)' : '未设置') + ', appId=' + config.appId);
        const decryptedXml = decryptWeChatMessage(
          encryptMsg,
          config.aesKey,
          config.appId
        );
        log.log('[WeChat] 解密成功, decryptedXml=' + decryptedXml.substring(0, 200));

        message = parseWeChatMessage(decryptedXml);
        log.log('[WeChat] 解析消息, MsgType=' + message.MsgType + ', Event=' + message.Event + ', FromUserName=' + message.FromUserName);
        needEncrypt = true;

      } else {
        // ========== 明文模式或兼容模式==========
        message = parseWeChatMessage(body);
      }

      const { MsgType, Event, FromUserName, ToUserName, Content } = message;
      log.log('[WeChat] 处理消息, MsgType=' + MsgType + ', Event=' + Event + ', Content=' + Content);

      // 处理消息逻辑
      let replyMsg = '';

      // 关注事件 - 核心逻辑：自动发送验证码
      if (MsgType === 'event' && Event === 'subscribe') {
        const code = generateVerificationCode();
        saveAuthCode(code, FromUserName, undefined, event);

        log.log(`[WeChat] 关注 ${FromUserName}，发送验证码 ${code}`);

        const welcomeMsg = generateWelcomeMessage(FromUserName);
        const codeMsg = `\n\n━━━━━━━━━━━━━━━━━━\n🔐 您的专属验证码\n\n╔═════════════════╗\n     ${code}\n╚═════════════════╝\n\n👉 请在网站输入验证码完成认证\n⏰ 验证码 5 分钟内有效\n💬 发送「验证码」可重新获取`;

        replyMsg = welcomeMsg + codeMsg;

      } else if (MsgType === 'event' && Event === 'unsubscribe') {
        // 取消关注事件 - 清除用户认证状态
        clearUserAuthentication(FromUserName, event);
        log.log(`[WeChat] 取关 ${FromUserName}，已清除认证`);
        return 'success';

      } else if (MsgType === 'event' && Event === 'LOCATION') {
        // 位置事件 - 不回复
        return 'success';

      } else if (MsgType === 'text') {
        const content = String(Content || '').trim();

        if (!content) {
          replyMsg = '💬 请输入有效内容\n\n发送「验证码」获取验证码';
        } else if (containsAuthKeyword(content)) {
          // 认证关键词 - 重新发送验证码
          const existingCode = generateVerificationCode();
          saveAuthCode(existingCode, FromUserName, undefined, event);

          log.log(`[WeChat] 验证码 ${FromUserName} ${existingCode}`);

          replyMsg = generateCodeMessage(existingCode);
        } else {
          // 默认回复
          replyMsg = '🐱 喵～收到你的消息啦！\n\n如需获取验证码，请发送「验证码」';
        }
      }

      // 如果没有回复内容，直接返回成功（不发送空回复）
      if (!replyMsg) {
        return 'success';
      }

      // 构建回复消息
      if (needEncrypt && config.aesKey) {
        // ========== 安全模式：加密回复 ==========
        // 1. 生成明文回复XML
        const replyXml = generateWeChatReply({
          ToUserName: FromUserName,
          FromUserName: ToUserName,
          CreateTime: Math.floor(Date.now() / 1000),
          MsgType: 'text',
          Content: replyMsg
        });

        // 2. 加密回复
        const encryptedReply = encryptWeChatReply(
          replyXml,
          config.aesKey,
          config.appId
        );

        // 3. 生成签名
        const replySignature = generateSignature(
          config.token,
          timestamp as string,
          nonce as string,
          encryptedReply
        );

        // 4. 生成加密回复XML
        const finalReply = generateEncryptedWeChatReply(
          encryptedReply,
          replySignature,
          timestamp as string,
          nonce as string
        );

        return finalReply;

      } else {
        // ========== 明文模式：直接回复 ==========
        return generateWeChatReply({
          ToUserName: FromUserName,
          FromUserName: ToUserName,
          CreateTime: Math.floor(Date.now() / 1000),
          MsgType: 'text',
          Content: replyMsg
        });
      }

    } catch (error) {
      log.error('[WeChat] ❌ 处理出错:', error);
      return 'Internal Server Error';
    }
  }

  return 'Method Not Allowed';
});
