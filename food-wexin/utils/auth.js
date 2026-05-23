/**
 * 认证相关工具函数
 */

/**
 * 跳转到登录入口
 * @param {Object} options - 跳转选项
 * @param {boolean} options.replace - 是否替换当前页面
 */
export function goToLoginEntry(options = {}) {
  const { replace = false } = options;
  
  if (replace) {
    uni.reLaunch({
      url: '/pages/login/login'
    });
  } else {
    uni.navigateTo({
      url: '/pages/login/login'
    });
  }
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function checkLogin() {
  // 老页面只看 isLoggedIn，新接口会把 JSESSIONID 同步到 token；两者都在才认为会话可用。
  const token = uni.getStorageSync('token');
  const isLoggedIn = uni.getStorageSync('isLoggedIn');
  return !!token && !!isLoggedIn;
}

/**
 * 获取用户令牌
 * @returns {string} 用户令牌
 */
export function getToken() {
  return uni.getStorageSync('token') || '';
}

/**
 * 获取用户信息
 * @returns {Object} 用户信息
 */
export function getUserInfo() {
  return uni.getStorageSync('userInfo') || {};
}

/**
 * 设置用户信息
 * @param {Object} userInfo - 用户信息
 */
export function setUserInfo(userInfo) {
  uni.setStorageSync('userInfo', userInfo);
}

/**
 * 要求页面必须登录
 * @param {Object} options - 选项
 * @param {string} options.message - 提示信息
 * @param {boolean} options.silent - 是否静默处理
 * @returns {boolean} 是否已登录
 */
export function requireAuthenticatedPage(options = {}) {
  const { message = '请先登录后再使用', silent = false } = options;
  
  // token 可能是后端 JSESSIONID，也可能是旧版本本地登录态，先保持兼容。
  const token = uni.getStorageSync('token') || uni.getStorageSync('user');
  const isLoggedIn = uni.getStorageSync('isLoggedIn');
  
  if (!token || !isLoggedIn) {
    if (!silent) {
      uni.showToast({ title: message, icon: 'none' });
    }
    uni.reLaunch({ url: '/pages/login/login' });
    return false;
  }
  
  return true;
}

/**
 * 退出登录
 */
export function logout() {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userInfo');
  uni.removeStorageSync('isLoggedIn');
  goToLoginEntry({ replace: true });
}

export default {
  goToLoginEntry,
  checkLogin,
  getToken,
  getUserInfo,
  setUserInfo,
  requireAuthenticatedPage,
  logout
};
