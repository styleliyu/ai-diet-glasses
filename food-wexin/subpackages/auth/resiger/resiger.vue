<template>
  <view class="register-page safe-area">
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">用户注册</text>
      <view class="header-space"></view>
    </view>

    <view class="register-hero animated-card delay-1">
      <view class="smile-bubble">
        <view class="smile-orbit orbit-one"></view>
        <text class="smile-sparkle sparkle-left">✦</text>
        <text class="smile-sparkle sparkle-right">✦</text>
        <text class="smile-face">😊</text>
      </view>
      <view class="hero-copy">
        <text class="hero-title">创建饮食账号</text>
        <text class="hero-desc">保存记录，后续可连接设备</text>
      </view>
    </view>

    <view class="register-card animated-card delay-2">
      <text class="card-title">创建账号</text>

      <view v-if="statusMessage" class="status-banner" :class="statusType">
        {{ statusMessage }}
      </view>

      <view class="form-item">
        <text class="form-label">用户名</text>
        <input
          v-model="form.username"
          class="form-input"
          placeholder="至少 3 位"
        />
        <text v-if="usernameError" class="field-hint error">{{ usernameError }}</text>
      </view>

      <view class="form-item">
        <text class="form-label">邮箱（选填）</text>
        <input
          v-model="form.email"
          class="form-input"
          placeholder="可稍后在设置中补绑"
        />
        <text v-if="emailError" class="field-hint error">{{ emailError }}</text>
        <text v-else class="field-hint">
          绑定邮箱后可用于找回用户名和密码。
        </text>
      </view>

      <view class="form-item">
        <text class="form-label">密码</text>
        <view class="input-wrap">
          <input
            v-model="form.password"
            class="form-input"
            :password="!showPassword"
            placeholder="至少 6 位"
          />
          <text class="input-toggle" @tap="showPassword = !showPassword">
            {{ showPassword ? "隐藏" : "显示" }}
          </text>
        </view>
        <text v-if="passwordError" class="field-hint error">{{ passwordError }}</text>
      </view>

      <view class="form-item">
        <text class="form-label">确认密码</text>
        <view class="input-wrap">
          <input
            v-model="form.confirmPassword"
            class="form-input"
            :password="!showConfirmPassword"
            placeholder="再次输入密码"
          />
          <text class="input-toggle" @tap="showConfirmPassword = !showConfirmPassword">
            {{ showConfirmPassword ? "隐藏" : "显示" }}
          </text>
        </view>
        <text v-if="confirmPasswordError" class="field-hint error">
          {{ confirmPasswordError }}
        </text>
      </view>

      <button
        class="primary-btn"
        :class="{ inactive: !canSubmit }"
        @tap="handleRegister"
      >
        提交注册
      </button>

      <view class="footer-row">
        <text class="footer-text">已经有账号？</text>
        <text class="option-link" @tap="goToLogin">返回登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { userApi } from "../../../api/index.js";
import { goToLoginEntry } from "../../../utils/auth.js";

const form = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const submitAttempted = ref(false);
const statusMessage = ref("");
const statusType = ref("info");

const normalizedUsername = computed(() => form.username.trim());
const normalizedEmail = computed(() => form.email.trim());
const normalizedPassword = computed(() => form.password.trim());
const normalizedConfirmPassword = computed(() => form.confirmPassword.trim());
const hasValidEmail = computed(
  () =>
    !normalizedEmail.value ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail.value),
);

const usernameError = computed(() => {
  if (!submitAttempted.value && !normalizedUsername.value) return "";
  if (!normalizedUsername.value) return "请输入用户名";
  if (normalizedUsername.value.length < 3) return "用户名至少 3 位";
  return "";
});

const emailError = computed(() => {
  if (!normalizedEmail.value) return "";
  if (!hasValidEmail.value) return "邮箱格式不正确";
  return "";
});

const passwordError = computed(() => {
  if (!submitAttempted.value && !normalizedPassword.value) return "";
  if (!normalizedPassword.value) return "请输入密码";
  if (normalizedPassword.value.length < 6) return "密码至少 6 位";
  return "";
});

const confirmPasswordError = computed(() => {
  if (!submitAttempted.value && !normalizedConfirmPassword.value) return "";
  if (!normalizedConfirmPassword.value) return "请再次输入密码";
  if (normalizedPassword.value !== normalizedConfirmPassword.value) {
    return "两次输入的密码不一致";
  }
  return "";
});

const canSubmit = computed(() => {
  return (
    normalizedUsername.value.length >= 3 &&
    normalizedPassword.value.length >= 6 &&
    normalizedConfirmPassword.value.length >= 6 &&
    normalizedPassword.value === normalizedConfirmPassword.value &&
    hasValidEmail.value
  );
});

function formatRegisterError(error) {
  const rawMessage = String(error?.message || "");
  if (rawMessage.includes("用户名") || rawMessage.includes("邮箱")) {
    return rawMessage || "注册失败，用户名或邮箱可能已存在";
  }
  if (rawMessage.includes("密码至少")) {
    return rawMessage;
  }
  if (rawMessage.includes("请输入")) {
    return rawMessage;
  }

  return (
    rawMessage || "后端没有成功创建账号，请检查用户名、密码或邮箱后重试。"
  );
}

async function handleRegister() {
  submitAttempted.value = true;
  statusMessage.value = "";
  if (!canSubmit.value) {
    statusType.value = "warning";
    statusMessage.value = "请先修正注册信息";
    uni.showToast({ title: "请先修正注册信息", icon: "none" });
    return;
  }

  uni.showLoading({ title: "提交中..." });

  try {
    const result = await userApi.register({
      username: normalizedUsername.value,
      email: normalizedEmail.value,
      password: form.password,
    });
    
    if (result.code === 200) {
      const payload = result?.data !== undefined ? result.data : result;
      statusType.value = "success";
      statusMessage.value = `账号 ${payload?.username || normalizedUsername.value} 已创建`;
      uni.showToast({ title: "注册成功", icon: "success" });
      goToOnboarding();
    } else {
      throw new Error(result.msg || "注册失败");
    }
  } catch (error) {
    statusType.value = "error";
    statusMessage.value = formatRegisterError(error);
    uni.showModal({
      title: "注册失败",
      content: statusMessage.value,
      showCancel: false,
      confirmText: "知道了",
    });
  } finally {
    uni.hideLoading();
  }
}

// 注册成功后直接进入首次问答，问答完成后会自动登录。
function goToOnboarding() {
  const query = [
    `username=${encodeURIComponent(normalizedUsername.value)}`,
    `email=${encodeURIComponent(normalizedEmail.value)}`,
    `password=${encodeURIComponent(form.password)}`,
  ].join("&");

  uni.navigateTo({
    url: `/subpackages/auth/onboarding/welcome?${query}`,
  });
}

function goToLogin() {
  goToLoginEntry({ replace: true });
}

function goBack() {
  goToLogin();
}
</script>

<style scoped>
.safe-area {
  min-height: 100vh;
  padding-top: calc(env(safe-area-inset-top) + 44rpx);
  padding-top: var(--app-header-top) !important;
}

.register-page {
  min-height: 100vh;
  padding: 36rpx 28rpx 48rpx;
  background:
    radial-gradient(
      circle at top left,
      rgba(77, 186, 121, 0.14),
      transparent 30%
    ),
    linear-gradient(180deg, #f8fbff 0%, #eef4f8 100%);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
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

.register-hero {
  margin-top: 32rpx;
  margin-bottom: 24rpx;
  padding: 28rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.76);
  display: flex;
  align-items: center;
  gap: 22rpx;
  box-shadow: 0 18rpx 42rpx rgba(106, 140, 175, 0.1);
}

.smile-bubble {
  position: relative;
  width: 92rpx;
  height: 92rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(232, 241, 246, 0.92) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  box-shadow: 0 12rpx 26rpx rgba(106, 140, 175, 0.14);
  animation: smileFloat 2.8s ease-in-out infinite;
  flex-shrink: 0;
}

.smile-bubble::after {
  content: "";
  position: absolute;
  left: 22rpx;
  right: 22rpx;
  bottom: -12rpx;
  height: 10rpx;
  border-radius: 50%;
  background: rgba(106, 140, 175, 0.14);
  animation: smileShadow 2.8s ease-in-out infinite;
}

.smile-face {
  position: relative;
  z-index: 3;
  display: block;
  animation: smileNod 1.75s ease-in-out infinite;
}

.smile-orbit {
  position: absolute;
  inset: -8rpx;
  border-radius: 32rpx;
  border: 2rpx dashed rgba(106, 140, 175, 0.24);
  animation: smileOrbit 5s linear infinite;
}

.smile-sparkle {
  position: absolute;
  z-index: 2;
  color: #6a8caf;
  font-size: 20rpx;
  line-height: 1;
  animation: sparklePop 1.7s ease-in-out infinite;
}

.sparkle-left {
  left: 4rpx;
  top: 12rpx;
}

.sparkle-right {
  right: 8rpx;
  bottom: 12rpx;
  color: #4dba79;
  animation-delay: 0.38s;
}

.hero-copy {
  min-width: 0;
}

.hero-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: #223547;
}

.hero-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6c8197;
}

.register-card {
  margin-top: 0;
  padding: 42rpx 34rpx 36rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22rpx 52rpx rgba(106, 140, 175, 0.12);
}

.card-title {
  display: block;
  margin-bottom: 34rpx;
  font-size: 46rpx;
  font-weight: 700;
  color: #223547;
}

.card-subtitle {
  display: block;
  margin-top: 12rpx;
  margin-bottom: 34rpx;
  font-size: 24rpx;
  color: #6c8197;
  line-height: 1.6;
}

.status-banner {
  margin-bottom: 24rpx;
  padding: 18rpx 22rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  line-height: 1.5;
}

.status-banner.info {
  background: #eef4f8;
  color: #567997;
}

.status-banner.success {
  background: #e8f7ee;
  color: #2f9f63;
}

.status-banner.warning {
  background: #fff5e8;
  color: #c17a23;
}

.status-banner.error {
  background: #fdeceb;
  color: #d85b5b;
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
  padding: 0 90rpx 0 24rpx;
  line-height: 104rpx;
  border-radius: 18rpx;
  background: #f5f8fb;
  font-size: 28rpx;
  color: #223547;
}

.input-wrap {
  position: relative;
}

.input-toggle {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24rpx;
  color: #567997;
}

.field-hint {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #6c8197;
  line-height: 1.5;
}

.field-hint.error {
  color: #d85b5b;
}

.primary-btn {
  margin-top: 10rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
  font-size: 30rpx;
  border: none;
}

.primary-btn.inactive {
  opacity: 0.55;
}

.footer-row {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin-top: 26rpx;
}

.footer-text {
  font-size: 24rpx;
  color: #6c8197;
}

.option-link {
  font-size: 24rpx;
  color: #567997;
}

/* 注册页 UI 优化：与登录页保持一致的品牌区、卡片入场和按钮反馈 */
.animated-card {
  animation: cardRise 0.42s ease both;
}

.delay-1 {
  animation-delay: 0.02s;
}

.delay-2 {
  animation-delay: 0.1s;
}

.primary-btn {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.primary-btn:active {
  transform: scale(0.985);
}

@keyframes cardRise {
  from {
    opacity: 0;
    transform: translateY(22rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes smileFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  32% {
    transform: translateY(-8rpx) rotate(4deg);
  }
  66% {
    transform: translateY(-2rpx) rotate(-3deg);
  }
}

@keyframes smileNod {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  42% {
    transform: scale(1.08) rotate(-6deg);
  }
  68% {
    transform: scale(0.98) rotate(4deg);
  }
}

@keyframes smileOrbit {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes sparklePop {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.72);
  }
  48% {
    opacity: 1;
    transform: scale(1.22);
  }
}

@keyframes smileShadow {
  0%,
  100% {
    opacity: 0.52;
    transform: scaleX(1);
  }
  45% {
    opacity: 0.22;
    transform: scaleX(0.72);
  }
}
</style>
