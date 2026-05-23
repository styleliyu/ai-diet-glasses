<template>
  <view class="account-page safe-area">
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">账户信息</text>
      <view class="header-space"></view>
    </view>

    <view class="avatar-card">
      <view class="avatar-wrapper" @tap="changeAvatar">
        <image v-if="userInfo.avatar" :src="userInfo.avatar" class="user-avatar" mode="aspectFill"></image>
        <view v-else class="avatar-placeholder">{{ avatarText }}</view>
      </view>
      <text class="avatar-tip">点击修改头像</text>
    </view>

    <view class="form-card">
      <view class="form-item">
        <text class="form-label">昵称</text>
        <input v-model="userInfo.nickname" class="form-input" placeholder="请输入昵称" maxlength="20" />
      </view>
      <view class="form-item">
        <text class="form-label">邮箱</text>
        <input v-model="userInfo.email" class="form-input" type="text" placeholder="请输入邮箱" maxlength="50" />
      </view>
      <view class="form-item">
        <text class="form-label">手机号</text>
        <input v-model="userInfo.phone" class="form-input" type="number" placeholder="请输入手机号" maxlength="11" />
      </view>
      <view class="form-item">
        <text class="form-label">性别</text>
        <view class="tag-row">
          <text v-for="item in genderOptions" :key="item.value" class="tag-item" :class="{ active: userInfo.gender === item.value }" @tap="userInfo.gender = item.value">
            {{ item.label }}
          </text>
        </view>
      </view>
      <view class="form-item">
        <text class="form-label">生日</text>
        <picker mode="date" :value="userInfo.birthday" @change="userInfo.birthday = $event.detail.value">
          <view class="picker-field">{{ userInfo.birthday || '请选择生日' }}</view>
        </picker>
      </view>
    </view>

    <button class="save-btn" :disabled="isSaving" @tap="saveChanges">
      {{ isSaving ? '保存中...' : '保存修改' }}
    </button>
  </view>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { userApi } from "../../../api/index.js";

const STORAGE_KEY = "userInfo";
const isSaving = ref(false);
const userInfo = reactive({
  nickname: "",
  email: "",
  phone: "",
  gender: "unknown",
  birthday: "",
  avatar: "",
});

const genderOptions = [
  { label: "男", value: "male" },
  { label: "女", value: "female" },
  { label: "保密", value: "unknown" },
];

const avatarText = computed(() => {
  return (userInfo.nickname || "我").slice(0, 1);
});

function applyUserInfo(data = {}) {
  Object.assign(userInfo, {
    nickname: data.nickname || data.username || "",
    email: data.email || "",
    phone: data.phone || "",
    gender: data.gender || "unknown",
    birthday: data.birthday || "",
    avatar: data.avatar || "",
  });
}

function saveLocal() {
  uni.setStorageSync(STORAGE_KEY, { ...userInfo });
}

async function loadUserInfo() {
  const localData = uni.getStorageSync(STORAGE_KEY);
  if (localData) {
    applyUserInfo(localData);
  }

  try {
    const result = await userApi.getUserInfo();
    const payload = result?.data !== undefined ? result.data : result;
    if (payload) {
      applyUserInfo(payload);
      saveLocal();
    }
  } catch (error) {
    console.log("账户信息接口未接入，使用本地数据", error);
  }
}

function changeAvatar() {
  uni.showActionSheet({
    itemList: ["拍照", "从相册选择"],
    success: (res) => {
      uni.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: [res.tapIndex === 0 ? "camera" : "album"],
        success: (imageRes) => {
          userInfo.avatar = imageRes.tempFilePaths[0];
        },
      });
    },
  });
}

async function saveChanges() {
  isSaving.value = true;
  saveLocal();

  try {
    await userApi.updateUserInfo({ ...userInfo });
  } catch (error) {
    console.log("账户信息接口未接入，已保存到本地", error);
  } finally {
    isSaving.value = false;
  }

  uni.showModal({
    title: "保存成功",
    content: "账户信息已更新。",
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

.account-page {
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

.avatar-card,
.form-card {
  margin-bottom: 22rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16rpx 40rpx rgba(106, 140, 175, 0.08);
}

.avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #6a8caf 0%, #88a9c0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  font-size: 56rpx;
  color: #fff;
  font-weight: 700;
}

.avatar-tip {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #7c90a4;
}

.form-item {
  margin-bottom: 22rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #5d7389;
}

.form-input,
.picker-field {
  width: 100%;
  box-sizing: border-box;
  min-height: 104rpx;
  border-radius: 18rpx;
  background: #f5f8fb;
  font-size: 28rpx;
  color: #223547;
}

.form-input {
  display: block;
  padding: 0 24rpx;
  line-height: 104rpx;
}

.picker-field {
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.tag-row {
  display: flex;
  gap: 14rpx;
}

.tag-item {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  border-radius: 16rpx;
  background: #eef4f8;
  color: #567997;
  font-size: 26rpx;
}

.tag-item.active {
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
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
