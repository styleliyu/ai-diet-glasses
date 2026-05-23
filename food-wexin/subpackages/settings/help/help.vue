<template>
  <view class="help-container safe-area">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="back-btn" @tap="goBack">←</text>
      <text class="page-title">帮助中心</text>
      <view style="width: 80rpx"></view>
    </view>

    <!-- 搜索框 -->
    <view class="search-section">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="searchQuery"
          placeholder="搜索问题或关键词"
          placeholder-class="placeholder"
          @input="filterQuestions"
        />
        <text class="clear-btn" v-if="searchQuery" @tap="clearSearch">×</text>
      </view>
    </view>

    <!-- 常见问题 -->
    <view
      class="faq-section"
      v-if="!searchQuery || filteredQuestions.length > 0"
    >
      <text class="section-title">常见问题</text>
      <view class="faq-list">
        <view
          class="faq-item"
          v-for="(item, index) in searchQuery
            ? filteredQuestions
            : faqList.slice(0, 5)"
          :key="index"
          @tap="toggleFAQ(index)"
        >
          <view class="faq-question">
            <text class="question-text">{{ item.question }}</text>
            <text class="arrow-icon" :class="{ rotated: item.expanded }"
              >▼</text
            >
          </view>
          <view class="faq-answer" v-if="item.expanded">
            <text class="answer-text">{{ item.answer }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索结果为空提示 -->
    <view
      class="empty-tips"
      v-if="searchQuery && filteredQuestions.length === 0"
    >
      <text class="empty-icon">🤔</text>
      <text class="empty-title">未找到相关问题</text>
      <text class="empty-desc">换个关键词试试，或联系客服获取帮助</text>
      <button class="contact-btn" @tap="contactCustomerService">
        联系客服
      </button>
    </view>

    <!-- 功能分类 -->
    <view class="categories-section" v-if="!searchQuery">
      <text class="section-title">按功能查看</text>
      <view class="categories-grid">
        <view
          class="category-item"
          v-for="category in categories"
          :key="category.id"
          @tap="goToCategory(category.id)"
        >
          <text class="category-icon">{{ category.icon }}</text>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="contact-section" v-if="!searchQuery">
      <text class="section-title">联系我们</text>
      <view class="contact-options">
        <view class="contact-item" @tap="sendEmail">
          <text class="contact-icon">📧</text>
          <view class="contact-info">
            <text class="contact-title">邮件支持</text>
            <text class="contact-desc">support@smartdiet.com</text>
          </view>
          <text class="arrow">→</text>
        </view>
        <view class="contact-item" @tap="callCustomerService">
          <text class="contact-icon">📞</text>
          <view class="contact-info">
            <text class="contact-title">客服热线</text>
            <text class="contact-desc">400-123-4567 (9:00-21:00)</text>
          </view>
          <text class="arrow">→</text>
        </view>
        <view class="contact-item" @tap="goToFeedback">
          <text class="contact-icon">💡</text>
          <view class="contact-info">
            <text class="contact-title">意见反馈</text>
            <text class="contact-desc">您的建议对我们很重要</text>
          </view>
          <text class="arrow">→</text>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-buttons" v-if="!searchQuery">
      <button class="bottom-btn" @tap="goToTutorial">新手教程</button>
      <button class="bottom-btn primary" @tap="checkForUpdates">
        检查更新
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";

const searchQuery = ref("");
const faqList = ref([
  {
    question: "如何创建个人饮食计划？",
    answer:
      '在首页点击"创建饮食计划"按钮，根据您的身高、体重、年龄和活动水平填写个人信息，系统将为您生成个性化的饮食计划。',
    expanded: false,
  },
  {
    question: "如何添加自定义食物？",
    answer:
      '在食物识别页面，您可以拍照识别食物，或在食物库中搜索。若找不到所需食物，点击"自定义添加"按钮，输入食物名称和营养成分即可。',
    expanded: false,
  },
  {
    question: "如何调整每日热量目标？",
    answer:
      '前往"设置-目标设置"页面，您可以调整每日热量摄入目标。系统会根据您的减重、增重或维持目标自动计算。',
    expanded: false,
  },
  {
    question: "食物识别准确吗？",
    answer:
      "我们的AI识别模型准确率超过90%，但复杂菜品可能识别有误。建议识别后核对结果，或手动调整分量。",
    expanded: false,
  },
  {
    question: "数据安全吗？会分享给第三方吗？",
    answer:
      "我们严格遵守隐私政策，您的个人健康数据经过加密存储，不会与任何第三方分享。您可以在隐私设置中管理数据权限。",
    expanded: false,
  },
  {
    question: "如何导出健康报告？",
    answer:
      '在报告页面，选择要导出的报告类型和时间范围，点击"导出"按钮即可生成PDF报告并保存到手机。',
    expanded: false,
  },
  {
    question: "为什么有些功能需要VIP？",
    answer:
      "高级功能如专家咨询、详细营养分析和无限食物识别需要服务器资源支持，VIP会员可享受完整服务。",
    expanded: false,
  },
  {
    question: "忘记密码怎么办？",
    answer:
      '在登录页面点击"忘记密码"，输入注册邮箱，我们会发送重置链接。重置后请及时修改密码。',
    expanded: false,
  },
]);

// 根据搜索词过滤问题
const filteredQuestions = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase();
  return faqList.value.filter(
    (item) =>
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query),
  );
});

// 功能分类
const categories = [
  { id: "diet", icon: "🍽️", name: "饮食计划" },
  { id: "food", icon: "📱", name: "食物识别" },
  { id: "report", icon: "📊", name: "健康报告" },
  { id: "account", icon: "👤", name: "账户管理" },
  { id: "privacy", icon: "🔒", name: "隐私安全" },
  { id: "payment", icon: "💳", name: "支付VIP" },
  { id: "app", icon: "📱", name: "应用使用" },
  { id: "other", icon: "❓", name: "其他问题" },
];

// 切换FAQ展开状态
const toggleFAQ = (index) => {
  if (searchQuery.value) {
    // 搜索模式下只展开当前项
    const targetIndex = faqList.value.findIndex(
      (item) => item.question === filteredQuestions.value[index].question,
    );
    if (targetIndex > -1) {
      faqList.value[targetIndex].expanded =
        !faqList.value[targetIndex].expanded;
    }
  } else {
    faqList.value[index].expanded = !faqList.value[index].expanded;
  }
};

// 过滤问题
const filterQuestions = () => {
  // 计算属性已处理
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = "";
};

// 联系客服
const contactCustomerService = () => {
  uni.makePhoneCall({
    phoneNumber: "4001234567",
  });
};

// 发送邮件
const sendEmail = () => {
  uni.showModal({
    title: "发送邮件",
    content: "将跳转到邮件应用，收件人已预设为 support@smartdiet.com",
    success: (res) => {
      if (res.confirm) {
        // 实际应用中这里应该调用邮件API
        uni.showToast({
          title: "已跳转到邮件应用",
          icon: "success",
        });
      }
    },
  });
};

// 打电话
const callCustomerService = () => {
  uni.makePhoneCall({
    phoneNumber: "4001234567",
  });
};

// 跳转到反馈
const goToFeedback = () => {
  uni.navigateTo({
    url: "/subpackages/settings/feedback/feedback",
  });
};

// 跳转到新手教程
const goToTutorial = () => {
  uni.showModal({
    title: "新手教程",
    content: "即将开始新手引导，请跟随指引学习应用基本功能",
    success: (res) => {
      if (res.confirm) {
        // 这里可以开始教程
        uni.showToast({
          title: "教程开始",
          icon: "success",
        });
      }
    },
  });
};

// 检查更新
const checkForUpdates = () => {
  uni.showLoading({
    title: "检查中...",
  });

  setTimeout(() => {
    uni.hideLoading();
    uni.showModal({
      title: "版本信息",
      content: "当前已是最新版本 (v1.0.0)",
      showCancel: false,
    });
  }, 1000);
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 跳转到分类
const goToCategory = (categoryId) => {
  // 实际应用中这里应该跳转到相应分类页面
  uni.showToast({
    title: `即将查看${categoryId}相关帮助`,
    icon: "none",
  });
};
</script>

<style scoped>
.safe-area {
  padding-top: calc(env(safe-area-inset-top) + 44rpx);
  padding-top: var(--app-header-top) !important;
  padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
  padding-bottom: calc(var(--app-safe-bottom) + 20rpx);
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e8f0f8 100%);
}

.help-container {
  padding: 0 30rpx;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.back-btn {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12rpx 28rpx rgba(70, 104, 136, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: #486988;
}

.page-title {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
}

/* 搜索框 */
.search-section {
  margin-bottom: 40rpx;
}

.search-box {
  background: white;
  border-radius: 20rpx;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  height: 80rpx;
  box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.1);
}

.search-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  color: #666;
}

.search-input {
  flex: 1;
  font-size: 30rpx;
  height: 100%;
}

.placeholder {
  color: #999;
  font-size: 28rpx;
}

.clear-btn {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
  font-weight: bold;
}

/* 常见问题 */
.faq-section,
.categories-section,
.contact-section {
  background: white;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.faq-list {
  margin-top: 20rpx;
}

.faq-item {
  border-bottom: 2rpx solid #eee;
  padding: 30rpx 0;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-text {
  font-size: 30rpx;
  color: #333;
  flex: 1;
  font-weight: 500;
}

.arrow-icon {
  font-size: 24rpx;
  color: #999;
  transition: transform 0.3s;
}

.arrow-icon.rotated {
  transform: rotate(180deg);
}

.faq-answer {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
}

.answer-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

/* 搜索结果为空 */
.empty-tips {
  background: white;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  margin-top: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 40rpx;
}

.contact-btn {
  width: 200rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #00c853 0%, #00b248 100%);
  color: white;
  font-size: 28rpx;
  font-weight: bold;
  border-radius: 16rpx;
  border: none;
  margin: 0 auto;
}

/* 功能分类 */
.categories-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.category-item {
  flex: 1 1 45%;
  background: linear-gradient(135deg, #a8c6df 0%, #6a8caf 100%);
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
  transition: all 0.3s;
}

.category-item:active {
  transform: translateY(-4rpx);
  box-shadow: 0 15rpx 30rpx rgba(0, 0, 0, 0.2);
}

.category-icon {
  font-size: 60rpx;
  margin-bottom: 15rpx;
}

.category-name {
  font-size: 26rpx;
  color: white;
  font-weight: bold;
}

/* 联系方式 */
.contact-options {
  margin-top: 10rpx;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 2rpx solid #eee;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-icon {
  font-size: 50rpx;
  margin-right: 30rpx;
}

.contact-info {
  flex: 1;
}

.contact-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 5rpx;
}

.contact-desc {
  font-size: 26rpx;
  color: #666;
  display: block;
}

.arrow {
  font-size: 32rpx;
  color: #999;
  margin-left: 20rpx;
}

/* 底部按钮 */
.bottom-buttons {
  display: flex;
  gap: 20rpx;
  padding: 40rpx 0;
  background: transparent;
}

.bottom-btn {
  flex: 1;
  height: 100rpx;
  background: white;
  color: #333;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 20rpx;
  border: 4rpx solid white;
}

.bottom-btn.primary {
  background: linear-gradient(135deg, #00c853 0%, #00b248 100%);
  color: white;
  border: none;
}
</style>
