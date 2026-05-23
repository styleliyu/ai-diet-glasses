<template>
  <view class="index-page">
    <view class="content">
      <view class="welcome-smile">
        <view class="smile-orbit orbit-one"></view>
        <view class="smile-orbit orbit-two"></view>
        <text class="smile-sparkle sparkle-left">✦</text>
        <text class="smile-sparkle sparkle-right">✦</text>
        <text class="smile-face">😊</text>
      </view>
      <text class="title">饮食助手</text>
      <text class="subtitle">健康饮食，从这里开始</text>
      <button class="primary-btn" @tap="goToLogin">进入应用</button>
    </view>
  </view>
</template>

<script setup>
import { goToLoginEntry } from "@/utils/auth.js";

function goToLogin() {
  goToLoginEntry({ replace: true });
}
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
}

.content {
  text-align: center;
  padding: 40rpx;
}

.welcome-smile {
  position: relative;
  width: 132rpx;
  height: 132rpx;
  margin: 0 auto 34rpx;
  border-radius: 42rpx;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
  box-shadow: 0 18rpx 44rpx rgba(22, 82, 48, 0.16);
  animation: welcomeSmileFloat 3s ease-in-out infinite;
}

.welcome-smile::after {
  content: "";
  position: absolute;
  left: 26rpx;
  right: 26rpx;
  bottom: -18rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(22, 82, 48, 0.14);
  filter: blur(2rpx);
  animation: smileShadow 3s ease-in-out infinite;
}

.smile-face {
  position: relative;
  z-index: 3;
  display: block;
  animation: smileNod 1.8s ease-in-out infinite;
}

.smile-orbit {
  position: absolute;
  border-radius: 44rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.42);
  pointer-events: none;
}

.orbit-one {
  inset: -10rpx;
  animation: smileOrbit 5.2s linear infinite;
}

.orbit-two {
  inset: 16rpx;
  border-style: dashed;
  opacity: 0.58;
  animation: smileOrbitReverse 4.4s linear infinite;
}

.smile-sparkle {
  position: absolute;
  z-index: 2;
  color: rgba(255, 255, 255, 0.92);
  font-size: 30rpx;
  line-height: 1;
  animation: sparklePop 1.8s ease-in-out infinite;
}

.sparkle-left {
  left: -2rpx;
  top: 22rpx;
}

.sparkle-right {
  right: 6rpx;
  bottom: 18rpx;
  animation-delay: 0.42s;
}

.title {
  display: block;
  font-size: 60rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 20rpx;
}

.subtitle {
  display: block;
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 60rpx;
}

.primary-btn {
  width: 320rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: #fff;
  color: #2f9f63;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
}

@keyframes welcomeSmileFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  30% {
    transform: translateY(-12rpx) rotate(4deg);
  }
  62% {
    transform: translateY(-4rpx) rotate(-3deg);
  }
}

@keyframes smileNod {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  42% {
    transform: scale(1.08) rotate(-6deg);
  }
  68% {
    transform: scale(0.98) rotate(4deg);
  }
}

@keyframes smileOrbit {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes smileOrbitReverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@keyframes sparklePop {
  0%,
  100% {
    opacity: 0.32;
    transform: scale(0.76);
  }
  48% {
    opacity: 1;
    transform: scale(1.18);
  }
}

@keyframes smileShadow {
  0%,
  100% {
    opacity: 0.5;
    transform: scaleX(1);
  }
  45% {
    opacity: 0.24;
    transform: scaleX(0.72);
  }
}
</style>
