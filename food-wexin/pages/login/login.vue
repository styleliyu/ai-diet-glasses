<template>
  <view class="login-page safe-area">
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">用户登录</text>
      <view class="header-space"></view>
    </view>

    <view class="login-hero animated-card delay-1">
      <view class="smile-bubble">
        <view class="smile-orbit orbit-one"></view>
        <text class="smile-sparkle sparkle-left">✦</text>
        <text class="smile-sparkle sparkle-right">✦</text>
        <text class="smile-face">😊</text>
      </view>
      <view class="hero-copy">
        <text class="hero-title">饮食助手</text>
        <text class="hero-desc">记录饮食，连接设备</text>
      </view>
    </view>

    <view class="login-card animated-card delay-2">
      <text class="card-title">欢迎回来</text>

      <view v-if="statusMessage" class="status-banner" :class="statusType">
        {{ statusMessage }}
      </view>

      <view class="form-item">
        <text class="form-label">用户名</text>
        <input v-model="username" class="form-input" placeholder="请输入用户名" />
      </view>

      <view class="form-item">
        <text class="form-label">密码</text>
        <view class="input-wrap">
          <input
            v-model="password"
            class="form-input"
            :password="!showPassword"
            placeholder="请输入密码"
          />
          <text class="input-toggle" @tap="showPassword = !showPassword">
            {{ showPassword ? "隐藏" : "显示" }}
          </text>
        </view>
      </view>

      <view class="option-row">
        <view class="remember-box" @tap="rememberMe = !rememberMe">
          <view class="checkbox" :class="{ active: rememberMe }">
            {{ rememberMe ? "√" : "" }}
          </view>
          <text class="option-text">记住我</text>
        </view>
        <view class="option-links">
          <text class="option-link" @tap="showForgotTips">忘记密码</text>
          <text class="option-separator">|</text>
          <text class="option-link" @tap="showBindEmailModal">绑定邮箱</text>
        </view>
      </view>

      <button class="primary-btn" :disabled="!canLogin" @tap="handleLogin">
        登录
      </button>

      <view class="footer-row">
        <text class="footer-text">还没有账号？</text>
        <text class="option-link" @tap="goToRegister">立即注册</text>
      </view>
    </view>

    <!-- 绑定邮箱弹窗 -->
    <view v-if="isBindEmailModalVisible" class="modal-overlay" @tap="closeBindEmailModal">
      <view class="bind-email-modal" @tap.stop>
        <view class="modal-head">
          <text class="modal-title">绑定邮箱</text>
          <text class="modal-close" @tap="closeBindEmailModal">×</text>
        </view>

        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">用户名</text>
            <input v-model="bindForm.username" class="form-input" placeholder="请输入用户名" />
          </view>

          <view class="form-item">
            <text class="form-label">当前密码</text>
            <input v-model="bindForm.password" class="form-input" password placeholder="请输入密码" />
          </view>

          <view class="form-item">
            <text class="form-label">新邮箱</text>
            <input v-model="bindForm.email" class="form-input" placeholder="请输入邮箱" />
          </view>

          <view class="form-item">
            <text class="form-label">验证码</text>
            <view class="input-with-button">
              <input v-model="bindForm.code" class="form-input code-input" placeholder="请输入验证码" />
              <button 
                class="code-btn" 
                :disabled="countdown > 0 || !canSendCode"
                @tap="sendBindCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </button>
            </view>
          </view>

          <button 
            class="primary-btn" 
            :disabled="!canBindEmail" 
            @tap="executeBindEmail"
          >
            确认绑定
          </button>
        </view>
      </view>
    </view>

    <!-- 重置密码弹窗 -->
    <view v-if="isResetPasswordModalVisible" class="modal-overlay" @tap="closeResetPasswordModal">
      <view class="bind-email-modal" @tap.stop>
        <view class="modal-head">
          <text class="modal-title">重置密码</text>
          <text class="modal-close" @tap="closeResetPasswordModal">×</text>
        </view>

        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">用户名</text>
            <input v-model="resetForm.username" class="form-input" disabled />
          </view>

          <view class="form-item">
            <text class="form-label">邮箱</text>
            <input v-model="resetForm.email" class="form-input" disabled />
          </view>

          <view class="form-item">
            <text class="form-label">新密码</text>
            <input v-model="resetForm.newPassword" class="form-input" password placeholder="请输入新密码" />
          </view>

          <view class="form-item">
            <text class="form-label">验证码</text>
            <view class="input-with-button">
              <input v-model="resetForm.code" class="form-input code-input" placeholder="请输入验证码" />
              <button
                class="code-btn"
                :disabled="resetCountdown > 0 || !resetForm.email"
                @tap="sendResetCode"
              >
                {{ resetCountdown > 0 ? `${resetCountdown}s` : '获取验证码' }}
              </button>
            </view>
          </view>

          <button
            class="primary-btn"
            :disabled="!canResetPassword"
            @tap="executeResetPassword"
          >
            确认重置
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow, onUnload } from "@dcloudio/uni-app";
import { userApi } from "@/api/index.js";
import {
  clearActiveUserProfile,
  consumePendingLoginDraft,
  getRememberedLogin,
  hasStoredDeviceRegistry,
  markPendingHomeDevicePrompt,
  saveRememberedLogin,
  switchActiveUserProfile,
} from "@/utils/user-settings.js";

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);
const statusMessage = ref("");
const statusType = ref("info");

// 绑定邮箱相关
const isBindEmailModalVisible = ref(false);
const bindForm = ref({
  username: "",
  password: "",
  email: "",
  code: ""
});
const countdown = ref(0);
let countdownTimer = null;

// 重置密码相关
const isResetPasswordModalVisible = ref(false);
const resetForm = ref({
  username: "",
  email: "",
  code: "",
  newPassword: ""
});
const resetCountdown = ref(0);
let resetCountdownTimer = null;

const canLogin = computed(() => {
  return username.value.trim().length >= 3 && password.value.trim().length >= 6;
});

// 绑定邮箱相关计算属性
const canSendCode = computed(() => {
  const form = bindForm.value;
  return form.username.trim().length >= 3 && 
         form.password.trim().length >= 6 && 
         form.email.trim().includes('@');
});

const canBindEmail = computed(() => {
  const form = bindForm.value;
  return form.username.trim().length >= 3 &&
         form.password.trim().length >= 6 &&
         form.email.trim().includes('@') &&
         form.code.trim().length === 6;
});

// 重置密码相关计算属性
const canResetPassword = computed(() => {
  const form = resetForm.value;
  return form.username.trim().length >= 3 &&
         form.newPassword.trim().length >= 6 &&
         form.code.trim().length === 6;
});

// 统一保存会话和当前账号的本地快照，避免切号时串数据。
function saveSession(data = {}) {
  const normalizedUsername = username.value.trim();
  const sessionToken = uni.getStorageSync("sessionCookie") || "";
  // 登录接口只保证返回基础账号信息，缺失字段用本地默认值补齐。
  const fallbackUser = {
    username: normalizedUsername,
    ...data,
    nickname: data.nickname || normalizedUsername || "未命名用户",
    userId: data.userId || `user-${Date.now()}`,
    token: data.token || sessionToken,
  };

  const scopedProfile = switchActiveUserProfile(normalizedUsername, {
    userInfo: fallbackUser,
  });
  const nextUser = scopedProfile?.userInfo || fallbackUser;

  // token 实际保存的是 JSESSIONID，保留 token key 是为了兼容旧鉴权工具。
  uni.setStorageSync("token", nextUser.token);
  uni.setStorageSync("userInfo", nextUser);
  uni.setStorageSync("isLoggedIn", true);
  saveRememberedLogin({
    enabled: rememberMe.value,
    username: normalizedUsername,
    password: password.value,
  });
}

function enterApp() {
  uni.switchTab({
    url: "/pages/home/home",
    fail: () => {
      uni.reLaunch({ url: "/pages/home/home" });
    },
  });
}

function formatLoginError(error) {
  const rawMessage = String(error?.message || "");

  if (
    rawMessage.includes("账号不存在") ||
    rawMessage.includes("密码错误") ||
    rawMessage.includes("HTTP 4")
  ) {
    return "登录失败，账号不存在或密码错误";
  }
  if (rawMessage.includes("请输入有效账号和密码")) {
    return "请输入有效账号和密码";
  }
  if (rawMessage.includes("登录已失效")) {
    return "登录已失效，请重新登录";
  }

  return rawMessage || "登录失败，账号不存在或密码错误";
}

async function handleLogin() {
  statusMessage.value = "";
  if (!canLogin.value) {
    statusType.value = "warning";
    statusMessage.value = "请输入有效账号和密码";
    uni.showToast({ title: "请输入有效账号和密码", icon: "none" });
    return;
  }

  uni.showLoading({ title: "登录中..." });

  try {
    // 登录前保存旧账号快照并清空活动资料，避免切换账号后串用设置数据。
    clearActiveUserProfile({ preserveSnapshot: true });
    uni.removeStorageSync("isLoggedIn");
    const result = await userApi.login({
      username: username.value,
      password: password.value,
    });
    
    if (result.code === 200) {
      const payload = result?.data !== undefined ? result.data : result;
      saveSession(typeof payload === "string" ? { token: payload } : payload || {});
      // 登录后设备引导：只写一次性标记，进入首页后再弹出添加设备提示。
      if (!hasStoredDeviceRegistry()) {
        markPendingHomeDevicePrompt();
      }
    } else {
      throw new Error(result.msg || "登录失败");
    }
  } catch (error) {
    uni.removeStorageSync("isLoggedIn");
    statusType.value = "error";
    statusMessage.value = formatLoginError(error);
    uni.showToast({
      title: statusMessage.value,
      icon: "none",
    });
    return;
  } finally {
    uni.hideLoading();
  }

  setTimeout(() => {
    enterApp();
  }, 250);
}

async function showForgotTips() {
  const inputUsername = username.value.trim();
  if (!inputUsername) {
    uni.showToast({ title: "请先输入用户名", icon: "none" });
    return;
  }

  uni.showLoading({ title: "发送中..." });

  try {
    const result = await userApi.sendResetCode({
      username: inputUsername,
      email: ""
    });

    if (result.code === 200) {
      const userEmail = result.data?.email || "";
      showResetPasswordModal(inputUsername, userEmail);
    } else {
      if (result.msg && result.msg.includes("未绑定邮箱")) {
        uni.showModal({
          title: "提示",
          content: "您的账号未绑定邮箱，请先点击下方「绑定邮箱」进行绑定。",
          showCancel: true,
          confirmText: "去绑定",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) {
              showBindEmailModal();
            }
          },
        });
      } else {
        uni.showToast({ title: result.msg || "发送失败", icon: "none" });
      }
    }
  } catch (error) {
    console.error("发送重置验证码失败:", error);
    if (error.status === 404 || error.errMsg?.includes("request:fail")) {
      uni.showToast({ title: "暂时无法发送", icon: "none" });
    } else {
      uni.showToast({ title: "发送失败，请重试", icon: "none" });
    }
  } finally {
    uni.hideLoading();
  }
}

function goToRegister() {
  uni.redirectTo({
    url: "/subpackages/auth/resiger/resiger",
    fail: () => {
      uni.reLaunch({ url: "/subpackages/auth/resiger/resiger" });
    },
  });
}

function goBack() {
  goToRegister();
}

// 绑定邮箱相关方法
function showBindEmailModal() {
  isBindEmailModalVisible.value = true;
  // 自动填充当前登录表单的用户名和密码，减少绑定邮箱时重复输入。
  bindForm.value.username = username.value;
  bindForm.value.password = password.value;
}

function closeBindEmailModal() {
  isBindEmailModalVisible.value = false;
  clearBindEmailCountdown();
}

function clearBindEmailCountdown() {
  // 邮箱验证码倒计时：页面离开或弹窗关闭时必须释放定时器，避免后台继续更新状态。
  if (!countdownTimer) return;
  clearInterval(countdownTimer);
  countdownTimer = null;
  countdown.value = 0;
}

function startCountdown() {
  countdown.value = 60;
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  // 验证码倒计时只控制前端按钮节流，真实有效期以后端 Session 为准。
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
}

async function sendBindCode() {
  if (!canSendCode.value) return;

  uni.showLoading({ title: "发送中..." });

  try {
    // 绑定邮箱需要先校验账号密码，避免未登录或误填账号绑定到错误邮箱。
    const result = await userApi.bindSendCode({
      username: bindForm.value.username,
      password: bindForm.value.password,
      email: bindForm.value.email
    });

    if (result.code === 200) {
      uni.showToast({ title: "验证码已发送", icon: "success" });
      startCountdown();
    } else {
      throw new Error(result.msg || "发送失败");
    }
  } catch (error) {
    uni.showToast({ title: error.message || "发送失败", icon: "none" });
  } finally {
    uni.hideLoading();
  }
}

async function executeBindEmail() {
  if (!canBindEmail.value) return;

  uni.showLoading({ title: "绑定中..." });

  try {
    const result = await userApi.executeBindEmail({
      username: bindForm.value.username,
      password: bindForm.value.password,
      email: bindForm.value.email,
      code: bindForm.value.code
    });

    if (result.code === 200) {
      uni.showToast({ title: "邮箱绑定成功", icon: "success" });

      const userData = result.data || {};
      // 立即更新本地快照，让个人中心无需重新登录就能看到新邮箱。
      const updatedUserInfo = {
        ...uni.getStorageSync('userInfo') || {},
        email: bindForm.value.email,
        ...userData
      };
      uni.setStorageSync('userInfo', updatedUserInfo);
      uni.$emit('userInfoUpdated', updatedUserInfo);

      closeBindEmailModal();
    } else {
      throw new Error(result.msg || "绑定失败");
    }
  } catch (error) {
    uni.showToast({ title: error.message || "绑定失败", icon: "none" });
  } finally {
    uni.hideLoading();
  }
}

// 重置密码相关方法
function showResetPasswordModal(username, email) {
  isResetPasswordModalVisible.value = true;
  // 找回密码流程由后端验证码绑定邮箱，本地只保存本次弹窗上下文。
  resetForm.value.username = username;
  resetForm.value.email = email;
  resetForm.value.code = "";
  resetForm.value.newPassword = "";
}

function closeResetPasswordModal() {
  isResetPasswordModalVisible.value = false;
  clearResetPasswordCountdown();
}

function clearResetPasswordCountdown() {
  // 重置密码倒计时：和绑定邮箱分开清理，防止两个弹窗互相影响。
  if (!resetCountdownTimer) return;
  clearInterval(resetCountdownTimer);
  resetCountdownTimer = null;
  resetCountdown.value = 0;
}

function startResetCountdown() {
  resetCountdown.value = 60;
  if (resetCountdownTimer) {
    clearInterval(resetCountdownTimer);
  }
  resetCountdownTimer = setInterval(() => {
    if (resetCountdown.value > 0) {
      resetCountdown.value--;
    } else {
      clearInterval(resetCountdownTimer);
      resetCountdownTimer = null;
    }
  }, 1000);
}

async function sendResetCode() {
  if (resetCountdown.value > 0 || !resetForm.value.email) return;

  uni.showLoading({ title: "发送中..." });

  try {
    const result = await userApi.sendResetCode({
      username: resetForm.value.username,
      email: resetForm.value.email
    });

    if (result.code === 200) {
      uni.showToast({ title: "验证码已发送", icon: "success" });
      startResetCountdown();
    } else {
      throw new Error(result.msg || "发送失败");
    }
  } catch (error) {
    console.error("发送重置验证码失败:", error);
    if (error.status === 404 || error.errMsg?.includes("request:fail")) {
      uni.showToast({ title: "暂时无法发送", icon: "none" });
    } else {
      uni.showToast({ title: error.message || "发送失败", icon: "none" });
    }
  } finally {
    uni.hideLoading();
  }
}

async function executeResetPassword() {
  if (!canResetPassword.value) return;

  uni.showLoading({ title: "重置中..." });

  try {
    const result = await userApi.resetPassword({
      email: resetForm.value.email,
      code: resetForm.value.code,
      newPassword: resetForm.value.newPassword
    });

    if (result.code === 200) {
      uni.showToast({ title: "密码重置成功，请使用新密码登录", icon: "success" });
      closeResetPasswordModal();
    } else {
      throw new Error(result.msg || "重置失败");
    }
  } catch (error) {
    console.error("密码重置失败:", error);
    if (error.status === 404 || error.errMsg?.includes("request:fail")) {
      uni.showToast({ title: "暂时无法发送", icon: "none" });
    } else {
      uni.showToast({ title: error.message || "重置失败", icon: "none" });
    }
  } finally {
    uni.hideLoading();
  }
}

// 注册成功或开启记住我后，自动回填账号，减少重复输入。
function restoreLoginForm() {
  const pendingDraft = consumePendingLoginDraft();
  if (pendingDraft) {
    // 注册/首次问答完成后会写入一次性草稿，帮助用户回登录页直接提交。
    username.value = pendingDraft.username || "";
    password.value = pendingDraft.password || "";
    rememberMe.value = Boolean(pendingDraft.rememberMe);
    uni.showToast({ title: "资料已保存，请直接登录", icon: "none" });
    return;
  }

  if (username.value || password.value) {
    return;
  }

  const remembered = getRememberedLogin();
  if (!remembered) {
    return;
  }

  // 记住我只回填表单，不自动登录，避免本地明文凭据直接进入应用。
  username.value = remembered.username || "";
  password.value = remembered.password || "";
  rememberMe.value = true;
}

onShow(() => {
  restoreLoginForm();
});

onUnload(() => {
  clearBindEmailCountdown();
  clearResetPasswordCountdown();
});
</script>

<style scoped>
.safe-area {
  min-height: 100vh;
  padding-top: calc(env(safe-area-inset-top) + 44rpx);
  padding-top: var(--app-header-top) !important;
}

.login-page {
  min-height: 100vh;
  padding: 36rpx 28rpx 48rpx;
  background:
    radial-gradient(
      circle at top right,
      rgba(106, 140, 175, 0.22),
      transparent 34%
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

.login-hero {
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

.login-card {
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

.option-row,
.footer-row,
.remember-box {
  display: flex;
  align-items: center;
}

.option-row,
.footer-row {
  justify-content: space-between;
}

.option-row {
  margin: 10rpx 0 28rpx;
}

.remember-box {
  gap: 12rpx;
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  background: #eef4f8;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
}

.checkbox.active {
  background: #2f9f63;
}

.option-text,
.footer-text {
  font-size: 24rpx;
  color: #6c8197;
}

.option-link {
  font-size: 24rpx;
  color: #567997;
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

.primary-btn[disabled] {
  opacity: 0.55;
}

.footer-row {
  margin-top: 26rpx;
  justify-content: center;
  gap: 8rpx;
}

/* 绑定邮箱弹窗样式 */
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

.code-btn[disabled] {
  opacity: 0.55;
}

.option-links {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.option-separator {
  font-size: 24rpx;
  color: #6c8197;
}

/* 登录页 UI 优化：入口卡片轻量进场，降低静态页面的生硬感 */
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
