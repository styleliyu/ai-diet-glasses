const H5_DEV_PROXY_PREFIX = "/backend";
const LOCAL_DEV_SERVER_URL = "http://localhost:8080";
const REMOTE_SERVER_URL = "http://47.98.36.158:8080";
const API_BASE_STORAGE_KEY = "apiBaseUrl";
const SESSION_COOKIE_KEY = "sessionCookie";
const FALLBACK_SESSION_TOKEN_PREFIX = "browser-session:";

const RUNTIME_NODE_ENV =
  typeof process !== "undefined" && process?.env?.NODE_ENV
    ? process.env.NODE_ENV
    : "";
const RUNTIME_UNI_PLATFORM =
  typeof process !== "undefined" && process?.env?.UNI_PLATFORM
    ? process.env.UNI_PLATFORM
    : "";
const BUILD_TIME_API_BASE_URL =
  typeof process !== "undefined" && process?.env?.VUE_APP_API_BASE_URL
    ? process.env.VUE_APP_API_BASE_URL
    : "";
const BUILD_TIME_MP_WEIXIN_API_BASE_URL =
  typeof process !== "undefined" && process?.env?.VUE_APP_MP_WEIXIN_API_BASE_URL
    ? process.env.VUE_APP_MP_WEIXIN_API_BASE_URL
    : "";

function getCompiledPlatform() {
  let platform = "";
  // #ifdef H5
  platform = "h5";
  // #endif
  // #ifdef MP-WEIXIN
  platform = "mp-weixin";
  // #endif
  return platform;
}

function trimTrailingSlash(value = "") {
  return String(value || "").replace(/\/+$/, "");
}

function isAbsoluteHttpUrl(value = "") {
  return /^https?:\/\//i.test(String(value || ""));
}

function isDevelopment() {
  return RUNTIME_NODE_ENV === "development";
}

function isH5() {
  return getCompiledPlatform() === "h5" || RUNTIME_UNI_PLATFORM === "h5";
}

function isMpWeixin() {
  return (
    getCompiledPlatform() === "mp-weixin" ||
    RUNTIME_UNI_PLATFORM === "mp-weixin"
  );
}

export function buildFallbackSessionToken(username = "") {
  const normalizedUsername = String(username || "").trim();
  return `${FALLBACK_SESSION_TOKEN_PREFIX}${normalizedUsername || "active"}`;
}

export function supportsBrowserManagedSession() {
  return isH5();
}

function isFallbackSessionToken(token = "") {
  return String(token || "").startsWith(FALLBACK_SESSION_TOKEN_PREFIX);
}

function getBaseUrl() {
  // 请求基址选择：集中处理 H5 代理、小程序本地联调和远端兜底，页面层不直接拼后端地址。
  const runtimeBaseUrl = uni.getStorageSync(API_BASE_STORAGE_KEY) || "";
  if (runtimeBaseUrl) {
    return trimTrailingSlash(runtimeBaseUrl);
  }

  if (isMpWeixin() && BUILD_TIME_MP_WEIXIN_API_BASE_URL) {
    return trimTrailingSlash(BUILD_TIME_MP_WEIXIN_API_BASE_URL);
  }

  if (
    BUILD_TIME_API_BASE_URL &&
    (!isMpWeixin() || isAbsoluteHttpUrl(BUILD_TIME_API_BASE_URL))
  ) {
    return trimTrailingSlash(BUILD_TIME_API_BASE_URL);
  }

  if (isDevelopment() && isH5()) {
    return H5_DEV_PROXY_PREFIX;
  }

  // 微信小程序开发态：默认连本机后端；真机调试时可用 VUE_APP_MP_WEIXIN_API_BASE_URL 覆盖成局域网地址。
  if (isDevelopment() && isMpWeixin()) {
    return trimTrailingSlash(
      BUILD_TIME_MP_WEIXIN_API_BASE_URL || LOCAL_DEV_SERVER_URL,
    );
  }

  return trimTrailingSlash(REMOTE_SERVER_URL);
}

function shouldLogRequestUrl() {
  return isDevelopment() || uni.getStorageSync("enableApiDebugLog") === true;
}

function getSessionCookie() {
  return uni.getStorageSync(SESSION_COOKIE_KEY) || "";
}

function setSessionCookie(cookie) {
  if (!cookie) return;
  uni.setStorageSync(SESSION_COOKIE_KEY, cookie);
}

export function clearSessionCookie() {
  uni.removeStorageSync(SESSION_COOKIE_KEY);
}

function storeSessionCookieFromHeaders(headers = {}) {
  // 会话保存：后端使用 JSESSIONID 时，尽量从响应头里提取并写入本地 storage。
  const rawCookie =
    headers["Set-Cookie"] ||
    headers["set-cookie"] ||
    headers["Set-cookie"] ||
    "";

  if (!rawCookie) return;

  const cookieValue = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie;
  const jsessionMatch = String(cookieValue).match(/JSESSIONID=[^;,]+/i);
  const normalized = jsessionMatch
    ? jsessionMatch[0]
    : String(cookieValue).split(";")[0].trim();

  if (normalized) {
    setSessionCookie(normalized);
  }
}

function buildHeaders(header = {}, contentType) {
  // 请求头构建：兼容 token、Cookie 和 H5 浏览器托管 cookie 三种登录态。
  const builtHeaders = {
    ...header,
  };

  if (contentType && !builtHeaders["Content-Type"]) {
    builtHeaders["Content-Type"] = contentType;
  }

  const token = uni.getStorageSync("token") || "";
  if (token && !isFallbackSessionToken(token) && !builtHeaders.Authorization) {
    builtHeaders.Authorization = token;
  }

  const sessionCookie = getSessionCookie();
  if (sessionCookie && !builtHeaders.Cookie) {
    builtHeaders.Cookie = sessionCookie;
  }

  return builtHeaders;
}

function buildUrl(url) {
  return url.startsWith("http") ? url : `${getBaseUrl()}${url}`;
}

function logRequestUrl(method, url) {
  if (!shouldLogRequestUrl()) return;
  console.log(`[api] ${method} ${url}`);
}

function showErrorToast(showError, title) {
  if (!showError) return;

  uni.showToast({
    title,
    icon: "none",
    duration: 2000,
  });
}

function buildHttpError(message, statusCode, responseData) {
  const error = new Error(message || `HTTP ${statusCode}`);
  error.name = "ApiHttpError";
  error.statusCode = Number(statusCode || 0);
  error.responseData = responseData;
  return error;
}

function buildNetworkError(err) {
  const error = new Error("Network connection failed");
  error.name = "ApiNetworkError";
  error.code = "NETWORK_UNREACHABLE";
  error.cause = err;
  error.originalMessage = err?.errMsg || err?.message || "";
  return error;
}

export function toFormUrlEncoded(data = {}) {
  return Object.keys(data)
    .filter((key) => data[key] !== undefined && data[key] !== null)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]))}`,
    )
    .join("&");
}

export function request(url, options = {}) {
  const {
    method = "GET",
    data = {},
    header = {},
    showLoading = true,
    showError = true,
    rawResponse = false,
    skipBusinessCheck = false,
    contentType = "application/json",
  } = options;

  let loadingHidden = false;
  const hideLoadingOnce = () => {
    if (!showLoading || loadingHidden) return;
    loadingHidden = true;
    uni.hideLoading();
  };

  if (showLoading) {
    uni.showLoading({
      title: "Loading...",
      mask: true,
    });
  }

  return new Promise((resolve, reject) => {
    const fullRequestUrl = buildUrl(url);
    logRequestUrl(method, fullRequestUrl);

    uni.request({
      url: fullRequestUrl,
      method,
      data,
      header: buildHeaders(header, contentType),
      withCredentials: true,
      success: (res) => {
        storeSessionCookieFromHeaders(res.header);

        hideLoadingOnce();

        const { statusCode, data: responseData } = res;

        if (rawResponse) {
          resolve(res);
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          const errorMessage =
            (typeof responseData === "object" && responseData?.msg) ||
            `HTTP ${statusCode}`;
          showErrorToast(showError, errorMessage);
          reject(buildHttpError(errorMessage, statusCode, responseData));
          return;
        }

        if (skipBusinessCheck) {
          resolve(responseData);
          return;
        }

        if (typeof responseData === "string") {
          resolve(responseData);
          return;
        }

        if (
          responseData?.code === 1 ||
          responseData?.code === 200 ||
          responseData?.success ||
          responseData?.status === "success"
        ) {
          resolve(responseData);
          return;
        }

        const businessError = new Error(responseData?.msg || "Request failed");
        businessError.name = "ApiBusinessError";
        businessError.responseData = responseData;
        showErrorToast(showError, businessError.message);
        reject(businessError);
      },
      fail: (err) => {
        hideLoadingOnce();

        const networkError = buildNetworkError(err);
        showErrorToast(showError, networkError.message);
        reject(networkError);
      },
      complete: () => {
        hideLoadingOnce();
      },
    });
  });
}

export function get(url, params = {}, options = {}) {
  let fullUrl = url;

  if (params && Object.keys(params).length > 0) {
    const queryString = Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== null)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join("&");

    if (queryString) {
      fullUrl += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  return request(fullUrl, { ...options, method: "GET" });
}

export function post(url, data = {}, options = {}) {
  return request(url, { ...options, method: "POST", data });
}

export function postForm(url, data = {}, options = {}) {
  return request(url, {
    ...options,
    method: "POST",
    data: toFormUrlEncoded(data),
    contentType: "application/x-www-form-urlencoded",
  });
}

export function put(url, data = {}, options = {}) {
  return request(url, { ...options, method: "PUT", data });
}

export function del(url, data = {}, options = {}) {
  return request(url, { ...options, method: "DELETE", data });
}

export function upload(
  url,
  filePath,
  name = "file",
  formData = {},
  options = {},
) {
  const {
    header = {},
    showError = true,
    rawResponse = false,
    skipBusinessCheck = false,
  } = options;

  // 上传兜底：页面没显式传 username 时，自动使用当前活动账号，保证识别记录能归属用户。
  if (!formData.username) {
    const userInfo = uni.getStorageSync("userInfo") || {};
    const username = userInfo.username || uni.getStorageSync("username") || "";
    if (username) {
      formData.username = username;
    }
  }

  return new Promise((resolve, reject) => {
    const fullUploadUrl = buildUrl(url);
    logRequestUrl("UPLOAD", fullUploadUrl);

    uni.showLoading({
      title: "Uploading...",
      mask: true,
    });

    uni.uploadFile({
      url: fullUploadUrl,
      filePath,
      name,
      formData,
      header: buildHeaders(header),
      success: (res) => {
        uni.hideLoading();
        storeSessionCookieFromHeaders(res.header);

        if (rawResponse) {
          resolve(res);
          return;
        }

        try {
          const parsedData =
            typeof res.data === "string" ? JSON.parse(res.data) : res.data;

          if (skipBusinessCheck) {
            resolve(parsedData);
            return;
          }

          if (
            parsedData?.code === 1 ||
            parsedData?.code === 200 ||
            parsedData?.success ||
            parsedData?.status === "success"
          ) {
            resolve(parsedData);
            return;
          }

          showErrorToast(showError, parsedData?.msg || "Upload failed");
          reject(new Error(parsedData?.msg || "Upload failed"));
        } catch (error) {
          showErrorToast(showError, "Upload failed");
          reject(error);
        }
      },
      fail: (err) => {
        uni.hideLoading();
        const networkError = buildNetworkError(err);
        showErrorToast(showError, "Upload failed");
        reject(networkError);
      },
    });
  });
}

export default {
  request,
  get,
  post,
  postForm,
  put,
  delete: del,
  del,
  upload,
  clearSessionCookie,
  toFormUrlEncoded,
};
