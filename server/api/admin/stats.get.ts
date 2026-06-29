// 站点统计数据 API
// 路由: /api/admin/stats

import { eventHandler } from 'h3';
import fs from 'fs';
import path from 'path';
import { getStorageStats } from '~/server/utils/storage';

// 数据文件路径
const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'auth-data.json');

export default eventHandler(async () => {
  // 读取认证数据
  if (!fs.existsSync(DATA_FILE)) {
    return {
      sites: [],
      totalAuth: 0,
      totalToday: 0,
      storageStats: { authCodes: 0, authenticatedUsers: 0 }
    };
  }

  const content = fs.readFileSync(DATA_FILE, 'utf8');
  const authData = JSON.parse(content);

  // 按 siteId 分组统计
  const siteStatsMap = new Map<string, {
    siteId: string;
    totalAuth: number;
    todayAuth: number;
    lastAuthAt: number;
  }>();

  // 统计已认证用户
  for (const [openid, userData] of Object.entries(authData.authenticatedUsers)) {
    const siteId = userData.siteId || 'unknown';

    if (!siteStatsMap.has(siteId)) {
      siteStatsMap.set(siteId, {
        siteId,
        totalAuth: 0,
        todayAuth: 0,
        lastAuthAt: 0
      });
    }

    const stats = siteStatsMap.get(siteId)!;
    stats.totalAuth++;

    // 统计今日新增
    const authDate = new Date(userData.authenticatedAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (authDate >= today) {
      stats.todayAuth++;
    }

    // 更新最后活跃时间
    const authTimestamp = new Date(userData.authenticatedAt).getTime();
    if (authTimestamp > stats.lastAuthAt) {
      stats.lastAuthAt = authTimestamp;
    }
  }

  // 转换为数组并排序（按认证数降序）
  const siteStats = Array.from(siteStatsMap.values())
    .sort((a, b) => b.totalAuth - a.totalAuth);

  // 计算总数
  const totalAuth = siteStats.reduce((sum, site) => sum + site.totalAuth, 0);
  const totalToday = siteStats.reduce((sum, site) => sum + site.todayAuth, 0);

  // 计算占比
  siteStats.forEach(site => {
    site.percentage = totalAuth > 0 ? ((site.totalAuth / totalAuth) * 100).toFixed(1) : '0.0';
  });

  return {
    sites: siteStats,
    totalAuth,
    totalToday,
    storageStats: getStorageStats()
  };
});
