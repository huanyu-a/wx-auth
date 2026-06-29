<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <header class="page-header">
      <div class="header-content">
        <div class="title-section">
          <ChartBarIcon class="header-icon" />
          <h1>微信认证数据</h1>
        </div>
        <div class="header-actions">
          <button
            @click="loadStats"
            :disabled="isLoading"
            class="refresh-button"
            aria-label="刷新数据"
          >
            <ArrowPathIcon :class="{ 'spin': isLoading }" />
            <span>刷新</span>
          </button>
        </div>
      </div>
      <p class="last-update" v-if="lastUpdated">
        最后更新: {{ formatDateTime(lastUpdated) }}
      </p>
    </header>

    <!-- 核心指标卡片 -->
    <section class="stats-grid" aria-label="核心指标">
      <article class="stat-card" v-for="metric in keyMetrics" :key="metric.id">
        <div class="metric-icon" :class="metric.color">
          <component :is="metric.icon" />
        </div>
        <div class="metric-content">
          <h3 class="metric-label">{{ metric.label }}</h3>
          <p class="metric-value">{{ metric.value }}</p>
          <span v-if="metric.trend" class="metric-trend" :class="metric.trendType">
            <ArrowUpIcon v-if="metric.trendType === 'up'" />
            <ArrowDownIcon v-else-if="metric.trendType === 'down'" />
            {{ metric.trend }}
          </span>
        </div>
      </article>
    </section>

    <!-- 站点数据表格 -->
    <section class="table-container" aria-labelledby="table-heading">
      <div class="table-header">
        <h2 id="table-heading">
          <BuildingOfficeIcon class="section-icon" />
          各站点统计
        </h2>
        <span class="site-count">{{ stats.sites.length }} 个站点</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">站点 ID</th>
              <th scope="col">认证用户数</th>
              <th scope="col">今日新增</th>
              <th scope="col">占比</th>
              <th scope="col">最后活跃</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="site in stats.sites" :key="site.siteId">
              <td>
                <code class="site-id">{{ site.siteId }}</code>
              </td>
              <td class="number-cell">{{ site.totalAuth.toLocaleString() }}</td>
              <td class="number-cell">
                <span class="trend-badge positive">+{{ site.todayAuth }}</span>
              </td>
              <td class="number-cell">
                <div class="percentage-cell">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: site.percentage + '%' }"></div>
                  </div>
                  <span class="percentage-value">{{ site.percentage }}%</span>
                </div>
              </td>
              <td class="time-cell">{{ formatDate(site.lastAuthAt) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>总计</strong></td>
              <td class="number-cell"><strong>{{ stats.totalAuth.toLocaleString() }}</strong></td>
              <td class="number-cell"><strong>+{{ stats.totalToday }}</strong></td>
              <td class="number-cell"><strong>100%</strong></td>
              <td>-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>

    <!-- 存储统计 -->
    <aside class="storage-info" aria-labelledby="storage-heading">
      <h3 id="storage-heading">
        <CircleStackIcon class="section-icon" />
        存储信息
      </h3>
      <dl class="storage-stats">
        <div class="stat-item">
          <dt>认证码数量</dt>
          <dd>{{ stats.storageStats.authCodes }}</dd>
        </div>
        <div class="stat-item">
          <dt>认证用户数量</dt>
          <dd>{{ stats.storageStats.authenticatedUsers }}</dd>
        </div>
      </dl>
    </aside>
  </div>
</template>

<script setup>
// 导入 Heroicons
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  CircleStackIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/vue/24/outline';

// 响应式状态
const stats = ref({
  sites: [],
  totalSites: 0,
  totalAuth: 0,
  totalToday: 0,
  storageStats: {
    authCodes: 0,
    authenticatedUsers: 0
  }
});

const isLoading = ref(false);
const lastUpdated = ref(null);

// 核心指标数据
const keyMetrics = computed(() => [
  {
    id: 'sites',
    label: '接入站点',
    value: stats.value.totalSites,
    icon: BuildingOfficeIcon,
    color: 'blue'
  },
  {
    id: 'total-auth',
    label: '总认证用户',
    value: stats.value.totalAuth.toLocaleString(),
    icon: ChartBarIcon,
    color: 'green'
  },
  {
    id: 'today',
    label: '今日新增',
    value: `+${stats.value.totalToday}`,
    icon: ArrowUpIcon,
    color: 'amber',
    trend: '持续增长',
    trendType: 'up'
  }
]);

// 加载数据
const loadStats = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    const data = await $fetch('/api/admin/stats');
    stats.value = {
      ...data,
      totalSites: data.sites.length
    };
    lastUpdated.value = new Date();
  } catch (error) {
    console.error('加载统计数据失败:', error);
    alert('加载数据失败: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于 1 小时显示分钟
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} 分钟前`;
  }

  // 小于 1 天显示小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} 小时前`;
  }

  // 否则显示日期
  return date.toLocaleDateString('zh-CN');
};

// 格式化日期时间
const formatDateTime = (date) => {
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 页面加载时获取数据
onMounted(() => {
  loadStats();

  // 每 30 秒自动刷新
  setInterval(loadStats, 30000);
});
</script>

<style scoped>
/* ===== 设计令牌 ===== */
.dashboard {
  --color-primary: #1E40AF;
  --color-secondary: #3B82F6;
  --color-accent: #D97706;
  --color-background: #F8FAFC;
  --color-foreground: #1E3A8A;
  --color-muted: #64748B;
  --color-border: #DBEAFE;
  --color-success: #059669;
  --color-success-bg: #D1FAE5;
  --color-card: #FFFFFF;
  --color-card-hover: #F8FAFC;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
  background: var(--color-background);
  min-height: 100vh;
}

/* ===== 页面标题 ===== */
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-primary);
}

h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0;
  line-height: 1.2;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.refresh-button:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.refresh-button:active:not(:disabled) {
  transform: scale(0.98);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.refresh-button .spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.last-update {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin: 0;
}

/* ===== 核心指标卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all 200ms ease-out;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-secondary);
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.metric-icon.blue {
  background: #DBEAFE;
  color: var(--color-primary);
}

.metric-icon.green {
  background: #D1FAE5;
  color: var(--color-success);
}

.metric-icon.amber {
  background: #FEF3C7;
  color: var(--color-accent);
}

.metric-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.metric-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0;
  line-height: 1.2;
}

.metric-trend {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.metric-trend.up {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.metric-trend.down {
  background: #FEE2E2;
  color: #DC2626;
}

.metric-trend svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* ===== 表格容器 ===== */
.table-container {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.table-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0;
}

.section-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
}

.site-count {
  font-size: 0.875rem;
  color: var(--color-muted);
  padding: 0.25rem 0.75rem;
  background: var(--color-background);
  border-radius: var(--radius-md);
}

.table-wrapper {
  overflow-x: auto;
  margin: 0 -1.5rem;
  padding: 0 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table thead {
  position: sticky;
  top: 0;
  background: var(--color-background);
  z-index: 10;
}

.data-table th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--color-border);
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-foreground);
  font-size: 0.875rem;
}

.data-table tbody tr {
  transition: background-color 150ms ease-out;
}

.data-table tbody tr:hover {
  background: var(--color-card-hover);
}

.data-table tbody tr:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.data-table tfoot {
  background: var(--color-background);
  font-weight: 600;
}

.data-table tfoot td {
  border-top: 2px solid var(--color-border);
}

.site-id {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #F1F5F9;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: 'Fira Code', 'SF Mono', Monaco, monospace;
  font-size: 0.8125rem;
  color: var(--color-primary);
  font-weight: 500;
}

.number-cell {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.time-cell {
  white-space: nowrap;
}

.trend-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
}

.trend-badge.positive {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.percentage-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 0.5rem;
  background: #E2E8F0;
  border-radius: 9999px;
  overflow: hidden;
  max-width: 120px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-secondary), var(--color-primary));
  border-radius: 9999px;
  transition: width 300ms ease-out;
}

.percentage-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-muted);
  min-width: 2.5rem;
  text-align: right;
}

/* ===== 存储信息 ===== */
.storage-info {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.storage-info h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 1rem 0;
}

.storage-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-item dt {
  font-size: 0.875rem;
  color: var(--color-muted);
  font-weight: 500;
}

.stat-item dd {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0;
  font-variant-numeric: tabular-nums;
}

/* ===== 响应式设计 ===== */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .refresh-button {
    width: 100%;
    justify-content: center;
  }

  h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
  }

  .metric-value {
    font-size: 1.5rem;
  }

  .table-container {
    padding: 1rem;
  }

  .table-wrapper {
    margin: 0 -1rem;
    padding: 0 1rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.8125rem;
  }

  .progress-bar {
    max-width: 80px;
  }

  .storage-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 0.75rem;
  }

  h1 {
    font-size: 1.25rem;
  }

  .metric-value {
    font-size: 1.25rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }

  .site-id {
    font-size: 0.75rem;
  }
}

/* ===== 可访问性 ===== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点可见性 */
.refresh-button:focus-visible,
.data-table tbody tr:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 打印样式 */
@media print {
  .refresh-button,
  .header-actions {
    display: none;
  }

  .dashboard {
    background: white;
  }

  .stat-card,
  .table-container,
  .storage-info {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #000;
  }
}
</style>
