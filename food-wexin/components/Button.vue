<template>
  <button
    :class="buttonClasses"
    :style="buttonStyles"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <view v-if="loading" class="loading-indicator">
      <view class="loading-spinner"></view>
    </view>

    <view v-else class="button-content">
      <text v-if="icon" class="button-icon">{{ icon }}</text>
      <text v-if="$slots.default" class="button-text">
        <slot></slot>
      </text>
      <text v-if="badge" class="button-badge">{{ badge }}</text>
    </view>
  </button>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // 按钮类型
  type: {
    type: String,
    default: "primary",
    validator: (value) =>
      [
        "primary",
        "secondary",
        "success",
        "warning",
        "danger",
        "info",
        "text",
      ].includes(value),
  },

  // 按钮尺寸
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["small", "medium", "large"].includes(value),
  },

  // 是否禁用
  disabled: {
    type: Boolean,
    default: false,
  },

  // 是否加载中
  loading: {
    type: Boolean,
    default: false,
  },

  // 是否块级元素
  block: {
    type: Boolean,
    default: false,
  },

  // 是否圆形按钮
  round: {
    type: Boolean,
    default: false,
  },

  // 图标
  icon: {
    type: String,
    default: "",
  },

  // 徽章
  badge: {
    type: [String, Number],
    default: "",
  },

  // 自定义背景色
  backgroundColor: {
    type: String,
    default: "",
  },

  // 自定义文字颜色
  textColor: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["click"]);

// 按钮类名
const buttonClasses = computed(() => {
  const classes = ["custom-button"];
  classes.push(`button-${props.type}`);
  classes.push(`button-${props.size}`);

  if (props.disabled) classes.push("button-disabled");
  if (props.loading) classes.push("button-loading");
  if (props.block) classes.push("button-block");
  if (props.round) classes.push("button-round");

  return classes;
});

// 按钮样式
const buttonStyles = computed(() => {
  const styles = {};

  if (props.backgroundColor) {
    styles.backgroundColor = props.backgroundColor;
  }

  if (props.textColor) {
    styles.color = props.textColor;
  }

  return styles;
});

// 点击事件
const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit("click", event);
  }
};
</script>

<style scoped>
.custom-button {
  border: none;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

/* 按钮类型样式 */
.button-primary {
  background-color: #07c160;
  color: #ffffff;
  border: 1rpx solid #07c160;
}

.button-secondary {
  background-color: #34c759;
  color: #ffffff;
  border: 1rpx solid #34c759;
}

.button-success {
  background-color: #4caf50;
  color: #ffffff;
  border: 1rpx solid #4caf50;
}

.button-warning {
  background-color: #ff9800;
  color: #ffffff;
  border: 1rpx solid #ff9800;
}

.button-danger {
  background-color: #ff6b6b;
  color: #ffffff;
  border: 1rpx solid #ff6b6b;
}

.button-info {
  background-color: #45b7d1;
  color: #ffffff;
  border: 1rpx solid #45b7d1;
}

.button-text {
  background-color: transparent;
  color: #333333;
  border: none;
}

/* 按钮尺寸 */
.button-small {
  height: 60rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
  border-radius: 12rpx;
}

.button-medium {
  height: 80rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  border-radius: 16rpx;
}

.button-large {
  height: 100rpx;
  padding: 0 40rpx;
  font-size: 32rpx;
  border-radius: 20rpx;
}

/* 按钮状态 */
.button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-loading {
  cursor: wait;
}

.button-block {
  width: 100%;
}

.button-round {
  border-radius: 100rpx;
}

/* 按钮内容 */
.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.button-icon {
  font-size: inherit;
  margin-right: 8rpx;
}

.button-text {
  font-weight: 500;
  line-height: 1.5;
}

.button-badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background-color: #ff6b6b;
  color: #ffffff;
  font-size: 20rpx;
  min-width: 30rpx;
  height: 30rpx;
  border-radius: 15rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.button-text .loading-spinner {
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: #333333;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 悬停效果 */
.custom-button:not(.button-disabled):not(.button-text):active {
  opacity: 0.8;
  transform: scale(0.98);
}

.button-text:not(.button-disabled):active {
  color: #07c160;
}
</style>
