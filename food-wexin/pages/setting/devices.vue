<template>
  <view class="devices-page safe-area">
    <view class="page-header">
      <view class="header-copy">
        <text class="page-title">设备</text>
        <text class="page-subtitle">连接状态、设备配置和账号绑定</text>
      </view>
    </view>

    <scroll-view scroll-y class="page-scroll">
      <view class="overview-panel animated-card delay-1">
        <view class="overview-main">
          <view class="device-visual" :class="currentDevice ? `visual-${currentDevice.status}` : 'visual-offline'">
            <view class="signal-ring ring-one"></view>
            <view class="signal-ring ring-two"></view>
            <text class="device-visual-icon">
              {{ currentDevice ? getConnectionIcon(currentDevice.connectionType) : "+" }}
            </text>
          </view>
          <view class="overview-copy">
            <text class="section-label">当前设备</text>
            <text class="current-name">
              {{ currentDevice ? currentDevice.name : "未连接设备" }}
            </text>
            <text class="current-meta">
              {{ currentDevice ? getDeviceConnectionText(currentDevice) : "登录后可通过蓝牙或网络添加设备" }}
            </text>
            <view v-if="currentDevice" class="current-tags">
              <text>{{ currentDevice.firmwareVersion || "固件未知" }}</text>
              <text>{{ currentDevice.boundUsername || "未绑定账号" }}</text>
            </view>
          </view>
          <text
            class="status-chip"
            :class="currentDevice ? `status-${currentDevice.status}` : 'status-offline'"
          >
            {{ currentDevice ? getStatusLabel(currentDevice.status) : "未连接" }}
          </text>
        </view>

        <view class="health-panel">
          <view class="health-head">
            <text>连接健康</text>
            <text>{{ currentDevice ? formatBattery(currentDevice.batteryLevel) : "--" }}</text>
          </view>
          <view class="health-track">
            <view
              class="health-fill"
              :class="currentDevice ? `health-${currentDevice.status}` : 'health-offline'"
              :style="{ width: currentDevice ? `${normalizeBattery(currentDevice.batteryLevel)}%` : '0%' }"
            ></view>
          </view>
          <view class="health-meta">
            <text>{{ currentDevice ? formatDeviceTime(currentDevice.lastCheckAt, "未检测") : "暂无检测" }}</text>
            <text>{{ currentDevice ? formatDeviceTime(currentDevice.lastSyncAt, "未同步") : "暂无同步" }}</text>
          </view>
        </view>

        <view class="summary-grid">
          <view class="summary-item">
            <text class="summary-value">{{ devices.length }}</text>
            <text class="summary-label">设备数</text>
          </view>
          <view class="summary-item">
            <text class="summary-value">{{ onlineCount }}</text>
            <text class="summary-label">在线</text>
          </view>
          <view class="summary-item">
            <text class="summary-value">{{ warningCount }}</text>
            <text class="summary-label">需关注</text>
          </view>
        </view>

        <view class="quick-actions">
          <image class="quick-actions-bg" src="/static/images/device-action-bg.jpg" mode="aspectFit"></image>
          <button class="primary-btn quick-action-btn" @tap="openConnectGuide">
            <view class="quick-icon add-icon">+</view>
            <view class="quick-copy">
              <text class="quick-title">添加设备</text>
              <text class="quick-desc">蓝牙 / 网络</text>
            </view>
          </button>
          <button class="secondary-btn quick-action-btn" @tap="checkAllDevices">
            <view class="quick-icon scan-icon"></view>
            <view class="quick-copy">
              <text class="quick-title">检测状态</text>
              <text class="quick-desc">刷新连接</text>
            </view>
          </button>
          <button
            class="secondary-btn quick-action-btn"
            :disabled="!currentDevice"
            @tap="currentDevice && openSettingsModal(currentDevice)"
          >
            <view class="quick-icon config-icon"></view>
            <view class="quick-copy">
              <text class="quick-title">配置当前</text>
              <text class="quick-desc">名称 / 网络</text>
            </view>
          </button>
        </view>
      </view>

      <view class="section-head">
        <text class="section-title">设备列表</text>
        <text class="section-action" @tap="addDemoDevice">添加设备</text>
      </view>

      <view v-if="devices.length" class="device-list">
        <view
          v-for="device in devices"
          :key="device.id"
          class="device-card animated-card"
          :class="{ active: device.id === currentDeviceId }"
          @tap="openDetailModal(device)"
        >
          <view class="device-row">
            <view class="device-icon">{{ getConnectionIcon(device.connectionType) }}</view>
            <view class="device-body">
            <view class="device-name-row">
                <text class="device-name">{{ device.name }}</text>
                <text v-if="device.id === currentDeviceId" class="current-chip">当前</text>
              </view>
              <text class="device-desc">{{ getDeviceConnectionText(device) }}</text>
              <view class="device-mini-tags">
                <text>{{ device.connectionType === "network" ? "网络" : "蓝牙" }}</text>
                <text>{{ device.firmwareVersion || "固件未知" }}</text>
              </view>
            </view>
            <text class="status-chip small" :class="`status-${device.status}`">
              {{ getStatusLabel(device.status) }}
            </text>
          </view>

          <view class="device-facts">
            <view>
              <text class="fact-label">电量</text>
              <text class="fact-value">{{ formatBattery(device.batteryLevel) }}</text>
            </view>
            <view>
              <text class="fact-label">检测</text>
              <text class="fact-value">{{ formatDeviceTime(device.lastCheckAt, "未检测") }}</text>
            </view>
            <view>
              <text class="fact-label">账号</text>
              <text class="fact-value">{{ device.boundUsername || "未绑定" }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty-panel">
        <view class="empty-device-visual">
          <text>+</text>
        </view>
        <text class="empty-title">还没有本地设备</text>
        <text class="empty-copy">添加设备后，可在这里查看连接状态和设备信息。</text>
        <button class="primary-btn" @tap="openConnectGuide">开始连接</button>
      </view>
    </scroll-view>

    <!-- 登录后设备引导：没有本地设备时，让用户选择蓝牙、网络或跳过。 -->
    <view v-if="connectGuideVisible" class="modal-overlay" @tap="closeConnectGuide">
        <view class="modal-sheet sheet-animated" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">连接设备</text>
            <text class="modal-subtitle">选择一种连接方式添加设备。</text>
          </view>
          <text class="modal-close" @tap="closeConnectGuide">×</text>
        </view>

        <view class="connect-options">
          <view class="connect-option" @tap="openBluetoothModal">
            <text class="connect-icon">BT</text>
            <view class="connect-body">
              <text class="connect-title">蓝牙连接</text>
              <text class="connect-desc">扫描附近设备并保存。</text>
            </view>
          </view>
          <view class="connect-option" @tap="openNetworkModal">
            <text class="connect-icon">NET</text>
            <view class="connect-body">
              <text class="connect-title">网络连接</text>
              <text class="connect-desc">保存 Wi-Fi/局域网信息，并用网络状态检测设备可达性</text>
            </view>
          </view>
        </view>

        <button class="plain-btn" @tap="skipDeviceSetup">暂时跳过</button>
      </view>
    </view>

    <!-- 蓝牙连接弹窗：使用 uni-app 蓝牙模块扫描并登记本地设备。 -->
    <view v-if="bluetoothModalVisible" class="modal-overlay" @tap="closeBluetoothModal">
        <view class="modal-sheet sheet-animated" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">蓝牙设备</text>
            <text class="modal-subtitle">选择扫描到的眼镜设备保存到本地</text>
          </view>
          <text class="modal-close" @tap="closeBluetoothModal">×</text>
        </view>

        <view class="scan-row">
          <button class="primary-btn" :disabled="bluetoothScanning" @tap="startBluetoothScan">
            {{ bluetoothScanning ? "扫描中" : "重新扫描" }}
          </button>
          <button class="secondary-btn" @tap="addManualBluetoothDevice">手动登记</button>
        </view>

        <view class="scan-list">
          <view
            v-for="item in bluetoothDevices"
            :key="item.deviceId"
            class="scan-item"
            @tap="saveBluetoothDevice(item)"
          >
            <view>
              <text class="scan-name">{{ item.name || "未命名蓝牙设备" }}</text>
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
            未发现设备，可重新扫描或手动登记。
          </view>
        </view>
      </view>
    </view>

    <!-- 网络连接弹窗：记录网络名称、密码和可选探测地址。 -->
    <view v-if="networkModalVisible" class="modal-overlay" @tap="closeNetworkModal">
        <view class="modal-sheet sheet-animated" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">网络设备</text>
            <text class="modal-subtitle">填写设备网络信息。</text>
          </view>
          <text class="modal-close" @tap="closeNetworkModal">×</text>
        </view>

        <view class="form-block">
          <text class="form-label">设备名称</text>
          <input v-model="networkForm.name" class="text-input" placeholder="例如：餐桌旁眼镜" />
        </view>
        <view class="form-block">
          <text class="form-label">Wi-Fi 名称</text>
          <input v-model="networkForm.ssid" class="text-input" placeholder="请输入设备所在网络名称" />
        </view>
        <view class="form-block">
          <text class="form-label">Wi-Fi 密码</text>
          <input v-model="networkForm.password" class="text-input" password placeholder="可选，本地保存用于再次连接" />
        </view>
        <view class="form-block">
          <text class="form-label">设备探测地址</text>
          <input v-model="networkForm.host" class="text-input" placeholder="可选，如 http://192.168.1.30/status" />
        </view>

        <button class="primary-btn wide" @tap="saveNetworkDevice">保存网络设备</button>
      </view>
    </view>

    <!-- 设备详情弹窗：将状态、账号、检测和操作集中展示。 -->
    <view v-if="detailModalVisible" class="modal-overlay" @tap="closeDetailModal">
        <view class="modal-sheet sheet-animated" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">{{ selectedDevice?.name || "设备详情" }}</text>
            <text class="modal-subtitle">{{ selectedDevice ? getDeviceConnectionText(selectedDevice) : "" }}</text>
          </view>
          <text class="modal-close" @tap="closeDetailModal">×</text>
        </view>

        <view v-if="selectedDevice" class="detail-grid">
          <view class="detail-item">
            <text class="detail-label">状态</text>
            <text class="detail-value">{{ getStatusLabel(selectedDevice.status) }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">电量</text>
            <text class="detail-value">{{ formatBattery(selectedDevice.batteryLevel) }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">最近检测</text>
            <text class="detail-value">{{ formatDeviceTime(selectedDevice.lastCheckAt, "未检测") }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">绑定账号</text>
            <text class="detail-value">{{ selectedDevice.boundUsername || "未绑定" }}</text>
          </view>
        </view>

        <view class="modal-actions">
          <button class="secondary-btn" @tap="selectedDevice && checkOneDevice(selectedDevice)">检测</button>
          <button class="secondary-btn" @tap="selectedDevice && switchDevice(selectedDevice)">设为当前</button>
          <button class="secondary-btn" @tap="selectedDevice && openBindModal(selectedDevice)">账号</button>
          <button class="secondary-btn" @tap="selectedDevice && openSettingsModal(selectedDevice)">配置</button>
          <button class="danger-btn" @tap="selectedDevice && disconnectDevice(selectedDevice)">断开</button>
        </view>
      </view>
    </view>

    <!-- 连接配置弹窗：允许用户维护蓝牙名称、网络名称、密码和探测地址。 -->
    <view v-if="settingsModalVisible" class="modal-overlay" @tap="closeSettingsModal">
        <view class="modal-sheet sheet-animated" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">设备配置</text>
            <text class="modal-subtitle">维护设备名称和连接信息。</text>
          </view>
          <text class="modal-close" @tap="closeSettingsModal">×</text>
        </view>

        <view class="form-block">
          <text class="form-label">设备名称</text>
          <input v-model="settingsForm.name" class="text-input" />
        </view>
        <view class="form-block">
          <text class="form-label">连接名称</text>
          <input v-model="settingsForm.connectionName" class="text-input" />
        </view>
        <view class="form-block">
          <text class="form-label">Wi-Fi 名称</text>
          <input v-model="settingsForm.networkSsid" class="text-input" />
        </view>
        <view class="form-block">
          <text class="form-label">Wi-Fi 密码</text>
          <input v-model="settingsForm.networkPassword" class="text-input" password />
        </view>
        <view class="form-block">
          <text class="form-label">探测地址</text>
          <input v-model="settingsForm.networkHost" class="text-input" />
        </view>

        <button class="primary-btn wide" @tap="saveDeviceSettings">保存配置</button>
      </view>
    </view>

    <!-- 账号绑定弹窗：保留设备与本地账号快照的绑定能力。 -->
    <view v-if="bindModalVisible" class="modal-overlay" @tap="closeBindModal">
        <view class="modal-sheet sheet-animated" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">绑定账号</text>
            <text class="modal-subtitle">当前设备切换账号时会同步本地活动账号</text>
          </view>
          <text class="modal-close" @tap="closeBindModal">×</text>
        </view>

        <view class="chip-row">
          <view
            v-for="profile in storedProfiles"
            :key="profile.username"
            class="select-chip"
            :class="{ active: bindForm.selectedUsername === profile.username }"
            @tap="pickStoredProfile(profile.username)"
          >
            {{ profile.nickname || profile.username }}
          </view>
        </view>

        <view class="form-block">
          <text class="form-label">手动账号名</text>
          <input v-model="bindForm.manualUsername" class="text-input" placeholder="输入新账号名会创建本地快照" />
        </view>

        <view class="modal-actions">
          <button class="secondary-btn" @tap="unbindDeviceAccount">解绑</button>
          <button class="primary-btn" @tap="confirmBindUser">确认绑定</button>
        </view>
      </view>
    </view>

    <!-- AI助手入口：设备页用于辅助解释连接、检测和配置状态。 -->
    <ai-assistant />
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onShow, onUnload } from "@dcloudio/uni-app";
import { userStore } from "@/store/index.js";
import { requireAuthenticatedPage } from "@/utils/auth.js";
import {
  bindDeviceToUser,
  clearPendingDeviceConnectMode,
  createDeviceFromConnection,
  createMockDevice,
  getCurrentDeviceId,
  getDeviceRegistry,
  getPendingDeviceConnectMode,
  getProjectDeviceNameMatch,
  hasProjectDeviceSignature,
  listStoredUserProfiles,
  saveDeviceRegistry,
  setCurrentDeviceId,
  switchCurrentDevice,
  updateDeviceConnectionSettings,
  updateDeviceStatus,
} from "@/utils/user-settings.js";

const devices = ref([]);
const currentDeviceId = ref("");
const storedProfiles = ref([]);
const connectGuideVisible = ref(false);
const bluetoothModalVisible = ref(false);
const networkModalVisible = ref(false);
const detailModalVisible = ref(false);
const settingsModalVisible = ref(false);
const bindModalVisible = ref(false);
const bluetoothScanning = ref(false);
const bluetoothDevices = ref([]);
const selectedDeviceId = ref("");
let bluetoothReadTimer = null;

const networkForm = reactive({
  name: "",
  ssid: "",
  password: "",
  host: "",
});

const settingsForm = reactive({
  deviceId: "",
  name: "",
  connectionName: "",
  networkSsid: "",
  networkPassword: "",
  networkHost: "",
});

const bindForm = reactive({
  deviceId: "",
  selectedUsername: "",
  manualUsername: "",
});

const statusMap = {
  online: "在线",
  syncing: "同步中",
  warning: "需关注",
  offline: "离线",
};

const currentDevice = computed(() =>
  devices.value.find((item) => item.id === currentDeviceId.value) || null,
);

const selectedDevice = computed(() =>
  devices.value.find((item) => item.id === selectedDeviceId.value) || null,
);

const onlineCount = computed(
  () => devices.value.filter((item) => item.status === "online").length,
);

const warningCount = computed(
  () => devices.value.filter((item) => item.status === "warning").length,
);

const bindingTargetUsername = computed(
  () =>
    String(bindForm.manualUsername || "").trim() ||
    String(bindForm.selectedUsername || "").trim(),
);

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
  return device.connectionName || device.model || "本地登记设备";
}

function formatBattery(value) {
  return value === null || value === undefined ? "--" : `${value}%`;
}

// 状态格式化与校验：电量条只接受 0-100，避免异常本地数据撑破 UI。
function normalizeBattery(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function formatDeviceTime(value = "", fallback = "未同步") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hour}:${minute}`;
}

function syncUserStoreFromStorage() {
  // 页面联动：设备切换账号后，把 storage 中的当前账号同步到全局 store 和其他页面。
  const storedUser = uni.getStorageSync("userInfo") || {};
  const storedToken = uni.getStorageSync("token") || storedUser.token || "";
  if (storedToken) {
    userStore.setToken(storedToken);
    uni.setStorageSync("isLoggedIn", true);
  }
  if (storedUser.username) {
    userStore.setUserInfo(storedUser);
    uni.$emit("userInfoUpdated", storedUser);
  }
}

function loadDeviceState() {
  // 页面状态加载：每次进入页面或设备列表变化时，从本地 storage 重新构建视图数据。
  devices.value = getDeviceRegistry();
  storedProfiles.value = listStoredUserProfiles();

  if (!devices.value.length) {
    currentDeviceId.value = "";
    return;
  }

  const savedCurrentId = getCurrentDeviceId();
  const hasCurrentDevice = devices.value.some((item) => item.id === savedCurrentId);
  currentDeviceId.value = hasCurrentDevice ? savedCurrentId : devices.value[0].id;
  if (!hasCurrentDevice) {
    setCurrentDeviceId(currentDeviceId.value);
  }
}

function openConnectGuide() {
  // 连接引导弹窗：用于登录后无设备、手动添加设备两个入口。
  connectGuideVisible.value = true;
}

function closeConnectGuide() {
  connectGuideVisible.value = false;
}

function skipDeviceSetup() {
  // 跳过连接：只关闭本次引导，不创建默认设备，避免误以为硬件已连接。
  clearPendingDeviceConnectMode();
  closeConnectGuide();
}

function resetNetworkForm() {
  Object.assign(networkForm, {
    name: "",
    ssid: "",
    password: "",
    host: "",
  });
}

// 蓝牙连接：调用 uni-app 蓝牙模块扫描设备，前端只保存用户选择的设备信息。
function openBluetoothModal() {
  clearPendingDeviceConnectMode();
  connectGuideVisible.value = false;
  bluetoothModalVisible.value = true;
  startBluetoothScan();
}

function closeBluetoothModal() {
  bluetoothModalVisible.value = false;
  bluetoothScanning.value = false;
  stopBluetoothScan();
}

function stopBluetoothScan() {
  // 蓝牙扫描清理：关闭弹窗或离开页面时，同步停止扫描和延迟读取任务。
  if (bluetoothReadTimer) {
    clearTimeout(bluetoothReadTimer);
    bluetoothReadTimer = null;
  }
  if (typeof uni.stopBluetoothDevicesDiscovery === "function") {
    uni.stopBluetoothDevicesDiscovery({});
  }
}

function startBluetoothScan() {
  if (
    typeof uni.openBluetoothAdapter !== "function" ||
    typeof uni.startBluetoothDevicesDiscovery !== "function" ||
    typeof uni.getBluetoothDevices !== "function"
  ) {
    uni.showToast({ title: "当前环境不支持蓝牙模块", icon: "none" });
    return;
  }

  bluetoothScanning.value = true;
  bluetoothDevices.value = [];
  uni.openBluetoothAdapter({
    success: () => {
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        success: () => {
          if (bluetoothReadTimer) {
            clearTimeout(bluetoothReadTimer);
          }
          bluetoothReadTimer = setTimeout(() => {
            bluetoothReadTimer = null;
            readBluetoothDevices();
          }, 1500);
        },
        fail: () => {
          bluetoothScanning.value = false;
          uni.showToast({ title: "蓝牙扫描启动失败", icon: "none" });
        },
      });
    },
    fail: () => {
      bluetoothScanning.value = false;
      uni.showToast({ title: "请先打开蓝牙权限", icon: "none" });
    },
  });
}

function normalizeBluetoothScanItem(item = {}) {
  // 蓝牙设备识别：匹配项目约定名称前缀的设备优先展示，未匹配的设备只能作为待确认保存。
  const name = item.name || item.localName || "";
  const matchedPrefix = getProjectDeviceNameMatch(name);
  return {
    ...item,
    name,
    identityMatched: Boolean(matchedPrefix),
    identityLabel: matchedPrefix || "",
  };
}

function readBluetoothDevices() {
  uni.getBluetoothDevices({
    success: (res) => {
      bluetoothDevices.value = (res.devices || [])
        .filter((item) => item.name || item.localName || item.deviceId)
        .map(normalizeBluetoothScanItem)
        .sort((left, right) => {
          if (left.identityMatched !== right.identityMatched) {
            return left.identityMatched ? -1 : 1;
          }
          return Number(right.RSSI || -999) - Number(left.RSSI || -999);
        });
    },
    complete: () => {
      bluetoothScanning.value = false;
      stopBluetoothScan();
    },
  });
}

function saveBluetoothDevice(item = {}) {
  // 保存蓝牙设备：把扫描结果转成统一设备模型，后续状态检测仍走前端本地逻辑。
  const identityMatched =
    item.identityMatched || Boolean(getProjectDeviceNameMatch(item.name));
  createDeviceFromConnection({
    connectionType: "bluetooth",
    name: item.name || "蓝牙眼镜",
    connectionName: item.name || item.deviceId || "蓝牙眼镜",
    bluetoothDeviceId: item.deviceId || "",
    bluetoothName: item.name || "",
    status: identityMatched ? "online" : "warning",
    connected: identityMatched,
  });
  closeBluetoothModal();
  loadDeviceState();
  uni.showToast({
    title: identityMatched ? "蓝牙设备已保存" : "已保存，待确认",
    icon: identityMatched ? "success" : "none",
  });
}

function addManualBluetoothDevice() {
  saveBluetoothDevice({
    name: "手动蓝牙眼镜",
    deviceId: `manual-bt-${Date.now()}`,
  });
}

// 网络连接：优先使用 uni.startWifi/connectWifi；若平台不支持，也允许先保存前端配置。
function openNetworkModal() {
  clearPendingDeviceConnectMode();
  connectGuideVisible.value = false;
  resetNetworkForm();
  networkModalVisible.value = true;
}

function closeNetworkModal() {
  networkModalVisible.value = false;
}

function getNetworkType() {
  // 网络状态读取：只判断当前运行环境是否有网络，不代表硬件已经上传到服务器。
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

  // 可选探测地址：用户填写设备本地状态页时才请求；未填写时不阻塞设备保存。
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

async function tryConnectWifi() {
  // Wi-Fi 连接：平台支持时尝试连接；不支持时返回 null，让页面继续保存配置。
  if (!networkForm.ssid || typeof uni.startWifi !== "function") {
    return null;
  }

  return new Promise((resolve) => {
    uni.startWifi({
      complete: () => {
        if (typeof uni.connectWifi !== "function") {
          resolve(null);
          return;
        }
        uni.connectWifi({
          SSID: networkForm.ssid,
          password: networkForm.password,
          success: () => resolve(true),
          fail: () => resolve(false),
        });
      },
    });
  });
}

async function saveNetworkDevice() {
  // 保存网络设备：Wi-Fi 名称或探测地址至少填一个，便于后续展示和检测。
  if (!networkForm.ssid.trim() && !networkForm.host.trim()) {
    uni.showToast({ title: "请填写 Wi-Fi 名称或探测地址", icon: "none" });
    return;
  }

  uni.showLoading({ title: "检测中..." });
  const wifiResult = await tryConnectWifi();
  const networkType = await getNetworkType();
  const probeResult = await probeUrl(networkForm.host);
  uni.hideLoading();

  const isConfirmedDevice = probeResult.matched;
  const isReachable =
    probeResult.reachable || wifiResult === true || networkType !== "none";
  const nextStatus = isConfirmedDevice ? "online" : isReachable ? "warning" : "offline";

  createDeviceFromConnection({
    connectionType: "network",
    name: networkForm.name || networkForm.ssid || "网络眼镜",
    connectionName: networkForm.ssid || networkForm.host || "网络连接",
    networkSsid: networkForm.ssid,
    networkPassword: networkForm.password,
    networkHost: networkForm.host,
    status: nextStatus,
    connected: isConfirmedDevice,
  });

  closeNetworkModal();
  loadDeviceState();
  uni.showToast({
    title: isConfirmedDevice ? "网络设备已保存" : "已保存，待确认",
    icon: "none",
  });
}

function addDemoDevice() {
  // 演示设备：用于没有真实硬件时验证列表、弹窗和状态样式。
  const nextDevice = createMockDevice({
    connectionType: "manual",
    connectionName: "本地设备",
    status: "warning",
    connected: false,
  });
  saveDeviceRegistry([...devices.value, nextDevice]);
  loadDeviceState();
  uni.showToast({ title: "设备已添加", icon: "success" });
}

function openDetailModal(device) {
  // 详情弹窗入口：列表卡片只展示摘要，具体检测/配置/绑定操作集中到弹窗。
  selectedDeviceId.value = device.id;
  detailModalVisible.value = true;
}

function closeDetailModal() {
  detailModalVisible.value = false;
  selectedDeviceId.value = "";
}

function openSettingsModal(device) {
  // 配置弹窗：编辑的是前端展示和状态检测字段，不写后端设备协议。
  selectedDeviceId.value = device.id;
  Object.assign(settingsForm, {
    deviceId: device.id,
    name: device.name || "",
    connectionName: device.connectionName || "",
    networkSsid: device.networkSsid || "",
    networkPassword: device.networkPassword || "",
    networkHost: device.networkHost || "",
  });
  settingsModalVisible.value = true;
}

function closeSettingsModal() {
  settingsModalVisible.value = false;
  Object.assign(settingsForm, {
    deviceId: "",
    name: "",
    connectionName: "",
    networkSsid: "",
    networkPassword: "",
    networkHost: "",
  });
}

function saveDeviceSettings() {
  // 保存配置：只更新本地登记信息，真实硬件网络密码仍由设备自身管理。
  if (!settingsForm.name.trim()) {
    uni.showToast({ title: "请填写设备名称", icon: "none" });
    return;
  }

  updateDeviceConnectionSettings(settingsForm.deviceId, {
    name: settingsForm.name,
    connectionName: settingsForm.connectionName,
    networkSsid: settingsForm.networkSsid,
    networkPassword: settingsForm.networkPassword,
    networkHost: settingsForm.networkHost,
  });
  closeSettingsModal();
  loadDeviceState();
  uni.showToast({ title: "设备配置已保存", icon: "success" });
}

async function resolveDeviceReachability(device) {
  // 状态检测核心：必须识别到项目设备签名才算 online，普通网络/蓝牙可用只算待确认。
  if (device.connectionType === "network") {
    const networkType = await getNetworkType();
    const probeResult = await probeUrl(device.networkHost);
    const reachable = probeResult.reachable || networkType !== "none";
    const connected = probeResult.matched;
    return {
      connected,
      status: connected ? "online" : reachable ? "warning" : "offline",
    };
  }

  if (device.connectionType === "bluetooth") {
    return checkBluetoothDeviceReachability(device);
  }

  return {
    connected: false,
    status: "warning",
  };
}

async function checkOneDevice(device, { silent = false } = {}) {
  if (!silent) {
    uni.showLoading({ title: "检测中..." });
  }

  const result = await resolveDeviceReachability(device);
  updateDeviceStatus(device.id, {
    status: result.status,
    connected: result.connected,
  });

  if (!silent) {
    uni.hideLoading();
  }
  loadDeviceState();
  if (!silent) {
    uni.showToast({ title: result.connected ? "设备可用" : "设备暂不可达", icon: "none" });
  }

  return result;
}

function checkBluetoothDeviceReachability(device = {}) {
  // 蓝牙检测：重新扫描并匹配已登记设备，同时校验名称前缀，避免把蓝牙开启误判为设备在线。
  if (
    typeof uni.openBluetoothAdapter !== "function" ||
    typeof uni.startBluetoothDevicesDiscovery !== "function" ||
    typeof uni.getBluetoothDevices !== "function"
  ) {
    return Promise.resolve({ connected: false, status: "offline" });
  }

  return new Promise((resolve) => {
    const finish = (result) => {
      if (typeof uni.stopBluetoothDevicesDiscovery === "function") {
        uni.stopBluetoothDevicesDiscovery({});
      }
      resolve(result);
    };

    uni.openBluetoothAdapter({
      success: () => {
        uni.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: false,
          complete: () => {
            setTimeout(() => {
              uni.getBluetoothDevices({
                success: (res) => {
                  const foundDevice = (res.devices || []).find((item) => {
                    const name = item.name || item.localName || "";
                    return (
                      item.deviceId === device.bluetoothDeviceId ||
                      name === device.bluetoothName ||
                      name === device.connectionName
                    );
                  });
                  const matchedName =
                    foundDevice?.name ||
                    foundDevice?.localName ||
                    device.bluetoothName ||
                    device.connectionName ||
                    device.name ||
                    "";
                  const connected = Boolean(
                    foundDevice && getProjectDeviceNameMatch(matchedName),
                  );
                  finish({
                    connected,
                    status: foundDevice ? (connected ? "online" : "warning") : "offline",
                  });
                },
                fail: () => finish({ connected: false, status: "offline" }),
              });
            }, 1500);
          },
        });
      },
      fail: () => resolve({ connected: false, status: "offline" }),
    });
  });
}

async function checkAllDevices() {
  // 批量检测：统一 loading 和结果提示，避免每台设备都弹一次 toast。
  if (!devices.value.length) {
    openConnectGuide();
    return;
  }

  uni.showLoading({ title: "检测中..." });
  let reachableCount = 0;
  for (const device of devices.value) {
    const result = await checkOneDevice(device, { silent: true });
    if (result.connected) {
      reachableCount += 1;
    }
  }
  uni.hideLoading();
  loadDeviceState();
  uni.showToast({
    title: `已检测 ${devices.value.length} 台设备，${reachableCount} 台可用`,
    icon: "none",
  });
}

function switchDevice(device) {
  // 当前设备切换：如果设备绑定了账号，会同步切换本地活动账号快照。
  const result = switchCurrentDevice(device.id);
  if (!result) {
    uni.showToast({ title: "切换失败", icon: "none" });
    return;
  }

  syncUserStoreFromStorage();
  loadDeviceState();
  closeDetailModal();
  uni.showToast({ title: "已设为当前设备", icon: "success" });
}

function disconnectDevice(device) {
  // 断开设备：这里只从本地设备列表移除，不会调用硬件或服务器删除接口。
  uni.showModal({
    title: "断开设备",
    content: `确定移除 ${device.name} 吗？`,
    success: (res) => {
      if (!res.confirm) return;

      const remainingDevices = devices.value.filter((item) => item.id !== device.id);
      saveDeviceRegistry(remainingDevices);
      if (device.id === currentDeviceId.value && remainingDevices.length) {
        switchCurrentDevice(remainingDevices[0].id);
        syncUserStoreFromStorage();
      }
      closeDetailModal();
      loadDeviceState();
      if (!remainingDevices.length) {
        openConnectGuide();
      }
    },
  });
}

function openBindModal(device) {
  // 账号绑定弹窗：当前设备绑定账号后，会影响“当前活动账号”的本地快照。
  selectedDeviceId.value = device.id;
  bindForm.deviceId = device.id;
  bindForm.selectedUsername = device.boundUsername || "";
  bindForm.manualUsername = "";
  bindModalVisible.value = true;
}

function closeBindModal() {
  bindModalVisible.value = false;
  bindForm.deviceId = "";
  bindForm.selectedUsername = "";
  bindForm.manualUsername = "";
}

function pickStoredProfile(username = "") {
  bindForm.selectedUsername = username;
  bindForm.manualUsername = "";
}

function confirmBindUser() {
  // 确认绑定：支持选择已有快照，也支持手动输入新账号名并创建本地快照。
  const username = bindingTargetUsername.value;
  if (!username) {
    uni.showToast({ title: "请选择或输入账号", icon: "none" });
    return;
  }

  const result = bindDeviceToUser(bindForm.deviceId, username, {
    activateIfCurrent: true,
  });
  if (!result) {
    uni.showToast({ title: "绑定失败", icon: "none" });
    return;
  }

  syncUserStoreFromStorage();
  closeBindModal();
  loadDeviceState();
  uni.showToast({ title: "账号已绑定", icon: "success" });
}

function unbindDeviceAccount() {
  const result = bindDeviceToUser(bindForm.deviceId, "", {
    activateIfCurrent: false,
  });
  if (!result) {
    uni.showToast({ title: "解绑失败", icon: "none" });
    return;
  }

  closeBindModal();
  loadDeviceState();
  uni.showToast({ title: "账号已解绑", icon: "success" });
}

function handleDeviceRegistryChanged() {
  // 事件刷新：其他弹窗或工具函数更新设备列表后，当前页面重新读取最新状态。
  loadDeviceState();
}

onShow(() => {
  if (
    !requireAuthenticatedPage({
      message: "请先登录后再使用设备模块",
      silent: true,
    })
  ) {
    return;
  }

  loadDeviceState();
  const pendingMode = getPendingDeviceConnectMode();
  if (pendingMode === "bluetooth") {
    openBluetoothModal();
  } else if (pendingMode === "network") {
    openNetworkModal();
  } else if (!devices.value.length) {
    openConnectGuide();
  }

  uni.$off("device-registry-updated", handleDeviceRegistryChanged);
  uni.$on("device-registry-updated", handleDeviceRegistryChanged);
});

onUnload(() => {
  uni.$off("device-registry-updated", handleDeviceRegistryChanged);
  stopBluetoothScan();
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

.devices-page {
  min-height: 100vh;
  padding: 0 24rpx 34rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f5fbf7 0%, #edf4f0 100%);
}

.page-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96rpx;
  margin-bottom: 24rpx;
}

.header-copy {
  width: 100%;
  padding: 0 24rpx;
  text-align: center;
  box-sizing: border-box;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #20372a;
}

.page-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b8172;
}

.page-scroll {
  height: calc(100vh - 140rpx);
}

.overview-panel,
.device-card,
.empty-panel {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24rpx;
  box-shadow: 0 14rpx 30rpx rgba(76, 110, 88, 0.08);
}

.overview-panel {
  padding: 28rpx;
}

.overview-main,
.device-row,
.modal-head,
.scan-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.section-label,
.summary-label,
.detail-label,
.form-label {
  display: block;
  font-size: 23rpx;
  color: #6f8577;
}

.current-name {
  display: block;
  margin-top: 10rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: #21382b;
}

.current-meta,
.device-desc,
.modal-subtitle,
.empty-copy,
.scan-id {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  line-height: 1.55;
  color: #6b8172;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 26rpx;
}

.summary-item,
.detail-item {
  padding: 18rpx;
  border-radius: 18rpx;
  background: #f2f7f4;
}

.summary-value,
.detail-value {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #20372a;
  word-break: break-all;
}

.quick-actions,
.modal-actions,
.scan-row {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
}

.primary-btn,
.secondary-btn,
.danger-btn,
.plain-btn {
  flex: 1;
  min-width: 0;
  height: 82rpx;
  line-height: 82rpx;
  border: none;
  border-radius: 18rpx;
  font-size: 27rpx;
}

.primary-btn {
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #ffffff;
}

.secondary-btn {
  background: #edf4f0;
  color: #436654;
}

.danger-btn {
  background: #fcebea;
  color: #d55e54;
}

.plain-btn {
  width: 100%;
  margin-top: 18rpx;
  background: #f4f7f5;
  color: #5b7365;
}

.wide {
  width: 100%;
  margin-top: 28rpx;
}

button[disabled] {
  opacity: 0.5;
}

.quick-actions {
  align-items: stretch;
  position: relative;
  overflow: hidden;
  padding: 18rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(67, 102, 84, 0.08);
  box-shadow: inset 0 2rpx 0 rgba(255, 255, 255, 0.72);
}

.quick-actions .quick-action-btn {
  height: auto;
  min-height: 128rpx;
  line-height: 1;
  padding: 18rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  position: relative;
  z-index: 1;
  overflow: hidden;
  box-shadow: 0 14rpx 30rpx rgba(67, 102, 84, 0.1);
}

.quick-actions-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  opacity: 0.38;
  pointer-events: none;
  animation: bgDrift 8s ease-in-out infinite;
}

.quick-actions .quick-action-btn::after {
  content: "";
  position: absolute;
  right: -28rpx;
  top: -34rpx;
  z-index: 0;
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.24);
}

.quick-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  font-size: 30rpx;
  font-weight: 800;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.quick-action-btn:active .quick-icon {
  transform: rotate(-6deg) scale(1.08);
}

.primary-btn .quick-icon {
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}

.secondary-btn .quick-icon {
  background: rgba(47, 159, 99, 0.1);
  color: #2f9f63;
}

.scan-icon::before,
.config-icon::before,
.config-icon::after {
  content: "";
  position: absolute;
}

.scan-icon::before {
  width: 24rpx;
  height: 24rpx;
  border: 4rpx solid currentColor;
  border-radius: 50%;
}

.scan-icon::after {
  content: "";
  position: absolute;
  right: 8rpx;
  bottom: 10rpx;
  width: 15rpx;
  height: 4rpx;
  border-radius: 4rpx;
  background: currentColor;
  transform: rotate(45deg);
}

.config-icon::before {
  width: 28rpx;
  height: 22rpx;
  border: 4rpx solid currentColor;
  border-radius: 8rpx;
}

.config-icon::after {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: currentColor;
}

.quick-copy {
  position: relative;
  z-index: 1;
}

.quick-title,
.quick-desc {
  display: block;
}

.quick-title {
  font-size: 25rpx;
  font-weight: 700;
}

.quick-desc {
  margin-top: 8rpx;
  font-size: 20rpx;
  opacity: 0.78;
}

.quick-action-btn[disabled] .quick-icon {
  filter: grayscale(1);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 28rpx 4rpx 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #20372a;
}

.section-action {
  font-size: 24rpx;
  color: #2f9f63;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.device-card {
  padding: 22rpx;
}

.device-card.active {
  border: 2rpx solid rgba(47, 159, 99, 0.28);
}

.device-icon,
.connect-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 18rpx;
  background: #e9f5ee;
  color: #2f9f63;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.device-body,
.connect-body {
  flex: 1;
  min-width: 0;
}

.device-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-wrap: wrap;
}

.device-name,
.connect-title,
.scan-name {
  display: block;
  font-size: 29rpx;
  font-weight: 700;
  color: #20372a;
}

.current-chip {
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(47, 159, 99, 0.1);
  color: #2f9f63;
  font-size: 21rpx;
}

.status-chip {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  color: #ffffff;
  font-size: 23rpx;
  white-space: nowrap;
}

.status-chip.small {
  font-size: 21rpx;
  padding: 8rpx 12rpx;
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

.device-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
  margin-top: 18rpx;
}

.device-facts > view {
  min-width: 0;
  padding: 14rpx 12rpx;
  border-radius: 14rpx;
  background: #f4f8f5;
}

.fact-label,
.fact-value {
  display: block;
  text-align: center;
}

.fact-label {
  color: #5d7566;
  font-size: 20rpx;
}

.fact-value {
  margin-top: 6rpx;
  color: #20372a;
  font-size: 22rpx;
  font-weight: 700;
  word-break: break-all;
}

.empty-panel {
  padding: 34rpx;
  text-align: center;
}

.empty-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #20372a;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: flex-end;
  padding: 24rpx;
  background: rgba(13, 30, 21, 0.36);
  box-sizing: border-box;
}

.modal-sheet {
  width: 100%;
  max-height: 86vh;
  overflow: auto;
  padding: 28rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.modal-title {
  display: block;
  font-size: 31rpx;
  font-weight: 700;
  color: #20372a;
}

.modal-close {
  width: 64rpx;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 16rpx;
  background: #f1f5f2;
  color: #627768;
  font-size: 38rpx;
  text-align: center;
  flex-shrink: 0;
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
  border-radius: 20rpx;
  background: #f5f8f6;
}

.connect-option {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.connect-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: #6c8172;
}

.scan-list {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.scan-rssi {
  color: #718577;
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
  background: #f5f8f6;
  color: #6b8172;
  font-size: 24rpx;
  text-align: center;
}

.form-block {
  margin-top: 22rpx;
}

.text-input {
  width: 100%;
  min-height: 92rpx;
  margin-top: 12rpx;
  padding: 0 22rpx;
  box-sizing: border-box;
  border-radius: 16rpx;
  background: #f5f8f6;
  color: #20372a;
  font-size: 27rpx;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 24rpx;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 24rpx;
}

.select-chip {
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  background: #edf4f0;
  color: #4f6b5a;
  font-size: 24rpx;
}

.select-chip.active {
  background: #2f9f63;
  color: #ffffff;
}

/* 设备页主视觉：用当前设备状态驱动图形化卡片，避免首屏只有文字和按钮 */
.overview-panel {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 248, 250, 0.98) 100%);
  border: 1rpx solid rgba(67, 102, 84, 0.08);
}

.overview-panel::before {
  content: "";
  position: absolute;
  right: -96rpx;
  top: -108rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: rgba(106, 140, 175, 0.16);
}

.overview-main {
  position: relative;
  align-items: center;
}

.overview-copy {
  flex: 1;
  min-width: 0;
}

.device-visual {
  position: relative;
  width: 116rpx;
  height: 116rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #6a8caf 0%, #4d8f9f 100%);
  box-shadow: 0 18rpx 36rpx rgba(74, 112, 140, 0.18);
}

.device-visual-icon {
  position: relative;
  z-index: 2;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 800;
}

.signal-ring {
  position: absolute;
  inset: -10rpx;
  border-radius: 42rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.72);
  animation: signalPulse 1.8s ease-in-out infinite;
}

.ring-two {
  inset: -20rpx;
  opacity: 0.4;
  animation-delay: 0.36s;
}

.visual-online {
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
}

.visual-syncing {
  background: linear-gradient(135deg, #5e9be8 0%, #397bd1 100%);
}

.visual-warning {
  background: linear-gradient(135deg, #e3a64e 0%, #d68a2e 100%);
}

.visual-offline {
  background: linear-gradient(135deg, #9aa8a0 0%, #7f8f86 100%);
}

.current-tags,
.device-mini-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}

.current-tags text,
.device-mini-tags text {
  padding: 7rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(67, 102, 84, 0.08);
  color: #4f6b5a;
  font-size: 21rpx;
}

/* 连接健康：把电量、检测时间、同步时间集中展示，减少用户找状态的成本 */
.health-panel {
  position: relative;
  margin-top: 26rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.7);
  border: 1rpx solid rgba(67, 102, 84, 0.08);
}

.health-head,
.health-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.health-head {
  color: #20372a;
  font-size: 24rpx;
  font-weight: 700;
}

.health-track {
  height: 14rpx;
  margin: 18rpx 0 14rpx;
  border-radius: 999rpx;
  background: #e6eee9;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  min-width: 8rpx;
  border-radius: inherit;
  transition: width 0.28s ease;
}

.health-online {
  background: linear-gradient(90deg, #4dba79 0%, #2f9f63 100%);
}

.health-syncing {
  background: linear-gradient(90deg, #5e9be8 0%, #397bd1 100%);
}

.health-warning {
  background: linear-gradient(90deg, #e3a64e 0%, #d68a2e 100%);
}

.health-offline {
  background: #8b9991;
}

.health-meta {
  color: #6b8172;
  font-size: 22rpx;
}

.summary-item {
  border: 1rpx solid rgba(67, 102, 84, 0.06);
  background: rgba(255, 255, 255, 0.72);
}

.device-card {
  background: rgba(255, 255, 255, 0.98);
  border: 1rpx solid rgba(67, 102, 84, 0.07);
  box-shadow: 0 16rpx 34rpx rgba(76, 110, 88, 0.1);
}

.device-card.active {
  background: linear-gradient(135deg, #ffffff 0%, #f4fbf6 100%);
}

.empty-device-visual {
  width: 116rpx;
  height: 116rpx;
  margin: 0 auto 24rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef5f7 0%, #dce9ef 100%);
  color: #486988;
  font-size: 48rpx;
  font-weight: 700;
}

@media (max-width: 420px) {
  .quick-actions,
  .modal-actions,
  .scan-row,
  .detail-grid,
  .device-facts {
    display: grid;
    grid-template-columns: 1fr;
  }

  .overview-main {
    align-items: flex-start;
  }
}

/* 设备管理 UI 优化：主卡与设备卡进场，突出设备模块在主导航中的权重 */
.animated-card {
  animation: cardRise 0.38s ease both;
}

.delay-1 {
  animation-delay: 0.03s;
}

.device-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.device-card:active,
.connect-option:active,
.scan-item:active,
button:active {
  transform: scale(0.985);
}

.device-card.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8rpx;
  background: #2f9f63;
  animation: activeBarPulse 1.8s ease-in-out infinite;
}

.modal-overlay {
  animation: fadeIn 0.18s ease both;
}

/* 设备操作弹层：统一底部抽屉动效，蓝牙/网络/详情/绑定都复用 */
.sheet-animated {
  animation: sheetIn 0.22s ease both;
  box-shadow: 0 -18rpx 48rpx rgba(13, 30, 21, 0.2);
}

.connect-option {
  transition: transform 0.18s ease, background 0.18s ease;
}

.connect-option:active {
  background: #edf6f1;
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
    opacity: 0.78;
    transform: translateY(34rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

@keyframes signalPulse {
  0% {
    opacity: 0.68;
    transform: scale(0.92);
  }
  70% {
    opacity: 0.08;
    transform: scale(1.18);
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}

@keyframes bgDrift {
  0%,
  100% {
    transform: scale(1) translateX(0);
  }
  50% {
    transform: scale(1.03) translateX(-8rpx);
  }
}

@keyframes activeBarPulse {
  0%,
  100% {
    opacity: 0.78;
  }
  50% {
    opacity: 1;
  }
}
</style>
