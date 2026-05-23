const STORAGE_KEYS = {
  rememberedLogin: "rememberLogin",
  pendingLoginDraft: "pendingLoginDraft",
  onboardingStatus: "userOnboardingStatus",
  userInfo: "userInfo",
  userTarget: "userTarget",
  nutritionTarget: "nutritionTarget",
  userPreferences: "userPreferences",
  localPreferences: "localPreferences",
  userAllergies: "userAllergies",
  localAllergies: "localAllergies",
  notification: "userNotificationSettings",
  security: "userSecuritySettings",
  dietRecords: "dietRecords",
  recognitionHistory: "recognitionHistory",
  deviceRegistry: "deviceRegistry",
  currentDeviceId: "currentDeviceId",
  pendingDeviceConnectMode: "pendingDeviceConnectMode",
  pendingHomeDevicePrompt: "pendingHomeDevicePrompt",
};

const USER_PROFILE_PREFIX = "userScopedProfile:";
const DEVICE_STATUS_VALUES = ["online", "offline", "syncing", "warning"];
const DEVICE_CONNECTION_TYPES = ["bluetooth", "network", "manual"];
const DEFAULT_DEVICE_MODEL = "ESP32-S3 智能眼镜";
export const DEVICE_IDENTITY_PREFIXES = [
  "FoodGlass",
  "SmartDiet",
  "智能膳食眼镜",
  "智能饮食眼镜",
  "ESP32-S3",
];

const DEFAULT_PREFERENCES = {
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
  activityLevel: "moderate",
};

const DEFAULT_ALLERGIES = {
  standardAllergens: [],
  customAllergens: [],
  allergyList: "",
  intolerances: "",
};

const DEFAULT_TARGET = {
  dailyCalories: "",
  targetWeight: "",
  note: "",
  goalType: "maintain",
  activityLevel: "moderate",
  isCustomDailyCalories: false,
};

const DEFAULT_NUTRITION_TARGET = {
  protein: 90,
  carbs: 180,
  fat: 55,
};

const DEFAULT_NOTIFICATION = {
  dailySummary: true,
  updateNotice: true,
  quietHours: "22:30 - 07:00",
};

const DEFAULT_SECURITY = {
  loginProtection: true,
};

function safeStorageGet(key, fallback) {
  const value = uni.getStorageSync(key);
  return value || fallback;
}

function normalizeUsername(value = "") {
  return String(value || "").trim();
}

function stringifyDeviceProbePayload(payload = "") {
  if (typeof payload === "string") return payload;
  if (payload === null || payload === undefined) return "";
  try {
    return JSON.stringify(payload);
  } catch (error) {
    return String(payload || "");
  }
}

export function getProjectDeviceNameMatch(value = "") {
  // 项目设备识别：蓝牙名称必须以约定前缀开头，避免把任意蓝牙设备误判为眼镜。
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) return "";

  return (
    DEVICE_IDENTITY_PREFIXES.find((prefix) =>
      normalizedValue.startsWith(prefix.toLowerCase()),
    ) || ""
  );
}

export function hasProjectDeviceSignature(payload = "") {
  // 网络探测识别：设备状态页返回文本/JSON 中包含约定前缀即可视为项目设备。
  const normalizedPayload = stringifyDeviceProbePayload(payload).toLowerCase();
  if (!normalizedPayload) return false;

  return DEVICE_IDENTITY_PREFIXES.some((prefix) =>
    normalizedPayload.includes(prefix.toLowerCase()),
  );
}

function getStorageKeys() {
  try {
    return uni.getStorageInfoSync()?.keys || [];
  } catch (error) {
    return [];
  }
}

function getScopedProfileKey(username = "") {
  const normalizedUsername = normalizeUsername(username);
  return normalizedUsername ? `${USER_PROFILE_PREFIX}${normalizedUsername}` : "";
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeTextList(value) {
  return String(value || "")
    .split(/[\n,;\uFF0C\u3001]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getNowIsoString() {
  return new Date().toISOString();
}

function normalizeIsoDate(value = "") {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function buildDeviceId() {
  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDeviceStatus(status = "online") {
  // 设备状态归一化：页面只认这四种状态，避免存储里出现未知值导致样式错乱。
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();
  return DEVICE_STATUS_VALUES.includes(normalizedStatus)
    ? normalizedStatus
    : "online";
}

function normalizeBatteryLevel(value) {
  // 电量归一化：硬件暂未接入时允许为空；有值时限制在 0-100。
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function normalizeConnectionType(value = "manual") {
  // 连接方式归一化：bluetooth/network 来自真实入口，manual 用于演示或占位设备。
  const normalizedType = String(value || "")
    .trim()
    .toLowerCase();
  return DEVICE_CONNECTION_TYPES.includes(normalizedType)
    ? normalizedType
    : "manual";
}

function buildDeviceName(index = 1) {
  // 默认设备名：本地自动生成设备时使用，用户后续可在设备配置弹窗里修改。
  return `眼镜设备 ${String(index).padStart(2, "0")}`;
}

function emitDeviceRegistryUpdated(devices = getDeviceRegistry()) {
  // 设备事件同步：让设备页、设置页等无需互相引用，也能感知设备列表变化。
  uni.$emit("device-registry-updated", {
    devices,
    currentDeviceId: getCurrentDeviceId(),
  });
}

function emitUserProfileUpdated(userInfo = {}) {
  // 账号事件同步：设备切换账号后通知首页、报告页、设置页刷新本地用户信息。
  uni.$emit("userInfoUpdated", userInfo);
  uni.$emit("active-user-switched", userInfo);
}

function buildDefaultUserInfo(username = "", overrides = {}) {
  const normalizedUsername = normalizeUsername(username);
  return {
    username: normalizedUsername,
    nickname:
      String(overrides.nickname || "").trim() ||
      normalizedUsername ||
      "未命名用户",
    email: String(overrides.email || "").trim(),
    phone: String(overrides.phone || "").trim(),
    avatar: String(overrides.avatar || ""),
    gender: String(overrides.gender || "unknown"),
    birthday: String(overrides.birthday || ""),
    height: String(overrides.height || ""),
    weight: String(overrides.weight || ""),
    userId: String(overrides.userId || `user-${Date.now()}`),
    token: String(overrides.token || ""),
  };
}

function buildScopedProfile(username = "", overrides = {}) {
  const normalizedUsername = normalizeUsername(username);
  const nextUserInfo = buildDefaultUserInfo(normalizedUsername, {
    ...(overrides.userInfo || {}),
  });

  // 账号快照：负责保存每个账号独立的目标、偏好、过敏和记录。
  return {
    userInfo: nextUserInfo,
    userTarget: {
      ...DEFAULT_TARGET,
      ...(overrides.userTarget || {}),
    },
    nutritionTarget: {
      ...DEFAULT_NUTRITION_TARGET,
      ...(overrides.nutritionTarget || {}),
    },
    userPreferences: normalizePreferences(overrides.userPreferences),
    localPreferences: normalizePreferences(
      overrides.localPreferences || overrides.userPreferences,
    ),
    userAllergies: normalizeAllergies(overrides.userAllergies),
    localAllergies: normalizeAllergies(
      overrides.localAllergies || overrides.userAllergies,
    ),
    notification: {
      ...DEFAULT_NOTIFICATION,
      ...(overrides.notification || {}),
    },
    security: {
      ...DEFAULT_SECURITY,
      ...(overrides.security || {}),
    },
    dietRecords: Array.isArray(overrides.dietRecords)
      ? overrides.dietRecords
      : [],
    recognitionHistory: Array.isArray(overrides.recognitionHistory)
      ? overrides.recognitionHistory
      : [],
  };
}

function writeScopedProfileToActiveStorage(profile) {
  if (!profile) return;

  // 活动 storage：各页面默认都从这里读取当前账号的数据。
  uni.setStorageSync(STORAGE_KEYS.userInfo, profile.userInfo);
  uni.setStorageSync(STORAGE_KEYS.userTarget, profile.userTarget);
  uni.setStorageSync(STORAGE_KEYS.nutritionTarget, profile.nutritionTarget);
  uni.setStorageSync(STORAGE_KEYS.userPreferences, profile.userPreferences);
  uni.setStorageSync(STORAGE_KEYS.localPreferences, profile.localPreferences);
  uni.setStorageSync(STORAGE_KEYS.userAllergies, profile.userAllergies);
  uni.setStorageSync(STORAGE_KEYS.localAllergies, profile.localAllergies);
  uni.setStorageSync(STORAGE_KEYS.notification, profile.notification);
  uni.setStorageSync(STORAGE_KEYS.security, profile.security);
  uni.setStorageSync(STORAGE_KEYS.dietRecords, profile.dietRecords);
  uni.setStorageSync(
    STORAGE_KEYS.recognitionHistory,
    profile.recognitionHistory,
  );
}

function readScopedProfileFromActiveStorage(username = "") {
  const normalizedUsername = normalizeUsername(username);
  return buildScopedProfile(normalizedUsername, {
    userInfo: safeStorageGet(STORAGE_KEYS.userInfo, {}),
    userTarget: safeStorageGet(STORAGE_KEYS.userTarget, {}),
    nutritionTarget: safeStorageGet(STORAGE_KEYS.nutritionTarget, {}),
    userPreferences: safeStorageGet(STORAGE_KEYS.userPreferences, {}),
    localPreferences: safeStorageGet(STORAGE_KEYS.localPreferences, {}),
    userAllergies: safeStorageGet(STORAGE_KEYS.userAllergies, {}),
    localAllergies: safeStorageGet(STORAGE_KEYS.localAllergies, {}),
    notification: safeStorageGet(STORAGE_KEYS.notification, {}),
    security: safeStorageGet(STORAGE_KEYS.security, {}),
    dietRecords: safeStorageGet(STORAGE_KEYS.dietRecords, []),
    recognitionHistory: safeStorageGet(STORAGE_KEYS.recognitionHistory, []),
  });
}

function getActiveToken() {
  return String(
    uni.getStorageSync("token") ||
      safeStorageGet(STORAGE_KEYS.userInfo, {}).token ||
      "",
  );
}

function activateUserProfile(username = "", overrides = {}) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return null;

  const fallbackToken = getActiveToken() || `local-session-${Date.now()}`;
  const nextProfile = switchActiveUserProfile(normalizedUsername, {
    ...overrides,
    userInfo: {
      ...((overrides && overrides.userInfo) || {}),
      token: String(
        ((overrides && overrides.userInfo) || {}).token || fallbackToken,
      ),
    },
  });

  if (!nextProfile) return null;

  const nextUserInfo = {
    ...nextProfile.userInfo,
    token: String(nextProfile.userInfo.token || fallbackToken),
  };
  const scopedKey = getScopedProfileKey(normalizedUsername);
  const syncedProfile = {
    ...nextProfile,
    userInfo: nextUserInfo,
  };

  writeScopedProfileToActiveStorage(syncedProfile);
  if (scopedKey) {
    uni.setStorageSync(scopedKey, syncedProfile);
  }

  uni.setStorageSync("token", nextUserInfo.token);
  uni.setStorageSync("isLoggedIn", true);
  emitUserProfileUpdated(nextUserInfo);
  return syncedProfile;
}

function normalizeDeviceRecord(device = {}, index = 0) {
  // 设备记录归一化：所有读写 storage 的设备都先过这里，保证字段完整、类型稳定。
  const createdAt = normalizeIsoDate(device.createdAt) || getNowIsoString();
  const updatedAt = normalizeIsoDate(device.updatedAt) || createdAt;
  const status = normalizeDeviceStatus(device.status);
  const connectionType = normalizeConnectionType(device.connectionType);

  return {
    id: String(device.id || buildDeviceId()),
    name: String(device.name || buildDeviceName(index + 1)).trim() ||
      buildDeviceName(index + 1),
    model: String(device.model || DEFAULT_DEVICE_MODEL).trim() ||
      DEFAULT_DEVICE_MODEL,
    status,
    batteryLevel: normalizeBatteryLevel(device.batteryLevel),
    lastSeenAt: normalizeIsoDate(device.lastSeenAt),
    lastSyncAt: normalizeIsoDate(device.lastSyncAt),
    lastCheckAt: normalizeIsoDate(device.lastCheckAt),
    firmwareVersion: String(device.firmwareVersion || "v1.0.0").trim() ||
      "v1.0.0",
    boundUsername: normalizeUsername(device.boundUsername),
    // 设备连接展示：前端只保存连接入口和检测结果，真实设备仍由硬件自己与服务器通信。
    connectionType,
    connectionName: String(device.connectionName || "").trim(),
    bluetoothDeviceId: String(device.bluetoothDeviceId || "").trim(),
    bluetoothName: String(device.bluetoothName || "").trim(),
    networkSsid: String(device.networkSsid || "").trim(),
    networkPassword: String(device.networkPassword || ""),
    networkHost: String(device.networkHost || "").trim(),
    connected:
      device.connected === undefined
        ? status !== "offline"
        : Boolean(device.connected),
    createdAt,
    updatedAt,
  };
}

function buildDefaultDevice(currentUsername = "") {
  const timestamp = getNowIsoString();
  return normalizeDeviceRecord({
    id: buildDeviceId(),
    name: buildDeviceName(1),
    model: DEFAULT_DEVICE_MODEL,
    status: "online",
    batteryLevel: 86,
    lastSeenAt: timestamp,
    lastSyncAt: timestamp,
    lastCheckAt: timestamp,
    firmwareVersion: "v1.0.0",
    boundUsername: currentUsername,
    connectionType: "manual",
    connectionName: "Default local device",
    connected: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function captureCurrentUserSnapshot(username = "") {
  const normalizedUsername =
    normalizeUsername(username) ||
    normalizeUsername(safeStorageGet(STORAGE_KEYS.userInfo, {}).username);

  if (!normalizedUsername) return null;

  // 切走账号前先固化快照，保证设备切换账号后还能完整切回。
  const snapshot = readScopedProfileFromActiveStorage(normalizedUsername);
  uni.setStorageSync(getScopedProfileKey(normalizedUsername), snapshot);
  return snapshot;
}

export function clearActiveUserProfile({ preserveSnapshot = true } = {}) {
  const activeUsername = normalizeUsername(
    safeStorageGet(STORAGE_KEYS.userInfo, {}).username,
  );

  if (preserveSnapshot && activeUsername) {
    captureCurrentUserSnapshot(activeUsername);
  }

  uni.removeStorageSync(STORAGE_KEYS.userInfo);
  uni.removeStorageSync(STORAGE_KEYS.userTarget);
  uni.removeStorageSync(STORAGE_KEYS.nutritionTarget);
  uni.removeStorageSync(STORAGE_KEYS.userPreferences);
  uni.removeStorageSync(STORAGE_KEYS.localPreferences);
  uni.removeStorageSync(STORAGE_KEYS.userAllergies);
  uni.removeStorageSync(STORAGE_KEYS.localAllergies);
  uni.removeStorageSync(STORAGE_KEYS.notification);
  uni.removeStorageSync(STORAGE_KEYS.security);
  uni.removeStorageSync(STORAGE_KEYS.dietRecords);
  uni.removeStorageSync(STORAGE_KEYS.recognitionHistory);
}

export function switchActiveUserProfile(username = "", overrides = {}) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return null;

  const currentUsername = normalizeUsername(
    safeStorageGet(STORAGE_KEYS.userInfo, {}).username,
  );

  if (currentUsername && currentUsername !== normalizedUsername) {
    captureCurrentUserSnapshot(currentUsername);
  }

  const scopedKey = getScopedProfileKey(normalizedUsername);
  const savedProfile = scopedKey ? safeStorageGet(scopedKey, null) : null;
  const mergedProfile = buildScopedProfile(normalizedUsername, {
    ...(savedProfile || {}),
    ...overrides,
    userInfo: {
      ...((savedProfile && savedProfile.userInfo) || {}),
      ...((overrides && overrides.userInfo) || {}),
      username: normalizedUsername,
    },
  });

  writeScopedProfileToActiveStorage(mergedProfile);
  if (scopedKey) {
    uni.setStorageSync(scopedKey, mergedProfile);
  }
  return mergedProfile;
}

export function normalizePreferences(input = {}) {
  // 偏好归一化：统一数组、开关和值域，避免页面直接依赖表单原始格式。
  const likedCategories = normalizeStringArray(input.likedCategories);
  const dislikedCategories = normalizeStringArray(input.dislikedCategories);
  const normalizedDietType = String(
    input.dietType || DEFAULT_PREFERENCES.dietType,
  )
    .replace("highProtein", "highprotein")
    .replace("lowCarb", "lowcarb");

  return {
    ...DEFAULT_PREFERENCES,
    ...input,
    dietType: normalizedDietType,
    likedCategories:
      likedCategories.length > 0
        ? likedCategories
        : [...DEFAULT_PREFERENCES.likedCategories],
    dislikedCategories,
    specialNeeds: {
      ...DEFAULT_PREFERENCES.specialNeeds,
      ...(input.specialNeeds || {}),
    },
    favoriteFoods: String(input.favoriteFoods || ""),
    avoidList: String(input.avoidList || ""),
    activityLevel: String(
      input.activityLevel || DEFAULT_PREFERENCES.activityLevel,
    ),
  };
}

export function normalizeAllergies(input = {}) {
  // 过敏信息统一成标准列表 + 自定义文本，兼容推荐逻辑和设置页展示。
  const standardAllergens = normalizeStringArray(input.standardAllergens);
  const customAllergens = normalizeStringArray(input.customAllergens);
  const allergyList =
    String(input.allergyList || "").trim() ||
    standardAllergens.concat(customAllergens).join(", ");
  const intolerances =
    String(input.intolerances || "").trim() ||
    customAllergens.join(", ");

  return {
    ...DEFAULT_ALLERGIES,
    ...input,
    standardAllergens,
    customAllergens,
    allergyList,
    intolerances,
  };
}

// 设备列表读写：负责维护本地登记的硬件设备。
export function getDeviceRegistry() {
  const storedDevices = safeStorageGet(STORAGE_KEYS.deviceRegistry, []);
  if (!Array.isArray(storedDevices)) return [];

  return storedDevices.map((item, index) => normalizeDeviceRecord(item, index));
}

// 当前设备标记：让页面知道哪个设备会驱动当前活动账号。
export function getCurrentDeviceId() {
  return String(uni.getStorageSync(STORAGE_KEYS.currentDeviceId) || "").trim();
}

export function hasStoredDeviceRegistry() {
  // 登录后设备引导用：只判断本地是否登记过设备，不主动创建默认设备。
  return getDeviceRegistry().length > 0;
}

export function markPendingHomeDevicePrompt() {
  // Home 设备引导：登录页只写一次性标记，真正弹窗放到首页首屏之后展示。
  uni.setStorageSync(STORAGE_KEYS.pendingHomeDevicePrompt, {
    createdAt: getNowIsoString(),
  });
}

export function consumePendingHomeDevicePrompt() {
  // 一次性消费：避免用户点“稍后”后在同一次登录流程反复弹出。
  const pending = safeStorageGet(STORAGE_KEYS.pendingHomeDevicePrompt, null);
  if (!pending) return false;

  uni.removeStorageSync(STORAGE_KEYS.pendingHomeDevicePrompt);
  return true;
}

export function getPendingDeviceConnectMode() {
  // 登录页选择连接方式后先写入这里，设备 tab 打开时再弹出对应连接弹窗。
  const mode = String(
    uni.getStorageSync(STORAGE_KEYS.pendingDeviceConnectMode) || "",
  )
    .trim()
    .toLowerCase();
  return ["bluetooth", "network"].includes(mode) ? mode : "";
}

export function setPendingDeviceConnectMode(mode = "") {
  // 待连接模式只允许蓝牙或网络；其他值直接清理，避免页面误打开弹窗。
  const normalizedMode = String(mode || "")
    .trim()
    .toLowerCase();
  if (!["bluetooth", "network"].includes(normalizedMode)) {
    uni.removeStorageSync(STORAGE_KEYS.pendingDeviceConnectMode);
    return "";
  }

  uni.setStorageSync(STORAGE_KEYS.pendingDeviceConnectMode, normalizedMode);
  return normalizedMode;
}

export function clearPendingDeviceConnectMode() {
  // 连接弹窗打开或用户跳过后清理，避免下次进入设备页重复弹出。
  uni.removeStorageSync(STORAGE_KEYS.pendingDeviceConnectMode);
}

export function setCurrentDeviceId(id = "") {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) {
    uni.removeStorageSync(STORAGE_KEYS.currentDeviceId);
    emitDeviceRegistryUpdated();
    return "";
  }

  uni.setStorageSync(STORAGE_KEYS.currentDeviceId, normalizedId);
  emitDeviceRegistryUpdated();
  return normalizedId;
}

export function saveDeviceRegistry(devices = []) {
  // 设备列表持久化：保存前统一字段结构，并保证 currentDeviceId 始终指向有效设备。
  const normalizedDevices = Array.isArray(devices)
    ? devices.map((item, index) => normalizeDeviceRecord(item, index))
    : [];

  uni.setStorageSync(STORAGE_KEYS.deviceRegistry, normalizedDevices);

  if (!normalizedDevices.length) {
    uni.removeStorageSync(STORAGE_KEYS.currentDeviceId);
    emitDeviceRegistryUpdated(normalizedDevices);
    return normalizedDevices;
  }

  const currentDeviceId = getCurrentDeviceId();
  if (!currentDeviceId || !normalizedDevices.some((item) => item.id === currentDeviceId)) {
    uni.setStorageSync(STORAGE_KEYS.currentDeviceId, normalizedDevices[0].id);
  }

  emitDeviceRegistryUpdated(normalizedDevices);
  return normalizedDevices;
}

// 设备数据模型与本地存储：首次进入设备页时自动补齐默认设备。
export function ensureDeviceRegistry(seedUsername = "") {
  // 兼容旧流程：需要“至少有一台设备”的页面可调用它自动补默认设备。
  // 新登录引导使用 hasStoredDeviceRegistry，避免还没选择连接方式就自动创建设备。
  const normalizedSeedUsername =
    normalizeUsername(seedUsername) ||
    normalizeUsername(safeStorageGet(STORAGE_KEYS.userInfo, {}).username);

  let devices = getDeviceRegistry();
  if (!devices.length) {
    devices = saveDeviceRegistry([buildDefaultDevice(normalizedSeedUsername)]);
    setCurrentDeviceId(devices[0].id);
    return devices;
  }

  const currentDeviceId = getCurrentDeviceId();
  const hasCurrentDevice = devices.some((item) => item.id === currentDeviceId);
  if (!hasCurrentDevice) {
    setCurrentDeviceId(devices[0].id);
  }

  if (normalizedSeedUsername) {
    const activeDeviceId = hasCurrentDevice ? currentDeviceId : devices[0].id;
    const activeDevice = devices.find((item) => item.id === activeDeviceId);
    if (activeDevice && !activeDevice.boundUsername) {
      devices = saveDeviceRegistry(
        devices.map((item) =>
          item.id === activeDeviceId
            ? {
                ...item,
                boundUsername: normalizedSeedUsername,
                updatedAt: getNowIsoString(),
              }
            : item,
        ),
      );
    }
  }

  return devices;
}

export function createMockDevice(overrides = {}) {
  // 演示设备：仅用于前端展示多设备状态，不表示真实硬件已连接。
  const nextIndex = ensureDeviceRegistry().length + 1;
  const statuses = ["online", "syncing", "warning", "offline"];
  const timestamp = getNowIsoString();

  // 模拟设备：前端阶段用于演示多设备、多账号切换，不依赖真实硬件扫描。
  return normalizeDeviceRecord({
    id: buildDeviceId(),
    name: overrides.name || buildDeviceName(nextIndex),
    model: overrides.model || DEFAULT_DEVICE_MODEL,
    status: overrides.status || statuses[nextIndex % statuses.length],
    batteryLevel:
      overrides.batteryLevel !== undefined
        ? overrides.batteryLevel
        : 36 + ((nextIndex * 17) % 55),
    lastSeenAt: overrides.lastSeenAt || timestamp,
    lastSyncAt: overrides.lastSyncAt || (nextIndex % 2 === 0 ? timestamp : ""),
    lastCheckAt: overrides.lastCheckAt || timestamp,
    firmwareVersion: overrides.firmwareVersion || `v1.0.${nextIndex}`,
    boundUsername: normalizeUsername(overrides.boundUsername),
    connectionType: overrides.connectionType || "manual",
    connectionName: overrides.connectionName || "",
    bluetoothDeviceId: overrides.bluetoothDeviceId || "",
    bluetoothName: overrides.bluetoothName || "",
    networkSsid: overrides.networkSsid || "",
    networkPassword: overrides.networkPassword || "",
    networkHost: overrides.networkHost || "",
    connected:
      overrides.connected === undefined
        ? normalizeDeviceStatus(overrides.status) !== "offline"
        : Boolean(overrides.connected),
    createdAt: overrides.createdAt || timestamp,
    updatedAt: overrides.updatedAt || timestamp,
  });
}

export function createDeviceFromConnection(config = {}) {
  // 连接结果入库：蓝牙/网络弹窗最终都走这里创建本地设备记录。
  const timestamp = getNowIsoString();
  const devices = getDeviceRegistry();
  const currentUsername = normalizeUsername(
    safeStorageGet(STORAGE_KEYS.userInfo, {}).username,
  );
  const connectionType = normalizeConnectionType(config.connectionType);
  const fallbackName =
    connectionType === "bluetooth"
      ? "Bluetooth glasses"
      : connectionType === "network"
        ? "Network glasses"
        : buildDeviceName(devices.length + 1);

  // 连接设备入库：这里只登记前端展示需要的连接信息，不假设后端已有设备接口。
  const nextDevice = normalizeDeviceRecord({
    id: buildDeviceId(),
    name: config.name || config.connectionName || fallbackName,
    model: config.model || DEFAULT_DEVICE_MODEL,
    status: config.status || "online",
    batteryLevel: config.batteryLevel === undefined ? null : config.batteryLevel,
    lastSeenAt: timestamp,
    lastSyncAt: config.lastSyncAt || "",
    lastCheckAt: timestamp,
    firmwareVersion: config.firmwareVersion || "v1.0.0",
    boundUsername: config.boundUsername || currentUsername,
    connectionType,
    connectionName: config.connectionName || config.name || fallbackName,
    bluetoothDeviceId: config.bluetoothDeviceId || "",
    bluetoothName: config.bluetoothName || "",
    networkSsid: config.networkSsid || "",
    networkPassword: config.networkPassword || "",
    networkHost: config.networkHost || "",
    connected: config.connected === undefined ? true : Boolean(config.connected),
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  saveDeviceRegistry([...devices, nextDevice]);
  if (!getCurrentDeviceId()) {
    setCurrentDeviceId(nextDevice.id);
  }

  return nextDevice;
}

export function updateDeviceConnectionSettings(deviceId = "", settings = {}) {
  // 连接配置更新：维护展示名称、Wi-Fi、探测地址等前端字段。
  const normalizedDeviceId = String(deviceId || "").trim();
  if (!normalizedDeviceId) return null;

  const timestamp = getNowIsoString();
  let updatedDevice = null;
  const nextDevices = getDeviceRegistry().map((device) => {
    if (device.id !== normalizedDeviceId) return device;

    updatedDevice = normalizeDeviceRecord({
      ...device,
      ...settings,
      connectionType:
        settings.connectionType === undefined
          ? device.connectionType
          : settings.connectionType,
      updatedAt: timestamp,
    });
    return updatedDevice;
  });

  saveDeviceRegistry(nextDevices);
  return updatedDevice;
}

export function updateDeviceStatus(deviceId = "", statusPatch = {}) {
  // 状态检测写回：只更新本地展示状态，不影响设备与服务器的真实通信链路。
  const normalizedDeviceId = String(deviceId || "").trim();
  if (!normalizedDeviceId) return null;

  const timestamp = getNowIsoString();
  let updatedDevice = null;
  const nextDevices = getDeviceRegistry().map((device) => {
    if (device.id !== normalizedDeviceId) return device;

    const status = normalizeDeviceStatus(statusPatch.status || device.status);
    updatedDevice = normalizeDeviceRecord({
      ...device,
      ...statusPatch,
      status,
      connected:
        statusPatch.connected === undefined
          ? status !== "offline"
          : Boolean(statusPatch.connected),
      lastSeenAt: status === "offline" ? device.lastSeenAt : timestamp,
      lastCheckAt: timestamp,
      updatedAt: timestamp,
    });
    return updatedDevice;
  });

  saveDeviceRegistry(nextDevices);
  return updatedDevice;
}

// 本地账号枚举：设备绑定账号时优先复用已存在的用户快照。
export function listStoredUserProfiles() {
  const profileMap = new Map();
  const activeUser = safeStorageGet(STORAGE_KEYS.userInfo, {});
  const activeUsername = normalizeUsername(activeUser.username);

  if (activeUsername) {
    profileMap.set(activeUsername, {
      username: activeUsername,
      nickname:
        String(activeUser.nickname || "").trim() || activeUsername,
      email: String(activeUser.email || "").trim(),
      isActive: true,
    });
  }

  getStorageKeys()
    .filter((key) => key.startsWith(USER_PROFILE_PREFIX))
    .forEach((key) => {
      const profile = safeStorageGet(key, null);
      const userInfo = profile?.userInfo || {};
      const username = normalizeUsername(userInfo.username || key.replace(USER_PROFILE_PREFIX, ""));
      if (!username) return;

      profileMap.set(username, {
        username,
        nickname: String(userInfo.nickname || "").trim() || username,
        email: String(userInfo.email || "").trim(),
        isActive: username === activeUsername,
      });
    });

  return Array.from(profileMap.values()).sort((left, right) => {
    if (left.isActive && !right.isActive) return -1;
    if (!left.isActive && right.isActive) return 1;
    return left.username.localeCompare(right.username);
  });
}

// 设备绑定账号：手动输入新账号名时也先生成一个最小快照壳。
export function ensureUserProfileSnapshot(username = "", overrides = {}) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return null;

  const scopedKey = getScopedProfileKey(normalizedUsername);
  const savedProfile = scopedKey ? safeStorageGet(scopedKey, null) : null;
  const fallbackToken = getActiveToken();
  const mergedProfile = buildScopedProfile(normalizedUsername, {
    ...(savedProfile || {}),
    ...overrides,
    userInfo: {
      ...((savedProfile && savedProfile.userInfo) || {}),
      ...((overrides && overrides.userInfo) || {}),
      username: normalizedUsername,
      token: String(
        ((overrides && overrides.userInfo) || {}).token ||
          (savedProfile && savedProfile.userInfo && savedProfile.userInfo.token) ||
          fallbackToken,
      ),
    },
  });

  if (scopedKey) {
    uni.setStorageSync(scopedKey, mergedProfile);
  }
  return mergedProfile;
}

// 当前设备切换：切换设备时同步活动账号快照，但不改后端接口。
export function switchCurrentDevice(id = "") {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) return null;

  const devices = ensureDeviceRegistry();
  const currentDevice = devices.find((item) => item.id === normalizedId);
  if (!currentDevice) return null;

  const timestamp = getNowIsoString();
  const nextDevices = saveDeviceRegistry(
    devices.map((item) =>
      item.id === normalizedId
        ? {
            ...item,
            updatedAt: timestamp,
            lastSeenAt:
              item.status === "offline" ? item.lastSeenAt : timestamp,
          }
        : item,
    ),
  );
  setCurrentDeviceId(normalizedId);

  const nextCurrentDevice =
    nextDevices.find((item) => item.id === normalizedId) || currentDevice;

  if (nextCurrentDevice.boundUsername) {
    ensureUserProfileSnapshot(nextCurrentDevice.boundUsername, {
      userInfo: {
        token: getActiveToken(),
      },
    });
    const profile = activateUserProfile(nextCurrentDevice.boundUsername);
    return {
      device: nextCurrentDevice,
      profile,
    };
  }

  return {
    device: nextCurrentDevice,
    profile: null,
  };
}

export function bindDeviceToUser(
  deviceId = "",
  username = "",
  { activateIfCurrent = true } = {},
) {
  const normalizedDeviceId = String(deviceId || "").trim();
  if (!normalizedDeviceId) return null;

  const normalizedUsername = normalizeUsername(username);
  const timestamp = getNowIsoString();
  const devices = ensureDeviceRegistry();
  const currentDeviceId = getCurrentDeviceId();

  if (normalizedUsername) {
    ensureUserProfileSnapshot(normalizedUsername, {
      userInfo: {
        token: getActiveToken(),
      },
    });
  }

  const nextDevices = saveDeviceRegistry(
    devices.map((item) =>
      item.id === normalizedDeviceId
        ? {
            ...item,
            boundUsername: normalizedUsername,
            updatedAt: timestamp,
            lastSyncAt: normalizedUsername ? timestamp : item.lastSyncAt,
          }
        : item,
    ),
  );

  const boundDevice = nextDevices.find((item) => item.id === normalizedDeviceId) || null;
  if (!boundDevice) return null;

  if (
    activateIfCurrent &&
    normalizedUsername &&
    normalizedDeviceId === currentDeviceId
  ) {
    const profile = activateUserProfile(normalizedUsername);
    return {
      device: boundDevice,
      profile,
    };
  }

  emitDeviceRegistryUpdated(nextDevices);
  return {
    device: boundDevice,
    profile: null,
  };
}

export function getRememberedLogin() {
  const remembered = safeStorageGet(STORAGE_KEYS.rememberedLogin, null);
  if (!remembered || remembered.enabled === false) {
    return null;
  }

  return {
    enabled: true,
    username: String(remembered.username || ""),
    password: String(remembered.password || ""),
    savedAt: remembered.savedAt || "",
  };
}

export function saveRememberedLogin({ enabled, username, password }) {
  if (!enabled) {
    uni.removeStorageSync(STORAGE_KEYS.rememberedLogin);
    return;
  }

  uni.setStorageSync(STORAGE_KEYS.rememberedLogin, {
    enabled: true,
    username: String(username || "").trim(),
    password: String(password || ""),
    savedAt: new Date().toISOString(),
  });
}

export function setPendingLoginDraft(data = {}) {
  uni.setStorageSync(STORAGE_KEYS.pendingLoginDraft, {
    username: String(data.username || "").trim(),
    password: String(data.password || ""),
    rememberMe: Boolean(data.rememberMe),
    createdAt: new Date().toISOString(),
  });
}

export function consumePendingLoginDraft() {
  const draft = safeStorageGet(STORAGE_KEYS.pendingLoginDraft, null);
  if (!draft) return null;

  uni.removeStorageSync(STORAGE_KEYS.pendingLoginDraft);
  return draft;
}

export function hasCompletedOnboarding(username = "") {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return false;

  const allStatus = safeStorageGet(STORAGE_KEYS.onboardingStatus, {});
  return Boolean(allStatus[normalizedUsername]);
}

export function markOnboardingComplete(username = "") {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return;

  const allStatus = safeStorageGet(STORAGE_KEYS.onboardingStatus, {});
  allStatus[normalizedUsername] = new Date().toISOString();
  uni.setStorageSync(STORAGE_KEYS.onboardingStatus, allStatus);
}

export function calculateDailyCalories({
  weight,
  goalType = "maintain",
  activityLevel = "moderate",
}) {
  const numericWeight = Number(weight || 0);
  const baseCalories = numericWeight > 0 ? numericWeight * 30 : 1800;
  const activityOffsetMap = {
    low: -120,
    moderate: 0,
    high: 180,
  };
  const goalOffsetMap = {
    lose: -300,
    maintain: 0,
    gain: 250,
  };

  const total =
    baseCalories +
    (activityOffsetMap[activityLevel] || 0) +
    (goalOffsetMap[goalType] || 0);

  return Math.max(1200, Math.round(total));
}

export function resolveDailyCaloriesTarget({
  userTarget = {},
  userInfo = {},
  preferences = {},
} = {}) {
  const mergedTarget = {
    ...DEFAULT_TARGET,
    ...(userTarget || {}),
  };

  const rawManualCalories = Number(mergedTarget.dailyCalories || 0);
  const isCustomDailyCalories =
    mergedTarget.isCustomDailyCalories === true && rawManualCalories > 0;

  if (isCustomDailyCalories) {
    return rawManualCalories;
  }

  // 热量目标兜底：当用户没手动填时，首页和报告页都走同一套推算规则。
  return calculateDailyCalories({
    weight: userInfo.weight,
    goalType: mergedTarget.goalType || "maintain",
    activityLevel:
      mergedTarget.activityLevel ||
      preferences.activityLevel ||
      DEFAULT_PREFERENCES.activityLevel,
  });
}

export function buildNutritionTarget(dailyCalories = 1800) {
  const calories = Number(dailyCalories || 1800);
  return {
    protein: Math.round((calories * 0.3) / 4),
    carbs: Math.round((calories * 0.4) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

export function saveOnboardingProfile({
  username,
  email,
  password,
  userInfo = {},
  target = {},
  nutrition = {},
  preferences = {},
  allergies = {},
}) {
  const normalizedUsername = normalizeUsername(username);
  const existingScopedProfile = normalizedUsername
    ? safeStorageGet(getScopedProfileKey(normalizedUsername), null)
    : null;
  const existingUser =
    (existingScopedProfile && existingScopedProfile.userInfo) || {};
  const normalizedPreferences = normalizePreferences(preferences);
  const normalizedAllergies = normalizeAllergies(allergies);
  const nextUserInfo = {
    ...existingUser,
    ...userInfo,
    username: normalizedUsername || existingUser.username || "",
    email: String(email || userInfo.email || existingUser.email || "").trim(),
    nickname:
      String(userInfo.nickname || existingUser.nickname || "").trim() ||
      (normalizedUsername || String(existingUser.username || "").trim()),
    phone: String(userInfo.phone || existingUser.phone || "").trim(),
    gender: String(userInfo.gender || existingUser.gender || "unknown"),
    birthday: String(userInfo.birthday || existingUser.birthday || ""),
    height: String(userInfo.height || existingUser.height || ""),
    weight: String(userInfo.weight || existingUser.weight || ""),
    avatar: String(userInfo.avatar || existingUser.avatar || ""),
    userId: existingUser.userId || `user-${Date.now()}`,
  };

  uni.setStorageSync(STORAGE_KEYS.userInfo, nextUserInfo);
  uni.setStorageSync(STORAGE_KEYS.userTarget, { ...target });
  uni.setStorageSync(STORAGE_KEYS.nutritionTarget, { ...nutrition });
  uni.setStorageSync(STORAGE_KEYS.userPreferences, normalizedPreferences);
  uni.setStorageSync(STORAGE_KEYS.localPreferences, normalizedPreferences);
  uni.setStorageSync(STORAGE_KEYS.userAllergies, normalizedAllergies);
  uni.setStorageSync(STORAGE_KEYS.localAllergies, normalizedAllergies);
  markOnboardingComplete(nextUserInfo.username);
  captureCurrentUserSnapshot(nextUserInfo.username);
  setPendingLoginDraft({
    username: nextUserInfo.username,
    password,
    rememberMe: false,
  });

  return {
    userInfo: nextUserInfo,
    target,
    nutrition,
    preferences: normalizedPreferences,
    allergies: normalizedAllergies,
  };
}

export function getStoredPreferences() {
  return normalizePreferences(
    safeStorageGet(
      STORAGE_KEYS.localPreferences,
      safeStorageGet(STORAGE_KEYS.userPreferences, DEFAULT_PREFERENCES),
    ),
  );
}

export function getStoredAllergies() {
  return normalizeAllergies(
    safeStorageGet(
      STORAGE_KEYS.localAllergies,
      safeStorageGet(STORAGE_KEYS.userAllergies, DEFAULT_ALLERGIES),
    ),
  );
}

export function buildAllergyFieldsFromText(text = "") {
  return normalizeTextList(text);
}

export { DEFAULT_ALLERGIES, DEFAULT_PREFERENCES, STORAGE_KEYS };
