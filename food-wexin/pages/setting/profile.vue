<template>
  <view class="profile-page safe-area">
    <view class="page-header">
      <view class="header-space"></view>
      <text class="page-title">设置中心</text>
      <view class="header-space"></view>
    </view>

    <scroll-view scroll-y class="page-scroll">
      <view class="hero-card animated-panel delay-1">
        <view class="hero-main">
          <view class="avatar">
            <image
              v-if="userInfo.avatar"
              :src="userInfo.avatar"
              class="avatar-image"
              mode="aspectFill"
            />
            <text v-else class="avatar-text">{{ avatarText }}</text>
          </view>
          <view class="hero-meta">
            <text class="hero-name">
              {{ userInfo.nickname || userInfo.username || "未登录用户" }}
            </text>
            <text class="hero-sub">
              {{ userInfo.email || "可在账户信息中补充邮箱" }}
            </text>
            <text class="hero-sub">{{ targetSummary }}</text>
          </view>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value">{{ userStats.recordDays }}</text>
            <text class="stat-label">记录天数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ userStats.totalRecords }}</text>
            <text class="stat-label">累计记录</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ userStats.achievementRate }}%</text>
            <text class="stat-label">达成率</text>
          </view>
        </view>
      </view>

      <view
        v-for="group in settingGroups"
        :key="group.title"
        class="section-card animated-panel delay-2"
      >
        <text class="section-title">{{ group.title }}</text>
        <view
          v-for="item in group.items"
          :key="item.url"
          class="menu-item"
          @tap="openPage(item.url)"
        >
          <view class="menu-icon">{{ item.icon }}</view>
          <view class="menu-body">
            <text class="menu-title">{{ item.title }}</text>
            <text class="menu-desc">{{ item.desc }}</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="section-card animated-panel delay-3">
        <text class="section-title">账号操作</text>
        <button
          class="action-btn action-btn-muted"
          @tap="openPage('/subpackages/settings/feedback/feedback')"
        >
          提交反馈
        </button>
        <button class="action-btn action-btn-danger" @tap="logout">
          退出登录
        </button>
      </view>
    </scroll-view>

    <view
      v-if="showChangeEmailModal"
      class="modal-overlay"
      @tap="closeChangeEmailModal"
    >
      <view class="bind-email-modal" @tap.stop>
        <view class="modal-head">
          <text class="modal-title">更换邮箱</text>
          <text class="modal-close" @tap="closeChangeEmailModal">×</text>
        </view>

        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">用户名</text>
            <input
              v-model="changeEmailForm.username"
              class="form-input"
              placeholder="请输入用户名"
            />
          </view>

          <view class="form-item">
            <text class="form-label">当前密码</text>
            <input
              v-model="changeEmailForm.password"
              class="form-input"
              password
              placeholder="请输入密码"
            />
          </view>

          <view class="form-item">
            <text class="form-label">新邮箱</text>
            <input
              v-model="changeEmailForm.email"
              class="form-input"
              placeholder="请输入新邮箱"
            />
          </view>

          <view class="form-item">
            <text class="form-label">验证码</text>
            <view class="input-with-button">
              <input
                v-model="changeEmailForm.code"
                class="form-input code-input"
                placeholder="请输入验证码"
              />
              <button
                class="code-btn"
                :disabled="disableChangeEmailCodeButton"
                @tap="sendChangeEmailCode"
              >
                {{ changeEmailCountdown > 0 ? `${changeEmailCountdown}s` : "获取验证码" }}
              </button>
            </view>
          </view>

          <button
            class="primary-btn"
            :disabled="disableChangeEmailSubmitButton"
            @tap="executeChangeEmail"
          >
            确认更换
          </button>
        </view>
      </view>
    </view>

    <!-- AI助手入口：设置页用于辅助说明账户、目标和通知等配置。 -->
    <ai-assistant />
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onShow, onUnload } from "@dcloudio/uni-app";
import { userApi } from "@/api/index.js";
import { userStore } from "@/store/index.js";
import { requireAuthenticatedPage } from "@/utils/auth.js";
import {
  getStoredPreferences,
  resolveDailyCaloriesTarget,
} from "@/utils/user-settings.js";

const userInfo = reactive({
  username: "",
  nickname: "",
  email: "",
  avatar: "",
  weight: "",
});

const userStats = reactive({
  recordDays: 0,
  totalRecords: 0,
  achievementRate: 0,
});

const showChangeEmailModal = ref(false);
const changeEmailForm = ref({
  username: "",
  password: "",
  email: "",
  code: "",
});
const changeEmailCountdown = ref(0);
let changeEmailCountdownTimer = null;

// 设置中心入口：集中管理饮食目标、账号、通知和设备管理导航。
const settingGroups = [
  {
    title: "饮食与目标",
    items: [
      {
        icon: "🎯",
        title: "每日目标",
        desc: "热量、目标体重和活动水平",
        url: "/subpackages/settings/target/target",
      },
      {
        icon: "🥗",
        title: "营养目标",
        desc: "蛋白质、碳水和脂肪配比",
        url: "/subpackages/settings/nutrition/nutrition",
      },
      {
        icon: "🍽",
        title: "饮食偏好",
        desc: "饮食类型、喜欢和忌口",
        url: "/subpackages/settings/preferences/preferences",
      },
      {
        icon: "⚠️",
        title: "过敏与禁忌",
        desc: "避免误识别和错误推荐",
        url: "/subpackages/settings/allergies/allergies",
      },
    ],
  },
  {
    title: "账号与提醒",
    items: [
      {
        icon: "👤",
        title: "账户信息",
        desc: "昵称、邮箱、手机和基础资料",
        url: "/subpackages/settings/account/account",
      },
      {
        icon: "🧩",
        title: "设备管理",
        desc: "查看设备状态并为设备切换账号",
        url: "/pages/setting/devices",
      },
      {
        icon: "🔒",
        title: "安全设置",
        desc: "密码保护、缓存清理和导出说明",
        url: "/subpackages/settings/security/security",
      },
      {
        icon: "🔔",
        title: "通知设置",
        desc: "记录提醒、周报和静默时段",
        url: "/subpackages/settings/notification/notification",
      },
      {
        icon: "✉️",
        title: "更换邮箱",
        desc: "修改已绑定的邮箱地址",
        url: "change-email",
      },
    ],
  },
  {
    title: "帮助与说明",
    items: [
      {
        icon: "ℹ️",
        title: "关于应用",
        desc: "版本信息和当前联调状态",
        url: "/subpackages/settings/about/about",
      },
      {
        icon: "❓",
        title: "帮助中心",
        desc: "常见问题与使用说明",
        url: "/subpackages/settings/help/help",
      },
      {
        icon: "🛡️",
        title: "隐私说明",
        desc: "本地存储和数据使用方式",
        url: "/subpackages/settings/privacy/privacy",
      },
    ],
  },
];

const avatarText = computed(() =>
  (userInfo.nickname || userInfo.username || "DI").slice(0, 2).toUpperCase(),
);

const targetSummary = computed(() => {
  const dailyCalories = resolveDailyCaloriesTarget({
    userTarget: uni.getStorageSync("userTarget") || {},
    userInfo,
    preferences: getStoredPreferences(),
  });
  return `当前目标 ${dailyCalories} kcal / 天`;
});

const disableChangeEmailCodeButton = computed(() => {
  const form = changeEmailForm.value;
  return (
    changeEmailCountdown.value > 0 ||
    !form.username.trim() ||
    !form.password.trim() ||
    !form.email.includes("@")
  );
});

const disableChangeEmailSubmitButton = computed(() => {
  const form = changeEmailForm.value;
  return (
    !form.username.trim() ||
    !form.password.trim() ||
    !form.email.includes("@") ||
    !form.code.trim()
  );
});

function openPage(url) {
  if (url === "change-email") {
    showChangeEmailModal.value = true;
    changeEmailForm.value.username = userInfo.username || "";
    return;
  }

  if (url === "/pages/setting/devices") {
    uni.switchTab({ url });
    return;
  }

  uni.navigateTo({ url });
}

// 页面联动与事件同步：优先读本地快照，再尝试用接口补全会话里的用户信息。
async function loadProfile() {
  const localUser = uni.getStorageSync("userInfo") || userStore.state.userInfo || {};
  Object.assign(userInfo, {
    username: localUser.username || "",
    nickname: localUser.nickname || "",
    email: localUser.email || "",
    avatar: localUser.avatar || "",
    weight: localUser.weight || "",
  });

  try {
    const result = await userApi.getUserInfo();
    const payload = result?.data !== undefined ? result.data : result;
    if (payload) {
      Object.assign(userInfo, payload);
      uni.setStorageSync("userInfo", { ...userInfo });
      userStore.setUserInfo({ ...userInfo });
    }
  } catch (error) {
    console.log("读取设置中心用户信息失败，继续使用本地快照", error);
  }

  try {
    const result = await userApi.getUserStats();
    const payload = result?.data !== undefined ? result.data : result;
    Object.assign(userStats, {
      recordDays: Number(payload?.recordDays || 0),
      totalRecords: Number(payload?.totalRecords || 0),
      achievementRate: Number(payload?.achievementRate || 0),
    });
  } catch (error) {
    console.log("读取设置中心统计失败，继续显示本地默认值", error);
  }
}

async function logout() {
  try {
    await userApi.logout();
  } catch (error) {
    console.log("退出登录时后端未响应，继续清理本地状态", error);
  }

  userStore.clearUser();
  uni.removeStorageSync("userInfo");
  uni.removeStorageSync("token");
  uni.removeStorageSync("isLoggedIn");
  uni.reLaunch({
    url: "/pages/login/login",
  });
}

function closeChangeEmailModal() {
  showChangeEmailModal.value = false;
  changeEmailForm.value = {
    username: "",
    password: "",
    email: "",
    code: "",
  };

  if (changeEmailCountdownTimer) {
    clearInterval(changeEmailCountdownTimer);
    changeEmailCountdownTimer = null;
    changeEmailCountdown.value = 0;
  }
}

function startChangeEmailCountdown() {
  changeEmailCountdown.value = 60;
  if (changeEmailCountdownTimer) {
    clearInterval(changeEmailCountdownTimer);
  }

  changeEmailCountdownTimer = setInterval(() => {
    if (changeEmailCountdown.value > 0) {
      changeEmailCountdown.value -= 1;
      return;
    }

    clearInterval(changeEmailCountdownTimer);
    changeEmailCountdownTimer = null;
  }, 1000);
}

async function sendChangeEmailCode() {
  const form = changeEmailForm.value;
  if (disableChangeEmailCodeButton.value) {
    uni.showToast({ title: "请先填写完整信息", icon: "none" });
    return;
  }

  uni.showLoading({ title: "发送中..." });
  try {
    const result = await userApi.bindSendCode({
      username: form.username,
      password: form.password,
      email: form.email,
    });

    if (result.code !== 200) {
      throw new Error(result.msg || "发送失败");
    }

    uni.showToast({ title: "验证码已发送", icon: "success" });
    startChangeEmailCountdown();
  } catch (error) {
    uni.showToast({ title: error.message || "发送失败", icon: "none" });
  } finally {
    uni.hideLoading();
  }
}

async function executeChangeEmail() {
  const form = changeEmailForm.value;
  if (disableChangeEmailSubmitButton.value) {
    uni.showToast({ title: "请先填写完整信息", icon: "none" });
    return;
  }

  uni.showLoading({ title: "更换中..." });
  try {
    const result = await userApi.executeBindEmail({
      username: form.username,
      password: form.password,
      email: form.email,
      code: form.code,
    });

    if (result.code !== 200) {
      throw new Error(result.msg || "更换失败");
    }

    const updatedUserInfo = {
      ...userInfo,
      email: form.email,
      ...(result.data || {}),
    };

    Object.assign(userInfo, updatedUserInfo);
    uni.setStorageSync("userInfo", updatedUserInfo);
    userStore.setUserInfo(updatedUserInfo);
    uni.$emit("userInfoUpdated", updatedUserInfo);
    uni.showToast({ title: "邮箱更换成功", icon: "success" });
    closeChangeEmailModal();
  } catch (error) {
    uni.showToast({ title: error.message || "更换失败", icon: "none" });
  } finally {
    uni.hideLoading();
  }
}

function handleUserInfoUpdated(data) {
  if (!data) return;
  Object.assign(userInfo, {
    ...userInfo,
    ...data,
  });
  uni.setStorageSync("userInfo", { ...userInfo });
  userStore.setUserInfo({ ...userInfo });
}

onShow(() => {
  if (
    !requireAuthenticatedPage({
      message: "请先登录后再使用设置中心",
      silent: true,
    })
  ) {
    return;
  }

  loadProfile();
  uni.$off("userInfoUpdated", handleUserInfoUpdated);
  uni.$on("userInfoUpdated", handleUserInfoUpdated);
});

onUnload(() => {
  uni.$off("userInfoUpdated", handleUserInfoUpdated);
  if (changeEmailCountdownTimer) {
    clearInterval(changeEmailCountdownTimer);
    changeEmailCountdownTimer = null;
  }
});
</script>

<style scoped>
.safe-area {
  min-height: 100vh;
  padding-top: calc(env(safe-area-inset-top) + 44rpx);
  padding-top: var(--app-header-top) !important;
  padding-bottom: calc(env(safe-area-inset-bottom) + 28rpx);
  padding-bottom: calc(var(--app-safe-bottom) + 28rpx);
}

.profile-page {
  min-height: 100vh;
  padding: 0 24rpx 36rpx;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top right, rgba(77, 186, 121, 0.14), transparent 26%),
    linear-gradient(180deg, #f6fbf8 0%, #edf5f0 100%);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.header-space {
  width: 76rpx;
  height: 76rpx;
}

.page-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #22352a;
}

.page-scroll {
  height: calc(100vh - 140rpx);
}

.hero-card,
.section-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 28rpx;
  box-shadow: 0 16rpx 36rpx rgba(88, 118, 99, 0.08);
}

.hero-card {
  padding: 32rpx;
  margin-bottom: 22rpx;
  background: linear-gradient(135deg, #85d2a4 0%, #3d9d6d 100%);
  color: #ffffff;
}

.hero-main {
  display: flex;
  align-items: center;
}

.avatar {
  position: relative;
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: 4rpx solid rgba(255, 255, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar::after {
  content: "";
  position: absolute;
  inset: -8rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.38);
  animation: avatarPulse 2.6s ease-in-out infinite;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-text {
  font-size: 42rpx;
  font-weight: 700;
}

.hero-meta {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
}

.hero-name {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
}

.hero-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  opacity: 0.92;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin-top: 26rpx;
}

.stat-item {
  padding: 20rpx 12rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.16);
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
}

.stat-label {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
}

.section-card {
  padding: 24rpx;
  margin-bottom: 22rpx;
}

.section-title {
  display: block;
  margin-bottom: 14rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #2a4335;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #edf2ee;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  background: #f0f7f3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  flex-shrink: 0;
  transition: transform 0.18s ease;
}

.menu-item:active .menu-icon {
  transform: rotate(-6deg) scale(1.08);
}

.menu-body {
  flex: 1;
  min-width: 0;
}

.menu-title {
  display: block;
  font-size: 29rpx;
  font-weight: 700;
  color: #23382b;
}

.menu-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: #698071;
}

.menu-arrow {
  font-size: 34rpx;
  color: #93a398;
}

.action-btn {
  height: 88rpx;
  line-height: 88rpx;
  margin-top: 14rpx;
  border: none;
  border-radius: 22rpx;
  font-size: 29rpx;
  font-weight: 600;
}

.action-btn-muted {
  background: #eef4f0;
  color: #456655;
}

.action-btn-danger {
  background: #fcedec;
  color: #db6b5f;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(12, 27, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  z-index: 999;
}

.bind-email-modal {
  width: 100%;
  max-width: 680rpx;
  background: #fff;
  border-radius: 30rpx;
  padding: 28rpx;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.modal-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #223547;
}

.modal-close {
  font-size: 40rpx;
  color: #7990a6;
}

.modal-body {
  margin-top: 16rpx;
}

.form-item {
  margin-bottom: 26rpx;
}

.form-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #5d7389;
}

.form-input {
  width: 100%;
  display: block;
  min-height: 104rpx;
  box-sizing: border-box;
  padding: 0 24rpx;
  line-height: 104rpx;
  border-radius: 18rpx;
  background: #f5f8fb;
  font-size: 28rpx;
  color: #223547;
}

.input-with-button {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.code-input {
  flex: 1;
  padding-right: 24rpx;
}

.code-btn {
  width: 200rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 16rpx;
  background: #eef4f8;
  color: #486988;
  font-size: 24rpx;
  border: none;
}

.code-btn[disabled],
.primary-btn[disabled] {
  opacity: 0.55;
}

.primary-btn {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
  font-size: 30rpx;
  border: none;
}

.animated-panel {
  animation: panelRise 0.38s ease both;
}

.delay-1 {
  animation-delay: 0.02s;
}

.delay-2 {
  animation-delay: 0.08s;
}

.delay-3 {
  animation-delay: 0.14s;
}

.hero-card,
.section-card,
.menu-item,
.action-btn,
.primary-btn {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.menu-item:active,
.action-btn:active,
.primary-btn:active {
  transform: scale(0.985);
}

@keyframes panelRise {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes avatarPulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.94);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.08);
  }
}
</style>
