import { reactive, readonly } from 'vue';
import { STORAGE_KEYS } from '@/utils/user-settings.js';

// 轻量 store 仍服务部分旧页面，状态同时落 storage 以便页面刷新后恢复。
const userState = reactive({
  token: uni.getStorageSync('token') || '',
  userInfo: uni.getStorageSync('userInfo') || null,
  target: uni.getStorageSync(STORAGE_KEYS.userTarget) || null
});

// 日常记录状态
const dailyState = reactive({
  todayRecords: [],
  todayCalories: 0,
  todayNutrition: {
    protein: 0,
    carbs: 0,
    fat: 0
  }
});

// 全局状态
const globalState = reactive({
  isLoading: false,
  lastSyncTime: null
});

// 用户相关操作
export const userStore = {
  state: readonly(userState),
  
  setToken(token) {
    userState.token = token;
    uni.setStorageSync('token', token);
  },
  
  setUserInfo(userInfo) {
    userState.userInfo = userInfo;
    uni.setStorageSync('userInfo', userInfo);
  },
  
  setTarget(target) {
    userState.target = target;
    uni.setStorageSync(STORAGE_KEYS.userTarget, target);
  },
  
  clearUser(options = {}) {
    const { preserveProfile = false } = options;
    userState.token = '';
    uni.removeStorageSync('token');

    if (preserveProfile) {
      // 切号前由 user-settings 保存账号快照，这里只同步当前活动快照。
      userState.userInfo = uni.getStorageSync('userInfo') || userState.userInfo;
      userState.target =
        uni.getStorageSync(STORAGE_KEYS.userTarget) || userState.target;
      return;
    }

    userState.userInfo = null;
    userState.target = null;
    uni.removeStorageSync('userInfo');
    uni.removeStorageSync(STORAGE_KEYS.userTarget);
  },
  
  isLoggedIn() {
    return !!userState.token;
  }
};

// 日常记录操作
export const dailyStore = {
  state: readonly(dailyState),
  
  setTodayRecords(records) {
    dailyState.todayRecords = records;
    this.calculateTodayNutrition();
  },
  
  addRecord(record) {
    dailyState.todayRecords.push(record);
    this.calculateTodayNutrition();
  },
  
  updateRecord(index, record) {
    dailyState.todayRecords[index] = record;
    this.calculateTodayNutrition();
  },
  
  deleteRecord(index) {
    dailyState.todayRecords.splice(index, 1);
    this.calculateTodayNutrition();
  },
  
  calculateTodayNutrition() {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    
    dailyState.todayRecords.forEach(record => {
      calories += record.calories || 0;
      protein += record.protein || 0;
      carbs += record.carbs || 0;
      fat += record.fat || 0;
    });
    
    dailyState.todayCalories = calories;
    dailyState.todayNutrition = { protein, carbs, fat };
  },
  
  clearTodayRecords() {
    dailyState.todayRecords = [];
    dailyState.todayCalories = 0;
    dailyState.todayNutrition = { protein: 0, carbs: 0, fat: 0 };
  }
};

// 全局操作
export const globalStore = {
  state: readonly(globalState),
  
  setLoading(loading) {
    globalState.isLoading = loading;
  },
  
  setLastSyncTime(time) {
    globalState.lastSyncTime = time;
  }
};

export default {
  user: userStore,
  daily: dailyStore,
  global: globalStore
};
