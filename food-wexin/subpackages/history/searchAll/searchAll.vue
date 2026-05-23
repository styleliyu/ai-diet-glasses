<template>
  <view class="search-page safe-area">
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <view class="header-copy">
        <text class="page-title">记录查询</text>
        <text class="page-subtitle">按时间范围查看饮食记录</text>
      </view>
      <view class="header-space"></view>
    </view>

    <view class="query-card">
      <view class="date-grid">
        <view>
          <text class="field-label">开始时间</text>
          <picker mode="date" :value="startDate" @change="onStartDateChange">
            <view class="picker-field">{{ startDate }}</view>
          </picker>
        </view>
        <view>
          <text class="field-label">结束时间</text>
          <picker mode="date" :value="endDate" @change="onEndDateChange">
            <view class="picker-field">{{ endDate }}</view>
          </picker>
        </view>
      </view>

      <view class="button-row">
        <button class="primary-btn" :disabled="loading" @tap="handleQuery">
          {{ loading ? "查询中..." : "查询记录" }}
        </button>
        <button class="ghost-btn" @tap="resetQuery">重置</button>
      </view>
    </view>

    <view class="summary-card" v-if="hasSearched">
      <text class="summary-title">查询结果</text>
      <text class="summary-text">共找到 {{ records.length }} 条记录</text>
    </view>

    <view v-if="records.length" class="record-list">
      <view
        v-for="record in records"
        :key="record.id || record.createTime"
        class="record-card"
      >
        <image
          v-if="record.imgUrl"
          :src="record.imgUrl"
          class="record-image"
          mode="aspectFill"
        ></image>
        <view v-else class="record-image placeholder">图</view>

        <view class="record-body">
          <view class="record-main">
            <text class="record-name">{{
              record.foodName || "未命名食物"
            }}</text>
            <text class="record-time">{{ record.createTime || "--" }}</text>
          </view>

          <view class="nutrition-grid">
            <text class="nutrition-item"
              >热量 {{ record.totalCalorie || 0 }} kcal</text
            >
            <text class="nutrition-item"
              >重量 {{ record.estimatedWeight || 0 }} g</text
            >
            <text class="nutrition-item">蛋白 {{ record.protein || 0 }} g</text>
            <text class="nutrition-item">脂肪 {{ record.fat || 0 }} g</text>
          </view>
        </view>

        <view class="record-tools">
          <text class="tool-btn danger" @tap="deleteRecord(record)">删除</text>
        </view>
      </view>
    </view>

    <view v-else-if="hasSearched" class="empty-card">
      <text class="empty-title">当前没有记录</text>
      <text class="empty-desc">你可以调整时间范围后重新查询</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { dietApi } from "../../../api/index.js";
import { requireAuthenticatedPage } from "../../../utils/auth.js";
import { formatDate } from "../../../utils/index.js";

const startDate = ref(getOffsetDate(-7));
const endDate = ref(formatDate(new Date(), "YYYY-MM-DD"));
const loading = ref(false);
const hasSearched = ref(false);
const records = ref([]);

function getOffsetDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDate(date, "YYYY-MM-DD");
}

function normalizePayload(payload) {
  // 查询接口和本地兜底都可能返回 records 包装或数组本体，这里统一展开。
  if (!payload) return [];
  const data = payload.data !== undefined ? payload.data : payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

function normalizeRecord(item = {}, index = 0) {
  // 删除和展示都依赖稳定 id，缺失时用时间和索引生成临时标识。
  return {
    id: item.id ?? `${item.createTime || "record"}-${index}`,
    foodName: item.foodName || item.name || "未命名食物",
    totalCalorie: Number(
      item.totalCalorie ?? item.calorie ?? item.totalCalories ?? 0,
    ),
    estimatedWeight: Number(item.estimatedWeight ?? item.weight ?? 0),
    createTime: item.createTime || item.date || "",
    imgUrl: item.imgUrl || item.ossImgUrl || item.imageUrl || "",
    protein: Number(item.protein ?? item.nutrients?.protein ?? 0),
    fat: Number(item.fat ?? item.nutrients?.fat ?? 0),
  };
}

function onStartDateChange(event) {
  startDate.value = event.detail.value;
}

function onEndDateChange(event) {
  endDate.value = event.detail.value;
}

async function handleQuery() {
  if (
    !requireAuthenticatedPage({
      message: "请先登录后再使用",
      silent: false,
    })
  ) {
    return;
  }
  loading.value = true;
  hasSearched.value = true;

  try {
    // 查询页只负责筛选区间，历史记录缓存和远端读取由 dietApi 统一处理。
    const result = await dietApi.getRecords({
      startTime: startDate.value,
      endTime: endDate.value,
    });

    records.value = normalizePayload(result).map(normalizeRecord);
  } catch (error) {
    console.error("查询记录失败:", error);
    records.value = [];
    uni.showToast({
      title: "查询失败，请稍后重试",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  startDate.value = getOffsetDate(-7);
  endDate.value = formatDate(new Date(), "YYYY-MM-DD");
  records.value = [];
  hasSearched.value = false;
}

function deleteRecord(record) {
  uni.showModal({
    title: "删除记录",
    content: `确定删除 ${record.foodName || "这条记录"} 吗？`,
    success: async (res) => {
      if (!res.confirm) return;

      try {
        // dietApi.deleteRecord 会同步刷新远端缓存，这里只更新当前列表视图。
        await dietApi.deleteRecord(record.id);
        records.value = records.value.filter((item) => item.id !== record.id);
        uni.showToast({ title: "删除成功", icon: "success" });
      } catch (error) {
        console.error("删除记录失败:", error);
        uni.showToast({ title: "删除失败", icon: "none" });
      }
    },
  });
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }

  uni.switchTab({
    url: "/pages/home/home",
  });
}

onShow(() => {
  // 查询页没有匿名模式，缺失登录快照时直接回登录入口。
  const isLoggedIn = uni.getStorageSync('isLoggedIn');
  const userInfo = uni.getStorageSync('userInfo');
  if (!isLoggedIn || !userInfo?.username) {
    uni.reLaunch({ url: "/pages/login/login" });
    return;
  }
  
  requireAuthenticatedPage({
    message: "请先登录后再使用",
    silent: true,
  });
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

.search-page {
  min-height: 100vh;
  padding: 36rpx 28rpx 48rpx;
  background:
    radial-gradient(
      circle at top left,
      rgba(106, 140, 175, 0.18),
      transparent 32%
    ),
    linear-gradient(180deg, #f8fbff 0%, #eef4f8 100%);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.back-btn {
  width: 76rpx;
  height: 76rpx;
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

.header-space {
  width: 76rpx;
  height: 76rpx;
}

.header-copy {
  flex: 1;
  text-align: center;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #223547;
}

.page-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6c8197;
}

.query-card,
.summary-card,
.record-card,
.empty-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  box-shadow: 0 16rpx 40rpx rgba(106, 140, 175, 0.08);
}

.query-card,
.summary-card,
.empty-card {
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.field-label {
  display: block;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  color: #6c8197;
}

.picker-field {
  min-height: 104rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  border-radius: 18rpx;
  background: #f4f8fb;
  color: #26384b;
  font-size: 28rpx;
}

.button-row {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.primary-btn,
.ghost-btn {
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 18rpx;
  font-size: 30rpx;
  border: none;
}

.primary-btn {
  flex: 1;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
}

.ghost-btn {
  width: 180rpx;
  background: #eef4f8;
  color: #486988;
}

.summary-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #223547;
}

.summary-text {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #71859b;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.record-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx;
}

.record-image {
  width: 104rpx;
  height: 104rpx;
  border-radius: 18rpx;
  flex-shrink: 0;
}

.record-image.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dce7ef 0%, #bfd0df 100%);
  color: #4e6d89;
  font-size: 30rpx;
}

.record-body {
  flex: 1;
  min-width: 0;
}

.record-main {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.record-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #223547;
}

.record-time {
  font-size: 22rpx;
  color: #7c90a4;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 16rpx;
}

.nutrition-item {
  padding: 12rpx 16rpx;
  border-radius: 14rpx;
  background: #f6f9fc;
  font-size: 22rpx;
  color: #567997;
}

.record-tools {
  display: flex;
  align-items: center;
}

.tool-btn {
  padding: 14rpx 20rpx;
  border-radius: 14rpx;
  font-size: 24rpx;
}

.tool-btn.danger {
  background: #ffe8e5;
  color: #d95c4f;
}

.empty-card {
  text-align: center;
}

.empty-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #4c637a;
}

.empty-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8394a5;
}
</style>
