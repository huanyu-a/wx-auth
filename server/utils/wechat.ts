// 微信相关工具函数
import crypto from 'crypto';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export interface WeChatMessage {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'text' | 'event' | 'news' | 'image';
  Content?: string;
  Event?: string;
  MsgId?: number;
  Image?: {
    PicUrl?: string;
    MediaId?: string;
  };
}

/**
 * 微信消息加解密（安全模式）
 * 参考：微信官方文档 - 消息加解密
 */

// 生成随机16位字节
function getRandomBytes(): Buffer {
  return crypto.randomBytes(16);
}

/**
 * 解密微信消息（安全模式）
 * @param encryptMsg 加密的消息体
 * @param aesKey EncodingAESKey（43位字符）
 * @param appId 公众号AppID
 */
export function decryptWeChatMessage(
  encryptMsg: string,
  aesKey: string,
  appId: string
): string {
  try {
    // 1. EncodingAESKey 转换为 32字节AES密钥
    // 微信的 EncodingAESKey 是43位Base64字符，需要添加 '=' 补全为44位
    const key = Buffer.from(aesKey + '=', 'base64');
    const iv = key.slice(0, 16);
    const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // 2. Base64解码
    const encrypted = Buffer.from(encryptMsg, 'base64');

    // 3. 解密
    let decrypted = cipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, cipher.final()]);

    // 4. 去除 PKCS#7 填充
    const padLen = decrypted[decrypted.length - 1];
    const unpadded = decrypted.slice(0, decrypted.length - padLen);

    // 5. 解析报文格式：随机16字节 + 消息长度(4字节) + 消息内容 + AppID
    const msgLen = unpadded.readUInt32BE(16);
    const content = unpadded.slice(20, 20 + msgLen).toString('utf8');
    const appIdFromMsg = unpadded.slice(20 + msgLen).toString('utf8');

    // 6. 验证AppID
    if (appIdFromMsg !== appId) {
      throw new Error(`AppID验证失败: 期望[${appId}] 收到[${appIdFromMsg}]`);
    }

    return content;
  } catch (error) {
    console.error('[WeChat] 解密失败:', error);
    throw new Error('消息解密失败');
  }
}

/**
 * 加密回复消息（安全模式）
 * @param replyMsg 明文回复消息
 * @param aesKey EncodingAESKey（43位字符）
 * @param appId 公众号AppID
 */
export function encryptWeChatReply(
  replyMsg: string,
  aesKey: string,
  appId: string
): string {
  try {
    // 1. EncodingAESKey 转换为 32字节AES密钥
    const key = Buffer.from(aesKey + '=', 'base64');
    const iv = key.slice(0, 16);

    // 2. 准备报文内容
    // 格式：随机16字节 + 消息长度(4字节, 网络字节序) + 消息内容 + AppID
    const randomBytes = getRandomBytes();
    const msgLen = Buffer.alloc(4);
    msgLen.writeUInt32BE(Buffer.from(replyMsg, 'utf8').length, 0);

    const appIdBuffer = Buffer.from(appId, 'utf8');

    // 3. 拼接报文
    const content = Buffer.concat([
      randomBytes,
      msgLen,
      Buffer.from(replyMsg, 'utf8'),
      appIdBuffer
    ]);

    // 4. PKCS#7 填充
    const blockSize = 32;
    const padLen = blockSize - (content.length % blockSize);
    const padding = Buffer.alloc(padLen, padLen);
    padding.fill(padLen);
    const paddedContent = Buffer.concat([content, padding]);

    // 5. AES-256-CBC 加密
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(paddedContent);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // 6. Base64编码
    return encrypted.toString('base64');
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('消息加密失败');
  }
}

/**
 * 生成安全模式的回复XML
 */
export function generateEncryptedWeChatReply(
  encryptMsg: string,
  signature: string,
  timestamp: string,
  nonce: string
): string {
  // 手动构建 XML 以确保正确的 CDATA 格式
  const cdata = (text: string) => `<![CDATA[${text}]]>`;

  let xml = '<xml>';
  xml += `<Encrypt>${cdata(encryptMsg)}</Encrypt>`;
  xml += `<MsgSignature>${cdata(signature)}</MsgSignature>`;
  xml += `<TimeStamp>${timestamp}</TimeStamp>`;
  xml += `<Nonce>${nonce}</Nonce>`;
  xml += '</xml>';

  return xml;
}

/**
 * 生成签名（用于加密消息回复）
 */
export function generateSignature(
  token: string,
  timestamp: string,
  nonce: string,
  encryptMsg: string
): string {
  const arr = [token, timestamp, nonce, encryptMsg].sort();
  const str = arr.join('');
  return crypto.createHash('sha1').update(str).digest('hex');
}

/**
 * 验证微信消息签名
 */
export function validateWeChatSignature(
  signature: string,
  timestamp: string,
  nonce: string,
  token: string
): boolean {
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1Str = crypto.createHash('sha1').update(str).digest('hex');
  return sha1Str === signature;
}

/**
 * 解析微信 XML 消息
 */
export function parseWeChatMessage(xml: string): WeChatMessage {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseNodeValue: true,
    parseAttributeValue: true
  });

  const parsed = parser.parse(xml);
  return parsed.xml;
}

/**
 * 生成微信 XML 回复消息
 */
export function generateWeChatReply(message: WeChatMessage): string {
  // 手动构建 XML 以确保正确的 CDATA 格式
  const cdata = (text: string) => `<![CDATA[${text}]]>`;

  let xml = '<xml>';
  xml += `<ToUserName>${cdata(message.ToUserName)}</ToUserName>`;
  xml += `<FromUserName>${cdata(message.FromUserName)}</FromUserName>`;
  xml += `<CreateTime>${message.CreateTime}</CreateTime>`;
  xml += `<MsgType>${cdata(message.MsgType)}</MsgType>`;

  if (message.MsgType === 'text' && message.Content) {
    xml += `<Content>${cdata(message.Content)}</Content>`;
  } else if (message.MsgType === 'image' && message.Image?.PicUrl) {
    xml += `<Image><PicUrl>${cdata(message.Image.PicUrl)}</PicUrl></Image>`;
  }

  xml += '</xml>';

  return xml;
}

/**
 * 生成6位随机认证码（密码学安全）
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * 检查消息内容是否包含关键词
 */
export function containsAuthKeyword(content: string): boolean {
  const config = useRuntimeConfig();
  const keywords = config.keywords;
  return keywords.some(k => content.includes(k));
}
/**
 * 生成欢迎消息（包含验证码和网站推广）- 通用版本
 */
export function generateWelcomeMessage(openid: string): string {
  const siteUrl = useRuntimeConfig().public.siteUrl;

  return `🎉 欢迎关注神族九帝！

━━━━━━━━━━━━━━━━━━
✅ 您的验证码：<SECRET_bfa776fe>━━━━━━━━━━━━━━━━━━

👉 在网站输入验证码完成认证

💡 验证码5分钟内有效
如需新验证码，发送"验证码"即可

━━━━━━━━━━━━━━━━━━
🌐 我的导航站
━━━━━━━━━━━━━━━━━━

🏠 首页：
   https://shenzjd.com

🔗 常用工具：
   📍 在线网盘：https://alist.shenzjd.com
   📍 网盘搜索：https://panhub.shenzjd.com
   📍 快链工具：https://duanlian.shenzjd.com
   📍 视频解析：https://parse.shenzjd.com
   📍 热点聚合：https://newshub.shenzjd.com
   📍 个人导航：https://navhub.shenzjd.com
   📍 必应壁纸：https://bing.shenzjd.com

━━━━━━━━━━━━━━━━━━
🌍 社交媒体
━━━━━━━━━━━━━━━━━━

💬 Telegram：https://t.me/shenzjd_com
💻 GitHub：https://github.com/wu529778790
🐦 X(Twitter)：https://x.com/shenzujiudi`;
}

/**
 * 生成认证码回复消息 - 通用版本
 */
export function generateCodeMessage(code: string): string {
  return `✅ 验证码已生成

━━━━━━━━━━━━━━━━━━
您的验证码：${code}
━━━━━━━━━━━━━━━━━━

👉 在网站输入验证码完成认证

💡 提示：验证码5分钟内有效`;
}
