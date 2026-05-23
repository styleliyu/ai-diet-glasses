<template>
  <view class="feedback-container safe-area">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">意见反馈</text>
      <view style="width: 80rpx"></view>
    </view>

    <!-- 反馈说明 -->
    <view class="feedback-intro">
      <text class="intro-text">
        感谢您使用智能膳食监测系统！您的建议对我们非常重要，
        请留下您的宝贵意见，我们将不断改进产品体验。
      </text>
    </view>

    <!-- 反馈类型选择 -->
    <view class="feedback-type">
      <text class="type-title">反馈类型</text>
      <view class="type-list">
        <view
          v-for="type in feedbackTypes"
          :key="type.value"
          class="type-item"
          :class="{ active: selectedType === type.value }"
          @tap="selectedType = type.value"
        >
          <text class="type-icon">{{ type.icon }}</text>
          <text class="type-label">{{ type.label }}</text>
        </view>
      </view>
    </view>

    <!-- 反馈内容 -->
    <view class="feedback-content">
      <text class="content-title">反馈内容</text>
      <textarea
        class="content-input"
        v-model="feedbackContent"
        placeholder="请详细描述您遇到的问题或建议..."
        maxlength="500"
        :show-count="true"
        :adjust-position="false"
      />
    </view>

    <!-- 联系方式 -->
    <view class="contact-info">
      <text class="contact-title">联系方式（选填）</text>
      <input
        class="contact-input"
        v-model="contactInfo"
        placeholder="请输入邮箱或手机号"
        maxlength="50"
      />
    </view>

    <!-- 截图上传 -->
    <view class="screenshot-section">
      <text class="screenshot-title">上传截图（可选）</text>
      <view class="screenshot-list">
        <view
          v-for="(image, index) in screenshots"
          :key="index"
          class="screenshot-item"
        >
          <image
            :src="image"
            class="screenshot-image"
            mode="aspectFill"
          ></image>
          <view class="remove-btn" @tap="removeScreenshot(index)">×</view>
        </view>
        <view
          class="add-screenshot"
          @tap="addScreenshot"
          v-if="screenshots.length < 3"
        >
          <text class="add-icon">+</text>
          <text class="add-text">添加图片</text>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="submit-btn"
        @tap="submitFeedback"
        :disabled="!canSubmit"
        :class="{ 'disabled-btn': !canSubmit }"
      >
        提交反馈
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";

// 反馈类型
const feedbackTypes = [
  { icon: "🐛", label: "问题反馈", value: "bug" },
  { icon: "💡", label: "功能建议", value: "suggestion" },
  { icon: "⚡", label: "性能问题", value: "performance" },
  { icon: "🎨", label: "界面优化", value: "ui" },
  { icon: "🔄", label: "其他", value: "other" },
];

// 数据
const selectedType = ref("bug");
const feedbackContent = ref("");
const contactInfo = ref("");
const screenshots = ref([]);

// 计算是否可以提交
const canSubmit = computed(() => {
  return feedbackContent.value.trim().length >= 10;
});

// 添加截图
const addScreenshot = () => {
  uni.chooseImage({
    count: 3 - screenshots.value.length,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      screenshots.value.push(...res.tempFilePaths);
    },
  });
};

// 移除截图
const removeScreenshot = (index) => {
  screenshots.value.splice(index, 1);
};

// 提交反馈
const submitFeedback = () => {
  if (!canSubmit.value) return;

  const feedbackData = {
    type: selectedType.value,
    content: feedbackContent.value,
    contact: contactInfo.value,
    screenshots: screenshots.value,
  };

  uni.showLoading({
    title: "提交中...",
  });

  // 模拟提交
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({
      title: "反馈提交成功",
      icon: "success",
    });

    // 清空表单
    feedbackContent.value = "";
    contactInfo.value = "";
    screenshots.value = [];
    selectedType.value = "bug";
  }, 1500);
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

.feedback-container {
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

/* 反馈说明 */
.feedback-intro {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.intro-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

/* 反馈类型 */
.feedback-type {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.type-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.type-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  background-color: #f9f9f9;
  transition: all 0.2s;
}

.type-item.active {
  background-color: #007aff;
  border-color: #007aff;
}

.type-item.active .type-icon,
.type-item.active .type-label {
  color: white;
}

.type-icon {
  font-size: 40rpx;
  margin-bottom: 10rpx;
  color: #666;
}

.type-label {
  font-size: 24rpx;
  color: #666;
}

/* 反馈内容 */
.feedback-content {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.content-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.content-input {
  width: 100%;
  height: 200rpx;
  padding: 24rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
  box-sizing: border-box;
  line-height: 1.5;
}

/* 联系方式 */
.contact-info {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.contact-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.contact-input {
  width: 100%;
  padding: 24rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
  box-sizing: border-box;
}

/* 截图上传 */
.screenshot-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
}

.screenshot-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.screenshot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.screenshot-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.screenshot-image {
  width: 100%;
  height: 100%;
}

.remove-btn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
}

.add-screenshot {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #e5e5e5;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
}

.add-icon {
  font-size: 60rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.add-text {
  font-size: 24rpx;
  color: #666;
}

/* 提交按钮 */
.submit-section {
  padding: 40rpx 0 80rpx;
}

.submit-btn {
  width: 100%;
  padding: 30rpx 0;
  background-color: #07c160;
  color: white;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 16rpx;
  border: none;
}

.disabled-btn {
  background-color: #ccc;
  opacity: 0.7;
}
</style>
