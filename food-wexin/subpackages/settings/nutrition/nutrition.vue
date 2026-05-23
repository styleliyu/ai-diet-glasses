<template>
  <view class="nutrition-container safe-area">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">营养目标</text>
      <view style="width: 80rpx"></view>
    </view>

    <!-- 说明 -->
    <view class="description">
      <text class="description-text">
        设置每日三大营养素的摄入目标，系统将根据您的目标提供个性化建议。
      </text>
    </view>

    <!-- 总热量目标 -->
    <view class="calorie-target">
      <text class="section-title">每日热量目标</text>
      <view class="calorie-input-group">
        <input
          class="calorie-input"
          type="number"
          v-model="dailyCalorieTarget"
          placeholder="请输入每日热量目标"
        />
        <text class="calorie-unit">kcal</text>
      </view>
      <text class="calorie-tip"
        >通常成年女性1800-2200 kcal，男性2200-2500 kcal</text
      >
    </view>

    <!-- 营养比例设置 -->
    <view class="ratio-section">
      <text class="section-title">营养比例</text>
      <text class="ratio-subtitle">调整三大营养素的比例分配</text>

      <view class="ratio-controls">
        <view class="ratio-item protein">
          <view class="ratio-header">
            <text class="ratio-name">蛋白质</text>
            <text class="ratio-value">{{ proteinPercent }}%</text>
          </view>
          <slider
            class="ratio-slider"
            :value="proteinPercent"
            min="10"
            max="50"
            step="1"
            @change="onProteinChange"
            activeColor="#4caf50"
            backgroundColor="#e8f5e9"
          />
          <view class="ratio-grams">
            <text class="grams-label">目标克数：</text>
            <text class="grams-value">{{ proteinGrams }}g</text>
          </view>
        </view>

        <view class="ratio-item carbs">
          <view class="ratio-header">
            <text class="ratio-name">碳水化合物</text>
            <text class="ratio-value">{{ carbsPercent }}%</text>
          </view>
          <slider
            class="ratio-slider"
            :value="carbsPercent"
            min="30"
            max="70"
            step="1"
            @change="onCarbsChange"
            activeColor="#2196f3"
            backgroundColor="#e3f2fd"
          />
          <view class="ratio-grams">
            <text class="grams-label">目标克数：</text>
            <text class="grams-value">{{ carbsGrams }}g</text>
          </view>
        </view>

        <view class="ratio-item fat">
          <view class="ratio-header">
            <text class="ratio-name">脂肪</text>
            <text class="ratio-value">{{ fatPercent }}%</text>
          </view>
          <slider
            class="ratio-slider"
            :value="fatPercent"
            min="15"
            max="40"
            step="1"
            @change="onFatChange"
            activeColor="#ff9800"
            backgroundColor="#fff3e0"
          />
          <view class="ratio-grams">
            <text class="grams-label">目标克数：</text>
            <text class="grams-value">{{ fatGrams }}g</text>
          </view>
        </view>
      </view>

      <view class="ratio-summary">
        <text class="summary-text"
          >总计：{{ proteinPercent + carbsPercent + fatPercent }}%</text
        >
        <text
          class="summary-tip"
          v-if="proteinPercent + carbsPercent + fatPercent !== 100"
        >
          ⚠️ 比例总和应为100%，当前差{{
            100 - (proteinPercent + carbsPercent + fatPercent)
          }}%
        </text>
      </view>
    </view>

    <!-- 快速预设 -->
    <view class="presets-section">
      <text class="section-title">快速预设</text>
      <view class="preset-buttons">
        <button
          class="preset-btn"
          :class="{ active: activePreset === 'balanced' }"
          @tap="applyPreset('balanced')"
        >
          均衡饮食 (30%蛋白/50%碳水/20%脂肪)
        </button>
        <button
          class="preset-btn"
          :class="{ active: activePreset === 'highprotein' }"
          @tap="applyPreset('highprotein')"
        >
          高蛋白饮食 (40%蛋白/40%碳水/20%脂肪)
        </button>
        <button
          class="preset-btn"
          :class="{ active: activePreset === 'lowcarb' }"
          @tap="applyPreset('lowcarb')"
        >
          低碳水饮食 (35%蛋白/30%碳水/35%脂肪)
        </button>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-section">
      <button
        class="save-btn"
        @tap="saveNutritionTarget"
        :disabled="isSaving || !isValid"
        :class="{ 'disabled-btn': isSaving || !isValid }"
      >
        {{ isSaving ? "保存中..." : "保存设置" }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { userApi } from "../../../api/index.js";

const dailyCalorieTarget = ref(2000);
const proteinPercent = ref(30);
const carbsPercent = ref(50);
const fatPercent = ref(20);
const activePreset = ref("balanced");
const isSaving = ref(false);

// 计算克数
const proteinGrams = computed(() => {
  return Math.round(
    (dailyCalorieTarget.value * proteinPercent.value) / 100 / 4,
  );
});

const carbsGrams = computed(() => {
  return Math.round((dailyCalorieTarget.value * carbsPercent.value) / 100 / 4);
});

const fatGrams = computed(() => {
  return Math.round((dailyCalorieTarget.value * fatPercent.value) / 100 / 9);
});

// 验证比例总和是否为100%
const isValid = computed(() => {
  const total = proteinPercent.value + carbsPercent.value + fatPercent.value;
  return total === 100;
});

// 蛋白质比例变化
const onProteinChange = (e) => {
  proteinPercent.value = e.detail.value;
  adjustOtherRatios("protein");
};

// 碳水比例变化
const onCarbsChange = (e) => {
  carbsPercent.value = e.detail.value;
  adjustOtherRatios("carbs");
};

// 脂肪比例变化
const onFatChange = (e) => {
  fatPercent.value = e.detail.value;
  adjustOtherRatios("fat");
};

// 调整其他比例以保持总和100%
const adjustOtherRatios = (changed) => {
  const total = proteinPercent.value + carbsPercent.value + fatPercent.value;
  const diff = total - 100;

  if (Math.abs(diff) < 0.5) return;

  if (changed === "protein") {
    // 调整碳水和脂肪，按原比例分配
    const carbsRatio =
      carbsPercent.value / (carbsPercent.value + fatPercent.value) || 0.5;
    const fatRatio = 1 - carbsRatio;

    carbsPercent.value = Math.max(10, carbsPercent.value - diff * carbsRatio);
    fatPercent.value = Math.max(15, fatPercent.value - diff * fatRatio);
  } else if (changed === "carbs") {
    const proteinRatio =
      proteinPercent.value / (proteinPercent.value + fatPercent.value) || 0.5;
    const fatRatio = 1 - proteinRatio;

    proteinPercent.value = Math.max(
      10,
      proteinPercent.value - diff * proteinRatio,
    );
    fatPercent.value = Math.max(15, fatPercent.value - diff * fatRatio);
  } else if (changed === "fat") {
    const proteinRatio =
      proteinPercent.value / (proteinPercent.value + carbsPercent.value) || 0.5;
    const carbsRatio = 1 - proteinRatio;

    proteinPercent.value = Math.max(
      10,
      proteinPercent.value - diff * proteinRatio,
    );
    carbsPercent.value = Math.max(30, carbsPercent.value - diff * carbsRatio);
  }
};

// 应用预设
const applyPreset = (preset) => {
  activePreset.value = preset;

  switch (preset) {
    case "balanced":
      proteinPercent.value = 30;
      carbsPercent.value = 50;
      fatPercent.value = 20;
      break;
    case "highprotein":
      proteinPercent.value = 40;
      carbsPercent.value = 40;
      fatPercent.value = 20;
      break;
    case "lowcarb":
      proteinPercent.value = 35;
      carbsPercent.value = 30;
      fatPercent.value = 35;
      break;
  }
};

// 保存营养目标
const saveNutritionTarget = async () => {
  if (!isValid.value) {
    uni.showToast({
      title: "比例总和必须为100%",
      icon: "none",
      duration: 2000,
    });
    return;
  }

  isSaving.value = true;

  try {
    const data = {
      dailyCalories: dailyCalorieTarget.value,
      nutrition: {
        protein: proteinGrams.value,
        carbs: carbsGrams.value,
        fat: fatGrams.value,
        proteinPercent: proteinPercent.value,
        carbsPercent: carbsPercent.value,
        fatPercent: fatPercent.value,
      },
    };

    const res = await userApi.updateTarget(data);

    if (res.code === 1 || res.code === 200) {
      uni.showToast({
        title: "营养目标已保存",
        icon: "success",
        duration: 2000,
      });

      // 保存成功后延迟返回
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({
        title: res.msg || "保存失败，请重试",
        icon: "none",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("保存营养目标失败:", error);
    uni.showToast({
      title: "网络错误，请稍后重试",
      icon: "none",
      duration: 2000,
    });
  } finally {
    isSaving.value = false;
  }
};

// 加载已有的营养目标
const loadNutritionTarget = async () => {
  try {
    const res = await userApi.getTarget();
    if (res.code === 1 || res.code === 200) {
      const data = res.data;
      if (data) {
        dailyCalorieTarget.value = data.dailyCalories || 2000;

        if (data.nutrition) {
          proteinPercent.value = data.nutrition.proteinPercent || 30;
          carbsPercent.value = data.nutrition.carbsPercent || 50;
          fatPercent.value = data.nutrition.fatPercent || 20;
        }
      }
    }
  } catch (error) {
    console.error("加载营养目标失败:", error);
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 组件挂载时加载数据
onMounted(() => {
  loadNutritionTarget();
});
</script>

<style scoped>
.safe-area {
  padding-top: calc(env(safe-area-inset-top) + 44rpx);
  padding-top: var(--app-header-top) !important;
  padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
  padding-bottom: calc(var(--app-safe-bottom) + 20rpx);
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e8f0f8 100%);
}

.nutrition-container {
  padding: 0 30rpx;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.back-btn {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12rpx 28rpx rgba(70, 104, 136, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: #486988;
}

.page-title {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
}

.description {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
}

.description-text {
  font-size: 28rpx;
  color: white;
  line-height: 1.5;
}

/* 总热量目标 */
.calorie-target {
  background: white;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.calorie-input-group {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.calorie-input {
  flex: 1;
  height: 100rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 30rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
}

.calorie-unit {
  font-size: 32rpx;
  color: #666;
  margin-left: 20rpx;
  font-weight: 500;
}

.calorie-tip {
  font-size: 26rpx;
  color: #666;
  display: block;
  text-align: center;
}

/* 营养比例设置 */
.ratio-section {
  background: white;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.ratio-subtitle {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 30rpx;
}

.ratio-controls {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.ratio-item {
  padding: 30rpx;
  border-radius: 20rpx;
}

.ratio-item.protein {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.ratio-item.carbs {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.ratio-item.fat {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.ratio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.ratio-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.ratio-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.ratio-slider {
  margin: 20rpx 0;
}

.ratio-grams {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15rpx;
}

.grams-label {
  font-size: 26rpx;
  color: #666;
}

.grams-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.ratio-summary {
  margin-top: 40rpx;
  padding-top: 30rpx;
  border-top: 2rpx solid #eee;
}

.summary-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.summary-tip {
  font-size: 26rpx;
  color: #f44336;
  display: block;
}

/* 快速预设 */
.presets-section {
  background: white;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.preset-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 20rpx;
}

.preset-btn {
  background: #f5f5f5;
  color: #666;
  border-radius: 16rpx;
  padding: 30rpx;
  font-size: 28rpx;
  text-align: left;
  border: none;
  transition: all 0.3s;
}

.preset-btn.active {
  background: linear-gradient(135deg, #00c853 0%, #00b248 100%);
  color: white;
  font-weight: bold;
}

/* 保存按钮 */
.save-section {
  padding: 40rpx 0;
}

.save-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #00c853 0%, #00b248 100%);
  color: white;
  font-size: 36rpx;
  font-weight: bold;
  border-radius: 20rpx;
  border: none;
  transition: all 0.3s;
}

.disabled-btn {
  background: #ccc;
  color: #888;
  opacity: 0.7;
}
</style>
