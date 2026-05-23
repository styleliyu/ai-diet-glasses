<template>
  <view class="notification-page safe-area">
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">通知设置</text>
      <view class="header-space"></view>
    </view>

    <view class="section-card">
      <text class="section-title">通知开关</text>
      <view class="switch-row">
        <text>接收通知</text>
        <switch :checked="settings.enabled" color="#2f9f63" @change="settings.enabled = $event.detail.value" />
      </view>
      <view class="switch-row" :class="{ disabled: !settings.enabled }">
        <text>系统通知</text>
        <switch :checked="settings.system" :disabled="!settings.enabled" color="#2f9f63" @change="settings.system = $event.detail.value" />
      </view>
      <view class="switch-row" :class="{ disabled: !settings.enabled }">
        <text>喝水提醒</text>
        <switch :checked="settings.waterReminder" :disabled="!settings.enabled" color="#2f9f63" @change="settings.waterReminder = $event.detail.value" />
      </view>
      <view class="switch-row" :class="{ disabled: !settings.enabled }">
        <text>目标提醒</text>
        <switch :checked="settings.goalReminder" :disabled="!settings.enabled" color="#2f9f63" @change="settings.goalReminder = $event.detail.value" />
      </view>
      <view class="switch-row" :class="{ disabled: !settings.enabled }">
        <text>周报通知</text>
        <switch :checked="settings.weeklyReport" :disabled="!settings.enabled" color="#2f9f63" @change="settings.weeklyReport = $event.detail.value" />
      </view>
    </view>

    <view class="section-card" v-if="settings.enabled">
      <view class="section-head">
        <text class="section-title">最近通知</text>
        <text class="section-link" @tap="markAllRead">全部已读</text>
      </view>
      <view class="notice-list">
        <view v-for="item in notificationsList" :key="item.id" class="notice-item" :class="{ unread: !item.read }">
          <view class="notice-dot"></view>
          <view class="notice-body">
            <view class="notice-head">
              <text class="notice-title">{{ item.title }}</text>
              <text class="notice-time">{{ item.time }}</text>
            </view>
            <text class="notice-message">{{ item.message }}</text>
          </view>
        </view>
      </view>
    </view>

    <button class="save-btn" @tap="saveSettings">保存设置</button>
  </view>
</template>

<script setup>
import { reactive, ref } from "vue";

const STORAGE_KEY = "localNotificationSettings";
const settings = reactive({
  enabled: true,
  system: true,
  waterReminder: true,
  goalReminder: true,
  weeklyReport: true,
  ...(uni.getStorageSync(STORAGE_KEY) || {}),
});

const notificationsList = ref([
  {
    id: 1,
    title: "系统通知",
    message: "设置页跳转和返回按钮已经更新完成。",
    time: "今天 09:00",
    read: false,
  },
  {
    id: 2,
    title: "喝水提醒",
    message: "测试阶段会以本地通知偏好为准。",
    time: "今天 10:20",
    read: true,
  },
  {
    id: 3,
    title: "周报提示",
    message: "真实推送接口接入后，这里会替换成后端消息中心。",
    time: "昨天 18:40",
    read: true,
  },
]);

function markAllRead() {
  notificationsList.value = notificationsList.value.map((item) => ({ ...item, read: true }));
}

function saveSettings() {
  uni.setStorageSync(STORAGE_KEY, { ...settings });
  uni.showModal({
    title: "保存成功",
    content: "通知设置已保存。",
    showCancel: false,
    confirmText: "返回",
    success: () => {
      goBack();
    },
  });
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }

  uni.switchTab({ url: "/pages/setting/profile" });
}
</script>

<style scoped>
.safe-area {
  min-height: 100vh;
  padding-top: calc(env(safe-area-inset-top) + 44rpx);
  padding-top: var(--app-header-top) !important;
  padding-bottom: calc(env(safe-area-inset-bottom) + 28rpx);
  padding-bottom: calc(var(--app-safe-bottom) + 28rpx);
}

.notification-page {
  min-height: 100vh;
  padding: 24rpx 28rpx 48rpx;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4f8 100%);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.back-btn,
.header-space {
  width: 76rpx;
  height: 76rpx;
}

.back-btn {
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 32rpx rgba(70, 104, 136, 0.12);
  color: #486988;
  font-size: 30rpx;
  font-weight: 600;
}

.page-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #223547;
}

.section-card {
  margin-bottom: 22rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16rpx 40rpx rgba(106, 140, 175, 0.08);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #223547;
}

.section-link {
  font-size: 24rpx;
  color: #567997;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #edf2f6;
  font-size: 28rpx;
  color: #223547;
}

.switch-row:last-child {
  border-bottom: none;
}

.switch-row.disabled {
  opacity: 0.45;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.notice-item {
  display: flex;
  gap: 16rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #edf2f6;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-dot {
  width: 16rpx;
  height: 16rpx;
  margin-top: 14rpx;
  border-radius: 50%;
  background: #d6e1ea;
}

.notice-item.unread .notice-dot {
  background: #2f9f63;
}

.notice-body {
  flex: 1;
}

.notice-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notice-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #223547;
}

.notice-time,
.notice-message {
  font-size: 24rpx;
  color: #7c90a4;
}

.notice-message {
  display: block;
  margin-top: 10rpx;
  line-height: 1.6;
}

.save-btn {
  margin-top: 16rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
  font-size: 30rpx;
  border: none;
}
</style>
