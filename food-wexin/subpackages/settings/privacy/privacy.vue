<template>
  <view class="privacy-container safe-area">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">隐私政策</text>
      <view style="width: 80rpx"></view>
    </view>

    <!-- 隐私说明 -->
    <view class="privacy-intro">
      <text class="intro-text">
        我们高度重视您的隐私安全。本隐私政策说明了我们如何收集、使用和保护您的个人信息。
      </text>
    </view>

    <!-- 隐私设置 -->
    <view class="privacy-settings">
      <view class="setting-title">隐私设置</view>

      <view class="setting-list">
        <view class="setting-item">
          <text class="setting-label">个性化推荐</text>
          <text class="setting-desc">基于您的饮食习惯提供个性化建议</text>
          <view class="setting-switch">
            <switch
              :checked="privacySettings.personalized"
              @change="onPersonalizedChange"
              color="#07c160"
            />
          </view>
        </view>

        <view class="setting-item">
          <text class="setting-label">数据收集</text>
          <text class="setting-desc">收集匿名数据用于产品优化</text>
          <view class="setting-switch">
            <switch
              :checked="privacySettings.dataCollection"
              @change="onDataCollectionChange"
              color="#07c160"
            />
          </view>
        </view>

        <view class="setting-item">
          <text class="setting-label">数据分析</text>
          <text class="setting-desc">分析膳食数据以改进识别准确率</text>
          <view class="setting-switch">
            <switch
              :checked="privacySettings.dataAnalysis"
              @change="onDataAnalysisChange"
              color="#07c160"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 隐私政策内容 -->
    <view class="privacy-content">
      <view class="content-title">隐私政策详情</view>

      <view class="policy-section">
        <text class="section-title">1. 信息收集</text>
        <text class="section-content">
          我们仅收集必要的个人信息以提供服务： • 账户信息：用户名、邮箱、密码等
          • 膳食记录：您记录的食物信息 • 设备信息：设备型号、操作系统版本 •
          使用数据：功能使用频率、偏好设置
        </text>
      </view>

      <view class="policy-section">
        <text class="section-title">2. 信息使用</text>
        <text class="section-content">
          我们使用您的信息用于以下目的： • 提供核心膳食管理功能 •
          改进AI识别准确率 • 个性化健康建议 • 产品功能优化 • 问题诊断和解决
        </text>
      </view>

      <view class="policy-section">
        <text class="section-title">3. 数据保护</text>
        <text class="section-content">
          我们采取严格的安全措施保护您的数据： • 数据传输使用SSL加密 •
          敏感信息加密存储 • 定期安全审计 • 访问权限控制 • 数据备份和恢复
        </text>
      </view>

      <view class="policy-section">
        <text class="section-title">4. 数据共享</text>
        <text class="section-content">
          我们不会出售或出租您的个人信息。 仅在以下情况共享数据： •
          获得您的明确同意 • 法律要求或政府指令 • 保护用户或公众安全 •
          产品转让或并购
        </text>
      </view>

      <view class="policy-section">
        <text class="section-title">5. 您的权利</text>
        <text class="section-content">
          您拥有以下隐私权利： • 访问您的个人信息 • 更正错误信息 • 删除个人账户
          • 撤回隐私设置同意 • 数据导出请求 • 投诉和咨询
        </text>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="data-management">
      <view class="management-title">数据管理</view>

      <view class="management-buttons">
        <button class="data-btn" @tap="exportData" type="default">
          导出个人数据
        </button>
        <button class="data-btn" @tap="deleteAccount" type="warn">
          删除账户数据
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from "vue";

// 隐私设置
const privacySettings = reactive({
  personalized: true,
  dataCollection: true,
  dataAnalysis: true,
});

// 设置变化
const onPersonalizedChange = (e) => {
  privacySettings.personalized = e.detail.value;
};

const onDataCollectionChange = (e) => {
  privacySettings.dataCollection = e.detail.value;
};

const onDataAnalysisChange = (e) => {
  privacySettings.dataAnalysis = e.detail.value;
};

// 导出数据
const exportData = () => {
  uni.showLoading({
    title: "准备导出中...",
  });

  setTimeout(() => {
    uni.hideLoading();
    uni.showModal({
      title: "数据导出",
      content: "您的个人数据已准备就绪，请查看下载内容",
      showCancel: false,
    });
  }, 1500);
};

// 删除账户
const deleteAccount = () => {
  uni.showModal({
    title: "删除确认",
    content: "此操作将永久删除您的所有数据，且无法恢复。确定要继续吗？",
    confirmText: "删除",
    confirmColor: "#ff3b30",
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: "删除中...",
        });

        setTimeout(() => {
          uni.hideLoading();
          uni.showToast({
            title: "账户已删除",
            icon: "success",
          });

          // 实际应用中应该跳转到登录页面
          setTimeout(() => {
            uni.reLaunch({
              url: "/pages/login/login",
            });
          }, 1500);
        }, 2000);
      }
    },
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};
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

.privacy-container {
  padding: 0 30rpx;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
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

/* 隐私说明 */
.privacy-intro {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.intro-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

/* 隐私设置 */
.privacy-settings {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.setting-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.setting-list {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.setting-item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 10rpx;
}

.setting-label {
  grid-column: 1;
  grid-row: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.setting-desc {
  grid-column: 1;
  grid-row: 2;
  font-size: 24rpx;
  color: #999;
}

.setting-switch {
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  align-items: center;
}

/* 隐私政策内容 */
.privacy-content {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.content-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.policy-section {
  margin-bottom: 40rpx;
}

.policy-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.section-content {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  white-space: pre-line;
}

/* 数据管理 */
.data-management {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 80rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.management-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.management-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.data-btn {
  padding: 24rpx 0;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
}

.data-btn[type="default"] {
  background-color: #f0f0f0;
  color: #333;
}

.data-btn[type="warn"] {
  background-color: #ff3b30;
  color: white;
}
</style>
