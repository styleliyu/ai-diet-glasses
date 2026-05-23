<template>
  <view :class="cardClasses" :style="cardStyles">
    <!-- 头部区域 -->
    <view v-if="title || $slots.header" class="card-header">
      <slot name="header">
        <text class="card-title">{{ title }}</text>
        <text v-if="subtitle" class="card-subtitle">{{ subtitle }}</text>
      </slot>
    </view>
    
    <!-- 图片区域 -->
    <view v-if="image || $slots.image" class="card-image">
      <slot name="image">
        <image 
          v-if="image" 
          :src="image" 
          :mode="imageMode"
          class="card-image-content"
          @click="handleImageClick"
        ></image>
      </slot>
    </view>
    
    <!-- 内容区域 -->
    <view class="card-content">
      <slot></slot>
    </view>
    
    <!-- 底部区域 -->
    <view v-if="$slots.footer || actions" class="card-footer">
      <slot name="footer">
        <view v-if="actions" class="card-actions">
          <Button 
            v-for="(action, index) in actions" 
            :key="index"
            :type="action.type || 'text'"
            :size="action.size || 'small'"
            :icon="action.icon"
            :loading="action.loading"
            :disabled="action.disabled"
            @click="action.onClick"
          >
            {{ action.text }}
          </Button>
        </view>
      </slot>
    </view>
    
    <!-- 角标 -->
    <view v-if="badge" class="card-badge">
      {{ badge }}
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import Button from './Button.vue';

const props = defineProps({
  // 标题
  title: {
    type: String,
    default: ''
  },
  
  // 副标题
  subtitle: {
    type: String,
    default: ''
  },
  
  // 图片地址
  image: {
    type: String,
    default: ''
  },
  
  // 图片模式
  imageMode: {
    type: String,
    default: 'aspectFill'
  },
  
  // 阴影效果
  shadow: {
    type: Boolean,
    default: true
  },
  
  // 边框
  bordered: {
    type: Boolean,
    default: false
  },
  
  // 圆角
  radius: {
    type: [Boolean, String],
    default: true
  },
  
  // 背景颜色
  backgroundColor: {
    type: String,
    default: ''
  },
  
  // 角标
  badge: {
    type: [String, Number],
    default: ''
  },
  
  // 角标类型
  badgeType: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'danger', 'info'].includes(value)
  },
  
  // 操作按钮
  actions: {
    type: Array,
    default: () => []
  },
  
  // 点击事件
  clickable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click', 'image-click']);

// 卡片类名
const cardClasses = computed(() => {
  const classes = ['custom-card'];
  
  if (props.shadow) classes.push('card-shadow');
  if (props.bordered) classes.push('card-bordered');
  if (props.clickable) classes.push('card-clickable');
  
  return classes;
});

// 卡片样式
const cardStyles = computed(() => {
  const styles = {};
  
  // 圆角
  if (props.radius === true) {
    styles.borderRadius = '24rpx';
  } else if (props.radius && typeof props.radius === 'string') {
    styles.borderRadius = props.radius;
  }
  
  // 背景颜色
  if (props.backgroundColor) {
    styles.backgroundColor = props.backgroundColor;
  }
  
  return styles;
});

// 点击卡片
const handleClick = (event) => {
  if (props.clickable) {
    emit('click', event);
  }
};

// 点击图片
const handleImageClick = (event) => {
  emit('image-click', event);
};
</script>

<style scoped>
.custom-card {
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
}

.card-shadow {
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.card-bordered {
  border: 1rpx solid #e0e0e0;
}

.card-clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-clickable:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.08);
}

/* 头部样式 */
.card-header {
  padding: 32rpx 32rpx 0;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
}

.card-subtitle {
  font-size: 26rpx;
  color: #666666;
  display: block;
}

/* 图片样式 */
.card-image {
  position: relative;
  overflow: hidden;
}

.card-image-content {
  width: 100%;
  height: auto;
  display: block;
}

/* 内容样式 */
.card-content {
  padding: 32rpx;
}

/* 底部样式 */
.card-footer {
  padding: 0 32rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
  margin-top: 20rpx;
  padding-top: 20rpx;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

/* 角标样式 */
.card-badge {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  padding: 8rpx 16rpx;
  font-size: 22rpx;
  font-weight: 500;
  border-radius: 20rpx;
  color: #ffffff;
  z-index: 1;
}

.card-badge[data-type="primary"] {
  background-color: #07c160;
}

.card-badge[data-type="success"] {
  background-color: #4CAF50;
}

.card-badge[data-type="warning"] {
  background-color: #FF9800;
}

.card-badge[data-type="danger"] {
  background-color: #ff6b6b;
}

.card-badge[data-type="info"] {
  background-color: #45b7d1;
}
</style>