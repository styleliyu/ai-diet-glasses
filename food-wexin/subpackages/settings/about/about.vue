<template>
  <view class="about-container safe-area">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">关于我们</text>
      <view style="width: 80rpx"></view>
    </view>

    <!-- Logo和应用信息 -->
    <view class="app-info">
      <view class="app-logo">
        <text class="logo-text">🥗</text>
      </view>
      <text class="app-name">智能膳食监测系统</text>
      <text class="app-version">版本 1.0.0</text>
    </view>

    <!-- 关于内容 -->
    <view class="about-content">
      <view class="content-card">
        <text class="content-title">系统介绍</text>
        <text class="content-text">
          智能膳食监测系统是一款基于人工智能技术的健康管理应用。
          通过先进的图像识别技术，帮助用户轻松记录每日饮食，分析营养摄入，
          提供科学的膳食建议，助力健康生活。
        </text>
      </view>

      <view class="content-card">
        <text class="content-title">主要功能</text>
        <view class="feature-list">
          <view class="feature-item">
            <text class="feature-icon">📸</text>
            <text class="feature-text"
              >AI食物识别：拍照即可识别食物种类和营养</text
            >
          </view>
          <view class="feature-item">
            <text class="feature-icon">📊</text>
            <text class="feature-text"
              >膳食记录：详细记录每日饮食与营养信息</text
            >
          </view>
          <view class="feature-item">
            <text class="feature-icon">📈</text>
            <text class="feature-text">统计分析：热量、营养摄入可视化图表</text>
          </view>
          <view class="feature-item">
            <text class="feature-icon">🎯</text>
            <text class="feature-text">健康目标：设定并追踪个人健康目标</text>
          </view>
          <view class="feature-item">
            <text class="feature-icon">💡</text>
            <text class="feature-text">智能建议：个性化膳食建议和提醒</text>
          </view>
        </view>
      </view>

      <view class="content-card">
        <text class="content-title">开发团队</text>
        <text class="content-text">
          本系统由AI膳食健康研究团队开发，结合营养学专家建议和前沿AI技术，
          致力于为用户提供科学、便捷的膳食管理解决方案。
        </text>
      </view>

      <view class="content-card">
        <text class="content-title">联系我们</text>
        <text class="content-text">
          邮箱：support@smartdiet.com 电话：400-123-4567 工作时间：周一至周五
          9:00-18:00
        </text>
      </view>
    </view>

    <!-- 版权信息 -->
    <view class="copyright">
      <text class="copyright-text">© 2026 智能膳食监测系统 版权所有</text>
    </view>
  </view>
</template>

<script setup>
function goBack() {
  // 返回逻辑：关于页是普通子页面，直接回到上一页即可。
  uni.navigateBack();
}
</script>

<style scoped>
.safe-area {
  padding-top: calc(env(safe-area-inset-top) + 44rpx);
  padding-top: var(--app-header-top) !important;
  padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
  padding-bottom: calc(var(--app-safe-bottom) + 20rpx);
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e8f0f8 100%);
}

.about-container {
  padding: 0 30rpx;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 60rpx;
}

.back-btn {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12rpx 28rpx rgba(70, 104, 136, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: #486988;
}

.page-title {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
}

/* 应用信息 */
.app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.app-logo {
  width: 160rpx;
  height: 160rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 6rpx solid rgba(255, 255, 255, 0.3);
  margin-bottom: 30rpx;
}

.logo-text {
  font-size: 80rpx;
}

.app-name {
  font-size: 36rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 10rpx;
}

.app-version {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 关于内容 */
.about-content {
  flex: 1;
}

.content-card {
  background: white;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.content-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.content-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

/* 功能列表 */
.feature-list {
  margin-top: 20rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.feature-item:last-child {
  margin-bottom: 0;
}

.feature-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  min-width: 40rpx;
}

.feature-text {
  font-size: 28rpx;
  color: #666;
  flex: 1;
}

/* 版权信息 */
.copyright {
  text-align: center;
  padding: 40rpx 0;
}

.copyright-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>
