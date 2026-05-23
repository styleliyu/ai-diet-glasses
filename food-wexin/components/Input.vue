<template>
  <view class="input-container" :class="containerClasses">
    <!-- 标签 -->
    <text v-if="label" class="input-label">
      {{ label }}
      <text v-if="required" class="required-mark">*</text>
    </text>
    
    <!-- 输入框区域 -->
    <view class="input-wrapper" :class="wrapperClasses">
      <!-- 前缀图标 -->
      <view v-if="prefixIcon" class="input-prefix" @click="handlePrefixClick">
        <text class="prefix-icon">{{ prefixIcon }}</text>
      </view>
      
      <!-- 输入框 -->
      <input
        ref="inputRef"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        :focus="autoFocus"
        :password="type === 'password' && !showPassword"
        :confirm-type="confirmType"
        :style="inputStyles"
        class="input-field"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @confirm="handleConfirm"
        @keyboardheightchange="handleKeyboardHeightChange"
      />
      
      <!-- 清除按钮 -->
      <view 
        v-if="clearable && modelValue && !disabled" 
        class="input-clear" 
        @click="handleClear"
      >
        <text class="clear-icon">×</text>
      </view>
      
      <!-- 密码显示/隐藏按钮 -->
      <view 
        v-if="type === 'password' && modelValue" 
        class="input-password-toggle" 
        @click="togglePassword"
      >
        <text class="password-icon">{{ showPassword ? '🙈' : '👁️' }}</text>
      </view>
      
      <!-- 后缀图标 -->
      <view v-if="suffixIcon" class="input-suffix" @click="handleSuffixClick">
        <text class="suffix-icon">{{ suffixIcon }}</text>
      </view>
    </view>
    
    <!-- 错误信息 -->
    <text v-if="error" class="input-error">
      <text class="error-icon">⚠️</text>
      {{ error }}
    </text>
    
    <!-- 提示信息 -->
    <text v-if="hint && !error" class="input-hint">
      <text class="hint-icon">💡</text>
      {{ hint }}
    </text>
    
    <!-- 字数统计 -->
    <text v-if="showCount && maxlength" class="input-count">
      {{ countText }}
    </text>
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  // 双向绑定值
  modelValue: {
    type: [String, Number],
    default: ''
  },
  
  // 输入框类型
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'number', 'password', 'textarea', 'digit'].includes(value)
  },
  
  // 标签
  label: {
    type: String,
    default: ''
  },
  
  // 占位符
  placeholder: {
    type: String,
    default: ''
  },
  
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  
  // 是否必填
  required: {
    type: Boolean,
    default: false
  },
  
  // 是否可清除
  clearable: {
    type: Boolean,
    default: false
  },
  
  // 最大长度
  maxlength: {
    type: Number,
    default: -1
  },
  
  // 显示字数统计
  showCount: {
    type: Boolean,
    default: false
  },
  
  // 错误信息
  error: {
    type: String,
    default: ''
  },
  
  // 提示信息
  hint: {
    type: String,
    default: ''
  },
  
  // 大小
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  
  // 圆角
  round: {
    type: Boolean,
    default: false
  },
  
  // 前缀图标
  prefixIcon: {
    type: String,
    default: ''
  },
  
  // 后缀图标
  suffixIcon: {
    type: String,
    default: ''
  },
  
  // 自动聚焦
  autoFocus: {
    type: Boolean,
    default: false
  },
  
  // 确认按钮类型
  confirmType: {
    type: String,
    default: 'done'
  },
  
  // 自定义样式
  customStyle: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits([
  'update:modelValue',
  'input',
  'focus',
  'blur',
  'confirm',
  'clear',
  'keyboardheightchange',
  'click-prefix',
  'click-suffix'
]);

// 状态
const inputRef = ref(null);
const showPassword = ref(false);
const isFocused = ref(false);

// 计算属性
const inputType = computed(() => {
  if (props.type === 'password' && showPassword.value) {
    return 'text';
  }
  return props.type;
});

const containerClasses = computed(() => {
  const classes = ['input-container'];
  classes.push(`input-size-${props.size}`);
  if (props.error) classes.push('input-error-state');
  if (props.disabled) classes.push('input-disabled');
  return classes;
});

const wrapperClasses = computed(() => {
  const classes = ['input-wrapper'];
  if (isFocused.value) classes.push('input-focused');
  if (props.round) classes.push('input-round');
  if (props.error) classes.push('input-error');
  if (props.disabled) classes.push('input-disabled');
  return classes;
});

const inputStyles = computed(() => {
  return {
    ...props.customStyle
  };
});

const countText = computed(() => {
  const value = String(props.modelValue || '');
  const length = value.length;
  if (props.maxlength > 0) {
    return `${length}/${props.maxlength}`;
  }
  return `${length}`;
});

// 方法
const handleInput = (event) => {
  let value = event.detail.value;
  emit('update:modelValue', value);
  emit('input', value);
};

const handleFocus = (event) => {
  isFocused.value = true;
  emit('focus', event);
};

const handleBlur = (event) => {
  isFocused.value = false;
  emit('blur', event);
};

const handleConfirm = (event) => {
  emit('confirm', event);
};

const handleClear = () => {
  emit('update:modelValue', '');
  emit('clear');
  
  // 重新聚焦输入框
  nextTick(() => {
    inputRef.value?.focus?.();
  });
};

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handlePrefixClick = () => {
  emit('click-prefix');
};

const handleSuffixClick = () => {
  emit('click-suffix');
};

const handleKeyboardHeightChange = (event) => {
  emit('keyboardheightchange', event);
};

// 聚焦输入框
const focus = () => {
  inputRef.value?.focus?.();
};

// 失焦输入框
const blur = () => {
  inputRef.value?.blur?.();
};

// 公开方法
defineExpose({
  focus,
  blur,
  inputRef
});
</script>

<style scoped>
.input-container {
  margin-bottom: 30rpx;
}

.input-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  display: block;
  margin-bottom: 16rpx;
}

.required-mark {
  color: #ff6b6b;
  margin-left: 4rpx;
}

.input-wrapper {
  background-color: #ffffff;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  transition: all 0.3s ease;
  position: relative;
}

.input-wrapper.input-focused {
  border-color: #07c160;
  box-shadow: 0 0 0 3rpx rgba(7, 193, 96, 0.1);
}

.input-wrapper.input-error {
  border-color: #ff6b6b;
}

.input-wrapper.input-disabled {
  background-color: #f8f9fa;
  border-color: #e0e0e0;
  opacity: 0.6;
  cursor: not-allowed;
}

.input-wrapper.input-round {
  border-radius: 100rpx;
}

/* 输入框大小 */
.input-size-small .input-wrapper {
  height: 70rpx;
}

.input-size-medium .input-wrapper {
  height: 90rpx;
}

.input-size-large .input-wrapper {
  height: 110rpx;
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #333333;
  background-color: transparent;
  border: none;
  outline: none;
}

.input-field::placeholder {
  color: #999999;
  font-size: 26rpx;
}

.input-field:disabled {
  color: #999999;
  cursor: not-allowed;
}

/* 图标区域 */
.input-prefix,
.input-suffix,
.input-clear,
.input-password-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.input-prefix:active,
.input-suffix:active,
.input-clear:active,
.input-password-toggle:active {
  opacity: 0.7;
  transform: scale(0.95);
}

.input-prefix {
  margin-right: 16rpx;
}

.input-suffix {
  margin-left: 16rpx;
}

.prefix-icon,
.suffix-icon,
.clear-icon,
.password-icon {
  font-size: 32rpx;
  color: #666666;
}

.input-clear .clear-icon {
  font-size: 36rpx;
  font-weight: bold;
  color: #999999;
}

.input-password-toggle .password-icon {
  font-size: 28rpx;
}

/* 错误和提示信息 */
.input-error,
.input-hint {
  font-size: 24rpx;
  display: flex;
  align-items: center;
  margin-top: 8rpx;
  line-height: 1.4;
}

.input-error {
  color: #ff6b6b;
}

.input-hint {
  color: #666666;
}

.error-icon,
.hint-icon {
  margin-right: 8rpx;
  font-size: 20rpx;
}

/* 字数统计 */
.input-count {
  font-size: 22rpx;
  color: #999999;
  text-align: right;
  margin-top: 8rpx;
  display: block;
}

/* 禁用状态 */
.input-disabled .input-label,
.input-disabled .input-field::placeholder {
  color: #999999;
}

.input-disabled .input-prefix,
.input-disabled .input-suffix,
.input-disabled .input-clear,
.input-disabled .input-password-toggle {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>