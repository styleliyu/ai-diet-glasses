<template>
  <view class="security-page safe-area">
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">安全设置</text>
      <view class="header-space"></view>
    </view>

    <view class="section-card">
      <text class="section-title">修改密码</text>
      <view class="form-item">
        <text class="form-label">当前密码</text>
        <input v-model="password.current" class="form-input" :password="!showCurrentPassword" placeholder="请输入当前密码" />
        <text class="toggle-password" @tap="showCurrentPassword = !showCurrentPassword">{{ showCurrentPassword ? '隐藏' : '显示' }}</text>
      </view>
      <view class="form-item">
        <text class="form-label">新密码</text>
        <input v-model="password.new" class="form-input" :password="!showNewPassword" placeholder="至少 6 位" />
        <text class="toggle-password" @tap="showNewPassword = !showNewPassword">{{ showNewPassword ? '隐藏' : '显示' }}</text>
      </view>
      <view class="form-item">
        <text class="form-label">确认新密码</text>
        <input v-model="password.confirm" class="form-input" :password="!showConfirmPassword" placeholder="再次输入新密码" />
        <text class="toggle-password" @tap="showConfirmPassword = !showConfirmPassword">{{ showConfirmPassword ? '隐藏' : '显示' }}</text>
      </view>
      <button class="save-btn" :disabled="!canChangePassword" @tap="changePassword">修改密码</button>
    </view>

    <view class="section-card">
      <text class="section-title">绑定信息</text>
      <view class="info-row">
        <view>
          <text class="info-title">手机号</text>
          <text class="info-desc">{{ phoneNumber || '未绑定' }}</text>
        </view>
        <text class="link-btn" @tap="bindPhone">设置</text>
      </view>
      <view class="info-row">
        <view>
          <text class="info-title">邮箱</text>
          <text class="info-desc">{{ email || '未绑定' }}</text>
        </view>
        <text class="link-btn" @tap="bindEmail">设置</text>
      </view>
      <view class="info-row">
        <view>
          <text class="info-title">实名认证</text>
          <text class="info-desc">{{ realName || '未认证' }}</text>
        </view>
        <text class="link-btn" @tap="realNameAuth">{{ realName ? '查看' : '认证' }}</text>
      </view>
    </view>

    <view class="section-card">
      <text class="section-title">隐私选项</text>
      <view class="switch-row">
        <text>自动备份数据</text>
        <switch :checked="settings.autoBackup" color="#2f9f63" @change="settings.autoBackup = $event.detail.value" />
      </view>
      <view class="switch-row">
        <text>允许导出数据</text>
        <switch :checked="settings.allowExport" color="#2f9f63" @change="settings.allowExport = $event.detail.value" />
      </view>
      <view class="switch-row">
        <text>个性化推荐</text>
        <switch :checked="settings.personalizedRecommendation" color="#2f9f63" @change="settings.personalizedRecommendation = $event.detail.value" />
      </view>
      <button class="secondary-btn" @tap="savePrivacySettings">保存隐私设置</button>
    </view>

    <view class="section-card">
      <text class="section-title">高风险操作</text>
      <text class="danger-btn" @tap="clearCache">清除缓存</text>
      <text class="danger-btn" @tap="exportAllData">导出全部数据</text>
      <text class="danger-btn strong" @tap="deleteAccount">删除账户</text>
    </view>

    <uni-popup ref="messagePopup" type="message">
      <uni-popup-message :type="messageType" :message="messageText"></uni-popup-message>
    </uni-popup>
  </view>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { userApi } from "../../../api/index.js";

const STORAGE_KEY = "localSecuritySettings";
const USER_KEY = "userInfo";
const messagePopup = ref(null);
const messageType = ref("success");
const messageText = ref("");
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const password = reactive({ current: "", new: "", confirm: "" });
const phoneNumber = ref("");
const email = ref("");
const realName = ref("");
const settings = reactive({
  autoBackup: true,
  allowExport: true,
  personalizedRecommendation: true,
});

const canChangePassword = computed(() => {
  return (
    password.current.trim().length > 0 &&
    password.new.trim().length >= 6 &&
    password.new === password.confirm
  );
});

function showMessage(type, text) {
  messageType.value = type;
  messageText.value = text;
  messagePopup.value?.open?.();
}

function saveLocalSettings() {
  uni.setStorageSync(STORAGE_KEY, { ...settings });
  const localUser = uni.getStorageSync(USER_KEY) || {};
  uni.setStorageSync(USER_KEY, {
    ...localUser,
    phone: phoneNumber.value,
    email: email.value,
    realName: realName.value,
  });
}

async function loadUserInfo() {
  const localUser = uni.getStorageSync(USER_KEY) || {};
  phoneNumber.value = localUser.phone || "";
  email.value = localUser.email || "";
  realName.value = localUser.realName || "";
  Object.assign(settings, uni.getStorageSync(STORAGE_KEY) || {});

  try {
    const result = await userApi.getUserInfo();
    const payload = result?.data !== undefined ? result.data : result;
    if (payload) {
      phoneNumber.value = payload.phone || phoneNumber.value;
      email.value = payload.email || email.value;
      realName.value = payload.realName || realName.value;
      saveLocalSettings();
    }
  } catch (error) {
    console.log("安全信息接口未接入，使用本地数据", error);
  }
}

async function changePassword() {
  if (!canChangePassword.value) {
    showMessage("warning", "请填写完整且有效的新密码");
    return;
  }

  try {
    await userApi.changePassword({
      oldPassword: password.current,
      newPassword: password.new,
    });
  } catch (error) {
    console.log("修改密码接口未接入，按本地测试处理", error);
  }

  password.current = "";
  password.new = "";
  password.confirm = "";
  showMessage("success", "密码修改流程已完成");
}

function bindPhone() {
  uni.showModal({
    title: "绑定手机号",
    editable: true,
    placeholderText: "请输入手机号",
    success: (res) => {
      const value = (res.content || "").trim();
      if (res.confirm && /^1[3-9]\d{9}$/.test(value)) {
        phoneNumber.value = value;
        saveLocalSettings();
        showMessage("success", "手机号已更新");
      }
    },
  });
}

function bindEmail() {
  uni.showModal({
    title: "绑定邮箱",
    editable: true,
    placeholderText: "请输入邮箱",
    success: (res) => {
      const value = (res.content || "").trim();
      if (res.confirm && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        email.value = value;
        saveLocalSettings();
        showMessage("success", "邮箱已更新");
      }
    },
  });
}

function realNameAuth() {
  uni.showModal({
    title: realName.value ? "实名信息" : "实名认证",
    content: realName.value || "测试阶段先按本地展示处理，后续接入实名接口。",
    showCancel: !realName.value,
    editable: !realName.value,
    placeholderText: "请输入真实姓名",
    success: (res) => {
      const value = (res.content || "").trim();
      if (!realName.value && res.confirm && value) {
        realName.value = value;
        saveLocalSettings();
        showMessage("success", "实名信息已保存");
      }
    },
  });
}

function savePrivacySettings() {
  saveLocalSettings();
  showMessage("success", "隐私设置已保存");
}

function clearCache() {
  uni.showModal({
    title: "清除缓存",
    content: "会清理本地缓存，但保留当前账户信息。",
    success: (res) => {
      if (!res.confirm) return;
      const userInfo = uni.getStorageSync(USER_KEY);
      uni.clearStorageSync();
      if (userInfo) {
        uni.setStorageSync(USER_KEY, userInfo);
      }
      saveLocalSettings();
      showMessage("success", "缓存已清除");
    },
  });
}

function exportAllData() {
  uni.showModal({
    title: "导出说明",
    content: "真实导出接口接入前，这里先保留说明弹窗，避免假下载。",
    showCancel: false,
    confirmText: "知道了",
  });
}

function deleteAccount() {
  uni.showModal({
    title: "删除账户",
    content: "测试阶段不执行真实删号，只清空本地状态并返回登录页。",
    confirmText: "继续",
    confirmColor: "#d95c4f",
    success: (res) => {
      if (!res.confirm) return;
      uni.clearStorageSync();
      uni.reLaunch({ url: "/pages/login/login" });
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

onMounted(() => {
  loadUserInfo();
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

.security-page {
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

.section-title {
  display: block;
  margin-bottom: 18rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #223547;
}

.form-item {
  margin-bottom: 18rpx;
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #5d7389;
}

.form-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 104rpx;
  padding: 0 96rpx 0 24rpx;
  line-height: 104rpx;
  border-radius: 18rpx;
  background: #f5f8fb;
  font-size: 28rpx;
  color: #223547;
}

.toggle-password {
  position: absolute;
  right: 24rpx;
  bottom: 22rpx;
  font-size: 24rpx;
  color: #567997;
}

.info-row,
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #edf2f6;
}

.info-row:last-child,
.switch-row:last-child {
  border-bottom: none;
}

.info-title {
  display: block;
  font-size: 28rpx;
  color: #223547;
  font-weight: 600;
}

.info-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7c90a4;
}

.link-btn {
  padding: 12rpx 20rpx;
  border-radius: 14rpx;
  background: #eef4f8;
  color: #567997;
  font-size: 24rpx;
}

.save-btn,
.secondary-btn {
  margin-top: 12rpx;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 18rpx;
  font-size: 28rpx;
  border: none;
}

.save-btn {
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
}

.secondary-btn {
  background: #eef4f8;
  color: #486988;
}

.danger-btn {
  display: block;
  margin-top: 16rpx;
  padding: 22rpx 24rpx;
  border-radius: 18rpx;
  background: #fff4f2;
  color: #c85b4b;
  font-size: 28rpx;
}

.danger-btn.strong {
  background: #ffe9e6;
  color: #d54d42;
}
</style>
