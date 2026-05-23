<script>
export default {
  globalData: {
    statusBarHeight: 0,
    navBarHeight: 0,
    totalHeaderHeight: 0
  },
  onLaunch: function () {
    this.setNavigationBarHeight();
  },
  onShow: function () {
    this.setNavigationBarHeight();
  },
  onHide: function () {},
  methods: {
    setNavigationBarHeight() {
      try {
        const systemInfo = uni.getSystemInfoSync();
        const menuButtonInfo =
          typeof uni.getMenuButtonBoundingClientRect === 'function'
            ? uni.getMenuButtonBoundingClientRect()
            : {};

        const statusBarHeight = systemInfo.statusBarHeight || 24;
        const menuButtonHeight = menuButtonInfo.height || 44;
        const menuButtonTop = menuButtonInfo.top || statusBarHeight + 8;
        const navBarHeight = (menuButtonTop - statusBarHeight) * 2 + menuButtonHeight;
        const headerTotalHeight = statusBarHeight + navBarHeight;

        // 顶部安全区数据：供自定义导航页面和需要精确测量的组件读取。
        this.globalData.statusBarHeight = statusBarHeight;
        this.globalData.navBarHeight = navBarHeight;
        this.globalData.totalHeaderHeight = headerTotalHeight;

        // 页面联动兜底：CSS 变量负责基础安全区，storage 负责 JS 侧需要精确高度的场景。
        uni.setStorageSync('statusBarHeight', statusBarHeight);
        uni.setStorageSync('navBarHeight', navBarHeight);
        uni.setStorageSync('totalHeaderHeight', headerTotalHeight);
      } catch (error) {
        console.error('获取系统安全区信息失败:', error);
        const statusBarHeight = 24;
        const navBarHeight = 44;
        const headerTotalHeight = statusBarHeight + navBarHeight;

        // 顶部安全区兜底：读取失败时仍保留可点击的自定义导航高度。
        this.globalData.statusBarHeight = statusBarHeight;
        this.globalData.navBarHeight = navBarHeight;
        this.globalData.totalHeaderHeight = headerTotalHeight;

        uni.setStorageSync('statusBarHeight', statusBarHeight);
        uni.setStorageSync('navBarHeight', navBarHeight);
        uni.setStorageSync('totalHeaderHeight', headerTotalHeight);
      }
    }
  }
};
</script>

<style lang="scss">
/* 全局安全区变量：所有 custom navigation 页面都以这里作为顶部间距下限。 */
:root,
page {
  --app-safe-top: 28px;
  --app-safe-bottom: env(safe-area-inset-bottom, 0px);
  --app-page-top-gap: 44rpx;
  --app-header-top: calc(var(--app-safe-top) + var(--app-page-top-gap));
  --status-bar-height: var(--app-safe-top);
  --nav-bar-height: 44px;
  --total-header-height: calc(var(--app-safe-top) + var(--nav-bar-height));
  --menu-button-height: 44px;
  --menu-button-top: calc(var(--app-safe-top) + 8px);
}

/* 页面安全区：提供保守兜底，避免顶部按钮与通知栏/状态栏重合。 */
.safe-area {
  box-sizing: border-box;
  padding-top: var(--app-header-top);
  padding-bottom: calc(var(--app-safe-bottom) + 28rpx);
}

/* 自定义导航栏：普通页面由 .safe-area 控制顶部距离，避免头部再重复叠加安全区。 */
.page-header {
  box-sizing: border-box;
}

.back-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-space {
  width: 44px;
}

/* 全局小长框微设计：给列表项、输入框、筛选框加轻量层次，避免各页面出现大片单调白框。 */
.record-item,
.history-item,
.menu-item,
.setting-item,
.connect-option,
.scan-item {
  position: relative;
  overflow: hidden;
  border: 1rpx solid rgba(86, 121, 151, 0.08);
  box-shadow: 0 10rpx 24rpx rgba(70, 104, 136, 0.06);
}

.record-item::before,
.history-item::before,
.menu-item::before,
.setting-item::before,
.connect-option::before,
.scan-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 18rpx;
  bottom: 18rpx;
  width: 6rpx;
  border-radius: 0 999rpx 999rpx 0;
  background: linear-gradient(180deg, #6a8caf 0%, #4dba79 100%);
  opacity: 0.72;
}

/* 信息小块：用于报告指标、设备摘要、营养指标等短横框，增加顶部光感和边界。 */
.metric-item,
.summary-item,
.detail-item,
.nutrition-card {
  position: relative;
  overflow: hidden;
  border: 1rpx solid rgba(86, 121, 151, 0.07);
}

.metric-item::after,
.summary-item::after,
.detail-item::after,
.nutrition-card::after {
  content: "";
  position: absolute;
  left: 18rpx;
  right: 18rpx;
  top: 0;
  height: 4rpx;
  border-radius: 999rpx;
  background: rgba(106, 140, 175, 0.2);
}

/* 表单与选择框：统一输入区域的边界和内阴影，减少纯灰底的扁平感。 */
.form-input,
.text-input,
.name-input,
.weight-input,
.picker-field {
  border: 1rpx solid rgba(86, 121, 151, 0.1);
  box-shadow: inset 0 2rpx 0 rgba(255, 255, 255, 0.74);
}

.form-input:focus,
.text-input:focus,
.name-input:focus,
.weight-input:focus {
  border-color: rgba(77, 143, 159, 0.36);
}

/* 分段/标签类小框：选中时增加底部短线，减少只有底色变化的单调感。 */
.mode-tab,
.select-chip {
  position: relative;
  overflow: hidden;
}

.mode-tab.active::after,
.select-chip.active::after {
  content: "";
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 6rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.78);
}
</style>
