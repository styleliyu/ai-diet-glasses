<template>
  <view class="recognition-page safe-area">
    <view class="page-header">
      <view class="header-copy">
        <text class="page-title">食物识别</text>
        <text class="page-subtitle">上传图片后识别食物并确认记录</text>
      </view>
    </view>

    <view class="preview-card animated-panel delay-1" @tap="chooseImageSource">
      <template v-if="imagePath">
        <image :src="imagePath" class="preview-image" mode="aspectFit"></image>
        <text class="replace-hint">点击重新选择图片</text>
      </template>
      <template v-else>
        <text class="preview-icon">Hello,Diet</text>
        <text class="preview-title">选择食物图片</text>
        <text class="preview-desc">支持拍照或从相册上传</text>
      </template>
    </view>

    <view class="action-row animated-panel delay-2">
      <button class="action-btn" @tap="takePhoto">拍照</button>
      <button class="action-btn ghost" @tap="chooseImage">相册</button>
      <button
        class="action-btn primary"
        :disabled="!imagePath || loading"
        @tap="recognizeFood"
      >
        {{ loading ? "识别中..." : "开始识别" }}
      </button>
    </view>

    <view class="tips-card animated-panel delay-3">
      <text class="tips-title">识别建议</text>
      <text class="tips-text"
        >把食物主体拍清楚、尽量避免背景杂乱，识别结果会更稳定。</text
      >
    </view>

    <view v-if="showHistory && recognitionHistory.length" class="history-card animated-panel delay-4">
      <view class="section-head">
        <text class="section-title">最近识别</text>
        <text class="section-link" @tap="clearHistory">清空</text>
      </view>
      <view class="history-list">
        <view
          v-for="(item, index) in recognitionHistory"
          :key="index"
          class="history-item"
          @tap="selectHistory(item)"
        >
          <view>
            <text class="history-name">{{ item.foodName }}</text>
            <text class="history-meta"
              >{{ item.time }} · {{ item.calories }} kcal</text
            >
          </view>
          <text class="history-weight">{{ item.weight }} g</text>
        </view>
      </view>
    </view>

    <view v-else-if="showHistory" class="history-card history-placeholder animated-panel delay-4">
      <view class="section-head">
        <text class="section-title">最近识别</text>
      </view>
      <view class="placeholder-body">
        <view class="placeholder-box">
          <text>🍱</text>
        </view>
        <text class="placeholder-title">暂无识别记录</text>
        <text class="placeholder-desc">识别后的食物会展示在这里。</text>
      </view>
    </view>

    <view
      v-if="showRecognitionModal && recognitionResult"
      class="modal-overlay"
      @tap="closeRecognitionModal"
    >
      <view class="result-modal" @tap.stop>
        <view class="modal-head">
          <text class="modal-title">识别结果</text>
          <text class="modal-close" @tap="closeRecognitionModal">×</text>
        </view>

        <view class="modal-body">
          <view class="name-row">
            <input
              v-model="editingFoodName"
              class="name-input"
              placeholder="请输入食物名称"
            />
          </view>

          <view v-if="recognitionResult.isFood" class="metric-grid">
            <view class="metric-item">
              <text class="metric-label">热量</text>
              <text class="metric-value">{{ adjustedCalories }} kcal</text>
            </view>
            <view class="metric-item">
              <text class="metric-label">重量</text>
              <text class="metric-value">{{ adjustedWeight }} g</text>
            </view>
            <view class="metric-item">
              <text class="metric-label">蛋白质</text>
              <text class="metric-value">{{ adjustedNutrients.protein }} g</text>
            </view>
            <view class="metric-item">
              <text class="metric-label">碳水</text>
              <text class="metric-value">{{ adjustedNutrients.carbs }} g</text>
            </view>
            <view class="metric-item">
              <text class="metric-label">脂肪</text>
              <text class="metric-value">{{ adjustedNutrients.fat }} g</text>
            </view>
          </view>

          <view v-if="!recognitionResult.isFood" class="non-food-message">
            <text class="non-food-name">{{ recognitionResult.foodName }}</text>
            <text class="non-food-advice">{{ recognitionResult.nutritionAdvice }}</text>
          </view>

          <view v-if="recognitionResult.isFood" class="weight-card">
            <text class="weight-label">调整重量</text>
            <view class="weight-controls">
              <text class="weight-btn" @tap="adjustWeight(-10)">-10g</text>
              <input
                v-model="adjustedWeight"
                class="weight-input"
                type="number"
                @blur="validateWeight"
              />
              <text class="weight-btn" @tap="adjustWeight(10)">+10g</text>
            </view>
          </view>

          <text v-if="recognitionResult.isFood && recognitionResult.nutritionAdvice" class="advice-text">
            {{ recognitionResult.nutritionAdvice }}
          </text>
        </view>

        <view class="modal-actions">
          <button class="action-btn ghost" @tap="reCapture">重拍</button>
          <button
            class="action-btn primary"
            :disabled="addingRecord"
            @tap="confirmAddToRecords"
          >
            {{ addingRecord ? "加入中..." : "加入记录" }}
          </button>
        </view>
      </view>
    </view>

    <uni-popup ref="messagePopup" type="message">
      <uni-popup-message
        :type="messageType"
        :message="messageText"
      ></uni-popup-message>
    </uni-popup>

    <!-- AI助手入口：识别页可直接追问食物识别、营养换算等问题。 -->
    <ai-assistant />
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { dietApi, recognizeApi } from "@/api/index.js";
import { requireAuthenticatedPage } from "@/utils/auth.js";
import { formatDate } from "@/utils/index.js";

const loading = ref(false);
const imagePath = ref("");
const recognitionResult = ref(null);
const editingFoodName = ref("");
const adjustedWeight = ref(100);
const recognitionHistory = ref([]);
const showHistory = ref(true);
const showRecognitionModal = ref(false);
const messagePopup = ref(null);
const messageType = ref("success");
const messageText = ref("");
const addingRecord = ref(false);

const adjustedCalories = computed(() => {
  if (!recognitionResult.value) return 0;
  const baseCalories = Number(recognitionResult.value.estimatedCalories || 0);
  const baseWeight =
    Number(recognitionResult.value.estimatedWeight || 100) || 100;
  // AI 返回的是估算重量下的总热量，用户改重量后需要按比例重算。
  return Math.round(
    (baseCalories * Number(adjustedWeight.value || baseWeight)) / baseWeight,
  );
});

const adjustedNutrients = computed(() => {
  if (!recognitionResult.value) {
    return {
      protein: 0,
      fat: 0,
      carbs: 0,
    };
  }

  const baseWeight =
    Number(recognitionResult.value.estimatedWeight || 100) || 100;
  const currentWeight = Number(adjustedWeight.value || baseWeight) || baseWeight;
  const ratio = currentWeight / baseWeight;

  // 三大营养素和重量一起缩放，保持确认入库的数据口径一致。
  return {
    protein: roundNutrition(
      Number(recognitionResult.value?.nutrients?.protein || 0) * ratio,
    ),
    fat: roundNutrition(
      Number(recognitionResult.value?.nutrients?.fat || 0) * ratio,
    ),
    carbs: roundNutrition(
      Number(recognitionResult.value?.nutrients?.carbs || 0) * ratio,
    ),
  };
});

function roundNutrition(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function formatHistoryTime(value) {
  if (!value) return formatDate(new Date(), "YYYY-MM-DD HH:mm");
  return String(value).slice(0, 16).replace("T", " ");
}

function mapRecordToHistoryItem(record = {}) {
  const foodName = record.foodName || "未命名食物";
  const calories = Number(record.totalCalorie ?? record.estimatedCalories ?? 0);
  const weight = Number(record.estimatedWeight ?? record.weight ?? 0);
  const imageUrl = record.imageUrl || record.imgUrl || "";

  return {
    foodName,
    calories,
    weight,
    time: formatHistoryTime(record.createTime),
    result: {
      foodName,
      estimatedCalories: calories,
      estimatedWeight: weight,
      nutrients: {
        protein: Number(record.protein ?? record?.nutrients?.protein ?? 0),
        fat: Number(record.fat ?? record?.nutrients?.fat ?? 0),
        carbs: Number(record.carbs ?? record?.nutrients?.carbs ?? 0),
      },
      nutritionAdvice: record.nutritionAdvice || record.advice || "",
      imageUrl,
      duplicated: Boolean(record.duplicated),
      synced: record.synced !== false,
    },
  };
}

function mergeRecognitionHistory(localItems = [], remoteItems = []) {
  const merged = [...localItems, ...remoteItems];
  const seen = new Set();

  // 本地缓存和后端历史可能包含同一条记录，用复合 key 去重。
  return merged.filter((item) => {
    const imageUrl = item.result?.imageUrl || item.imageUrl || "";
    const key = imageUrl
      ? `image:${imageUrl}`
      : [item.foodName || "", item.weight || 0, item.calories || 0].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function loadRecognitionHistory() {
  if (
    !requireAuthenticatedPage({
      message: "请先登录后再使用",
      silent: true,
    })
  ) {
    return;
  }
  const localHistory = uni.getStorageSync("recognitionHistory") || [];
  recognitionHistory.value = Array.isArray(localHistory) ? localHistory : [];

  try {
    // 先展示本地缓存，再用远端记录补齐，避免进入页面时空白等待。
    const response = await recognizeApi.getRecognitionHistory();
    const payload = response?.data !== undefined ? response.data : response;
    const remoteHistory = Array.isArray(payload)
      ? payload.map(mapRecordToHistoryItem)
      : [];

    recognitionHistory.value = mergeRecognitionHistory(
      recognitionHistory.value,
      remoteHistory,
    ).slice(0, 20);
    saveHistory();
  } catch (error) {
    console.warn("刷新最近识别记录失败，继续使用本地缓存", error);
  }
}

// 识别页优先展示本地缓存，再与远端记录合并，这样首次进入也能马上看到历史。
function saveHistory() {
  uni.setStorageSync(
    "recognitionHistory",
    recognitionHistory.value.slice(0, 20),
  );
}

function chooseImageSource() {
  if (!imagePath.value) {
    chooseImage();
    return;
  }

  // 已选图片时让用户明确选择替换来源，避免误触直接覆盖。
  uni.showActionSheet({
    itemList: ["拍照", "从相册选择", "移除图片"],
    success: (res) => {
      if (res.tapIndex === 0) takePhoto();
      if (res.tapIndex === 1) chooseImage();
      if (res.tapIndex === 2) imagePath.value = "";
    },
  });
}

function takePhoto() {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["camera"],
    success: (res) => {
      imagePath.value = res.tempFilePaths[0];
    },
  });
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album"],
    success: (res) => {
      imagePath.value = res.tempFilePaths[0];
    },
  });
}

function buildFallbackRecognitionResult() {
  return {
    isFood: true,
    foodName: "识别结果待确认",
    estimatedCalories: 180,
    estimatedWeight: 100,
    nutrients: {
      protein: 8,
      carbs: 20,
      fat: 6,
    },
    nutritionAdvice: "当前接口还在测试阶段，建议手动确认食物名称和重量。",
    imageUrl: "",
    duplicated: false,
    synced: false,
  };
}

function normalizeRecognitionResponse(payload) {
  if (!payload) return buildFallbackRecognitionResult();
  const raw = payload.data !== undefined ? payload.data : payload;
  // 兼容后端原始字段和前端标准字段，弹窗只消费统一结构。
  return {
    isFood: Boolean(raw.isFood),
    foodName: raw.foodName || raw.name || "未命名食物",
    estimatedCalories: Number(
      raw.estimatedCalories ?? raw.totalCalorie ?? raw.calorie ?? 180,
    ),
    estimatedWeight: Number(raw.estimatedWeight ?? raw.weight ?? 100),
    nutrients: {
      protein: Number(raw?.nutrients?.protein ?? raw.protein ?? 0),
      carbs: Number(
        raw?.nutrients?.carbs ?? raw.carbohydrate ?? raw.carbs ?? 0,
      ),
      fat: Number(raw?.nutrients?.fat ?? raw.fat ?? 0),
    },
    nutritionAdvice: raw.nutritionAdvice || raw.advice || "",
    imageUrl: raw.imageUrl || raw.imgUrl || "",
    duplicated: Boolean(raw.duplicated),
    synced: raw.synced !== false,
  };
}

async function recognizeFood() {
  if (
    !requireAuthenticatedPage({
      message: "请先登录后再使用",
      silent: false,
    })
  ) {
    return;
  }
  if (!imagePath.value) {
    showMessage("warning", "请先选择图片");
    return;
  }

  loading.value = true;

  try {
    // 上传后端会触发 AI 识别和入库，这里只接收标准化展示结果。
    const result = await recognizeApi.recognizeFood(imagePath.value);
    recognitionResult.value = normalizeRecognitionResponse(result);
    editingFoodName.value = recognitionResult.value.foodName;
    adjustedWeight.value = recognitionResult.value.estimatedWeight || 100;
    showRecognitionModal.value = true;
  } catch (error) {
    console.error("识别失败:", error);
    showMessage("error", `识别失败: ${error.message || "服务器连接失败"}`);
  } finally {
    loading.value = false;
  }
}

function adjustWeight(offset) {
  adjustedWeight.value = Math.max(
    10,
    Math.min(1000, Number(adjustedWeight.value || 0) + offset),
  );
}

function validateWeight() {
  const value = Number(adjustedWeight.value || 0);
  adjustedWeight.value = Math.max(10, Math.min(1000, value || 100));
}

function reCapture() {
  showRecognitionModal.value = false;
  imagePath.value = "";
}

async function confirmAddToRecords() {
  if (addingRecord.value) return;
  if (
    !requireAuthenticatedPage({
      message: "请先登录后再使用",
      silent: false,
    })
  ) {
    return;
  }
  const result = recognitionResult.value;
  if (!result) return;
  addingRecord.value = true;

  const confirmedWeight = Number(
    adjustedWeight.value || result.estimatedWeight || 100,
  );
  const confirmedName = editingFoodName.value || result.foodName;
  // 用户确认后的重量/名称覆盖 AI 估算值，记录页以后展示确认口径。
  const confirmedRecord = {
    foodName: confirmedName,
    totalCalorie: adjustedCalories.value,
    estimatedWeight: confirmedWeight,
    protein: adjustedNutrients.value.protein,
    fat: adjustedNutrients.value.fat,
    carbs: adjustedNutrients.value.carbs,
    imageUrl: result.imageUrl || imagePath.value || "",
    imgUrl: result.imageUrl || imagePath.value || "",
  };

  try {
    // 加入记录后主动通知首页刷新，避免用户手动切换页面后才看到变化。
    if (result.synced === false) {
      await dietApi.addRecord(confirmedRecord);
    }

    const historyItem = {
      foodName: confirmedName,
      calories: adjustedCalories.value,
      weight: confirmedWeight,
      time: formatDate(new Date(), "YYYY-MM-DD HH:mm"),
      result: {
        ...result,
        foodName: confirmedName,
        estimatedWeight: confirmedWeight,
        estimatedCalories: adjustedCalories.value,
        nutrients: adjustedNutrients.value,
        imageUrl: confirmedRecord.imageUrl,
      },
    };

    recognitionHistory.value = mergeRecognitionHistory(
      [historyItem],
      recognitionHistory.value,
    ).slice(0, 20);
    saveHistory();
    uni.$emit("diet-record-updated", {
      source: "recognition",
      time: Date.now(),
    });
    showRecognitionModal.value = false;
    showHistory.value = true;
    showMessage(
      "success",
      result.synced === false
        ? "已加入每日记录与本地识别历史"
        : "已加入每日记录，识别历史也已更新",
    );
  } catch (error) {
    console.error("加入每日记录失败:", error);
    showMessage("error", "加入每日记录失败，请稍后重试");
  } finally {
    addingRecord.value = false;
  }
}

function toggleHistory() {
  showHistory.value = !showHistory.value;
  if (showHistory.value) {
    loadRecognitionHistory();
  }
}

function selectHistory(item) {
  recognitionResult.value = item.result;
  editingFoodName.value = item.result.foodName;
  adjustedWeight.value = item.weight;
  showRecognitionModal.value = true;
}

function clearHistory() {
  uni.showModal({
    title: "清空历史",
    content: "确定清空本地识别历史吗？后端已有记录会在刷新后重新显示。",
    success: (res) => {
      if (!res.confirm) return;
      recognitionHistory.value = [];
      saveHistory();
      loadRecognitionHistory();
      showMessage("success", "本地识别历史已清空");
    },
  });
}

function closeRecognitionModal() {
  showRecognitionModal.value = false;
}

function showMessage(type, text) {
  messageType.value = type;
  messageText.value = text;
  messagePopup.value?.open?.();
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }

  uni.switchTab({ url: "/pages/home/home" });
}

onShow(() => {
  loadRecognitionHistory();
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

.recognition-page {
  min-height: 100vh;
  padding: 36rpx 28rpx 48rpx;
  background:
    radial-gradient(
      circle at top right,
      rgba(106, 140, 175, 0.18),
      transparent 34%
    ),
    linear-gradient(180deg, #f8fbff 0%, #eef4f8 100%);
}

.page-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96rpx;
  margin-bottom: 28rpx;
}

.header-copy {
  width: 100%;
  padding: 0 24rpx;
  text-align: center;
  box-sizing: border-box;
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

.preview-card,
.tips-card,
.history-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 22rpx;
  box-shadow: 0 16rpx 40rpx rgba(106, 140, 175, 0.08);
}

.preview-card {
  min-height: 520rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2rpx dashed #d7e3ed;
}

.preview-image {
  width: 100%;
  height: 420rpx;
  border-radius: 22rpx;
}

.preview-icon {
  font-size: 80rpx;
  color: #7f92a5;
}

.preview-title {
  margin-top: 24rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #223547;
}

.preview-desc,
.replace-hint,
.tips-text,
.history-meta,
.advice-text {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #7c90a4;
  line-height: 1.6;
}

.action-row,
.modal-actions {
  display: flex;
  gap: 16rpx;
  margin-bottom: 22rpx;
}

.action-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 18rpx;
  background: #eef4f8;
  color: #486988;
  font-size: 30rpx;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
}

.action-btn.ghost {
  background: #f5f8fb;
}

.tips-title,
.section-title,
.modal-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #223547;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.section-link {
  font-size: 24rpx;
  color: #567997;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx 24rpx;
  border: 1rpx solid rgba(106, 140, 175, 0.08);
  border-radius: 20rpx;
  background: #f7fafd;
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.72);
}

.history-placeholder {
  min-height: 250rpx;
}

.placeholder-body {
  padding: 18rpx 0 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.placeholder-box {
  width: 116rpx;
  height: 116rpx;
  border-radius: 34rpx;
  background: linear-gradient(135deg, #eef5f7 0%, #dce9ef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 54rpx;
  box-shadow: 0 14rpx 32rpx rgba(106, 140, 175, 0.12);
}

.placeholder-title {
  margin-top: 20rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #223547;
}

.placeholder-desc {
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #7c90a4;
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

.delay-4 {
  animation-delay: 0.2s;
}

.preview-card,
.action-btn,
.tips-card,
.history-card {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.preview-card:active,
.action-btn:active,
.history-item:active {
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

.history-name {
  display: block;
  font-size: 28rpx;
  color: #223547;
  font-weight: 600;
}

.history-weight {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #567997;
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

.result-modal {
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
}

.modal-close {
  font-size: 40rpx;
  color: #7990a6;
}

.modal-body {
  margin-top: 24rpx;
}

.name-input,
.weight-input {
  width: 100%;
  display: block;
  min-height: 104rpx;
  padding: 0 24rpx;
  line-height: 104rpx;
  border-radius: 18rpx;
  background: #f5f8fb;
  font-size: 28rpx;
  color: #223547;
  box-sizing: border-box;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
  margin-top: 20rpx;
}

.metric-item {
  padding: 20rpx;
  border-radius: 18rpx;
  background: #f6f9fc;
}

.metric-label {
  display: block;
  font-size: 22rpx;
  color: #7c90a4;
}

.metric-value {
  display: block;
  margin-top: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #223547;
}

.weight-card {
  margin-top: 20rpx;
  padding: 22rpx;
  border-radius: 20rpx;
  background: #f6f9fc;
}

.weight-label {
  display: block;
  font-size: 24rpx;
  color: #5e7389;
}

.weight-controls {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 14rpx;
}

.weight-btn {
  width: 110rpx;
  height: 74rpx;
  border-radius: 16rpx;
  background: #e9f0f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #486988;
  font-size: 24rpx;
}

.non-food-message {
  margin-top: 20rpx;
  padding: 24rpx;
  border-radius: 18rpx;
  background: #f6f9fc;
  text-align: center;
}

.non-food-name {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #223547;
  margin-bottom: 12rpx;
}

.non-food-advice {
  display: block;
  font-size: 24rpx;
  color: #6c8197;
  line-height: 1.6;
}
</style>
