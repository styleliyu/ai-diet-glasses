<template>
  <view class="onboarding-page safe-area">
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <view class="header-main">
        <text class="page-title">首次资料问答</text>
        <text class="page-subtitle">完成后会自动写入设置页，后续都能修改</text>
      </view>
      <text class="step-pill">{{ currentStep }}/3</text>
    </view>

    <view class="progress-bar">
      <view class="progress-value" :style="{ width: `${(currentStep / 3) * 100}%` }"></view>
    </view>

    <scroll-view scroll-y class="page-scroll">
      <view v-if="currentStep === 1" class="section-card">
        <text class="section-title">个人信息</text>
        <text class="section-tip">这些信息会填充到“账户信息”和“目标设置”里。</text>

        <view class="field-card">
          <text class="field-label">昵称</text>
          <input v-model="form.nickname" class="field-input" placeholder="例如：小夏" />
        </view>

        <view class="field-card">
          <text class="field-label">性别</text>
          <view class="tag-grid">
            <text
              v-for="item in genderOptions"
              :key="item.value"
              class="tag-item"
              :class="{ active: form.gender === item.value }"
              @tap="form.gender = item.value"
            >
              {{ item.label }}
            </text>
          </view>
        </view>

        <view class="field-card">
          <text class="field-label">生日</text>
          <picker mode="date" :value="form.birthday" @change="form.birthday = $event.detail.value">
            <view class="picker-field">{{ form.birthday || "请选择生日" }}</view>
          </picker>
        </view>

        <view class="field-row">
          <view class="field-card half">
            <text class="field-label">身高(cm)</text>
            <input v-model="form.height" type="digit" class="field-input" placeholder="170" />
          </view>
          <view class="field-card half">
            <text class="field-label">当前体重(kg)</text>
            <input v-model="form.weight" type="digit" class="field-input" placeholder="60" />
          </view>
        </view>
      </view>

      <view v-else-if="currentStep === 2" class="section-card">
        <text class="section-title">目标与饮食习惯</text>
        <text class="section-tip">这些内容会同步到“目标设置”和“饮食偏好”。</text>

        <view class="field-card">
          <text class="field-label">当前目标</text>
          <view class="tag-grid">
            <text
              v-for="item in goalOptions"
              :key="item.value"
              class="tag-item"
              :class="{ active: form.goalType === item.value }"
              @tap="form.goalType = item.value"
            >
              {{ item.label }}
            </text>
          </view>
        </view>

        <view class="field-card">
          <text class="field-label">日常活动量</text>
          <view class="tag-grid">
            <text
              v-for="item in activityOptions"
              :key="item.value"
              class="tag-item"
              :class="{ active: form.activityLevel === item.value }"
              @tap="form.activityLevel = item.value"
            >
              {{ item.label }}
            </text>
          </view>
        </view>

        <view class="field-row">
          <view class="field-card half">
            <text class="field-label">目标体重(kg)</text>
            <input v-model="form.targetWeight" type="digit" class="field-input" placeholder="55" />
          </view>
          <view class="field-card half">
            <text class="field-label">饮食风格</text>
            <view class="tag-grid compact">
              <text
                v-for="item in dietOptions"
                :key="item.value"
                class="tag-item"
                :class="{ active: form.dietType === item.value }"
                @tap="form.dietType = item.value"
              >
                {{ item.label }}
              </text>
            </view>
          </view>
        </view>

        <view class="field-card">
          <text class="field-label">喜欢的食物类别</text>
          <view class="tag-grid">
            <text
              v-for="item in foodCategories"
              :key="item.id"
              class="tag-item"
              :class="{ active: form.likedCategories.includes(item.id) }"
              @tap="toggleListItem(form.likedCategories, item.id)"
            >
              {{ item.name }}
            </text>
          </view>
        </view>

        <view class="field-card">
          <text class="field-label">尽量避免的类别</text>
          <view class="tag-grid">
            <text
              v-for="item in foodCategories"
              :key="`avoid-${item.id}`"
              class="tag-item danger"
              :class="{ active: form.dislikedCategories.includes(item.id) }"
              @tap="toggleListItem(form.dislikedCategories, item.id)"
            >
              {{ item.name }}
            </text>
          </view>
        </view>

        <view class="field-card">
          <text class="field-label">特殊需求</text>
          <view class="switch-list">
            <view class="switch-item">
              <text>低盐</text>
              <switch :checked="form.specialNeeds.lowSalt" color="#2f9f63" @change="form.specialNeeds.lowSalt = $event.detail.value" />
            </view>
            <view class="switch-item">
              <text>低糖</text>
              <switch :checked="form.specialNeeds.lowSugar" color="#2f9f63" @change="form.specialNeeds.lowSugar = $event.detail.value" />
            </view>
            <view class="switch-item">
              <text>低脂</text>
              <switch :checked="form.specialNeeds.lowFat" color="#2f9f63" @change="form.specialNeeds.lowFat = $event.detail.value" />
            </view>
            <view class="switch-item">
              <text>高纤维</text>
              <switch :checked="form.specialNeeds.highFiber" color="#2f9f63" @change="form.specialNeeds.highFiber = $event.detail.value" />
            </view>
          </view>
        </view>

        <view class="field-card">
          <text class="field-label">常吃食物</text>
          <textarea v-model="form.favoriteFoods" class="field-textarea" maxlength="100" placeholder="例如：鸡胸肉、燕麦、酸奶" />
        </view>

        <view class="field-card">
          <text class="field-label">需要提醒我少吃</text>
          <textarea v-model="form.avoidList" class="field-textarea" maxlength="100" placeholder="例如：高糖饮料、油炸夜宵" />
        </view>
      </view>

      <view v-else class="section-card">
        <text class="section-title">过敏与禁忌</text>
        <text class="section-tip">会写入“过敏与禁忌”，后续你可以继续补充。</text>

        <view class="field-card">
          <text class="field-label">常见过敏原</text>
          <view class="tag-grid">
            <text
              v-for="item in allergenOptions"
              :key="item.id"
              class="tag-item danger"
              :class="{ active: form.standardAllergens.includes(item.id) }"
              @tap="toggleListItem(form.standardAllergens, item.id)"
            >
              {{ item.name }}
            </text>
          </view>
        </view>

        <view class="field-card">
          <text class="field-label">自定义禁忌</text>
          <view class="input-row">
            <input
              v-model="customAllergen"
              class="field-input compact-input"
              placeholder="例如：芒果、酒精"
              @confirm="addCustomAllergen"
            />
            <text class="add-btn" @tap="addCustomAllergen">添加</text>
          </view>
          <view v-if="form.customAllergens.length" class="tag-grid">
            <text
              v-for="(item, index) in form.customAllergens"
              :key="`${item}-${index}`"
              class="tag-item danger active"
              @tap="removeCustomAllergen(index)"
            >
              {{ item }} ×
            </text>
          </view>
        </view>

        <view class="field-card summary-card">
          <text class="field-label">保存后会写入这些设置</text>
          <text class="summary-line">账户信息：{{ form.nickname || username }} / {{ genderLabel }}</text>
          <text class="summary-line">目标设置：{{ estimatedDailyCalories }} kcal/日</text>
          <text class="summary-line">饮食偏好：{{ dietLabel }}</text>
          <text class="summary-line">过敏与禁忌：{{ allergySummary }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="footer-bar">
      <button class="footer-btn muted" @tap="handleSecondaryAction">
        {{ currentStep === 1 ? "稍后再说" : "上一步" }}
      </button>
      <button class="footer-btn primary" :loading="isSaving" @tap="handlePrimaryAction">
        {{ currentStep === 3 ? "完成并保存" : "下一步" }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { userApi } from "../../../api/index.js";
import {
  buildNutritionTarget,
  calculateDailyCalories,
  saveOnboardingProfile,
} from "../../../utils/user-settings.js";

const currentStep = ref(1);
const isSaving = ref(false);
const username = ref("");
const email = ref("");
const password = ref("");
const customAllergen = ref("");

const form = reactive({
  nickname: "",
  gender: "unknown",
  birthday: "",
  height: "",
  weight: "",
  goalType: "maintain",
  activityLevel: "moderate",
  targetWeight: "",
  dietType: "balanced",
  likedCategories: ["vegetables", "fruits", "grains", "protein"],
  dislikedCategories: [],
  specialNeeds: {
    lowSalt: false,
    lowSugar: false,
    lowFat: false,
    highFiber: true,
  },
  favoriteFoods: "",
  avoidList: "",
  standardAllergens: [],
  customAllergens: [],
});

const genderOptions = [
  { label: "男", value: "male" },
  { label: "女", value: "female" },
  { label: "保密", value: "unknown" },
];

const goalOptions = [
  { label: "减脂", value: "lose" },
  { label: "维持", value: "maintain" },
  { label: "增肌", value: "gain" },
];

const activityOptions = [
  { label: "久坐较多", value: "low" },
  { label: "日常活动", value: "moderate" },
  { label: "运动频繁", value: "high" },
];

const dietOptions = [
  { label: "均衡饮食", value: "balanced" },
  { label: "高蛋白", value: "highprotein" },
  { label: "低脂饮食", value: "lowFat" },
  { label: "低碳水", value: "lowcarb" },
  { label: "素食", value: "vegetarian" },
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

const allergenOptions = [
  { id: "peanut", name: "花生" },
  { id: "milk", name: "牛奶" },
  { id: "egg", name: "鸡蛋" },
  { id: "soy", name: "大豆" },
  { id: "wheat", name: "小麦" },
  { id: "fish", name: "鱼类" },
  { id: "shellfish", name: "甲壳类" },
  { id: "nuts", name: "坚果" },
  { id: "sesame", name: "芝麻" },
];

const genderLabel = computed(() => {
  return (
    genderOptions.find((item) => item.value === form.gender)?.label || "保密"
  );
});

const dietLabel = computed(() => {
  return (
    dietOptions.find((item) => item.value === form.dietType)?.label || "均衡饮食"
  );
});

const allergySummary = computed(() => {
  const standardLabels = allergenOptions
    .filter((item) => form.standardAllergens.includes(item.id))
    .map((item) => item.name);
  const allNames = standardLabels.concat(form.customAllergens);
  return allNames.length > 0 ? allNames.join("、") : "暂无";
});

const estimatedDailyCalories = computed(() => {
  return calculateDailyCalories({
    weight: form.weight,
    goalType: form.goalType,
    activityLevel: form.activityLevel,
  });
});

function toggleListItem(target, value) {
  const index = target.indexOf(value);
  if (index > -1) {
    target.splice(index, 1);
    return;
  }

  target.push(value);
}

function addCustomAllergen() {
  const value = customAllergen.value.trim();
  if (!value || form.customAllergens.includes(value)) return;
  form.customAllergens.push(value);
  customAllergen.value = "";
}

function removeCustomAllergen(index) {
  form.customAllergens.splice(index, 1);
}

function validateCurrentStep() {
  if (currentStep.value === 1) {
    if (!form.nickname.trim()) {
      uni.showToast({ title: "请先填写昵称", icon: "none" });
      return false;
    }
    return true;
  }

  return true;
}

function goToLogin() {
  uni.redirectTo({
    url: "/pages/login/login",
    fail: () => {
      uni.reLaunch({ url: "/pages/login/login" });
    },
  });
}

function goBack() {
  if (currentStep.value > 1) {
    currentStep.value -= 1;
    return;
  }

  goToLogin();
}

function handleSecondaryAction() {
  if (currentStep.value === 1) {
    goToLogin();
    return;
  }

  currentStep.value -= 1;
}

async function completeOnboarding() {
  if (!username.value.trim()) {
    uni.showToast({ title: "缺少账号信息，请重新注册", icon: "none" });
    goToLogin();
    return;
  }

  isSaving.value = true;

  const target = {
    dailyCalories: estimatedDailyCalories.value,
    isCustomDailyCalories: false,
    targetWeight: form.targetWeight ? Number(form.targetWeight) : "",
    note: `${dietLabel.value} / ${goalOptions.find((item) => item.value === form.goalType)?.label || "维持"}`,
    goalType: form.goalType,
    activityLevel: form.activityLevel,
  };

  const nutrition = buildNutritionTarget(target.dailyCalories);
  const preferences = {
    dietType: form.dietType,
    likedCategories: [...form.likedCategories],
    dislikedCategories: [...form.dislikedCategories],
    specialNeeds: { ...form.specialNeeds },
    favoriteFoods: form.favoriteFoods,
    avoidList: form.avoidList,
    activityLevel: form.activityLevel,
  };
  const allergies = {
    standardAllergens: [...form.standardAllergens],
    customAllergens: [...form.customAllergens],
    allergyList: allergySummary.value === "暂无" ? "" : allergySummary.value,
    intolerances: form.customAllergens.join("、"),
  };

  const savedProfile = saveOnboardingProfile({
    username: username.value,
    email: email.value,
    password: password.value,
    userInfo: {
      nickname: form.nickname.trim(),
      gender: form.gender,
      birthday: form.birthday,
      height: form.height,
      weight: form.weight,
    },
    target,
    nutrition,
    preferences,
    allergies,
  });

  try {
    await Promise.all([
      userApi.updateUserInfo(savedProfile.userInfo),
      userApi.updateTarget(savedProfile.target),
      userApi.updatePreferences(savedProfile.preferences),
      userApi.updateAllergies(savedProfile.allergies),
    ]);
  } catch (error) {
    console.log("首次问答已保存到本地，后端接口暂未完全接入", error);
  } finally {
    isSaving.value = false;
  }

  uni.showModal({
    title: "资料已保存",
    content: "你的个人信息、饮食习惯和过敏设置已经写入设置页，之后仍可修改。",
    showCancel: false,
    confirmText: "去登录",
    success: () => {
      goToLogin();
    },
  });
}

function handlePrimaryAction() {
  if (!validateCurrentStep()) {
    return;
  }

  if (currentStep.value < 3) {
    currentStep.value += 1;
    return;
  }

  completeOnboarding();
}

onLoad((options = {}) => {
  username.value = decodeURIComponent(options.username || "");
  email.value = decodeURIComponent(options.email || "");
  password.value = decodeURIComponent(options.password || "");
  form.nickname = username.value || "";
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

.onboarding-page {
  min-height: 100vh;
  padding: 24rpx 28rpx 34rpx;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(77, 186, 121, 0.16), transparent 32%),
    linear-gradient(180deg, #f7fbf8 0%, #edf5f0 100%);
}

.page-header,
.header-main,
.field-row,
.input-row,
.footer-bar,
.switch-item {
  display: flex;
}

.page-header,
.switch-item {
  align-items: center;
  justify-content: space-between;
}

.back-btn,
.step-pill {
  flex-shrink: 0;
}

.back-btn {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12rpx 32rpx rgba(70, 104, 136, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #486988;
  font-size: 30rpx;
  font-weight: 600;
}

.header-main {
  flex: 1;
  margin: 0 18rpx;
  flex-direction: column;
}

.page-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #223547;
}

.page-subtitle,
.section-tip,
.summary-line {
  display: block;
  font-size: 23rpx;
  color: #6d8397;
  line-height: 1.7;
}

.step-pill {
  min-width: 96rpx;
  padding: 16rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(77, 186, 121, 0.14);
  text-align: center;
  font-size: 24rpx;
  color: #2f9f63;
  font-weight: 600;
}

.progress-bar {
  height: 14rpx;
  margin: 24rpx 0 22rpx;
  border-radius: 999rpx;
  background: rgba(148, 170, 189, 0.24);
  overflow: hidden;
}

.progress-value {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
}

.page-scroll {
  height: calc(100vh - 330rpx);
}

.section-card,
.field-card,
.summary-card {
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18rpx 44rpx rgba(106, 140, 175, 0.08);
}

.section-card {
  padding: 30rpx;
}

.section-title,
.field-label {
  display: block;
  font-weight: 700;
  color: #223547;
}

.section-title {
  font-size: 32rpx;
}

.section-tip {
  margin-top: 10rpx;
  margin-bottom: 24rpx;
}

.field-row {
  gap: 16rpx;
}

.field-card {
  margin-bottom: 18rpx;
  padding: 24rpx;
}

.field-card:last-child {
  margin-bottom: 0;
}

.half {
  flex: 1;
}

.field-label {
  margin-bottom: 14rpx;
  font-size: 27rpx;
}

.field-input,
.picker-field,
.field-textarea,
.compact-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 18rpx;
  background: #f5f8fb;
  color: #223547;
  font-size: 27rpx;
}

.field-input,
.picker-field {
  min-height: 96rpx;
  padding: 0 24rpx;
  line-height: 96rpx;
}

.picker-field {
  display: flex;
  align-items: center;
}

.field-textarea {
  min-height: 150rpx;
  padding: 20rpx 24rpx;
  line-height: 1.7;
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.tag-grid.compact .tag-item {
  width: calc(50% - 7rpx);
  box-sizing: border-box;
  text-align: center;
}

.tag-item {
  padding: 16rpx 22rpx;
  border-radius: 16rpx;
  background: #eef4f8;
  color: #567997;
  font-size: 25rpx;
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
  gap: 16rpx;
}

.switch-item {
  min-height: 84rpx;
  font-size: 27rpx;
  color: #223547;
}

.input-row {
  align-items: center;
  gap: 14rpx;
}

.compact-input {
  flex: 1;
}

.add-btn {
  width: 140rpx;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
  font-size: 26rpx;
}

.summary-card {
  background:
    radial-gradient(circle at top right, rgba(77, 186, 121, 0.12), transparent 45%),
    rgba(255, 255, 255, 0.98);
}

.footer-bar {
  gap: 16rpx;
  margin-top: 22rpx;
}

.footer-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border: none;
  border-radius: 20rpx;
  font-size: 29rpx;
  font-weight: 600;
}

.footer-btn.muted {
  background: #eef2ef;
  color: #536a5d;
}

.footer-btn.primary {
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
}
</style>
