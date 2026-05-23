<template>
  <view class="home-page safe-area">
    <view class="page-header">
      <view class="header-copy">
        <text class="greeting">{{ greeting }}，{{ userName }}</text>
        <text class="date-text">今天是 {{ todayText }}</text>
      </view>
      <view class="header-device" @tap="goDevices">
        <view class="header-dot" :class="currentHomeDevice ? `status-${currentHomeDevice.status}` : 'status-offline'"></view>
        <text>设备</text>
      </view>
    </view>

    <view class="overview-card animated-card delay-1">
      <view class="overview-head">
        <text class="section-title">今日热量概览</text>
        <text class="section-hint">目标 {{ dailyTarget }} kcal</text>
      </view>

      <view class="hero-number">{{ totalCalories }}</view>
      <text class="hero-unit">今日累计摄入 kcal</text>

      <view class="progress-track">
        <view
          class="progress-fill"
          :style="{ width: progressWidth + '%' }"
        ></view>
      </view>
      <text class="progress-note">完成 {{ progressWidth }}%，还差 {{ remainingCalories }} kcal</text>
    </view>

    <view class="device-status-card animated-card delay-2" @tap="handleDeviceCardTap">
      <view class="device-status-main">
        <view class="icon-slot device">
          <text>{{ currentHomeDevice ? getConnectionIcon(currentHomeDevice.connectionType) : "+" }}</text>
        </view>
        <view class="device-status-copy">
          <text class="device-status-title">
            {{ currentHomeDevice ? currentHomeDevice.name : "未添加设备" }}
          </text>
          <text class="device-status-desc">
            {{ currentHomeDevice ? getDeviceConnectionText(currentHomeDevice) : "添加后可查看连接状态" }}
          </text>
        </view>
      </view>
      <view class="device-status-side">
        <text class="status-chip" :class="currentHomeDevice ? `status-${currentHomeDevice.status}` : 'status-offline'">
          {{ currentHomeDevice ? getStatusLabel(currentHomeDevice.status) : "未添加" }}
        </text>
        <text class="device-status-meta">
          {{ currentHomeDevice ? `${formatBattery(currentHomeDevice.batteryLevel)} · ${formatDeviceTime(currentHomeDevice.lastCheckAt, "未检测")}` : "点击添加" }}
        </text>
      </view>
      <text class="card-arrow">›</text>
    </view>

    <view class="nutrition-grid animated-card delay-3">
      <view class="nutrition-card protein">
        <view class="nutrition-icon">P</view>
        <text class="nutrition-label">蛋白质</text>
        <text class="nutrition-value">{{ protein }} g</text>
      </view>
      <view class="nutrition-card carbs">
        <view class="nutrition-icon">C</view>
        <text class="nutrition-label">碳水</text>
        <text class="nutrition-value">{{ carbs }} g</text>
      </view>
      <view class="nutrition-card fat">
        <view class="nutrition-icon">F</view>
        <text class="nutrition-label">脂肪</text>
        <text class="nutrition-value">{{ fat }} g</text>
      </view>
    </view>

    <view class="action-card animated-card delay-4">
      <view class="section-head">
        <text class="section-title">快捷操作</text>
      </view>
      <view class="action-row">
        <view class="action-btn primary" @tap="goRecognition">
          <view class="action-icon camera-icon"></view>
          <text class="action-title">食物识别</text>
          <text class="action-desc">拍照识别并记录</text>
        </view>
        <view class="action-btn" @tap="goSearch">
          <view class="action-icon search-icon"></view>
          <text class="action-title">查询记录</text>
          <text class="action-desc">查看历史饮食明细</text>
        </view>
      </view>
    </view>

    <view class="record-card animated-card delay-5">
      <view class="section-head">
        <text class="section-title">最近记录</text>
        <text class="section-link" @tap="goSearch">查看全部</text>
      </view>

      <view v-if="recentRecords.length" class="record-list">
        <view
          v-for="record in recentRecords"
          :key="record.id || record.createTime"
          class="record-item"
        >
          <view>
            <text class="record-name">{{ record.foodName || "饮食记录" }}</text>
            <text class="record-time">{{ record.createTime || todayText }}</text>
          </view>
          <text class="record-calorie">{{ record.totalCalorie || 0 }} kcal</text>
        </view>
      </view>

      <view v-else class="empty-box">
        <text class="empty-title">今天还没有记录</text>
        <text class="empty-desc">点上面的食物识别开始记录</text>
      </view>
    </view>

    <view v-if="homeDevicePromptVisible" class="modal-overlay" @tap="dismissDevicePrompt">
      <view class="modal-sheet compact-sheet prompt-sheet" @tap.stop>
        <view class="prompt-visual">
          <view class="icon-slot device large"><text>+</text></view>
        </view>
        <text class="modal-title center">是否添加设备</text>
        <text class="modal-subtitle center">添加后可在首页查看连接状态。</text>
        <view class="modal-actions split">
          <button class="plain-btn" @tap="dismissDevicePrompt">稍后</button>
          <button class="primary-btn" @tap="openAddDeviceChooser">添加设备</button>
        </view>
      </view>
    </view>

    <view v-if="connectChooserVisible" class="modal-overlay" @tap="closeConnectChooser">
      <view class="modal-sheet" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">选择连接方式</text>
            <text class="modal-subtitle">选择蓝牙或网络方式添加设备。</text>
          </view>
          <text class="modal-close" @tap="closeConnectChooser">×</text>
        </view>

        <view class="connect-options">
          <view class="connect-option" @tap="openBluetoothModal">
            <view class="icon-slot bluetooth"><text>BT</text></view>
            <view class="connect-body">
              <text class="connect-title">蓝牙连接</text>
              <text class="connect-desc">扫描附近设备并保存。</text>
            </view>
          </view>
          <view class="connect-option" @tap="openNetworkModal">
            <view class="icon-slot network"><text>NET</text></view>
            <view class="connect-body">
              <text class="connect-title">网络连接</text>
              <text class="connect-desc">填写网络信息并检测状态。</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="bluetoothModalVisible" class="modal-overlay" @tap="closeBluetoothModal">
      <view class="modal-sheet" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">蓝牙设备</text>
            <text class="modal-subtitle">选择扫描到的设备。</text>
          </view>
          <text class="modal-close" @tap="closeBluetoothModal">×</text>
        </view>

        <view class="scan-row">
          <button class="primary-btn" :disabled="bluetoothScanning" @tap="startBluetoothScan">
            {{ bluetoothScanning ? "扫描中" : "重新扫描" }}
          </button>
        </view>

        <view class="scan-list">
          <view
            v-for="item in bluetoothDevices"
            :key="item.deviceId"
            class="scan-item"
            @tap="saveBluetoothDevice(item)"
          >
            <view>
              <text class="scan-name">{{ item.name || "蓝牙设备" }}</text>
              <text class="scan-id">{{ item.deviceId }}</text>
            </view>
            <view class="scan-side">
              <text
                class="scan-identity"
                :class="{ matched: item.identityMatched }"
              >
                {{ item.identityMatched ? "已识别" : "待确认" }}
              </text>
              <text class="scan-rssi">{{ item.RSSI || "--" }}</text>
            </view>
          </view>
          <view v-if="!bluetoothDevices.length && !bluetoothScanning" class="scan-empty">
            未发现设备，请重新扫描。
          </view>
        </view>
      </view>
    </view>

    <view v-if="networkModalVisible" class="modal-overlay" @tap="closeNetworkModal">
      <view class="modal-sheet" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">网络设备</text>
            <text class="modal-subtitle">填写设备网络信息。</text>
          </view>
          <text class="modal-close" @tap="closeNetworkModal">×</text>
        </view>

        <view class="form-block">
          <text class="form-label">设备名称</text>
          <input v-model="networkForm.name" class="text-input" placeholder="例如：餐桌旁设备" />
        </view>
        <view class="form-block">
          <text class="form-label">Wi-Fi 名称</text>
          <input v-model="networkForm.ssid" class="text-input" placeholder="请输入网络名称" />
        </view>
        <view class="form-block">
          <text class="form-label">探测地址</text>
          <input v-model="networkForm.host" class="text-input" placeholder="可选，如 http://192.168.1.30/status" />
        </view>

        <button class="primary-btn wide" @tap="saveNetworkDevice">保存设备</button>
      </view>
    </view>

    <!-- AI助手入口：主页面提供悬浮咨询，组件内部负责聊天状态和历史缓存。 -->
    <ai-assistant />
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onHide, onShow, onUnload } from "@dcloudio/uni-app";
import { dietApi } from "@/api/index.js";
import { requireAuthenticatedPage } from "@/utils/auth.js";
import { formatDate } from "@/utils/index.js";
import {
  consumePendingHomeDevicePrompt,
  createDeviceFromConnection,
  getCurrentDeviceId,
  getDeviceRegistry,
  getStoredPreferences,
  getProjectDeviceNameMatch,
  hasProjectDeviceSignature,
  hasStoredDeviceRegistry,
  resolveDailyCaloriesTarget,
} from "@/utils/user-settings.js";

const userName = ref(
  (uni.getStorageSync("userInfo") || {}).nickname ||
    (uni.getStorageSync("userInfo") || {}).username ||
    "未登录用户",
);
const dailyTarget = ref(
  resolveDailyCaloriesTarget({
    userTarget: uni.getStorageSync("userTarget") || {},
    userInfo: uni.getStorageSync("userInfo") || {},
    preferences: getStoredPreferences(),
  }),
);
const todayPayload = ref(null);
const recentRecords = ref([]);
const latestRecordId = ref(null);
const devices = ref([]);
const currentDeviceId = ref("");
const homeDevicePromptVisible = ref(false);
const connectChooserVisible = ref(false);
const bluetoothModalVisible = ref(false);
const networkModalVisible = ref(false);
const bluetoothScanning = ref(false);
const bluetoothDevices = ref([]);
let recordPollingTimer = null;
let bluetoothDiscoveryStarted = false;
let bluetoothStopTimer = null;

const networkForm = reactive({
  name: "",
  ssid: "",
  host: "",
});

const statusMap = {
  online: "在线",
  syncing: "同步中",
  warning: "需关注",
  offline: "离线",
};

const todayText = computed(() => formatDate(new Date(), "YYYY-MM-DD"));
const currentHour = new Date().getHours();
const greeting =
  currentHour < 12 ? "上午好" : currentHour < 18 ? "下午好" : "晚上好";

const currentHomeDevice = computed(() => {
  return devices.value.find((item) => item.id === currentDeviceId.value) || null;
});

function refreshHeaderState() {
  const storedUser = uni.getStorageSync("userInfo") || {};
  const storedTarget = uni.getStorageSync("userTarget") || {};
  userName.value =
    storedUser.nickname || storedUser.username || storedUser.email || "未登录用户";
  // 首页目标热量和报告页共用同一套推算规则，避免不同页面口径不一致。
  dailyTarget.value = resolveDailyCaloriesTarget({
    userTarget: storedTarget,
    userInfo: storedUser,
    preferences: getStoredPreferences(),
  });
}

function loadDeviceState() {
  // Home 设备状态：只读本地设备登记信息，不主动创建默认设备。
  const nextDevices = getDeviceRegistry();
  const savedCurrentId = getCurrentDeviceId();
  devices.value = nextDevices;
  currentDeviceId.value = nextDevices.some((item) => item.id === savedCurrentId)
    ? savedCurrentId
    : nextDevices[0]?.id || "";
}

function maybeShowDevicePrompt() {
  // 登录后一次性引导：登录页写标记，首页首屏展示并立即消费。
  const shouldPrompt = consumePendingHomeDevicePrompt();
  if (shouldPrompt && !hasStoredDeviceRegistry()) {
    homeDevicePromptVisible.value = true;
  }
}

function unwrap(payload) {
  if (!payload) return null;
  return payload.data !== undefined ? payload.data : payload;
}

const totalCalories = computed(() => {
  const list = unwrap(todayPayload.value)?.todayTotal || [];
  // 后端/前端聚合返回字段不同，统一按 valueDay/value 兼容求和。
  return list.reduce(
    (sum, item) => sum + Number(item.valueDay ?? item.value ?? 0),
    0,
  );
});

const protein = computed(() => {
  return recentRecords.value.reduce(
    (sum, item) => sum + Number(item.protein ?? item.nutrients?.protein ?? 0),
    0,
  );
});

const carbs = computed(() => {
  return recentRecords.value.reduce(
    (sum, item) =>
      sum +
      Number(item.carbs ?? item.carbohydrate ?? item.nutrients?.carbs ?? 0),
    0,
  );
});

const fat = computed(() => {
  return recentRecords.value.reduce(
    (sum, item) => sum + Number(item.fat ?? item.nutrients?.fat ?? 0),
    0,
  );
});

const progressWidth = computed(() => {
  return Math.min(
    100,
    Math.round((totalCalories.value / Math.max(dailyTarget.value, 1)) * 100),
  );
});

const remainingCalories = computed(() => {
  return Math.max(0, dailyTarget.value - totalCalories.value);
});

function normalizeRecord(item = {}, index = 0) {
  // 记录可能来自后端 JSON、旧本地缓存或识别结果，进入首页前统一字段。
  return {
    id: item.id ?? `${item.createTime || "record"}-${index}`,
    foodName: item.foodName || item.name || "饮食记录",
    totalCalorie: Number(
      item.totalCalorie ?? item.calorie ?? item.totalCalories ?? 0,
    ),
    createTime: item.createTime || item.date || "",
    protein: Number(item.protein ?? item.nutrients?.protein ?? 0),
    carbs: Number(
      item.carbs ?? item.carbohydrate ?? item.nutrients?.carbs ?? 0,
    ),
    fat: Number(item.fat ?? item.nutrients?.fat ?? 0),
  };
}

async function loadHomeData() {
  if (loadingAuthGuard()) {
    return;
  }
  refreshHeaderState();

  try {
    // 今日统计优先走 dietApi 聚合结果，失败时用空结构保证页面可渲染。
    todayPayload.value = await dietApi.getDailyStat({ date: todayText.value });
  } catch (error) {
    console.error("加载今日统计失败:", error);
    todayPayload.value = { data: { todayTotal: [], date: todayText.value } };
  }

  try {
    // 最近记录只展示当天前 5 条，完整历史交给查询页。
    const result = await dietApi.getRecords({
      startTime: todayText.value,
      endTime: todayText.value,
    });
    const payload = unwrap(result);
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.records)
        ? payload.records
        : [];
    recentRecords.value = list
      .map(normalizeRecord)
      .sort((left, right) =>
        String(right.createTime || "").localeCompare(String(left.createTime || "")),
      )
      .slice(0, 5);
    latestRecordId.value = recentRecords.value[0]?.id ?? null;
  } catch (error) {
    console.error("加载最近记录失败:", error);
    recentRecords.value = [];
    latestRecordId.value = null;
  }
}

async function refreshOnNewRecord(force = false) {
  if (loadingAuthGuard()) {
    stopRecordPolling();
    return;
  }

  if (force) {
    // 识别页通过事件触发强制刷新，避免等待下一轮轮询。
    await loadHomeData();
    return;
  }

  try {
    // 普通轮询只检查是否有新记录，减少首页常驻时的请求量。
    const result = await dietApi.checkNewRecord();
    const payload = unwrap(result) || {};
    const nextRecordId = payload.recordId ?? null;

    if (payload.hasNew && nextRecordId !== latestRecordId.value) {
      await loadHomeData();
    }
  } catch (error) {
    console.warn("检查新记录失败", error);
  }
}

function startRecordPolling() {
  stopRecordPolling();
  // 首页可见时才轮询，离开页面立即停止，避免后台持续请求。
  recordPollingTimer = setInterval(() => {
    refreshOnNewRecord();
  }, 4000);
}

function stopRecordPolling() {
  if (!recordPollingTimer) return;
  clearInterval(recordPollingTimer);
  recordPollingTimer = null;
}

function handleDietRecordUpdated() {
  refreshOnNewRecord(true);
}

function handleDeviceRegistryUpdated() {
  loadDeviceState();
}

function loadingAuthGuard() {
  return !requireAuthenticatedPage({
    message: "请先登录后再使用",
    silent: false,
  });
}

function getStatusLabel(status = "") {
  return statusMap[status] || "在线";
}

function getConnectionIcon(type = "") {
  if (type === "bluetooth") return "BT";
  if (type === "network") return "NET";
  return "DEV";
}

function getDeviceConnectionText(device = {}) {
  if (device.connectionType === "bluetooth") {
    return device.bluetoothName || device.connectionName || "蓝牙设备";
  }
  if (device.connectionType === "network") {
    return device.networkSsid || device.connectionName || "网络设备";
  }
  return device.connectionName || device.model || "本地设备";
}

function formatBattery(value) {
  return value === null || value === undefined ? "--" : `${value}%`;
}

function formatDeviceTime(value = "", fallback = "未检测") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hour}:${minute}`;
}

function goRecognition() {
  uni.switchTab({ url: "/pages/food-recognition/recognition" });
}

function goSearch() {
  uni.navigateTo({ url: "/subpackages/history/searchAll/searchAll" });
}

function goDevices() {
  uni.switchTab({ url: "/pages/setting/devices" });
}

function handleDeviceCardTap() {
  if (currentHomeDevice.value) {
    goDevices();
    return;
  }
  homeDevicePromptVisible.value = true;
}

function dismissDevicePrompt() {
  homeDevicePromptVisible.value = false;
}

function openAddDeviceChooser() {
  homeDevicePromptVisible.value = false;
  connectChooserVisible.value = true;
}

function closeConnectChooser() {
  connectChooserVisible.value = false;
}

function openBluetoothModal() {
  connectChooserVisible.value = false;
  bluetoothModalVisible.value = true;
  bluetoothDevices.value = [];
  startBluetoothScan();
}

function closeBluetoothModal() {
  stopBluetoothScan();
  bluetoothModalVisible.value = false;
}

function normalizeBluetoothScanItem(item = {}) {
  // 蓝牙设备识别：符合项目前缀才标记为已识别，其他设备保存后保持待确认。
  const name = item.name || item.localName || "";
  const matchedPrefix = getProjectDeviceNameMatch(name);
  return {
    deviceId: item.deviceId,
    name,
    RSSI: item.RSSI,
    identityMatched: Boolean(matchedPrefix),
    identityLabel: matchedPrefix || "",
  };
}

function handleBluetoothDeviceFound(res = {}) {
  const foundDevices = Array.isArray(res.devices) ? res.devices : [];
  const nextMap = new Map(
    bluetoothDevices.value.map((item) => [item.deviceId, item]),
  );

  foundDevices.forEach((item) => {
    if (!item.deviceId) return;
    nextMap.set(item.deviceId, normalizeBluetoothScanItem(item));
  });

  bluetoothDevices.value = Array.from(nextMap.values()).sort((left, right) => {
    if (left.identityMatched !== right.identityMatched) {
      return left.identityMatched ? -1 : 1;
    }
    return Number(right.RSSI || -999) - Number(left.RSSI || -999);
  });
}

function startBluetoothScan() {
  if (
    typeof uni.openBluetoothAdapter !== "function" ||
    typeof uni.startBluetoothDevicesDiscovery !== "function" ||
    typeof uni.onBluetoothDeviceFound !== "function"
  ) {
    uni.showToast({ title: "当前环境不支持蓝牙", icon: "none" });
    return;
  }

  stopBluetoothScan({ silent: true });
  bluetoothDevices.value = [];
  bluetoothScanning.value = true;
  uni.onBluetoothDeviceFound(handleBluetoothDeviceFound);

  uni.openBluetoothAdapter({
    success: () => {
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        success: () => {
          bluetoothDiscoveryStarted = true;
          if (bluetoothStopTimer) {
            clearTimeout(bluetoothStopTimer);
          }
          bluetoothStopTimer = setTimeout(() => {
            bluetoothStopTimer = null;
            stopBluetoothScan({ silent: true });
          }, 8000);
        },
        fail: () => {
          bluetoothScanning.value = false;
          uni.showToast({ title: "蓝牙扫描失败", icon: "none" });
        },
      });
    },
    fail: () => {
      bluetoothScanning.value = false;
      uni.showToast({ title: "请开启蓝牙权限", icon: "none" });
    },
  });
}

function stopBluetoothScan({ silent = false } = {}) {
  // Home 设备引导扫描：离开页面或关闭弹窗时清理自动停止任务，避免后台重复触发。
  if (bluetoothStopTimer) {
    clearTimeout(bluetoothStopTimer);
    bluetoothStopTimer = null;
  }
  if (typeof uni.offBluetoothDeviceFound === "function") {
    uni.offBluetoothDeviceFound(handleBluetoothDeviceFound);
  }
  if (bluetoothDiscoveryStarted && typeof uni.stopBluetoothDevicesDiscovery === "function") {
    uni.stopBluetoothDevicesDiscovery({
      complete: () => {
        bluetoothDiscoveryStarted = false;
      },
    });
  }
  bluetoothScanning.value = false;
  if (!silent && typeof uni.closeBluetoothAdapter === "function") {
    uni.closeBluetoothAdapter();
  }
}

function saveBluetoothDevice(item = {}) {
  if (!item.deviceId) {
    uni.showToast({ title: "设备信息无效", icon: "none" });
    return;
  }

  const identityMatched =
    item.identityMatched || Boolean(getProjectDeviceNameMatch(item.name));
  const deviceName = item.name || "蓝牙设备";
  createDeviceFromConnection({
    connectionType: "bluetooth",
    name: deviceName,
    connectionName: item.name || item.deviceId,
    bluetoothDeviceId: item.deviceId,
    bluetoothName: item.name || "",
    status: identityMatched ? "online" : "warning",
    connected: identityMatched,
  });
  closeBluetoothModal();
  loadDeviceState();
  uni.$emit("device-registry-updated", { devices: devices.value });
  uni.showToast({
    title: identityMatched ? "设备已添加" : "已保存，待确认",
    icon: identityMatched ? "success" : "none",
  });
}

function openNetworkModal() {
  connectChooserVisible.value = false;
  Object.assign(networkForm, {
    name: "",
    ssid: "",
    host: "",
  });
  networkModalVisible.value = true;
}

function closeNetworkModal() {
  networkModalVisible.value = false;
}

function getNetworkType() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => resolve(res.networkType || "unknown"),
      fail: () => resolve("unknown"),
    });
  });
}

function probeUrl(url = "") {
  const target = String(url || "").trim();
  if (!target || !/^https?:\/\//i.test(target)) {
    return Promise.resolve({ checked: false, reachable: false, matched: false });
  }

  return new Promise((resolve) => {
    uni.request({
      url: target,
      method: "GET",
      timeout: 3000,
      success: (res) =>
        resolve({
          checked: true,
          reachable: true,
          matched: hasProjectDeviceSignature(res.data),
        }),
      fail: () => resolve({ checked: true, reachable: false, matched: false }),
    });
  });
}

async function saveNetworkDevice() {
  const hasBasicInfo =
    networkForm.name.trim() || networkForm.ssid.trim() || networkForm.host.trim();
  if (!hasBasicInfo) {
    uni.showToast({ title: "请填写设备信息", icon: "none" });
    return;
  }

  uni.showLoading({ title: "保存中..." });
  const networkType = await getNetworkType();
  const probeResult = await probeUrl(networkForm.host);
  uni.hideLoading();

  const isConfirmedDevice = probeResult.matched;
  const isReachable = probeResult.reachable || networkType !== "none";
  const nextStatus = isConfirmedDevice ? "online" : isReachable ? "warning" : "offline";

  createDeviceFromConnection({
    connectionType: "network",
    name: networkForm.name || networkForm.ssid || "网络设备",
    connectionName: networkForm.ssid || networkForm.host || "网络连接",
    networkSsid: networkForm.ssid,
    networkHost: networkForm.host,
    status: nextStatus,
    connected: isConfirmedDevice,
  });

  closeNetworkModal();
  loadDeviceState();
  uni.$emit("device-registry-updated", { devices: devices.value });
  uni.showToast({
    title: isConfirmedDevice ? "设备已添加" : "已保存，待确认",
    icon: isConfirmedDevice ? "success" : "none",
  });
}

onShow(() => {
  // 双重检查登录态：缺少本地用户快照时直接回登录页，避免空状态闪屏。
  const isLoggedIn = uni.getStorageSync("isLoggedIn");
  const userInfo = uni.getStorageSync("userInfo");
  if (!isLoggedIn || !userInfo?.username) {
    uni.reLaunch({ url: "/pages/login/login" });
    return;
  }

  loadDeviceState();
  maybeShowDevicePrompt();
  loadHomeData();
  startRecordPolling();
  uni.$off("diet-record-updated", handleDietRecordUpdated);
  uni.$on("diet-record-updated", handleDietRecordUpdated);
  uni.$off("device-registry-updated", handleDeviceRegistryUpdated);
  uni.$on("device-registry-updated", handleDeviceRegistryUpdated);
});

onHide(() => {
  stopRecordPolling();
  stopBluetoothScan({ silent: true });
  uni.$off("diet-record-updated", handleDietRecordUpdated);
  uni.$off("device-registry-updated", handleDeviceRegistryUpdated);
});

onUnload(() => {
  stopRecordPolling();
  stopBluetoothScan({ silent: true });
  uni.$off("diet-record-updated", handleDietRecordUpdated);
  uni.$off("device-registry-updated", handleDeviceRegistryUpdated);
});
</script>

<style scoped>
.safe-area {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 28rpx);
  padding-bottom: calc(var(--app-safe-bottom) + 28rpx);
}

.home-page {
  min-height: 100vh;
  padding: 0 28rpx 48rpx;
  background:
    radial-gradient(
      circle at top right,
      rgba(106, 140, 175, 0.18),
      transparent 36%
    ),
    linear-gradient(180deg, #f8fbff 0%, #eef4f8 100%);
}

.page-header {
  height: var(--total-header-height);
  padding-top: var(--app-safe-top);
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding-left: 16px;
  padding-right: 16px;
  margin-bottom: 26rpx;
  background: inherit;
}

.header-copy {
  flex: 1;
}

.greeting {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #223547;
}

.date-text {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6c8197;
}

.header-device {
  min-width: 116rpx;
  height: 72rpx;
  padding: 0 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  box-shadow: 0 12rpx 32rpx rgba(70, 104, 136, 0.12);
  color: #486988;
  font-size: 26rpx;
  font-weight: 600;
}

.header-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  animation: statusPulse 1.8s ease-in-out infinite;
}

.overview-card,
.device-status-card,
.action-card,
.record-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 22rpx;
  box-shadow: 0 16rpx 40rpx rgba(106, 140, 175, 0.08);
}

.overview-card {
  background: linear-gradient(135deg, #6a8caf 0%, #8cafc9 100%);
}

.overview-head,
.section-head,
.device-status-card,
.device-status-main,
.modal-head,
.scan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #223547;
}

.overview-card .section-title,
.overview-card .section-hint,
.overview-card .hero-number,
.overview-card .hero-unit,
.overview-card .progress-note {
  color: #fff;
}

.section-hint,
.section-link {
  font-size: 24rpx;
  color: #71859b;
}

.hero-number {
  margin-top: 30rpx;
  font-size: 82rpx;
  font-weight: 800;
  line-height: 1;
}

.hero-unit {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
}

.progress-track {
  margin-top: 28rpx;
  height: 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.28);
  overflow: hidden;
}

.progress-fill {
  position: relative;
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #b8ffd3 0%, #ffffff 100%);
  transition: width 0.28s ease;
  overflow: hidden;
}

.progress-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.58) 50%, transparent 100%);
  animation: progressShine 2.2s ease-in-out infinite;
}

.progress-note {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
}

.device-status-card {
  gap: 18rpx;
}

.device-status-main {
  flex: 1;
  justify-content: flex-start;
  gap: 18rpx;
  min-width: 0;
}

.device-status-copy {
  min-width: 0;
}

.device-status-title {
  display: block;
  font-size: 31rpx;
  font-weight: 700;
  color: #223547;
}

.device-status-desc,
.device-status-meta,
.connect-desc,
.modal-subtitle,
.scan-id {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  line-height: 1.5;
  color: #71859b;
}

.device-status-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.status-chip {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  color: #ffffff;
  font-size: 22rpx;
  white-space: nowrap;
}

.status-online {
  background: #2f9f63;
}

.status-syncing {
  background: #397bd1;
}

.status-warning {
  background: #d68a2e;
}

.status-offline {
  background: #8b9991;
}

.icon-slot {
  width: 76rpx;
  height: 76rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
}

.icon-slot.device {
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
}

.icon-slot.bluetooth {
  background: linear-gradient(135deg, #4a83d8 0%, #2563b8 100%);
}

.icon-slot.network {
  background: linear-gradient(135deg, #d68a2e 0%, #c46f1f 100%);
}

.icon-slot.large {
  width: 96rpx;
  height: 96rpx;
  margin: 0 auto;
  font-size: 34rpx;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 22rpx;
}

.nutrition-card {
  padding: 24rpx 18rpx;
  border-radius: 24rpx;
  box-shadow: 0 14rpx 32rpx rgba(106, 140, 175, 0.08);
}

.nutrition-card.protein {
  background: linear-gradient(135deg, #e6f7ec 0%, #cfead9 100%);
}

.nutrition-card.carbs {
  background: linear-gradient(135deg, #e7f1fb 0%, #d5e6f7 100%);
}

.nutrition-card.fat {
  background: linear-gradient(135deg, #fff2e5 0%, #ffe1c0 100%);
}

.nutrition-label {
  display: block;
  font-size: 22rpx;
  color: #57708a;
}

.nutrition-value {
  display: block;
  margin-top: 16rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: #223547;
}

.action-row {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 16rpx;
  margin-top: 22rpx;
}

.action-btn {
  padding: 26rpx;
  border-radius: 24rpx;
  background: #f6f9fc;
  transition: transform 0.18s ease;
}

.action-btn:active,
.connect-option:active,
.device-status-card:active,
button:active {
  transform: scale(0.98);
}

.action-btn.primary {
  background: linear-gradient(135deg, #eef5f7 0%, #dce9ef 100%);
  border: 1rpx solid rgba(86, 121, 151, 0.12);
}

.action-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #223547;
}

.action-btn.primary .action-title,
.action-btn.primary .action-desc {
  color: #223547;
}

.action-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #72869c;
  line-height: 1.5;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 20rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx 24rpx;
  border: 1rpx solid rgba(106, 140, 175, 0.08);
  border-radius: 20rpx;
  background: #f7fafd;
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.72);
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.record-item:active {
  transform: translateY(-2rpx) scale(0.99);
  background: #eef5fa;
  box-shadow: 0 10rpx 22rpx rgba(106, 140, 175, 0.08);
}

.record-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #223547;
}

.record-time {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #7c90a4;
}

.record-calorie {
  flex-shrink: 0;
  font-size: 26rpx;
  color: #567997;
}

.empty-box {
  margin-top: 22rpx;
  padding: 42rpx 20rpx;
  border-radius: 20rpx;
  background: #f6f9fc;
  text-align: center;
}

.empty-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #4c637a;
}

.empty-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8394a5;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: flex-end;
  padding: 24rpx;
  background: rgba(12, 27, 42, 0.36);
  box-sizing: border-box;
  animation: fadeIn 0.18s ease;
}

.modal-sheet {
  width: 100%;
  max-height: 86vh;
  overflow: auto;
  padding: 30rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-sizing: border-box;
  animation: sheetIn 0.22s ease;
}

.compact-sheet {
  text-align: center;
}

.modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #223547;
}

.modal-title.center,
.modal-subtitle.center {
  text-align: center;
}

.modal-close {
  width: 64rpx;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 16rpx;
  background: #f1f5f8;
  color: #6c8197;
  font-size: 38rpx;
  text-align: center;
  flex-shrink: 0;
}

.prompt-visual {
  margin-bottom: 22rpx;
}

.connect-options {
  margin-top: 26rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.connect-option,
.scan-item {
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f5f8fb;
}

.connect-option {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.connect-body {
  flex: 1;
  min-width: 0;
}

.connect-title,
.scan-name {
  display: block;
  font-size: 29rpx;
  font-weight: 700;
  color: #223547;
}

.modal-actions,
.scan-row {
  display: flex;
  gap: 12rpx;
  margin-top: 28rpx;
}

.modal-actions.split {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
}

.primary-btn,
.plain-btn {
  flex: 1;
  min-width: 0;
  height: 84rpx;
  line-height: 84rpx;
  border: none;
  border-radius: 18rpx;
  font-size: 28rpx;
}

.primary-btn {
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #ffffff;
}

.plain-btn {
  background: #f2f6f8;
  color: #567997;
}

.wide {
  width: 100%;
  margin-top: 28rpx;
}

button[disabled] {
  opacity: 0.55;
}

.scan-list {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.scan-rssi {
  color: #71859b;
  font-size: 24rpx;
}

.scan-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
}

.scan-identity {
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(214, 138, 46, 0.12);
  color: #c0781f;
  font-size: 21rpx;
}

.scan-identity.matched {
  background: rgba(47, 159, 99, 0.12);
  color: #2f9f63;
}

.scan-empty {
  padding: 24rpx;
  border-radius: 18rpx;
  background: #f5f8fb;
  color: #71859b;
  font-size: 24rpx;
  text-align: center;
}

.form-block {
  margin-top: 22rpx;
}

.form-label {
  display: block;
  font-size: 24rpx;
  color: #647c93;
}

.text-input {
  width: 100%;
  min-height: 92rpx;
  margin-top: 12rpx;
  padding: 0 22rpx;
  box-sizing: border-box;
  border-radius: 16rpx;
  background: #f5f8fb;
  color: #223547;
  font-size: 27rpx;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes sheetIn {
  from {
    transform: translateY(28rpx);
    opacity: 0.78;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Home UI 优化：卡片入场动效用于提升首屏层次，不改变业务数据流 */
.animated-card {
  animation: cardRise 0.42s ease both;
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

.delay-5 {
  animation-delay: 0.26s;
}

.device-status-card {
  position: relative;
  overflow: hidden;
  border: 1rpx solid rgba(86, 121, 151, 0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.device-status-card::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6rpx;
  background: linear-gradient(90deg, #4dba79 0%, #6a8caf 55%, #d68a2e 100%);
  opacity: 0.72;
}

.card-arrow {
  margin-left: 12rpx;
  font-size: 42rpx;
  line-height: 1;
  color: #8aa0b4;
}

/* 营养卡片图标占位：后续替换正式图标时只需改这里或替换节点内容 */
.nutrition-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.nutrition-card:active {
  transform: translateY(-4rpx) scale(0.99);
}

.nutrition-icon {
  width: 44rpx;
  height: 44rpx;
  margin-bottom: 14rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 800;
  color: #ffffff;
}

.nutrition-card.protein .nutrition-icon {
  background: #2f9f63;
}

.nutrition-card.carbs .nutrition-icon {
  background: #4a83d8;
}

.nutrition-card.fat .nutrition-icon {
  background: #d68a2e;
}

/* 快捷操作图标占位：拍照和查询入口先用 CSS 图形，等正式图标到位后替换资源 */
.action-btn {
  min-height: 132rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  box-sizing: border-box;
}

.action-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  position: relative;
  flex-shrink: 0;
  background: #e8eff5;
  transition: transform 0.2s ease;
}

.action-btn.primary .action-icon {
  background: linear-gradient(135deg, #6a8caf 0%, #4d8f9f 100%);
  animation: iconBreath 2.6s ease-in-out infinite;
}

.action-btn:active .action-icon {
  transform: rotate(-6deg) scale(1.08);
}

.camera-icon::before {
  content: "";
  position: absolute;
  left: 13rpx;
  top: 18rpx;
  width: 30rpx;
  height: 22rpx;
  border: 4rpx solid currentColor;
  border-radius: 8rpx;
}

.camera-icon::after {
  content: "";
  position: absolute;
  left: 23rpx;
  top: 25rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: currentColor;
}

.search-icon::before {
  content: "";
  position: absolute;
  left: 13rpx;
  top: 12rpx;
  width: 22rpx;
  height: 22rpx;
  border: 4rpx solid currentColor;
  border-radius: 50%;
}

.search-icon::after {
  content: "";
  position: absolute;
  right: 13rpx;
  bottom: 14rpx;
  width: 18rpx;
  height: 4rpx;
  border-radius: 4rpx;
  background: currentColor;
  transform: rotate(45deg);
}

.action-icon,
.action-btn:not(.primary) .action-title {
  color: #486988;
}

.action-btn.primary .action-icon {
  color: #ffffff;
}

.action-btn.primary .action-desc {
  color: #5d7389;
}

.modal-sheet {
  box-shadow: 0 -18rpx 48rpx rgba(34, 53, 71, 0.18);
}

.prompt-sheet {
  padding-top: 38rpx;
}

@keyframes cardRise {
  from {
    opacity: 0;
    transform: translateY(22rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progressShine {
  0% {
    transform: translateX(-100%);
  }
  55%,
  100% {
    transform: translateX(100%);
  }
}

@keyframes statusPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(77, 186, 121, 0.35);
  }
  50% {
    box-shadow: 0 0 0 10rpx rgba(77, 186, 121, 0);
  }
}

@keyframes iconBreath {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06);
  }
}

@media (max-width: 420px) {
  .device-status-card,
  .action-row,
  .modal-actions.split {
    display: grid;
    grid-template-columns: 1fr;
  }

  .device-status-side {
    align-items: flex-start;
  }
}
</style>
