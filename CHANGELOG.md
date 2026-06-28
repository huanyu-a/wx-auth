# 版本更新日志

## v1.2.0 (2025-06-28)

### ✨ 新功能

#### 新增 `required` 配置项
支持灵活配置认证模式：

```typescript
// 强制认证模式（默认）
WxAuth.init({
  apiBase: 'https://wx-auth.shenzjd.com',
  required: true,  // 不显示关闭按钮，必须认证
  onVerified: (user) => { ... }
});

// 可选认证模式
WxAuth.init({
  apiBase: 'https://wx-auth.shenzjd.com',
  required: false,  // 显示关闭按钮，可跳过
  onVerified: (user) => { ... },
  onClose: () => {
    // 处理用户关闭弹窗的逻辑
  }
});
```

**特性：**
- ✅ **强制认证模式**（required=true）：
  - 不显示关闭按钮（×）
  - 点击遮罩层无效
  - 适合内容付费、会员系统等场景

- ✅ **可选认证模式**（required=false）：
  - 显示关闭按钮（×）
  - 点击遮罩可关闭
  - 显示提示文字"（可点击右上角关闭）"
  - 关闭时触发 `onClose` 回调
  - 适合博客、资讯等场景

### 🎨 UI 优化

#### 可选认证模式样式
- 添加 `.wx-auth-optional` CSS 类
- 遮罩层显示 pointer 光标
- 描述文字显示关闭提示
- 关闭按钮仅在可选模式显示

#### 强制认证模式样式
- 添加 `.wx-auth-required` CSS 类
- 隐藏关闭按钮
- 遮罩层阻止点击事件

### 📚 文档更新

- ✅ 更新 SDK README 使用示例
- ✅ 更新主项目 README 接入文档
- ✅ 更新 CLAUDE.md 配置说明
- ✅ 添加 TEST_REQUIRED.md 测试说明

---

## v1.1.0 (2025-12-30)

### ✨ 新功能

#### 新增 `onClose` 回调
用户关闭弹窗时触发回调：

```typescript
WxAuth.init({
  apiBase: 'https://wx-auth.shenzjd.com',
  onClose: () => {
    console.log('用户关闭了认证弹窗');
  }
});
```

### 🔧 修复
- 修复弹窗防删除保护机制
- 优化移动端显示效果
- 改进暗色模式适配

---

## 版本说明

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.2.0 | 2025-06-28 | 新增 required 配置项 |
| v1.1.0 | 2025-12-30 | 新增 onClose 回调、防删除保护 |
| v1.0.0 | 2025-12-28 | 初始版本 |
