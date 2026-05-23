<template>
  <view class="ai-assistant-wrapper">
    <!-- 悬浮球 - 使用movable-area和movable-view实现拖拽 -->
    <movable-area v-if="!isChatVisible && isPositionReady" class="movable-area" scale-area="false">
      <movable-view
        class="floating-ball"
        :x="ballX"
        :y="ballY"
        direction="all"
        inertia="true"
        :animation="enableMoveAnimation"
        out-of-bounds="false"
        @change="handleBallMove"
        @touchstart="handleBallTouchStart"
        @touchend="handleBallTouchEnd"
        @mouseup="handleBallTouchEnd"
        @tap="toggleChat"
      >
        <view
          class="assistant-peek-shell"
          :class="[
            assistantEdge ? `edge-${assistantEdge}` : '',
            { 'is-expanded': isTouchingBall }
          ]"
        >
          <text class="ball-icon">🤖</text>
          <view class="ball-pulse"></view>
        </view>
      </movable-view>
    </movable-area>

    <!-- 聊天弹窗 -->
    <view v-if="isChatVisible" class="chat-overlay" @tap="toggleChat">
      <view class="chat-modal" @tap.stop>
        <!-- 聊天头部 -->
        <view class="chat-header">
          <view class="chat-avatar">
            <text>🤖</text>
          </view>
          <view class="chat-info">
            <text class="chat-title">零感食客</text>
            <text class="chat-subtitle">你好，我是您的饮食AI助手</text>
          </view>
          <view class="chat-actions">
            <view class="chat-clear" @tap="clearChatHistory">🗑</view>
            <view class="chat-close" @tap="toggleChat">×</view>
          </view>
        </view>

        <!-- 消息列表 -->
        <scroll-view class="chat-messages" scroll-y>
          <!-- AI欢迎消息 -->
          <view class="message message-ai">
            <view class="message-avatar">🤖</view>
            <view class="message-content">
              <text class="message-text">你好！我是零感食客，您的智能饮食助手。您今天已摄入 {{ dashboardData.consumed }} kcal，还可以吃 {{ dashboardData.remaining }} kcal 哦。我可以回答关于本小程序的功能使用、膳食营养、食物识别等问题，试试问我吧！</text>
            </view>
          </view>

          <!-- 快捷问题 -->
          <view class="quick-questions">
            <view
              v-for="(item, index) in quickQuestions"
              :key="index"
              class="quick-btn"
              @tap="askQuestion(item)"
            >
              <text>{{ item }}</text>
            </view>
          </view>

          <!-- 加载状态 -->
          <view v-if="isLoading" class="message message-ai">
            <view class="message-avatar">🤖</view>
            <view class="message-content loading">
              <view class="loading-dots">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
              </view>
            </view>
          </view>

          <!-- 用户消息 -->
          <view v-for="(msg, index) in messages" :key="index" :class="['message', msg.type === 'user' ? 'message-user' : 'message-ai']">
            <view v-if="msg.type === 'ai'" class="message-avatar">🤖</view>
            <view class="message-content">
              <text class="message-text">{{ msg.type === 'ai' ? msg.displayText : msg.text }}</text>
            </view>
          </view>
        </scroll-view>

        <!-- 输入区域 -->
        <view class="chat-input-area">
          <input
            v-model="userInput"
            type="text"
            placeholder="输入你的问题..."
            class="chat-input"
            @keyup.enter="sendMessage"
          />
          <button class="send-btn" @tap="sendMessage" :disabled="!userInput.trim() || isLoading">发送</button>
        </view>

        <!-- 快捷建议 -->
        <view v-if="showSuggestion" class="suggestion-bar">
          <text class="suggestion-text">{{ currentSuggestion }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, getCurrentInstance } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { get, post } from "@/api/request.js";

// Vue 3 组件实例（在顶级作用域获取）
const instance = getCurrentInstance();

const isChatVisible = ref(false);
const isLoading = ref(false);
const messages = ref([]);
const showSuggestion = ref(false);
const currentSuggestion = ref("");
const userInput = ref("");
const ballX = ref(260);
const ballY = ref(520);
const latestBallX = ref(260);
const latestBallY = ref(520);
const dragStartAt = ref(0);
const dragStartX = ref(260);
const dragStartY = ref(520);
const isDraggingBall = ref(false);
const isTouchingBall = ref(false);
const isPositionReady = ref(false);
const enableMoveAnimation = ref(false);
const assistantEdge = ref("");
const dashboardData = ref({
  consumed: 0,
  targetCal: 1950,
  percent: 0,
  remaining: 1950,
  username: ""
});

const quickQuestions = [
  "小程序功能介绍",
  "如何识别食物",
  "查看营养报告",
  "智能眼镜原理"
];

const AI_ASSISTANT_POSITION_KEY = "aiAssistantPosition";
const AI_ASSISTANT_POSITION_EVENT = "ai-assistant-position-updated";
const ASSISTANT_BALL_SIZE = 54;
const ASSISTANT_SIDE_GAP = 12;
const ASSISTANT_TOP_GAP = 96;
const ASSISTANT_BOTTOM_GAP = 112;
const DRAG_TAP_THRESHOLD = 8;
const EDGE_SNAP_DISTANCE = 48;
const POSITION_SYNC_THRESHOLD = 1;

function getAssistantBounds() {
  const systemInfo = uni.getSystemInfoSync();
  const windowWidth = Number(systemInfo.windowWidth) || 375;
  const windowHeight = Number(systemInfo.windowHeight) || 667;

  return {
    minX: ASSISTANT_SIDE_GAP,
    maxX: Math.max(windowWidth - ASSISTANT_BALL_SIZE - ASSISTANT_SIDE_GAP, ASSISTANT_SIDE_GAP),
    minY: ASSISTANT_TOP_GAP,
    maxY: Math.max(windowHeight - ASSISTANT_BALL_SIZE - ASSISTANT_BOTTOM_GAP, ASSISTANT_TOP_GAP),
  };
}

function clampAssistantPosition(x, y) {
  const bounds = getAssistantBounds();
  const numericX = Number(x);
  const numericY = Number(y);
  const nextX = Number.isFinite(numericX) ? numericX : bounds.maxX;
  const nextY = Number.isFinite(numericY) ? numericY : bounds.maxY;

  return {
    x: Math.min(Math.max(nextX, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(nextY, bounds.minY), bounds.maxY),
  };
}

function normalizeAssistantPosition(position = {}) {
  const safePosition = clampAssistantPosition(position.x, position.y);
  const edge = position.edge === "left" || position.edge === "right" ? position.edge : "";

  return {
    x: safePosition.x,
    y: safePosition.y,
    edge,
  };
}

function isSameAssistantPosition(position) {
  const nextPosition = normalizeAssistantPosition(position);
  return (
    Math.abs(ballX.value - nextPosition.x) <= POSITION_SYNC_THRESHOLD &&
    Math.abs(ballY.value - nextPosition.y) <= POSITION_SYNC_THRESHOLD &&
    assistantEdge.value === nextPosition.edge
  );
}

function getDefaultAssistantPosition() {
  const bounds = getAssistantBounds();
  return {
    x: bounds.maxX,
    y: bounds.maxY,
    edge: "right",
  };
}

function snapAssistantPosition(position) {
  const bounds = getAssistantBounds();
  const safePosition = clampAssistantPosition(position.x, position.y);
  let x = safePosition.x;
  let y = safePosition.y;
  let edge = "";

  // 边缘吸附：靠近安全边界才吸附，避免强制贴边影响用户停放位置。
  if (x - bounds.minX <= EDGE_SNAP_DISTANCE) {
    x = bounds.minX;
    edge = "left";
  } else if (bounds.maxX - x <= EDGE_SNAP_DISTANCE) {
    x = bounds.maxX;
    edge = "right";
  }

  if (y - bounds.minY <= EDGE_SNAP_DISTANCE) {
    y = bounds.minY;
  } else if (bounds.maxY - y <= EDGE_SNAP_DISTANCE) {
    y = bounds.maxY;
  }

  return { x, y, edge };
}

function readSavedAssistantPosition() {
  try {
    const savedPosition = uni.getStorageSync(AI_ASSISTANT_POSITION_KEY);
    if (savedPosition && typeof savedPosition === "object") {
      return normalizeAssistantPosition(savedPosition);
    }
  } catch (error) {
    console.warn("读取AI助手位置失败:", error);
  }

  return getDefaultAssistantPosition();
}

function applyAssistantPosition(position) {
  const safePosition = normalizeAssistantPosition(position);
  ballX.value = safePosition.x;
  ballY.value = safePosition.y;
  latestBallX.value = safePosition.x;
  latestBallY.value = safePosition.y;
  assistantEdge.value = safePosition.edge;
}

function applyAssistantPositionSilently(position, { markReady = true } = {}) {
  const safePosition = normalizeAssistantPosition(position);
  if (isSameAssistantPosition(safePosition) && isPositionReady.value === markReady) return;

  enableMoveAnimation.value = false;
  applyAssistantPosition(safePosition);

  if (markReady) {
    nextTick(() => {
      isPositionReady.value = true;
    });
  }
}

function syncAssistantPositionFromStorage() {
  applyAssistantPositionSilently(readSavedAssistantPosition());
}

function handleSharedAssistantPosition(position) {
  if (position && typeof position === "object" && !isDraggingBall.value) {
    applyAssistantPositionSilently(position);
  }
}

function saveAssistantPosition(position) {
  const safePosition = snapAssistantPosition(position);
  enableMoveAnimation.value = true;
  applyAssistantPosition(safePosition);

  try {
    uni.setStorageSync(AI_ASSISTANT_POSITION_KEY, safePosition);
    uni.$emit(AI_ASSISTANT_POSITION_EVENT, safePosition);
  } catch (error) {
    console.warn("保存AI助手位置失败:", error);
  }

  setTimeout(() => {
    enableMoveAnimation.value = false;
  }, 220);
}

// AI接口兜底：后端聊天接口未接入时，仍给用户一个可用的本地说明。
function getLocalAssistantReply(content) {
  if (content.includes("识别") || content.includes("食物")) {
    return "你可以在识别页上传图片，确认食物名称和重量后加入饮食记录。识别结果会参与首页统计和报告分析。";
  }
  if (content.includes("报告") || content.includes("营养")) {
    return "报告页会按日报或周报汇总热量、蛋白质、碳水和脂肪，并结合目标热量展示完成情况。";
  }
  if (content.includes("眼镜") || content.includes("设备") || content.includes("蓝牙") || content.includes("网络")) {
    return "设备页可以添加蓝牙或网络设备，检测连接状态，并把当前设备和本地账号绑定，便于查看设备状态。";
  }
  if (content.includes("功能") || content.includes("介绍")) {
    return "这个小程序主要包含首页看板、食物识别、设备管理、饮食报告和个人设置，帮助你记录并分析日常饮食。";
  }
  return "我可以帮你了解食物识别、饮食记录、设备连接、营养报告和账号设置。你可以换个更具体的问题试试。";
}

function toggleChat() {
  if (isDraggingBall.value) {
    isDraggingBall.value = false;
    return;
  }

  isChatVisible.value = !isChatVisible.value;
  if (isChatVisible.value && messages.value.length === 0) {
    loadDashboardData();
    loadChatHistory();
  }
}

// 加载聊天历史
function loadChatHistory() {
  const userInfo = uni.getStorageSync('userInfo') || {};
  const username = userInfo.username || 'guest';
  const key = `chat_history_${username}`;
  const savedHistory = uni.getStorageSync(key);
  
  if (savedHistory && Array.isArray(savedHistory)) {
    // 直接加载历史记录，不触发打字动画
    messages.value = savedHistory.map(msg => ({
      ...msg,
      displayText: msg.type === 'ai' ? msg.text : msg.text
    }));
  }
}

// 保存聊天历史
function saveChatHistory() {
  const userInfo = uni.getStorageSync('userInfo') || {};
  const username = userInfo.username || 'guest';
  const key = `chat_history_${username}`;
  
  // 只保留最近20条记录
  const recentMessages = messages.value.slice(-20);
  uni.setStorageSync(key, recentMessages);
}

// 清空聊天记录
function clearChatHistory() {
  const userInfo = uni.getStorageSync('userInfo') || {};
  const username = userInfo.username || 'guest';
  const key = `chat_history_${username}`;
  
  uni.removeStorageSync(key);
  messages.value = [];
  uni.showToast({ title: '聊天记录已清空', icon: 'success' });
}

async function loadDashboardData() {
  try {
    const result = await get("/api/home", {}, { showError: false, showLoading: false });
    if (result?.data) {
      dashboardData.value = {
        consumed: result.data.consumed || 0,
        targetCal: result.data.targetCal || 1950,
        percent: result.data.percent || 0,
        remaining: result.data.remaining || 1950,
        username: result.data.username || ""
      };
    }
  } catch (error) {
    console.error("获取首页数据失败:", error);
  }
}

// 打字机效果
async function typewriterEffect(message, callback) {
  let displayText = "";
  const fullText = message.text;
  let index = 0;
  
  message.displayText = displayText;
  
  while (index < fullText.length) {
    displayText += fullText.charAt(index);
    message.displayText = displayText;
    index++;
    // 控制速度，移除nextTick以提升性能
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  
  // 消息完全生成后滚动到底部
  scrollToBottom();
  
  if (callback) callback();
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (instance && instance.proxy) {
      const query = uni.createSelectorQuery().in(instance.proxy);
      query.select('.chat-messages').boundingClientRect();
      query.select('.chat-messages').scrollOffset();
      query.exec((res) => {
        if (res[0]) {
          uni.pageScrollTo({
            scrollTop: 99999,
            duration: 100
          });
        }
      });
    }
  });
}



// 发送消息
async function sendMessage() {
  const content = userInput.value.trim();
  if (!content || isLoading.value) return;
  
  // 添加用户消息（使用解构赋值强制触发响应式更新）
  messages.value = [...messages.value, { type: "user", text: content }];
  userInput.value = "";
  isLoading.value = true;
  showSuggestion.value = false;
  
  // 保存聊天历史
  saveChatHistory();
  
  // 添加"思考中"状态
  const thinkingMessage = { 
    type: "ai", 
    text: "思考中...",
    displayText: "思考中...",
    isThinking: true
  };
  messages.value = [...messages.value, thinkingMessage];
  
  try {
    // 准备历史对话记录（最近3-5轮），排除当前用户消息
    const historyMessages = [];
    
    // 提取最近的对话记录，过滤掉思考状态，排除最后一条（当前用户消息）
    const validMessages = messages.value.filter(m => !m.isThinking);
    const messagesWithoutCurrent = validMessages.slice(0, -1);
    
    // 只取最近的3-5轮对话
    for (let i = messagesWithoutCurrent.length - 1; i >= 0; i--) {
      const msg = messagesWithoutCurrent[i];
      if (historyMessages.length >= 10) break; // 最多10条消息（5轮）
      historyMessages.unshift({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    }
    
    // 调用后端AI聊天接口
    const result = await post("/api/ai/chat", { 
      content, 
      historyMessages 
    }, { showError: false, showLoading: false });
    
    // 处理不同的返回格式
    let responseText = "";
    if (result?.data?.data?.response) {
      responseText = result.data.data.response;
    } else if (result?.data?.response) {
      responseText = result.data.response;
    } else if (result?.data?.msg) {
      responseText = result.data.msg;
    } else {
      responseText = "抱歉，我暂时无法回答这个问题，请稍后再试。";
    }
    
    if (responseText) {
      // 移除"思考中"消息（替换为AI回复）
      messages.value = messages.value.filter(m => !m.isThinking);
      
      const aiMessage = { 
        type: "ai", 
        text: responseText,
        displayText: ""
      };
      messages.value = [...messages.value, aiMessage];
      
      // 打字机效果
      await typewriterEffect(aiMessage);
      
      // 保存聊天历史
      saveChatHistory();
    } else {
      // 移除"思考中"消息
      messages.value = messages.value.filter(m => !m.isThinking);
      const errorMessage = { type: "ai", text: "抱歉，我暂时无法回答这个问题，请稍后再试。" };
      messages.value = [...messages.value, errorMessage];
      scrollToBottom();
      
      // 保存聊天历史
      saveChatHistory();
    }
  } catch (error) {
    console.error("AI聊天失败:", error);
    // 移除"思考中"消息
    messages.value = messages.value.filter(m => !m.isThinking);
    const aiMessage = { 
      type: "ai", 
      text: getLocalAssistantReply(content),
      displayText: ""
    };
    messages.value = [...messages.value, aiMessage];
    await typewriterEffect(aiMessage);
    saveChatHistory();
  } finally {
    isLoading.value = false;
  }
}

async function askQuestion(question) {
  // 直接调用sendMessage
  userInput.value = question;
  await sendMessage();
}

function handleBallMove(event) {
  const detail = event?.detail || {};
  const safePosition = clampAssistantPosition(detail.x, detail.y);
  latestBallX.value = safePosition.x;
  latestBallY.value = safePosition.y;
}

function handleBallTouchStart() {
  dragStartAt.value = Date.now();
  dragStartX.value = latestBallX.value;
  dragStartY.value = latestBallY.value;
  isDraggingBall.value = false;
  isTouchingBall.value = true;
}

function handleBallTouchEnd() {
  const deltaX = Math.abs(latestBallX.value - dragStartX.value);
  const deltaY = Math.abs(latestBallY.value - dragStartY.value);
  const movedDistance = Math.max(deltaX, deltaY);

  if (movedDistance > DRAG_TAP_THRESHOLD || Date.now() - dragStartAt.value > 260) {
    isDraggingBall.value = true;
    saveAssistantPosition({
      x: latestBallX.value,
      y: latestBallY.value,
    });

    setTimeout(() => {
      isDraggingBall.value = false;
      isTouchingBall.value = false;
    }, 80);
    return;
  }

  setTimeout(() => {
    isTouchingBall.value = false;
  }, 160);
}

onMounted(() => {
  // 悬浮助手位置：读取全局缓存，并监听其他页面实例的坐标更新。
  syncAssistantPositionFromStorage();
  uni.$on(AI_ASSISTANT_POSITION_EVENT, handleSharedAssistantPosition);
});

onShow(() => {
  // Tab页会被缓存，重新显示时必须回到唯一的全局坐标。
  syncAssistantPositionFromStorage();
});

onUnmounted(() => {
  uni.$off(AI_ASSISTANT_POSITION_EVENT, handleSharedAssistantPosition);
});
</script>

<style scoped>
.ai-assistant-wrapper {
  position: fixed;
  z-index: 2147483647;
}

/* 可移动区域 */
.movable-area {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999998;
  pointer-events: none;
}

.floating-ball {
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  overflow: visible;
}

.assistant-peek-shell {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(77, 186, 121, 0.4);
  transition: transform 180ms ease, box-shadow 180ms ease;
  will-change: transform;
}

.assistant-peek-shell.edge-left {
  transform: translateX(-46%);
}

.assistant-peek-shell.edge-right {
  transform: translateX(46%);
}

.assistant-peek-shell.is-expanded {
  transform: translateX(0) scale(1.04);
  box-shadow: 0 10rpx 28rpx rgba(77, 186, 121, 0.46);
}

.ball-icon {
  font-size: 48rpx;
  z-index: 10;
}

.ball-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  animation: pulse 2s ease-out infinite;
  z-index: -1;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10rpx);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 32rpx;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  pointer-events: auto;
  z-index: 2147483646;
}

.chat-modal {
  width: 100%;
  max-width: 600rpx;
  max-height: 75vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
}

.chat-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.chat-info {
  flex: 1;
  margin-left: 16rpx;
}

.chat-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
}

.chat-subtitle {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  opacity: 0.9;
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.chat-clear {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.chat-close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 300;
}

.chat-messages {
  flex: 1;
  padding: 24rpx;
  min-height: 400rpx;
  max-height: 50vh;
  box-sizing: border-box;
}

.message {
  display: flex;
  margin-bottom: 24rpx;
  align-items: flex-start;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #f0f7f3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
}

.message-user .message-avatar {
  background: #e8f5e9;
}

.message-content {
  max-width: 70%;
  padding: 16rpx 20rpx;
  border-radius: 20rpx;
  background: #f5f8fb;
  margin-left: 12rpx;
}

.message-user .message-content {
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
  margin-left: 0;
  margin-right: 12rpx;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.5;
  color: #333;
}

.message-user .message-text {
  color: #fff;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
  padding: 0 16rpx;
}

.quick-btn {
  padding: 12rpx 20rpx;
  background: #e8f5e9;
  border-radius: 32rpx;
  font-size: 24rpx;
  color: #2f9f63;
  border: 1rpx solid #c8e6c9;
}

.loading-dots {
  display: flex;
  gap: 8rpx;
  padding: 8rpx 0;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #4dba79;
  animation: bounce 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 输入区域 */
.chat-input-area {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  border-top: 1rpx solid #f0f0f0;
  background: #fff;
}

.chat-input {
  flex: 1;
  height: 80rpx;
  padding: 0 20rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 40rpx;
  font-size: 28rpx;
  background: #f9f9f9;
  margin-right: 12rpx;
}

.send-btn {
  width: 120rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
  font-size: 28rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:disabled {
  opacity: 0.6;
}

.suggestion-bar {
  padding: 16rpx 24rpx;
  background: #fffbeb;
  border-top: 1rpx solid #fef3c7;
}

.suggestion-text {
  font-size: 24rpx;
  color: #92400e;
}
</style>
