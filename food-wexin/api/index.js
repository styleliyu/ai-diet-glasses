import {
  buildFallbackSessionToken,
  clearSessionCookie,
  get,
  post,
  postForm,
  request,
  supportsBrowserManagedSession,
  upload,
} from "./request.js";
import {
  getStoredAllergies,
  getStoredPreferences,
  normalizeAllergies,
  normalizePreferences,
  resolveDailyCaloriesTarget,
} from "@/utils/user-settings.js";

const HISTORY_CACHE_TTL = 10 * 1000;

// Placeholder storage: this block keeps local settings and fallback payloads available before backend APIs are stable.
const localStore = {
  get(key, fallback = {}) {
    const value = uni.getStorageSync(key);
    return value || fallback;
  },
  set(key, value) {
    uni.setStorageSync(key, value);
    return Promise.resolve({
      code: 200,
      msg: "ok",
      data: value,
    });
  },
  merge(key, value) {
    const merged = {
      ...(this.get(key, {}) || {}),
      ...(value || {}),
    };
    uni.setStorageSync(key, merged);
    return merged;
  },
};

let historyCache = {
  records: null,
  updatedAt: 0,
};

function buildOk(data, msg = "ok") {
  return {
    code: 200,
    msg,
    data,
  };
}

function cleanupText(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumber(value, fallback = 0) {
  const match = String(value || "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : fallback;
}

function normalizeRecordTime(rawValue = "") {
  const value = cleanupText(rawValue);
  if (!value) return "";

  const fullMatch = value.match(
    /(\d{4}-\d{1,2}-\d{1,2})(?:\s+(\d{1,2}:\d{2})(?::(\d{2}))?)?/,
  );
  if (fullMatch) {
    const [, datePart, timePart = "00:00", secondPart = "00"] = fullMatch;
    const [year, month, day] = datePart.split("-");
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${timePart}:${secondPart}`;
  }

  return value;
}

function isRecoverablePlaceholderError(error) {
  const message = String(error?.message || "").toLowerCase();
  const statusCode = Number(error?.statusCode || 0);

  return (
    error?.code === "NETWORK_UNREACHABLE" ||
    statusCode === 0 ||
    statusCode === 401 ||
    statusCode === 403 ||
    statusCode === 404 ||
    statusCode === 405 ||
    message.includes("failed to fetch") ||
    message.includes("network connection failed") ||
    message.includes("http 401") ||
    message.includes("http 403") ||
    message.includes("http 404") ||
    message.includes("http 405")
  );
}

function getDefaultUserInfo() {
  const storedUser = localStore.get("userInfo", {});
  return {
    username: storedUser.username || storedUser.nickname || "",
    nickname:
      storedUser.nickname || storedUser.username || storedUser.email || "",
    email: storedUser.email || "",
    phone: storedUser.phone || "",
    avatar: storedUser.avatar || "",
    gender: storedUser.gender || "unknown",
    birthday: storedUser.birthday || "",
    height: storedUser.height || "",
    weight: storedUser.weight || "",
    userId: storedUser.userId || "",
    token: storedUser.token || uni.getStorageSync("token") || "",
  };
}

function buildLoginUserInfo(username, token) {
  const normalizedUsername = String(username || "").trim();
  return {
    username: normalizedUsername,
    nickname: normalizedUsername || "Unnamed user",
    email: "",
    phone: "",
    avatar: "",
    gender: "unknown",
    birthday: "",
    height: "",
    weight: "",
    userId: `user-${Date.now()}`,
    token: token || "",
  };
}

function getCurrentUsername() {
  return (
    localStore.get("userInfo", {}).username ||
    localStore.get("userInfo", {}).nickname ||
    "guest"
  );
}

function normalizeRecord(item = {}, index = 0) {
  const nutrientNumbers =
    String(item.nutrients || "").match(/-?\d+(?:\.\d+)?/g) || [];

  return {
    id: Number(item.id || index + 1),
    foodName: cleanupText(item.foodName || item.name) || "Unnamed food",
    totalCalorie: extractNumber(
      item.totalCalorie ?? item.calorie ?? item.totalCalories,
      0,
    ),
    estimatedWeight: extractNumber(item.estimatedWeight ?? item.weight, 0),
    createTime: normalizeRecordTime(item.createTime || item.meta || item.date),
    protein: Number(
      (item.protein ?? item.nutrients?.protein ?? nutrientNumbers[0]) || 0,
    ),
    fat: Number(
      (item.fat ?? item.nutrients?.fat ?? nutrientNumbers[1]) || 0,
    ),
    carbs: Number(
      (item.carbs ??
        item.carbohydrate ??
        item.nutrients?.carbs ??
        nutrientNumbers[2]) || 0,
    ),
    imageUrl: item.imageUrl || item.imgUrl || item.ossImgUrl || "",
    imgUrl: item.imgUrl || item.imageUrl || item.ossImgUrl || "",
    advice: item.advice || "",
  };
}

function parseHtmlHistoryRecords(html = "") {
  const records = [];
  const cardRegex =
    /href="\/delete-record\/(\d+)"[\s\S]*?<img[^>]+src="([^"]*)"[\s\S]*?<p class="food-name"[^>]*>([\s\S]*?)<\/p>[\s\S]*?<div class="meta">([\s\S]*?)<\/div>[\s\S]*?<div class="nutri-tag">([\s\S]*?)<\/div>[\s\S]*?<div class="cal-badge">[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/gi;

  let match;
  while ((match = cardRegex.exec(html))) {
    records.push(
      normalizeRecord(
        {
          id: match[1],
          imageUrl: match[2],
          foodName: match[3],
          meta: match[4],
          nutrients: match[5],
          totalCalorie: match[6],
          estimatedWeight:
            match[4]?.match(/(\d+(?:\.\d+)?)\s*g/i)?.[1] || "0",
        },
        records.length,
      ),
    );
  }

  return records;
}

function parseRecordCollection(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.records)
      ? payload.records
      : Array.isArray(payload?.data?.records)
        ? payload.data.records
        : [];

  return list.map(normalizeRecord);
}

function getLocalDietRecords() {
  const records = localStore.get("dietRecords", []);
  return Array.isArray(records) ? records.map(normalizeRecord) : [];
}

function saveLocalDietRecords(records = []) {
  const nextRecords = Array.isArray(records) ? records.map(normalizeRecord) : [];
  uni.setStorageSync("dietRecords", nextRecords);
  return nextRecords;
}

function toDate(value, endOfDay = false) {
  if (!value) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  const valueWithTime = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? `${normalized} ${endOfDay ? "23:59:59" : "00:00:00"}`
    : normalized;

  const date = new Date(valueWithTime.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function filterRecords(records = [], params = {}) {
  const startDate = toDate(params.startTime || params.date, false);
  const endDate = toDate(params.endTime || params.date, true);

  return records.filter((record) => {
    const recordDate = toDate(record.createTime, false);
    if (!recordDate) return true;

    if (startDate && recordDate < startDate) return false;
    if (endDate && recordDate > endDate) return false;
    return true;
  });
}

function sumNutrition(records = []) {
  return records.reduce(
    (summary, record) => ({
      calories: summary.calories + Number(record.totalCalorie || 0),
      protein: summary.protein + Number(record.protein || 0),
      fat: summary.fat + Number(record.fat || 0),
      carbs: summary.carbs + Number(record.carbs || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

function groupRecordsByDate(records = []) {
  return records.reduce((groups, record) => {
    const dateKey = String(record.createTime || "").slice(0, 10) || "Unknown";
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(record);
    return groups;
  }, {});
}

function resetHistoryCache() {
  historyCache = {
    records: null,
    updatedAt: 0,
  };
}

async function fetchHistoryRecords(force = false) {
  // Placeholder fallback for history API: prefer remote records, fallback to local storage when the backend route is not ready.
  if (
    !force &&
    Array.isArray(historyCache.records) &&
    Date.now() - historyCache.updatedAt < HISTORY_CACHE_TTL
  ) {
    return historyCache.records;
  }

  try {
    const response = await request("/api/history", {
      method: "GET",
      showLoading: false,
      showError: false,
    });
    const payload = response?.data !== undefined ? response.data : response;
    const records = parseRecordCollection(payload);

    historyCache = {
      records,
      updatedAt: Date.now(),
    };
    saveLocalDietRecords(records);
    return records;
  } catch (error) {
    if (!isRecoverablePlaceholderError(error)) {
      throw error;
    }

    const fallbackRecords = getLocalDietRecords();
    historyCache = {
      records: fallbackRecords,
      updatedAt: Date.now(),
    };
    return fallbackRecords;
  }
}

function buildDailyStat(records = [], date) {
  const summary = sumNutrition(records);

  return buildOk({
    date,
    todayTotal: [
      {
        nameDay: "Total Calories",
        valueDay: summary.calories,
      },
    ],
    totalCalorie: summary.calories,
    nutrients: {
      protein: summary.protein,
      fat: summary.fat,
      carbs: summary.carbs,
    },
  });
}

function buildWeekStat(records = [], params = {}) {
  const grouped = groupRecordsByDate(records);
  const orderedDates = Object.keys(grouped).sort();

  return buildOk({
    startTime: params.startTime || "",
    endTime: params.endTime || "",
    weekTotal: orderedDates.map((date) => {
      const summary = sumNutrition(grouped[date]);
      return {
        nameWeek: date,
        valueWeek: summary.calories,
      };
    }),
    dailyData: orderedDates.map((date) => {
      const summary = sumNutrition(grouped[date]);
      return {
        date,
        value: summary.calories,
      };
    }),
  });
}

async function getRemoteRecordsWithFallback(params = {}) {
  const remoteRecords = await fetchHistoryRecords();
  return filterRecords(remoteRecords, params);
}

function buildSessionFallbackResponse(error = null) {
  // Session placeholder: pages can still render from local user snapshot when auth/session is missing or unstable.
  const fallbackUser = {
    ...getDefaultUserInfo(),
    token:
      uni.getStorageSync("sessionCookie") ||
      uni.getStorageSync("token") ||
      getDefaultUserInfo().token ||
      "",
  };

  if (fallbackUser.token) {
    uni.setStorageSync("token", fallbackUser.token);
  }
  uni.setStorageSync("userInfo", fallbackUser);

  const message = error
    ? "session placeholder fallback"
    : "ok";

  return buildOk(fallbackUser, message);
}

export const userApi = {
  async login(data) {
    clearSessionCookie();
    uni.removeStorageSync("token");

    const response = await post(
      "/login",
      {
        username: String(data?.username || "").trim(),
        password: String(data?.password || ""),
      },
      {
        showError: false,
        showLoading: false,
      },
    );

    resetHistoryCache();
    const sessionToken = uni.getStorageSync("sessionCookie") || "";
    const canUseBrowserManagedSession = supportsBrowserManagedSession();
    // H5 may store same-origin session cookies in the browser without exposing Set-Cookie to JS.
    const authToken =
      sessionToken ||
      (canUseBrowserManagedSession
        ? buildFallbackSessionToken(String(data?.username || "").trim())
        : "");

    if (!authToken) {
      throw new Error("Login succeeded but session cookie is missing");
    }

    const payload = response?.data !== undefined ? response.data : response;
    const userInfo = {
      ...buildLoginUserInfo(data.username, authToken),
      ...(payload || {}),
      username: String(payload?.username || data?.username || "").trim(),
      nickname:
        String(payload?.nickname || payload?.username || data?.username || "").trim() ||
        "Unnamed user",
      token: authToken,
    };

    uni.setStorageSync("userInfo", userInfo);
    uni.setStorageSync("token", authToken);
    uni.setStorageSync("isLoggedIn", true);
    return response;
  },

  async register(data) {
    return post(
      "/register",
      {
        username: String(data?.username || "").trim(),
        password: String(data?.password || ""),
        email: String(data?.email || "").trim(),
      },
      {
        showError: false,
        showLoading: false,
      },
    );
  },

  async getUserInfo() {
    // Pending session API fallback: use remote session when available, otherwise return the local active snapshot.
    try {
      const response = await get(
        "/api/auth/session",
        {},
        {
          showError: false,
          showLoading: false,
        },
      );

      const payload = response?.data !== undefined ? response.data : response;
      const mergedUser = {
        ...getDefaultUserInfo(),
        ...(payload || {}),
        token:
          uni.getStorageSync("sessionCookie") ||
          uni.getStorageSync("token") ||
          payload?.token ||
          "",
      };

      uni.setStorageSync("userInfo", mergedUser);
      if (mergedUser.token) {
        uni.setStorageSync("token", mergedUser.token);
      }
      return buildOk(mergedUser, response?.msg || "ok");
    } catch (error) {
      if (!isRecoverablePlaceholderError(error)) {
        throw error;
      }

      return buildSessionFallbackResponse(error);
    }
  },

  updateUserInfo(data) {
    return localStore.set("userInfo", {
      ...getDefaultUserInfo(),
      ...data,
    });
  },

  async logout() {
    try {
      await post(
        "/api/auth/logout",
        {},
        {
          showError: false,
          showLoading: false,
        },
      );
    } finally {
      clearSessionCookie();
      uni.removeStorageSync("token");
      uni.removeStorageSync("isLoggedIn");
      resetHistoryCache();
    }

    return buildOk(true);
  },

  changePassword() {
    return buildOk(true, "local placeholder");
  },

  async sendResetCode(data) {
    return post(
      "/api/user/send-reset-code",
      {
        username: String(data?.username || "").trim(),
        email: String(data?.email || "").trim(),
      },
      {
        showError: false,
        showLoading: false,
      },
    );
  },

  async resetPassword(data) {
    const response = await postForm(
      "/api/user/reset-password",
      {
        email: data.email,
        code: data.code,
        newPassword: data.newPassword,
      },
      {
        rawResponse: true,
        skipBusinessCheck: true,
        showError: false,
        showLoading: false,
      },
    );

    const text = cleanupText(response.data || "");
    if (/^error:/i.test(text)) {
      throw new Error(text.replace(/^error:\s*/i, ""));
    }

    return buildOk(true, text || "Password reset succeeded");
  },

  async getUserStats() {
    const records = await getRemoteRecordsWithFallback();
    const grouped = groupRecordsByDate(records);
    const targetCalories =
      Number(
        resolveDailyCaloriesTarget({
          userTarget: localStore.get("userTarget", {}),
          userInfo: getDefaultUserInfo(),
          preferences: getStoredPreferences(),
        }),
      ) || 2000;

    const dates = Object.keys(grouped);
    const achievementDays = dates.filter((date) => {
      const summary = sumNutrition(grouped[date]);
      return summary.calories > 0 && summary.calories <= targetCalories;
    }).length;

    return buildOk({
      recordDays: dates.length,
      totalRecords: records.length,
      achievementRate: dates.length
        ? Math.round((achievementDays / dates.length) * 100)
        : 0,
    });
  },

  getTarget() {
    const storedTarget = localStore.get("userTarget", {});
    const resolvedDailyCalories = resolveDailyCaloriesTarget({
      userTarget: storedTarget,
      userInfo: getDefaultUserInfo(),
      preferences: getStoredPreferences(),
    });

    return buildOk({
      targetWeight: "",
      note: "",
      isCustomDailyCalories: false,
      ...storedTarget,
      dailyCalories: resolvedDailyCalories,
    });
  },

  updateTarget(data) {
    return localStore.set("userTarget", data);
  },

  getPreferences() {
    return buildOk(getStoredPreferences());
  },

  updatePreferences(data) {
    const normalized = normalizePreferences(data);
    uni.setStorageSync("localPreferences", normalized);
    return localStore.set("userPreferences", normalized);
  },

  getAllergies() {
    return buildOk(getStoredAllergies());
  },

  updateAllergies(data) {
    const normalized = normalizeAllergies(data);
    uni.setStorageSync("localAllergies", normalized);
    return localStore.set("userAllergies", normalized);
  },

  async bindSendCode(data) {
    return post(
      "/api/user/bind-send-code",
      {
        username: String(data?.username || "").trim(),
        password: String(data?.password || ""),
        email: String(data?.email || "").trim(),
      },
      {
        showError: false,
        showLoading: false,
      },
    );
  },

  async executeBindEmail(data) {
    return post(
      "/api/user/execute-bind-email",
      {
        username: String(data?.username || "").trim(),
        password: String(data?.password || ""),
        email: String(data?.email || "").trim(),
        code: String(data?.code || "").trim(),
      },
      {
        showError: false,
        showLoading: false,
      },
    );
  },
};

export const dietApi = {
  async getRecords(params = {}) {
    const records = await getRemoteRecordsWithFallback(params);
    return buildOk({ records });
  },

  addRecord(data) {
    const existingRecords = getLocalDietRecords();
    const nextRecord = normalizeRecord({
      id: Date.now(),
      createTime: new Date().toISOString().slice(0, 19).replace("T", " "),
      ...data,
    });
    const nextRecords = [nextRecord, ...existingRecords];
    saveLocalDietRecords(nextRecords);
    resetHistoryCache();
    return buildOk(nextRecord, "local placeholder");
  },

  updateRecord(id, data) {
    const nextRecords = getLocalDietRecords().map((record) =>
      Number(record.id) === Number(id)
        ? normalizeRecord({ ...record, ...data })
        : record,
    );
    saveLocalDietRecords(nextRecords);
    resetHistoryCache();
    return buildOk(data);
  },

  async deleteRecord(id) {
    // Delete placeholder: use server route when available, otherwise remove from local cache so the page can continue working.
    try {
      const response = await request(`/delete-record/${id}`, {
        method: "GET",
        rawResponse: true,
        skipBusinessCheck: true,
        showError: false,
        showLoading: false,
        contentType: null,
      });

      const html = typeof response.data === "string" ? response.data : "";
      if (html && /delete-record|record-card|empty-state/i.test(html)) {
        resetHistoryCache();
      }
    } catch (error) {
      if (!isRecoverablePlaceholderError(error)) {
        throw error;
      }
    }

    const localRecords = getLocalDietRecords().filter(
      (record) => Number(record.id) !== Number(id),
    );
    saveLocalDietRecords(localRecords);
    resetHistoryCache();
    return buildOk(true, "local delete fallback");
  },

  async getDailyStat(params = {}) {
    const date = params.date || new Date().toISOString().slice(0, 10);
    const records = await getRemoteRecordsWithFallback({
      startTime: date,
      endTime: date,
    });
    return buildDailyStat(records, date);
  },

  async getWeekStat(params = {}) {
    const records = await getRemoteRecordsWithFallback(params);
    return buildWeekStat(records, params);
  },

  async checkNewRecord() {
    // Polling placeholder: if backend route is unavailable, report no new record instead of breaking the page.
    try {
      const response = await get(
        "/api/check-new-record",
        {},
        {
          showError: false,
          showLoading: false,
          skipBusinessCheck: true,
        },
      );
      const payload = response?.data !== undefined ? response.data : response;
      return buildOk(payload || { hasNew: false });
    } catch (error) {
      if (!isRecoverablePlaceholderError(error)) {
        throw error;
      }

      return buildOk({ hasNew: false }, "local placeholder");
    }
  },
};

export const recognizeApi = {
  async recognizeFood(filePath, formData = {}) {
    const username = formData.username || getCurrentUsername();
    const result = await upload(
      "/api/identify/device",
      filePath,
      "file",
      {
        username,
        ...formData,
      },
      {
        skipBusinessCheck: true,
        showError: false,
      },
    );

    if (result?.code !== 200) {
      throw new Error(result?.msg || "Recognition failed");
    }

    const payload = result?.data !== undefined ? result.data : result;
    if (!payload) {
      throw new Error("Recognition failed: No data returned");
    }

    resetHistoryCache();

    return buildOk({
      isFood: Boolean(payload.isFood),
      foodName: payload.name || "Unnamed food",
      estimatedCalories: Number(payload.totalCal || 0),
      estimatedWeight: Number(payload.weight || 100),
      nutrients: {
        protein: Number(payload.protein || 0),
        fat: Number(payload.fat || 0),
        carbs: Number(payload.carbs || 0),
      },
      nutritionAdvice: payload.advice || "",
      imageUrl: payload.imageUrl || "",
      duplicated: Boolean(payload.duplicated),
      synced: true,
    });
  },

  async batchRecognizeFood(filePaths, formData = {}) {
    const results = [];
    for (const filePath of filePaths) {
      results.push(await this.recognizeFood(filePath, formData));
    }
    return results;
  },

  async getRecognitionHistory(params = {}) {
    const records = await getRemoteRecordsWithFallback(params);
    return buildOk(records.slice(0, 20));
  },
};

export default {
  userApi,
  dietApi,
  recognizeApi,
};
