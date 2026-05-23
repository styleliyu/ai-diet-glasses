/**
 * 状态管理 - Pinia Store
 * 用于管理用户状态、饮食记录等全局数据
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 用户信息接口
interface UserInfo {
  id?: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  token?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  gender?: string;
  birthday?: string;
}

// 饮食记录接口
interface DietRecord {
  id: number;
  foodName: string;
  totalCalorie: number;
  estimatedWeight: number;
  createTime: string;
  imgUrl?: string;
  nutrients?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

// 目标设置接口
interface TargetSetting {
  dailyCalories: number;
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Pinia store 主要承接旧页面状态；新的设置数据仍以 utils/user-settings 的账号快照为准。
export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref<UserInfo>({});
  const isLoggedIn = ref(false);
  const token = ref('');
  
  // 获取用户信息
  const getUserInfo = computed(() => userInfo.value);
  
  // 获取是否登录
  const getIsLoggedIn = computed(() => isLoggedIn.value);
  
  // 设置用户信息
  const setUserInfo = (info: UserInfo) => {
    userInfo.value = { ...userInfo.value, ...info };
    if (info.token) {
      token.value = info.token;
      uni.setStorageSync('token', info.token);
    }
    uni.setStorageSync('userInfo', userInfo.value);
  };
  
  // 登录
  const login = (info: UserInfo) => {
    setUserInfo(info);
    isLoggedIn.value = true;
    uni.setStorageSync('isLoggedIn', true);
  };
  
  // 登出
  const logout = () => {
    userInfo.value = {};
    token.value = '';
    isLoggedIn.value = false;
    uni.removeStorageSync('token');
    uni.removeStorageSync('userInfo');
    uni.setStorageSync('isLoggedIn', false);
  };
  
  // 更新用户信息
  const updateUserInfo = (info: Partial<UserInfo>) => {
    userInfo.value = { ...userInfo.value, ...info };
    uni.setStorageSync('userInfo', userInfo.value);
  };
  
  // 从本地存储初始化，避免小程序页面重建后丢失登录态。
  const initFromStorage = () => {
    const storedUserInfo = uni.getStorageSync('userInfo');
    const storedToken = uni.getStorageSync('token');
    const storedIsLoggedIn = uni.getStorageSync('isLoggedIn');
    
    if (storedUserInfo) {
      userInfo.value = storedUserInfo;
    }
    if (storedToken) {
      token.value = storedToken;
    }
    if (storedIsLoggedIn) {
      isLoggedIn.value = storedIsLoggedIn;
    }
  };
  
  return {
    userInfo,
    isLoggedIn,
    token,
    getUserInfo,
    getIsLoggedIn,
    setUserInfo,
    login,
    logout,
    updateUserInfo,
    initFromStorage
  };
});

// 定义饮食记录store
export const useDietStore = defineStore('diet', () => {
  // 状态
  const todayRecords = ref<DietRecord[]>([]);
  const weeklyRecords = ref<DietRecord[]>([]);
  const monthlyRecords = ref<DietRecord[]>([]);
  const isLoading = ref(false);
  const dailyTarget = ref(2000);
  const nutritionTarget = ref({
    protein: 50,
    carbs: 250,
    fat: 67
  });
  
  // 计算属性
  const todayTotalCalories = computed(() => {
    return todayRecords.value.reduce((sum, record) => sum + record.totalCalorie, 0);
  });
  
  const todayRemainingCalories = computed(() => {
    return Math.max(0, dailyTarget.value - todayTotalCalories.value);
  });
  
  const todayCaloriePercentage = computed(() => {
    if (dailyTarget.value === 0) return 0;
    return Math.min(100, Math.round((todayTotalCalories.value / dailyTarget.value) * 100));
  });
  
  const todayNutrition = computed(() => {
    const nutrition = { protein: 0, carbs: 0, fat: 0 };
    todayRecords.value.forEach(record => {
      if (record.nutrients) {
        nutrition.protein += record.nutrients.protein || 0;
        nutrition.carbs += record.nutrients.carbs || 0;
        nutrition.fat += record.nutrients.fat || 0;
      }
    });
    return nutrition;
  });
  
  // 操作
  const addRecord = (record: DietRecord) => {
    todayRecords.value.unshift(record);
    saveToLocalStorage();
  };
  
  const updateRecord = (id: number, updates: Partial<DietRecord>) => {
    const index = todayRecords.value.findIndex(record => record.id === id);
    if (index !== -1) {
      todayRecords.value[index] = { ...todayRecords.value[index], ...updates };
      saveToLocalStorage();
    }
  };
  
  const deleteRecord = (id: number) => {
    const index = todayRecords.value.findIndex(record => record.id === id);
    if (index !== -1) {
      todayRecords.value.splice(index, 1);
      saveToLocalStorage();
    }
  };
  
  const setTodayRecords = (records: DietRecord[]) => {
    todayRecords.value = records;
    saveToLocalStorage();
  };
  
  const setWeeklyRecords = (records: DietRecord[]) => {
    weeklyRecords.value = records;
  };
  
  const setMonthlyRecords = (records: DietRecord[]) => {
    monthlyRecords.value = records;
  };
  
  const setDailyTarget = (target: number) => {
    dailyTarget.value = target;
    uni.setStorageSync('dailyTarget', target);
  };
  
  const setNutritionTarget = (target: { protein: number; carbs: number; fat: number }) => {
    nutritionTarget.value = target;
    uni.setStorageSync('nutritionTarget', target);
  };
  
  const setIsLoading = (loading: boolean) => {
    isLoading.value = loading;
  };
  
  // 从本地存储加载，用于离线和接口失败时维持最近一次记录展示。
  const loadFromLocalStorage = () => {
    const storedRecords = uni.getStorageSync('todayRecords');
    const storedTarget = uni.getStorageSync('dailyTarget');
    const storedNutritionTarget = uni.getStorageSync('nutritionTarget');
    
    if (storedRecords) {
      todayRecords.value = storedRecords;
    }
    if (storedTarget) {
      dailyTarget.value = storedTarget;
    }
    if (storedNutritionTarget) {
      nutritionTarget.value = storedNutritionTarget;
    }
  };
  
  // 只持久化今日记录，周/月数据由报告页按查询条件重新聚合。
  const saveToLocalStorage = () => {
    uni.setStorageSync('todayRecords', todayRecords.value);
  };
  
  // 清空记录
  const clearRecords = () => {
    todayRecords.value = [];
    weeklyRecords.value = [];
    monthlyRecords.value = [];
    uni.removeStorageSync('todayRecords');
  };
  
  return {
    // 状态
    todayRecords,
    weeklyRecords,
    monthlyRecords,
    isLoading,
    dailyTarget,
    nutritionTarget,
    
    // 计算属性
    todayTotalCalories,
    todayRemainingCalories,
    todayCaloriePercentage,
    todayNutrition,
    
    // 操作
    addRecord,
    updateRecord,
    deleteRecord,
    setTodayRecords,
    setWeeklyRecords,
    setMonthlyRecords,
    setDailyTarget,
    setNutritionTarget,
    setIsLoading,
    loadFromLocalStorage,
    saveToLocalStorage,
    clearRecords
  };
});

// 定义应用设置store
export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const theme = ref('light');
  const language = ref('zh-CN');
  const notifications = ref(true);
  const allergies = ref<string[]>([]);
  const favoriteFoods = ref<string[]>([]);
  
  // 操作
  const setTheme = (newTheme: string) => {
    theme.value = newTheme;
    uni.setStorageSync('theme', newTheme);
  };
  
  const setLanguage = (lang: string) => {
    language.value = lang;
    uni.setStorageSync('language', lang);
  };
  
  const setNotifications = (enabled: boolean) => {
    notifications.value = enabled;
    uni.setStorageSync('notifications', enabled);
  };
  
  const setAllergies = (items: string[]) => {
    allergies.value = items;
    uni.setStorageSync('allergies', items);
  };
  
  const setFavoriteFoods = (items: string[]) => {
    favoriteFoods.value = items;
    uni.setStorageSync('favoriteFoods', items);
  };
  
  // 设置 store 保存 UI 偏好，和用户营养/过敏设置分开管理。
  const loadFromLocalStorage = () => {
    const storedTheme = uni.getStorageSync('theme');
    const storedLanguage = uni.getStorageSync('language');
    const storedNotifications = uni.getStorageSync('notifications');
    const storedAllergies = uni.getStorageSync('allergies');
    const storedFavoriteFoods = uni.getStorageSync('favoriteFoods');
    
    if (storedTheme) theme.value = storedTheme;
    if (storedLanguage) language.value = storedLanguage;
    if (storedNotifications !== undefined) notifications.value = storedNotifications;
    if (storedAllergies) allergies.value = storedAllergies;
    if (storedFavoriteFoods) favoriteFoods.value = storedFavoriteFoods;
  };
  
  return {
    // 状态
    theme,
    language,
    notifications,
    allergies,
    favoriteFoods,
    
    // 操作
    setTheme,
    setLanguage,
    setNotifications,
    setAllergies,
    setFavoriteFoods,
    loadFromLocalStorage
  };
});

// 组合store
export const useStore = () => {
  const userStore = useUserStore();
  const dietStore = useDietStore();
  const settingsStore = useSettingsStore();
  
  // 初始化所有store
  const initAllStores = () => {
    userStore.initFromStorage();
    dietStore.loadFromLocalStorage();
    settingsStore.loadFromLocalStorage();
  };
  
  return {
    user: userStore,
    diet: dietStore,
    settings: settingsStore,
    initAllStores
  };
};

export default useStore;
