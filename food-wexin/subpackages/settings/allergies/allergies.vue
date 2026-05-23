<template>
  <view class="allergies-page safe-area">
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">过敏与禁忌</text>
      <view class="header-space"></view>
    </view>

    <view class="section-card" v-for="group in allergenGroups" :key="group.category">
      <text class="section-title">{{ group.category }}</text>
      <view class="tag-grid">
        <text
          v-for="item in group.items"
          :key="item.id"
          class="tag-item"
          :class="{ active: selectedAllergens.includes(item.id) }"
          @tap="toggleAllergen(item.id)"
        >
          {{ item.name }}
        </text>
      </view>
    </view>

    <view class="section-card">
      <text class="section-title">自定义禁忌</text>
      <view class="input-row">
        <input v-model="customAllergen" class="custom-input" placeholder="输入食物或成分名称" @confirm="addCustomAllergen" />
        <text class="add-btn" @tap="addCustomAllergen">添加</text>
      </view>
      <view class="tag-grid" v-if="customAllergens.length">
        <text v-for="(item, index) in customAllergens" :key="`${item}-${index}`" class="tag-item danger active" @tap="removeCustomAllergen(index)">
          {{ item }} ×
        </text>
      </view>
    </view>

    <button class="save-btn" :disabled="isSaving" @tap="saveAllergies">
      {{ isSaving ? '保存中...' : '保存设置' }}
    </button>
  </view>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { userApi } from "../../../api/index.js";

const STORAGE_KEY = "localAllergies";
const isSaving = ref(false);
const selectedAllergens = ref([]);
const customAllergen = ref("");
const customAllergens = ref([]);

const allergenGroups = [
  {
    category: "常见过敏原",
    items: [
      { id: "peanut", name: "花生" },
      { id: "milk", name: "牛奶" },
      { id: "egg", name: "鸡蛋" },
      { id: "soy", name: "大豆" },
      { id: "wheat", name: "小麦" },
      { id: "fish", name: "鱼类" },
      { id: "shellfish", name: "甲壳类" },
      { id: "nuts", name: "坚果" },
    ],
  },
  {
    category: "其他需要避开的成分",
    items: [
      { id: "sesame", name: "芝麻" },
      { id: "mustard", name: "芥末" },
      { id: "celery", name: "芹菜" },
      { id: "spicy", name: "重辣" },
      { id: "fried", name: "油炸" },
      { id: "sugary", name: "高糖" },
    ],
  },
];

function toggleAllergen(id) {
  const index = selectedAllergens.value.indexOf(id);
  if (index > -1) {
    selectedAllergens.value.splice(index, 1);
  } else {
    selectedAllergens.value.push(id);
  }
}

function addCustomAllergen() {
  const value = customAllergen.value.trim();
  if (!value || customAllergens.value.includes(value)) return;
  customAllergens.value.push(value);
  customAllergen.value = "";
}

function removeCustomAllergen(index) {
  customAllergens.value.splice(index, 1);
}

function getPayload() {
  return {
    standardAllergens: [...selectedAllergens.value],
    customAllergens: [...customAllergens.value],
  };
}

function applyPayload(data = {}) {
  selectedAllergens.value = data.standardAllergens || [];
  customAllergens.value = data.customAllergens || [];
}

function saveLocal(payload) {
  uni.setStorageSync(STORAGE_KEY, payload);
}

async function loadAllergies() {
  const localData = uni.getStorageSync(STORAGE_KEY);
  if (localData) {
    applyPayload(localData);
  }

  try {
    const result = await userApi.getAllergies();
    const payload = result?.data !== undefined ? result.data : result;
    if (payload) {
      applyPayload(payload);
      saveLocal(payload);
    }
  } catch (error) {
    console.log("过敏接口未接入，使用本地数据", error);
  }
}

async function saveAllergies() {
  isSaving.value = true;
  const payload = getPayload();
  saveLocal(payload);

  try {
    await userApi.updateAllergies(payload);
  } catch (error) {
    console.log("过敏接口未接入，已保存到本地", error);
  } finally {
    isSaving.value = false;
  }

  uni.showModal({
    title: "保存成功",
    content: "过敏与禁忌设置已保存，本地筛选会立即生效。",
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
  loadAllergies();
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

.allergies-page {
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

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 18rpx 24rpx;
  border-radius: 16rpx;
  background: #eef4f8;
  color: #567997;
  font-size: 26rpx;
}

.tag-item.active {
  background: linear-gradient(135deg, #f07b6d 0%, #d95c4f 100%);
  color: #fff;
}

.input-row {
  display: flex;
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.custom-input {
  flex: 1;
  min-height: 104rpx;
  padding: 0 24rpx;
  line-height: 104rpx;
  border-radius: 18rpx;
  background: #f5f8fb;
  font-size: 28rpx;
  color: #223547;
  box-sizing: border-box;
}

.add-btn {
  width: 140rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
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
