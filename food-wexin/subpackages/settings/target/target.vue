<template>
  <view class="target-container safe-area">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">目标设置</text>
      <view style="width: 80rpx"></view>
    </view>

    <!-- 说明 -->
    <view class="description">
      <text class="description-text">
        设置您的健康目标，系统将根据目标提供个性化的饮食建议和进度追踪。
      </text>
    </view>

    <!-- 目标类型 -->
    <view class="target-section">
      <text class="section-title">目标类型</text>

      <view class="target-type-options">
        <view
          class="target-type-option"
          v-for="type in targetTypes"
          :key="type.id"
          :class="{ selected: selectedTargetType === type.id }"
          @tap="selectTargetType(type.id)"
        >
          <text class="target-icon">{{ type.icon }}</text>
          <text class="target-name">{{ type.name }}</text>
          <text class="target-desc">{{ type.description }}</text>
          <view class="checkmark" v-if="selectedTargetType === type.id">✓</view>
        </view>
      </view>
    </view>

    <!-- 体重管理 -->
    <view class="target-section">
      <text class="section-title">体重管理</text>

      <view class="weight-management">
        <view class="weight-input-group">
          <view class="weight-input-item">
            <text class="weight-label">当前体重</text>
            <view class="weight-input-box">
              <input
                class="weight-input"
                type="number"
                v-model="currentWeight"
                placeholder="请输入"
              />
              <text class="weight-unit">kg</text>
            </view>
          </view>

          <view class="weight-input-item">
            <text class="weight-label">目标体重</text>
            <view class="weight-input-box">
              <input
                class="weight-input"
                type="number"
                v-model="targetWeight"
                placeholder="请输入"
              />
              <text class="weight-unit">kg</text>
            </view>
          </view>
        </view>

        <view class="weight-difference">
          <text class="diff-label">目标变化：</text>
          <text class="diff-value" :class="weightDiffClass">
            {{ weightDiffText }}
          </text>
        </view>

        <view class="bmi-info" v-if="currentWeight && height">
          <text class="bmi-label">当前BMI：</text>
          <text class="bmi-value">{{ currentBMI }}</text>
          <text class="bmi-category">{{ bmiCategory }}</text>
        </view>
      </view>
    </view>

    <!-- 身高设置 -->
    <view class="target-section">
      <text class="section-title">身高设置</text>

      <view class="height-setting">
        <text class="height-label">身高</text>
        <view class="height-input-group">
          <input
            class="height-input"
            type="number"
            v-model="height"
            placeholder="请输入身高"
          />
          <text class="height-unit">cm</text>
        </view>
      </view>
    </view>

    <!-- 热量目标 -->
    <view class="target-section">
      <text class="section-title">每日热量目标</text>

      <view class="calorie-target">
        <text class="calorie-value">{{ calculatedCalorieTarget }} kcal</text>
        <text class="calorie-desc">基于您的目标自动计算</text>

        <view class="calorie-slider">
          <slider
            :value="calorieAdjustment"
            min="-500"
            max="500"
            step="50"
            @change="onCalorieAdjustmentChange"
            activeColor="#07c160"
            backgroundColor="#e8f5e9"
          />
          <view class="slider-labels">
            <text class="slider-label">-500 kcal</text>
            <text class="slider-value">{{ calorieAdjustment }} kcal</text>
            <text class="slider-label">+500 kcal</text>
          </view>
        </view>

        <view class="calorie-breakdown">
          <text class="breakdown-title">热量构成：</text>
          <view class="breakdown-items">
            <view class="breakdown-item">
              <text class="item-label">基础代谢</text>
              <text class="item-value">{{ bmr }} kcal</text>
            </view>
            <view class="breakdown-item">
              <text class="item-label">活动消耗</text>
              <text class="item-value">{{ activityCalories }} kcal</text>
            </view>
            <view class="breakdown-item">
              <text class="item-label">目标调整</text>
              <text class="item-value">{{ calorieAdjustment }} kcal</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 活动水平 -->
    <view class="target-section">
      <text class="section-title">活动水平</text>

      <view class="activity-options">
        <view
          class="activity-option"
          v-for="level in activityLevels"
          :key="level.id"
          :class="{ selected: selectedActivityLevel === level.id }"
          @tap="selectActivityLevel(level.id)"
        >
          <text class="activity-icon">{{ level.icon }}</text>
          <text class="activity-name">{{ level.name }}</text>
          <text class="activity-desc">{{ level.description }}</text>
          <view class="activity-factor">×{{ level.factor }}</view>
        </view>
      </view>
    </view>

    <!-- 目标期限 -->
    <view class="target-section">
      <text class="section-title">目标期限</text>

      <view class="duration-setting">
        <text class="duration-label">计划时长</text>
        <view class="duration-slider">
          <slider
            :value="targetDuration"
            min="7"
            max="365"
            step="7"
            @change="onDurationChange"
            activeColor="#07c160"
          />
          <view class="duration-labels">
            <text class="duration-label">1周</text>
            <text class="duration-value">{{ targetDuration }}天</text>
            <text class="duration-label">1年</text>
          </view>
        </view>

        <view class="weekly-progress">
          <text class="progress-label">每周减重：</text>
          <text class="progress-value">{{ weeklyWeightLoss }} kg/周</text>
        </view>
      </view>
    </view>

    <!-- 进度追踪 -->
    <view class="target-section">
      <text class="section-title">进度追踪</text>

      <view class="progress-tracking">
        <view class="progress-stats">
          <view class="stat-item">
            <text class="stat-value">{{ daysCompleted }}</text>
            <text class="stat-label">已坚持天数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ progressPercentage }}%</text>
            <text class="stat-label">完成进度</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ caloriesRemaining }} kcal</text>
            <text class="stat-label">剩余热量</text>
          </view>
        </view>

        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{ width: progressPercentage + '%' }"
          ></view>
        </view>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-section">
      <button
        class="save-btn"
        @tap="saveTargetSettings"
        :disabled="isSaving"
        :class="{ 'disabled-btn': isSaving }"
      >
        {{ isSaving ? "保存中..." : "保存目标设置" }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { userApi } from "../../../api/index.js";

const isSaving = ref(false);

// 目标类型
const targetTypes = [
  {
    id: "weight_loss",
    icon: "📉",
    name: "减重",
    description: "减少体重，塑造体型",
  },
  {
    id: "weight_maintain",
    icon: "⚖️",
    name: "维持体重",
    description: "保持当前体重不变",
  },
  {
    id: "weight_gain",
    icon: "📈",
    name: "增重",
    description: "增加体重，增加肌肉",
  },
  {
    id: "body_recomposition",
    icon: "💪",
    name: "体型重塑",
    description: "减脂增肌同时进行",
  },
];
const selectedTargetType = ref("weight_loss");

// 体重数据
const currentWeight = ref(65);
const targetWeight = ref(60);
const height = ref(170);

// 活动水平
const activityLevels = [
  {
    id: "sedentary",
    icon: "🛋️",
    name: "久坐",
    description: "很少或没有运动",
    factor: 1.2,
  },
  {
    id: "light",
    icon: "🚶",
    name: "轻度活动",
    description: "每周1-3次轻度运动",
    factor: 1.375,
  },
  {
    id: "moderate",
    icon: "🏃",
    name: "中度活动",
    description: "每周3-5次中度运动",
    factor: 1.55,
  },
  {
    id: "active",
    icon: "🏋️",
    name: "活跃",
    description: "每周6-7次高强度运动",
    factor: 1.725,
  },
  {
    id: "very_active",
    icon: "🚴",
    name: "非常活跃",
    description: "体力劳动者或运动员",
    factor: 1.9,
  },
];
const selectedActivityLevel = ref("moderate");

// 热量调整
const calorieAdjustment = ref(-300);
const targetDuration = ref(90);

// 计算属性
// 体重差值
const weightDiff = computed(() => {
  return targetWeight.value - currentWeight.value;
});

const weightDiffText = computed(() => {
  const diff = weightDiff.value;
  if (diff > 0) return `+${diff.toFixed(1)} kg`;
  if (diff < 0) return `${diff.toFixed(1)} kg`;
  return "0 kg";
});

const weightDiffClass = computed(() => {
  const diff = weightDiff.value;
  if (diff > 0) return "gain";
  if (diff < 0) return "loss";
  return "maintain";
});

// BMI计算
const currentBMI = computed(() => {
  if (!currentWeight.value || !height.value) return "--";
  const heightM = height.value / 100;
  return (currentWeight.value / (heightM * heightM)).toFixed(1);
});

const bmiCategory = computed(() => {
  const bmi = parseFloat(currentBMI.value);
  if (isNaN(bmi)) return "";
  if (bmi < 18.5) return "偏瘦";
  if (bmi < 24) return "正常";
  if (bmi < 28) return "超重";
  return "肥胖";
});

// 基础代谢率（BMR）计算
const bmr = computed(() => {
  if (!currentWeight.value || !height.value) return 0;
  // 使用Mifflin-St Jeor公式
  const age = 30; // 假设年龄30岁，实际应该从用户信息获取
  const bmrValue = 10 * currentWeight.value + 6.25 * height.value - 5 * age + 5;
  return Math.round(bmrValue);
});

// 活动水平系数
const activityFactor = computed(() => {
  const level = activityLevels.find(
    (l) => l.id === selectedActivityLevel.value,
  );
  return level ? level.factor : 1.55;
});

// 活动消耗热量
const activityCalories = computed(() => {
  return Math.round(bmr.value * (activityFactor.value - 1));
});

// 计算的热量目标
const calculatedCalorieTarget = computed(() => {
  const base = bmr.value * activityFactor.value;
  const target = base + calorieAdjustment.value;
  return Math.max(1200, Math.round(target)); // 最低1200kcal
});

// 每周减重
const weeklyWeightLoss = computed(() => {
  if (weightDiff.value >= 0) return "--";
  const weeks = targetDuration.value / 7;
  return Math.abs(weightDiff.value / weeks).toFixed(2);
});

// 进度追踪
const daysCompleted = computed(() => {
  // 模拟数据，实际应该从后端获取
  return 15;
});

const progressPercentage = computed(() => {
  return Math.min(
    100,
    Math.round((daysCompleted.value / targetDuration.value) * 100),
  );
});

const caloriesRemaining = computed(() => {
  const daysLeft = targetDuration.value - daysCompleted.value;
  return Math.max(0, daysLeft * calculatedCalorieTarget.value);
});

// 选择目标类型
const selectTargetType = (typeId) => {
  selectedTargetType.value = typeId;

  // 根据目标类型自动调整热量
  switch (typeId) {
    case "weight_loss":
      calorieAdjustment.value = -300;
      break;
    case "weight_maintain":
      calorieAdjustment.value = 0;
      break;
    case "weight_gain":
      calorieAdjustment.value = 300;
      break;
    case "body_recomposition":
      calorieAdjustment.value = -100;
      break;
  }
};

// 选择活动水平
const selectActivityLevel = (levelId) => {
  selectedActivityLevel.value = levelId;
};

// 热量调整变化
const onCalorieAdjustmentChange = (e) => {
  calorieAdjustment.value = e.detail.value;
};

// 目标期限变化
const onDurationChange = (e) => {
  targetDuration.value = e.detail.value;
};

// 保存目标设置
const saveTargetSettings = async () => {
  if (!currentWeight.value || !targetWeight.value || !height.value) {
    uni.showToast({
      title: "请填写完整的体重和身高信息",
      icon: "none",
      duration: 2000,
    });
    return;
  }

  isSaving.value = true;

  try {
    const data = {
      targetType: selectedTargetType.value,
      currentWeight: currentWeight.value,
      targetWeight: targetWeight.value,
      height: height.value,
      activityLevel: selectedActivityLevel.value,
      dailyCalories: calculatedCalorieTarget.value,
      calorieAdjustment: calorieAdjustment.value,
      targetDuration: targetDuration.value,
      bmr: bmr.value,
      bmi: currentBMI.value,
    };

    const res = await userApi.updateTarget(data);

    if (res.code === 1 || res.code === 200) {
      uni.showToast({
        title: "目标设置已保存",
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
    console.error("保存目标设置失败:", error);
    uni.showToast({
      title: "网络错误，请稍后重试",
      icon: "none",
      duration: 2000,
    });
  } finally {
    isSaving.value = false;
  }
};

// 加载已有的目标设置
const loadTargetSettings = async () => {
  try {
    const res = await userApi.getTarget();
    if (res.code === 1 || res.code === 200) {
      const data = res.data;
      if (data) {
        selectedTargetType.value = data.targetType || "weight_loss";
        currentWeight.value = data.currentWeight || 65;
        targetWeight.value = data.targetWeight || 60;
        height.value = data.height || 170;
        selectedActivityLevel.value = data.activityLevel || "moderate";
        calorieAdjustment.value = data.calorieAdjustment || -300;
        targetDuration.value = data.targetDuration || 90;
      }
    }
  } catch (error) {
    console.error("加载目标设置失败:", error);
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 组件挂载时加载数据
onMounted(() => {
  loadTargetSettings();
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

.target-container {
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

/* 目标区域 */
.target-section {
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
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

/* 目标类型选项 */
.target-type-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.target-type-option {
  flex: 1 1 45%;
  background: #f8f9fa;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s;
  position: relative;
  min-width: 0;
}

.target-type-option.selected {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 4rpx solid #6a8caf;
  transform: translateY(-4rpx);
  box-shadow: 0 15rpx 30rpx rgba(106, 140, 175, 0.2);
}

.target-icon {
  font-size: 60rpx;
  margin-bottom: 15rpx;
}

.target-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.target-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.3;
}

.checkmark {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 40rpx;
  height: 40rpx;
  background: #00c853;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
}

/* 体重管理 */
.weight-management {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.weight-input-group {
  display: flex;
  gap: 30rpx;
}

.weight-input-item {
  flex: 1;
}

.weight-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.weight-input-box {
  display: flex;
  align-items: center;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  background-color: #f9f9f9;
  overflow: hidden;
}

.weight-input {
  flex: 1;
  padding: 24rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  border: none;
  background: transparent;
}

.weight-unit {
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.weight-difference {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
}

.diff-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.diff-value {
  font-size: 32rpx;
  font-weight: bold;
}

.diff-value.gain {
  color: #4caf50;
}

.diff-value.loss {
  color: #f44336;
}

.diff-value.maintain {
  color: #ff9800;
}

.bmi-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background: #f0f9ff;
  border-radius: 12rpx;
}

.bmi-label {
  font-size: 26rpx;
  color: #666;
}

.bmi-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #2196f3;
}

.bmi-category {
  font-size: 26rpx;
  color: #666;
  padding: 8rpx 16rpx;
  background: #e3f2fd;
  border-radius: 8rpx;
}

/* 身高设置 */
.height-setting {
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.height-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  min-width: 80rpx;
}

.height-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  background-color: #f9f9f9;
  overflow: hidden;
}

.height-input {
  flex: 1;
  padding: 24rpx;
  font-size: 32rpx;
  color: #333;
  border: none;
  background: transparent;
}

.height-unit {
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #666;
}

/* 热量目标 */
.calorie-target {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.calorie-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
}

.calorie-desc {
  font-size: 26rpx;
  color: #666;
  text-align: center;
}

.calorie-slider {
  margin: 20rpx 0;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
}

.slider-label {
  font-size: 24rpx;
  color: #666;
}

.slider-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #07c160;
}

.calorie-breakdown {
  background: #f9f9f9;
  border-radius: 16rpx;
  padding: 30rpx;
}

.breakdown-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 20rpx;
}

.breakdown-items {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  font-size: 26rpx;
  color: #666;
}

.item-value {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
}

/* 活动水平 */
.activity-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.activity-option {
  background: #f8f9fa;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  transition: all 0.3s;
}

.activity-option.selected {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 2rpx solid #00c853;
}

.activity-icon {
  font-size: 40rpx;
}

.activity-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.activity-desc {
  flex: 2;
  font-size: 24rpx;
  color: #666;
}

.activity-factor {
  font-size: 28rpx;
  font-weight: bold;
  color: #07c160;
}

/* 目标期限 */
.duration-setting {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.duration-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.duration-slider {
  margin: 20rpx 0;
}

.duration-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
}

.duration-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #07c160;
}

.weekly-progress {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
}

.progress-label {
  font-size: 26rpx;
  color: #666;
}

.progress-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #07c160;
}

/* 进度追踪 */
.progress-tracking {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.progress-bar {
  width: 100%;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #07c160 0%, #05a854 100%);
  border-radius: 8rpx;
  transition: width 0.5s ease;
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
