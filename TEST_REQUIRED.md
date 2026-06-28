# required 配置测试说明

## 测试场景

### 1. 强制认证模式（required: true）

```typescript
WxAuth.init({
  apiBase: 'https://wx-auth.shenzjd.com',
  required: true,  // 或不设置，true 是默认值
  onVerified: (user) => {
    console.log('认证成功', user);
  }
});
```

**预期行为：**
- ❌ 不显示关闭按钮（×）
- ❌ 点击遮罩层无效（`event.preventDefault()`）
- ✅ 必须完成认证或刷新页面

---

### 2. 可选认证模式（required: false）

```typescript
WxAuth.init({
  apiBase: 'https://wx-auth.shenzjd.com',
  required: false,
  onVerified: (user) => {
    console.log('认证成功', user);
  },
  onClose: () => {
    console.log('用户关闭了认证弹窗');
  }
});
```

**预期行为：**
- ✅ 显示关闭按钮（×）
- ✅ 点击遮罩可关闭弹窗
- ✅ 描述文字显示"（可点击右上角关闭）"
- ✅ 关闭时触发 `onClose` 回调

---

## 快速测试

### 测试 1：强制认证
```bash
pnpm dev
```

访问 http://localhost:3000，应该看到：
- 弹窗中没有 × 关闭按钮
- 点击背景遮罩不会关闭弹窗

### 测试 2：可选认证
修改 `pages/index.vue` 中的配置：

```typescript
required: false, // 改为 false
```

重启后访问 http://localhost:3000，应该看到：
- 弹窗右上角有 × 关闭按钮
- 点击 × 或背景遮罩可关闭弹窗
- 控制台输出"用户关闭了认证弹窗"
- 描述文字有"（可点击右上角关闭）"提示

---

## CSS 类名

SDK 会根据 `required` 配置自动添加 CSS 类：

- `wx-auth-required` - 强制认证模式
- `wx-auth-optional` - 可选认证模式

可在自定义 CSS 中覆盖样式：

```css
/* 自定义强制认证模式的标题栏颜色 */
.wx-auth-required .wx-auth-header {
  background: #ff0000;
}

/* 自定义可选认证模式的背景 */
.wx-auth-optional .wx-auth-overlay {
  background: rgba(0, 0, 0, 0.3);
}
```

---

## 版本信息

- **版本**: 1.2.0
- **更新日期**: 2025-06-28
- **功能**: 新增 `required` 配置项，支持强制/可选认证模式
