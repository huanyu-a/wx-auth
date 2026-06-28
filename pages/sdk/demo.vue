<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <div class="w-full max-w-4xl mx-auto">
      <!-- 返回链接 -->
      <div class="mb-6">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-slate-600 hover:text-[#07C160] transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          返回首页
        </NuxtLink>
      </div>

      <!-- 主卡片 -->
      <div class="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
        <!-- 头部 -->
        <div class="bg-gradient-to-r from-[#07C160] to-[#06AD56] p-8 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold tracking-tight mb-2">SDK 接入演示</h1>
              <p class="text-white/90 text-lg">在你的网站中快速接入微信订阅号认证</p>
            </div>
            <div class="hidden sm:block">
              <div class="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg class="w-10 h-10" fill="white" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="p-8 space-y-8">
          <!-- NPM 接入方式 -->
          <div>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#07C160]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/>
              </svg>
              方式一：NPM 安装
            </h2>
            <div class="space-y-3">
              <div class="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                <pre class="text-sm text-green-400 font-mono"><code># 安装 SDK
npm install wx-auth-sdk</code></pre>
              </div>
              <div class="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                <pre class="text-sm text-slate-300 font-mono leading-relaxed"><code><span class="text-purple-400">import</span> { WxAuth } <span class="text-purple-400">from</span> <span class="text-yellow-300">'wx-auth-sdk'</span>;
<span class="text-purple-400">import</span> <span class="text-yellow-300">'wx-auth-sdk/dist/style.css'</span>;

WxAuth.<span class="text-blue-400">init</span>({
  apiBase: <span class="text-yellow-300">'https://wx-auth.shenzjd.com'</span>,
  siteId: <span class="text-yellow-300">'my-website'</span>, <span class="text-slate-500">// 你的网站标识</span>
  <span class="text-slate-500">// wechatName 和 qrcodeUrl 会自动从后端获取</span>
  onVerified: <span class="text-blue-400">(</span>user<span class="text-blue-400">)</span> <span class="text-purple-400">=></span> {
    console.log(<span class="text-yellow-300">'认证成功'</span>, user);
  }
});</code></pre>
              </div>
            </div>
          </div>

          <!-- CDN 接入方式 -->
          <div>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#07C160]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm4 11h2v-2H9v2zm0-4h2V6H9v4z"/>
              </svg>
              方式二：CDN 引入
            </h2>
            <div class="bg-slate-900 rounded-xl p-4 overflow-x-auto">
              <pre class="text-sm text-slate-300 font-mono leading-relaxed"><code><span class="text-slate-500">&lt;!-- 引入样式和脚本 --&gt;</span>
<span class="text-red-400">&lt;link</span> rel=<span class="text-yellow-300">"stylesheet"</span> href=<span class="text-yellow-300">"https://unpkg.com/wx-auth-sdk/dist/wx-auth.css"</span><span class="text-red-400">&gt;</span>
<span class="text-red-400">&lt;script</span> src=<span class="text-yellow-300">"https://unpkg.com/wx-auth-sdk/dist/wx-auth.umd.js"</span><span class="text-red-400">&gt;&lt;/script&gt;</span>

<span class="text-red-400">&lt;script&gt;</span>
  WxAuth.<span class="text-blue-400">init</span>({
    apiBase: <span class="text-yellow-300">'https://wx-auth.shenzjd.com'</span>,
    siteId: <span class="text-yellow-300">'my-website'</span>,
    onVerified: <span class="text-blue-400">(</span>user<span class="text-blue-400">)</span> <span class="text-purple-400">=></span> {
      console.log(<span class="text-yellow-300">'认证成功'</span>, user);
    }
  });
<span class="text-red-400">&lt;/script&gt;</span></code></pre>
            </div>
          </div>

          <!-- 配置说明 -->
          <div class="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200/60">
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#07C160]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
              </svg>
              配置说明
            </h2>
            <div class="space-y-3 text-sm">
              <div class="flex items-start gap-3">
                <span class="inline-flex items-center justify-center px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-md font-mono text-xs flex-shrink-0">siteId</span>
                <span class="text-slate-600">你的网站唯一标识（<strong>必填</strong>），用于区分不同接入网站的访问数据</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="inline-flex items-center justify-center px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md font-mono text-xs flex-shrink-0">apiBase</span>
                <span class="text-slate-600">后端 API 地址（可选，有默认值），当前为 <code class="bg-slate-200 px-1 rounded text-xs">https://wx-auth.shenzjd.com</code></span>
              </div>
              <div class="flex items-start gap-3">
                <span class="inline-flex items-center justify-center px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md font-mono text-xs flex-shrink-0">required</span>
                <span class="text-slate-600">是否必须认证（可选，默认 <code class="bg-slate-200 px-1 rounded text-xs">true</code>）</span>
              </div>
              <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-sm text-yellow-800">
                  <strong>⚠️ 注意：</strong><code class="bg-yellow-100 px-1 rounded text-xs">wechatName</code> 和 <code class="bg-yellow-100 px-1 rounded text-xs">qrcodeUrl</code> 无需配置，自动从后端获取，接入方配置也<strong>无效</strong>（统一使用"神族九帝"公众号）。
                </p>
              </div>
            </div>
          </div>

          <!-- API 方法 -->
          <div>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#07C160]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              API 方法
            </h2>
            <div class="grid sm:grid-cols-2 gap-4">
              <div class="bg-slate-50 rounded-xl p-4">
                <div class="font-mono text-sm font-semibold text-[#07C160] mb-2">WxAuth.init(options)</div>
                <p class="text-sm text-slate-600">初始化 SDK，自动检测 Cookie 并静默认证</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-4">
                <div class="font-mono text-sm font-semibold text-[#07C160] mb-2">WxAuth.requireAuth()</div>
                <p class="text-sm text-slate-600">手动触发认证流程，返回 <code class="bg-slate-200 px-1 rounded text-xs">Promise&lt;boolean&gt;</code></p>
              </div>
              <div class="bg-slate-50 rounded-xl p-4">
                <div class="font-mono text-sm font-semibold text-[#07C160] mb-2">WxAuth.close()</div>
                <p class="text-sm text-slate-600">关闭认证弹窗</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-4">
                <div class="font-mono text-sm font-semibold text-[#07C160] mb-2">自动配置获取</div>
                <p class="text-sm text-slate-600">wechatName、qrcodeUrl 自动从 <code class="bg-slate-200 px-1 rounded text-xs">/api/sdk/config</code> 获取</p>
              </div>
            </div>
          </div>

          <!-- 实时测试 -->
          <div class="bg-gradient-to-br from-[#07C160]/5 to-[#06AD56]/5 rounded-xl p-6 border border-[#07C160]/20">
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#07C160]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd"/>
              </svg>
              实时测试
            </h2>
            <p class="text-sm text-slate-600 mb-4">点击下方按钮测试 SDK 认证流程（使用 demo siteId）：</p>
            <button
              @click="triggerDemoAuth"
              class="py-3 px-8 bg-[#07C160] hover:bg-[#06AD56] text-white rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              测试认证流程
            </button>
          </div>
        </div>

        <!-- 底部 -->
        <div class="bg-slate-50 px-8 py-4 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>微信订阅号认证 SDK v1.1.0 | 零依赖 | < 12 KB</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WxAuth } from "../../wx-auth-sdk/src/index";
import "../../wx-auth-sdk/src/wx-auth.css";

function triggerDemoAuth() {
  WxAuth.init({
    siteId: "sdk-demo",
    onVerified: (user) => {
      alert("认证成功！用户信息：" + JSON.stringify(user));
    },
  });
}
</script>
