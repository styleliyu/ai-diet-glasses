<template>
  <view class="preferences-page safe-area">
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">饮食偏好</text>
      <view class="header-space"></view>
    </view>

    <view class="section-card">
      <text class="section-title">饮食类型</text>
      <view class="tag-grid">
        <text
          v-for="item in dietTypes"
          :key="item.id"
          class="tag-item"
          :class="{ active: selectedDietType === item.id }"
          @tap="selectedDietType = item.id"
        >
          {{ item.name }}
        </text>
      </view>
    </view>

    <view class="section-card">
      <text class="section-title">喜欢的食物类别</text>
      <view class="tag-grid">
        <text
          v-for="item in foodCategories"
          :key="item.id"
          class="tag-item"
          :class="{ active: likedCategories.includes(item.id) }"
          @tap="toggleTag(likedCategories, item.id)"
        >
          {{ item.name }}
        </text>
      </view>
    </view>

    <view class="section-card">
      <text class="section-title">不喜欢的食物类别</text>
      <view class="tag-grid">
        <text
          v-for="item in foodCategories"
          :key="`dislike-${item.id}`"
          class="tag-item danger"
          :class="{ active: dislikedCategories.includes(item.id) }"
          @tap="toggleTag(dislikedCategories, item.id)"
        >
          {{ item.name }}
        </text>
      </view>
    </view>

    <view class="section-card">
      <text class="section-title">特殊需求</text>
      <view class="switch-list">
        <view class="switch-item">
          <text>低盐</text>
          <switch
            :checked="specialNeeds.lowSalt"
            color="#2f9f63"
            @change="specialNeeds.lowSalt = $event.detail.value"
          />
        </view>
        <view class="switch-item">
          <text>低糖</text>
          <switch
            :checked="specialNeeds.lowSugar"
            color="#2f9f63"
            @change="specialNeeds.lowSugar = $event.detail.value"
          />
        </view>
        <view class="switch-item">
          <text>低脂</text>
          <switch
            :checked="specialNeeds.lowFat"
            color="#2f9f63"
            @change="specialNeeds.lowFat = $event.detail.value"
          />
        </view>
        <view class="switch-item">
          <text>高纤维</text>
          <switch
            :checked="specialNeeds.highFiber"
            color="#2f9f63"
            @change="specialNeeds.highFiber = $event.detail.value"
          />
        </view>
      </view>
    </view>

    <button class="save-btn" :disabled="isSaving" @tap="savePreferences">
      {{ isSaving ? "保存中..." : "保存偏好设置" }}
    </button>
  </view>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { userApi } from "../../../api/index.js";

const STORAGE_KEY = "localPreferences";
const isSaving = ref(false);
const selectedDietType = ref("balanced");
const likedCategories = ref(["vegetables", "fruits", "grains", "protein"]);
const dislikedCategories = ref([]);
const specialNeeds = reactive({
  lowSalt: false,
  lowSugar: false,
  lowFat: false,
  highFiber: true,
});

const dietTypes = [
  { id: "balanced", name: "均衡饮食" },
  { id: "vegetarian", name: "素食" },
  { id: "vegan", name: "纯素" },
  { id: "lowcarb", name: "低碳水" },
  { id: "highprotein", name: "高蛋白" },
  { id: "keto", name: "生酮" },
];

const foodCategories = [
  { id: "vegetables", name: "蔬菜" },
  { id: "fruits", name: "水果" },
  { id: "grains", name: "谷物" },
  { id: "protein", name: "蛋白质" },
  { id: "dairy", name: "奶制品" },
  { id: "seafood", name: "海鲜" },
  { id: "meat", name: "肉类" },
  { id: "nuts", name: "坚果" },
  { id: "sweets", name: "甜食" },
  { id: "beverages", name: "饮料" },
];

function toggleTag(targetRef, id) {
  const index = targetRef.value.indexOf(id);
  if (index > -1) {
    targetRef.value.splice(index, 1);
  } else {
    targetRef.value.push(id);
  }
}

function getPayload() {
  return {
    dietType: selectedDietType.value,
    likedCategories: [...likedCategories.value],
    dislikedCategories: [...dislikedCategories.value],
    specialNeeds: { ...specialNeeds },
  };
}

function applyPayload(data = {}) {
  selectedDietType.value = data.dietType || "balanced";
  likedCategories.value = data.likedCategories || [
    "vegetables",
    "fruits",
    "grains",
    "protein",
  ];
  dislikedCategories.value = data.dislikedCategories || [];
  Object.assign(specialNeeds, {
    lowSalt: false,
    lowSugar: false,
    lowFat: false,
    highFiber: true,
    ...(data.specialNeeds || {}),
  });
}

function saveLocal(payload) {
  uni.setStorageSync(STORAGE_KEY, payload);
}

async function loadPreferences() {
  const localData = uni.getStorageSync(STORAGE_KEY);
  if (localData) {
    applyPayload(localData);
  }

  try {
    const result = await userApi.getPreferences();
    const payload = result?.data !== undefined ? result.data : result;
    if (payload) {
      applyPayload(payload);
      saveLocal(payload);
    }
  } catch (error) {
    console.log("偏好接口未接入，使用本地数据", error);
  }
}

async function savePreferences() {
  isSaving.value = true;
  const payload = getPayload();
  saveLocal(payload);

  try {
    await userApi.updatePreferences(payload);
  } catch (error) {
    console.log("偏好接口未接入，已保存到本地", error);
  } finally {
    isSaving.value = false;
  }

  uni.showModal({
    title: "保存成功",
    content: "饮食偏好已保存，本地设置会立即生效。",
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
  loadPreferences();
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

.preferences-page {
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
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
}

.tag-item.danger.active {
  background: linear-gradient(135deg, #f07b6d 0%, #d95c4f 100%);
}

.switch-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
  font-size: 28rpx;
  color: #223547;
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
