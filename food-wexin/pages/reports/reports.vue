<template>
  <view class="reports-container safe-area">
    <view class="page-header">
      <view class="header-copy">
        <text class="page-title">饮食报告</text>
        <text class="page-subtitle">按日、按周或按区间查看摄入情况</text>
      </view>
    </view>

    <view class="mode-tabs animated-panel delay-1">
      <view
        v-for="item in modes"
        :key="item.value"
        class="mode-tab"
        :class="{ active: activeMode === item.value }"
        @tap="switchMode(item.value)"
      >
        {{ item.label }}
      </view>
    </view>

    <view class="filter-card animated-panel delay-2">
      <template v-if="activeMode === 'day'">
        <text class="filter-label">选择日期</text>
        <picker mode="date" :value="dayDate" @change="onDayDateChange">
          <view class="picker-field">{{ dayDate }}</view>
        </picker>
      </template>

      <template v-else>
        <view class="range-grid">
          <view class="range-item">
            <text class="filter-label">{{ rangeStartLabel }}</text>
            <picker
              mode="date"
              :value="rangeStart"
              @change="onRangeStartChange"
            >
              <view class="picker-field">{{ rangeStart }}</view>
            </picker>
          </view>
          <view class="range-item">
            <text class="filter-label">{{ rangeEndLabel }}</text>
            <picker mode="date" :value="rangeEnd" @change="onRangeEndChange">
              <view class="picker-field">{{ rangeEnd }}</view>
            </picker>
          </view>
        </view>
        <text v-if="activeMode === 'week'" class="filter-hint">
          周报模式下只需先选开始或结束日期，另一端会自动补齐为 7 天区间。
        </text>
      </template>

      <button class="query-btn" :disabled="loading" @tap="loadReportData">
        {{ loading ? "加载中..." : "刷新数据" }}
      </button>
    </view>

    <view class="summary-grid animated-panel delay-3">
      <view class="summary-card emphasis">
        <text class="summary-label">总热量</text>
        <text class="summary-value">{{ totalCalories }}</text>
        <text class="summary-unit">kcal</text>
      </view>
      <view class="summary-card">
        <text class="summary-label">记录条数</text>
        <text class="summary-value">{{ totalCount }}</text>
        <text class="summary-unit">条</text>
      </view>
      <view class="summary-card">
        <text class="summary-label">参考目标</text>
        <text class="summary-value">{{ targetCalories }}</text>
        <text class="summary-unit">kcal</text>
      </view>
      <view class="summary-card">
        <text class="summary-label">平均摄入</text>
        <text class="summary-value">{{ averageCalories }}</text>
        <text class="summary-unit">kcal</text>
      </view>
    </view>

    <view class="export-launch-card animated-panel delay-4">
      <view class="section-head export-launch-head">
        <view>
          <text class="section-title">报告导出</text>
          <text class="export-subtitle">将当前报告整理成分享摘要、详细报告或记录清单后再复制导出</text>
        </view>
        <text class="export-badge">{{ exportFormatLabel }}</text>
      </view>
      <view class="export-quick-row">
        <text class="export-quick-item">区间 {{ exportRangeLabel }}</text>
        <text class="export-quick-item">{{ totalCount }} 条记录</text>
        <text class="export-quick-item">{{ totalCalories }} kcal</text>
      </view>
      <button class="query-btn export-launch-btn" @tap="openExportPanel">
        打开导出面板
      </button>
    </view>

    <view v-if="exportVisible" class="report-overlay" @tap="closeExportPanel">
      <view class="export-modal" @tap.stop>
        <view class="export-modal-header">
          <view>
            <text class="section-title">自定义导出</text>
            <text class="export-subtitle">选择更适合用户阅读的导出形式，确认后直接复制</text>
          </view>
          <text class="modal-close" @tap="closeExportPanel">×</text>
        </view>

        <scroll-view scroll-y class="export-modal-body">
          <view class="export-block">
            <text class="export-label">导出格式</text>
            <view class="chip-row">
              <view
                v-for="item in exportFormats"
                :key="item.value"
                class="select-chip"
                :class="{ active: exportFormat === item.value }"
                @tap="selectExportFormat(item.value)"
              >
                <text class="chip-label">{{ item.label }}</text>
                <text class="chip-desc">{{ item.desc }}</text>
              </view>
            </view>
          </view>

          <view class="export-block">
            <text class="export-label">包含内容</text>
            <view class="chip-row">
              <view
                v-for="item in exportSections"
                :key="item.key"
                class="select-chip"
                :class="{ active: exportOptions[item.key] }"
                @tap="toggleExportOption(item.key)"
              >
                <text class="chip-label">{{ item.label }}</text>
                <text class="chip-desc">{{ item.desc }}</text>
              </view>
            </view>
          </view>

          <view class="export-metrics">
            <view class="export-metric">
              <text class="export-metric-label">文件名</text>
              <text class="export-metric-value file-name">{{ exportFileName }}</text>
            </view>
            <view class="export-metric">
              <text class="export-metric-label">目标达成率</text>
              <text class="export-metric-value">{{ achievementRate }}%</text>
            </view>
            <view class="export-metric">
              <text class="export-metric-label">预估长度</text>
              <text class="export-metric-value">{{ exportCharCount }} 字</text>
            </view>
            <view class="export-metric">
              <text class="export-metric-label">记录数量</text>
              <text class="export-metric-value">{{ totalCount }} 条</text>
            </view>
          </view>

          <view class="export-preview">
            <view class="section-head compact">
              <text class="section-title small">导出预览</text>
              <text class="section-hint">{{ exportFormatLabel }}</text>
            </view>
            <text class="export-preview-text">{{ exportPreview }}</text>
          </view>
        </scroll-view>

        <view class="export-actions">
          <button class="secondary-btn" @tap="showExportTips">导出说明</button>
          <button class="query-btn export-btn" @tap="copyExportContent">
            复制导出内容
          </button>
        </view>
      </view>
    </view>

    <!-- AI助手入口：报告页用于解释日报、周报和营养统计口径。 -->
    <ai-assistant />
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { dietApi, userApi } from "@/api/index.js";
import { requireAuthenticatedPage } from "@/utils/auth.js";
import { formatDate } from "@/utils/index.js";
import {
  getStoredPreferences,
  resolveDailyCaloriesTarget,
} from "@/utils/user-settings.js";

const modes = [
  { label: "日报", value: "day" },
  { label: "周报", value: "week" },
  { label: "自定义", value: "custom" },
];

const activeMode = ref("day");
const loading = ref(false);
const exportVisible = ref(false);
const dayDate = ref(formatDate(new Date(), "YYYY-MM-DD"));
const rangeStart = ref(getOffsetDate(-6));
const rangeEnd = ref(formatDate(new Date(), "YYYY-MM-DD"));
const targetCalories = ref(2000);
const exportFormat = ref("summary");
const exportOptions = reactive({
  summary: true,
  nutrition: true,
  trend: true,
  records: false,
});

const dailyPayload = ref(null);
const weeklyPayload = ref(null);
const records = ref([]);

const exportFormats = [
  { label: "分享摘要", value: "summary", desc: "适合发给他人快速查看" },
  { label: "详细报告", value: "detailed", desc: "包含总览、营养和趋势" },
  { label: "记录清单", value: "records", desc: "只导出饮食明细" },
];

const exportSections = [
  { label: "总览", key: "summary", desc: "热量、目标、达成率" },
  { label: "营养", key: "nutrition", desc: "蛋白质、碳水、脂肪" },
  { label: "趋势", key: "trend", desc: "按日期或分类汇总" },
  { label: "记录列表", key: "records", desc: "逐条饮食记录" },
];

function getOffsetDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDate(date, "YYYY-MM-DD");
}

function unwrap(payload) {
  if (!payload) return null;
  return payload.data !== undefined ? payload.data : payload;
}

function normalizeRecord(item = {}, index = 0) {
  // 报告页只依赖标准记录字段，兼容后端、旧缓存和识别页本地记录。
  return {
    id: item.id ?? `${item.createTime || "record"}-${index}`,
    foodName: item.foodName || item.name || "未命名食物",
    totalCalorie: Number(
      item.totalCalorie ?? item.calorie ?? item.totalCalories ?? 0,
    ),
    estimatedWeight: Number(item.estimatedWeight ?? item.weight ?? 0),
    createTime: item.createTime || item.date || "",
    imgUrl: item.imgUrl || item.ossImgUrl || item.imageUrl || "",
    protein: Number(item.protein ?? item.nutrients?.protein ?? 0),
    carbs: Number(
      item.carbs ?? item.carbohydrate ?? item.nutrients?.carbs ?? 0,
    ),
    fat: Number(item.fat ?? item.nutrients?.fat ?? 0),
  };
}

function normalizeDayLabel(value = "") {
  return String(value || "").slice(5, 10) || "当日";
}

function groupRecordsForTrend(items = []) {
  // 自定义区间没有独立趋势接口，直接按 createTime 在前端聚合。
  const grouped = items.reduce((result, item) => {
    const dateKey = String(item.createTime || "").slice(0, 10) || "未标记日期";
    if (!result[dateKey]) {
      result[dateKey] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }

    result[dateKey].calories += Number(item.totalCalorie || 0);
    result[dateKey].protein += Number(item.protein || 0);
    result[dateKey].carbs += Number(item.carbs || 0);
    result[dateKey].fat += Number(item.fat || 0);
    return result;
  }, {});

  return Object.keys(grouped)
    .sort()
    .map((date) => ({
      date,
      label: normalizeDayLabel(date),
      value: Math.round(grouped[date].calories),
      protein: Math.round(grouped[date].protein * 10) / 10,
      carbs: Math.round(grouped[date].carbs * 10) / 10,
      fat: Math.round(grouped[date].fat * 10) / 10,
    }));
}

const totalCalories = computed(() => {
  if (activeMode.value === "day") {
    return chartItems.value.reduce((sum, item) => sum + item.value, 0);
  }
  if (activeMode.value === "week") {
    return chartItems.value.reduce((sum, item) => sum + item.value, 0);
  }
  return records.value.reduce(
    (sum, item) => sum + (Number(item.totalCalorie) || 0),
    0,
  );
});

const totalCount = computed(() => {
  // 记录条数必须使用真实明细数量；日报统计接口会返回一个图表汇总项，不能当成一条饮食记录。
  return records.value.length;
});

const averageCalories = computed(() => {
  // 平均摄入按天/区间图表项计算，避免被一餐多条记录拉低日报或周报均值。
  const divisor = activeMode.value === "day" ? 1 : Math.max(chartItems.value.length, 1);
  return Math.round(totalCalories.value / divisor);
});

const exportRangeLabel = computed(() => {
  if (activeMode.value === "day") {
    return dayDate.value;
  }
  return `${rangeStart.value} 至 ${rangeEnd.value}`;
});

const rangeStartLabel = computed(() =>
  activeMode.value === "week" ? "起始日期" : "开始时间",
);

const rangeEndLabel = computed(() =>
  activeMode.value === "week" ? "截止日期" : "结束时间",
);

const exportFormatLabel = computed(() => {
  const matched = exportFormats.find((item) => item.value === exportFormat.value);
  return matched?.label || "分享摘要";
});

const exportFileName = computed(() => {
  const suffixMap = {
    summary: "txt",
    detailed: "txt",
    records: "txt",
  };
  const normalizedRange = exportRangeLabel.value.replace(/\s+至\s+/g, "_").replace(/\s+/g, "");
  return `diet-report-${activeMode.value}-${normalizedRange}.${suffixMap[exportFormat.value] || "txt"}`;
});

const exportGeneratedAt = computed(() => formatDate(new Date(), "YYYY-MM-DD HH:mm"));

const chartItems = computed(() => {
  let rawItems = [];

  if (activeMode.value === "day") {
    // 日报使用今日统计结果，字段兼容前端聚合和后端返回。
    rawItems = unwrap(dailyPayload.value)?.todayTotal || [];
    return buildChartItems(
      rawItems.map((item) => ({
        label: item.nameDay || item.name || "分类",
        value: Number(item.valueDay ?? item.value ?? 0),
      })),
    );
  }

  if (activeMode.value === "week") {
    // 周报优先展示按天汇总后的热量趋势。
    rawItems = unwrap(weeklyPayload.value)?.weekTotal || [];
    return buildChartItems(
      rawItems.map((item) => ({
        label: normalizeDayLabel(item.nameWeek || item.name || "日期"),
        value: Number(item.valueWeek ?? item.value ?? 0),
      })),
    );
  }

  return buildChartItems(groupRecordsForTrend(records.value));
});

const nutrientSummary = computed(() => {
  // 有明细记录时以记录为准；没有明细时使用统计接口里的营养汇总。
  const sourceRecords =
    activeMode.value === "custom"
      ? records.value
      : activeMode.value === "day"
        ? records.value
        : [];

  if (sourceRecords.length > 0) {
    return sourceRecords.reduce(
      (summary, item) => ({
        protein:
          Math.round((summary.protein + Number(item.protein || 0)) * 10) / 10,
        carbs:
          Math.round((summary.carbs + Number(item.carbs || 0)) * 10) / 10,
        fat: Math.round((summary.fat + Number(item.fat || 0)) * 10) / 10,
      }),
      { protein: 0, carbs: 0, fat: 0 },
    );
  }

  if (activeMode.value === "day") {
    const nutrients = unwrap(dailyPayload.value)?.nutrients || {};
    return {
      protein: Number(nutrients.protein || 0),
      carbs: Number(nutrients.carbs || 0),
      fat: Number(nutrients.fat || 0),
    };
  }

  if (activeMode.value === "week") {
    return chartItems.value.reduce(
      (summary, item) => ({
        protein: summary.protein + Number(item.protein || 0),
        carbs: summary.carbs + Number(item.carbs || 0),
        fat: summary.fat + Number(item.fat || 0),
      }),
      { protein: 0, carbs: 0, fat: 0 },
    );
  }

  return { protein: 0, carbs: 0, fat: 0 };
});

const achievementRate = computed(() => {
  if (!chartItems.value.length) return 0;
  const matchedDays = chartItems.value.filter(
    (item) => item.value > 0 && item.value <= targetCalories.value,
  ).length;
  return Math.round((matchedDays / chartItems.value.length) * 100);
});

const achievementText = computed(() => {
  if (!chartItems.value.length) {
    return "当前区间还没有可分析的记录";
  }

  if (achievementRate.value >= 80) {
    return "多数日期都控制在目标内";
  }

  if (achievementRate.value >= 50) {
    return "整体稳定，还可以继续压缩波动";
  }

  return "超出目标的日期偏多，建议优先看峰值日";
});

const peakDay = computed(() => {
  if (!chartItems.value.length) {
    return {
      label: "--",
      value: 0,
    };
  }

  const peakItem = [...chartItems.value].sort((left, right) => right.value - left.value)[0];
  return {
    label: peakItem.label || "--",
    value: peakItem.value || 0,
  };
});

function buildChartItems(items) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return items.map((item) => ({
    ...item,
    width: Math.max(8, Math.round((item.value / max) * 100)),
  }));
}

function setExportOptions(nextOptions = {}) {
  Object.keys(exportOptions).forEach((key) => {
    exportOptions[key] = Boolean(nextOptions[key]);
  });
}

function selectExportFormat(value) {
  exportFormat.value = value;

  if (value === "summary") {
    setExportOptions({
      summary: true,
      nutrition: true,
      trend: true,
      records: false,
    });
    return;
  }

  if (value === "detailed") {
    setExportOptions({
      summary: true,
      nutrition: true,
      trend: true,
      records: true,
    });
    return;
  }

  setExportOptions({
    summary: true,
    nutrition: false,
    trend: false,
    records: true,
  });
}

function toggleExportOption(key) {
  const enabledCount = Object.values(exportOptions).filter(Boolean).length;
  if (exportOptions[key] && enabledCount === 1) {
    uni.showToast({
      title: "至少保留一项导出内容",
      icon: "none",
    });
    return;
  }

  exportOptions[key] = !exportOptions[key];
}

function buildExportSummaryLines() {
  return [
    `统计区间：${exportRangeLabel.value}`,
    `总热量：${totalCalories.value} kcal`,
    `记录条数：${totalCount.value} 条`,
    `参考目标：${targetCalories.value} kcal`,
    `平均摄入：${averageCalories.value} kcal`,
    `目标达成率：${achievementRate.value}%`,
    `峰值日期：${peakDay.value.label}（${peakDay.value.value} kcal）`,
    `达成说明：${achievementText.value}`,
  ];
}

function buildExportHeader(title) {
  return [
    title,
    `生成时间：${exportGeneratedAt.value}`,
    `导出模式：${exportFormatLabel.value}`,
    `文件名：${exportFileName.value}`,
  ];
}

function buildSection(title, lines = []) {
  return ["", `【${title}】`, ...lines];
}

function buildExportNutritionLines() {
  return [
    `蛋白质：${nutrientSummary.value.protein} g`,
    `碳水：${nutrientSummary.value.carbs} g`,
    `脂肪：${nutrientSummary.value.fat} g`,
  ];
}

function buildExportTrendLines() {
  if (!chartItems.value.length) {
    return ["暂无趋势数据"];
  }

  return chartItems.value.map(
    (item) => `${item.label}：${item.value} kcal`,
  );
}

function buildExportRecordLines() {
  if (!records.value.length) {
    return ["当前区间没有记录"];
  }

  return records.value.map((record, index) => {
    return `${index + 1}. ${record.foodName}：${record.totalCalorie || 0} kcal，约 ${record.estimatedWeight || 0} g，时间 ${record.createTime || "--"}`;
  });
}

const exportPreview = computed(() => {
  if (exportFormat.value === "summary") {
    const sections = buildExportHeader("饮食报告分享摘要");
    sections.push(`总热量 ${totalCalories.value} kcal，平均摄入 ${averageCalories.value} kcal。`);
    sections.push(`共记录 ${totalCount.value} 条，参考目标 ${targetCalories.value} kcal。`);
    sections.push(`本期目标达成率 ${achievementRate.value}%，峰值日期为 ${peakDay.value.label}。`);
    if (exportOptions.nutrition) {
      sections.push(
        `营养汇总：蛋白 ${nutrientSummary.value.protein} g，碳水 ${nutrientSummary.value.carbs} g，脂肪 ${nutrientSummary.value.fat} g。`,
      );
    }
    return sections.join("\n");
  }

  if (exportFormat.value === "detailed") {
    const sections = buildExportHeader("饮食报告");
    sections.push(`模式：${activeMode.value === "day" ? "日报" : activeMode.value === "week" ? "周报" : "自定义区间"}`);
    sections.push(`区间：${exportRangeLabel.value}`);

    if (exportOptions.summary) {
      sections.push(...buildSection("总览", buildExportSummaryLines()));
    }

    if (exportOptions.nutrition) {
      sections.push(...buildSection("营养汇总", buildExportNutritionLines()));
    }

    if (exportOptions.trend) {
      sections.push(...buildSection("趋势变化", buildExportTrendLines()));
    }

    if (exportOptions.records) {
      sections.push(...buildSection("记录列表", buildExportRecordLines()));
    }

    return sections.join("\n");
  }

  const sections = buildExportHeader("饮食记录清单");
  sections.push(`统计区间：${exportRangeLabel.value}`);
  sections.push(...buildSection("记录列表", buildExportRecordLines()));
  if (exportOptions.summary) {
    sections.push(...buildSection("汇总", [
      `总热量：${totalCalories.value} kcal`,
      `记录条数：${totalCount.value} 条`,
    ]));
  }
  return sections.join("\n");
});

const exportCharCount = computed(() => exportPreview.value.length);

function switchMode(mode) {
  activeMode.value = mode;
  if (mode === "day") {
    dayDate.value = formatDate(new Date(), "YYYY-MM-DD");
  }
  if (mode === "week") {
    rangeStart.value = getOffsetDate(-6);
    rangeEnd.value = formatDate(new Date(), "YYYY-MM-DD");
  }
  loadReportData();
}

function openExportPanel() {
  exportVisible.value = true;
}

function closeExportPanel() {
  exportVisible.value = false;
}

function onDayDateChange(event) {
  dayDate.value = event.detail.value;
}

function onRangeStartChange(event) {
  const nextValue = event.detail.value;
  rangeStart.value = nextValue;

  if (activeMode.value === "week") {
    const nextDate = new Date(`${nextValue}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + 6);
    rangeEnd.value = formatDate(nextDate, "YYYY-MM-DD");
    return;
  }

  if (rangeEnd.value && rangeEnd.value < nextValue) {
    rangeEnd.value = nextValue;
  }
}

function onRangeEndChange(event) {
  const nextValue = event.detail.value;
  rangeEnd.value = nextValue;

  if (activeMode.value === "week") {
    const nextDate = new Date(`${nextValue}T00:00:00`);
    nextDate.setDate(nextDate.getDate() - 6);
    rangeStart.value = formatDate(nextDate, "YYYY-MM-DD");
    return;
  }

  if (rangeStart.value && rangeStart.value > nextValue) {
    rangeStart.value = nextValue;
  }
}

async function loadTargetCalories() {
  if (
    !requireAuthenticatedPage({
      message: "请先登录后再使用",
      silent: true,
    })
  ) {
    return;
  }
  try {
    const result = unwrap(await userApi.getTarget());
    targetCalories.value = Number(result?.dailyCalories ?? 2000) || 2000;
  } catch (error) {
    // 目标接口不可用时回退本地推算，保证达标率仍可计算。
    targetCalories.value =
      Number(
        resolveDailyCaloriesTarget({
          userTarget: uni.getStorageSync("userTarget") || {},
          userInfo: uni.getStorageSync("userInfo") || {},
          preferences: getStoredPreferences(),
        }),
      ) || 2000;
  }
}

async function loadReportData() {
  if (
    !requireAuthenticatedPage({
      message: "请先登录后再使用",
      silent: false,
    })
  ) {
    return;
  }
  loading.value = true;

  try {
    if (activeMode.value === "day") {
      // 日报同时拉统计和明细：统计供图表，明细供营养汇总和导出。
      dailyPayload.value = await dietApi.getDailyStat({ date: dayDate.value });
      const result = await dietApi.getRecords({
        startTime: dayDate.value,
        endTime: dayDate.value,
      });
      const payload = unwrap(result);
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.records)
          ? payload.records
          : [];
      records.value = list
        .map(normalizeRecord)
        .sort((left, right) =>
          String(right.createTime || "").localeCompare(String(left.createTime || "")),
        );
      return;
    }

    if (activeMode.value === "week") {
      // 周报使用区间统计画趋势，再拉明细供列表和营养汇总兜底。
      weeklyPayload.value = await dietApi.getWeekStat({
        startTime: rangeStart.value,
        endTime: rangeEnd.value,
      });
      const result = await dietApi.getRecords({
        startTime: rangeStart.value,
        endTime: rangeEnd.value,
      });
      const payload = unwrap(result);
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.records)
          ? payload.records
          : [];
      records.value = list.map(normalizeRecord);
      return;
    }

    // 自定义区间没有专用统计接口，直接从记录明细聚合所有指标。
    const result = await dietApi.getRecords({
      startTime: rangeStart.value,
      endTime: rangeEnd.value,
    });
    const payload = unwrap(result);
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.records)
        ? payload.records
        : [];
    records.value = list
      .map(normalizeRecord)
      .sort((left, right) =>
        String(right.createTime || "").localeCompare(String(left.createTime || "")),
      );
  } catch (error) {
    console.error("加载报告失败:", error);
    // 空结构能让图表和导出预览继续渲染，不把接口错误扩散到模板。
    if (activeMode.value === "custom") {
      records.value = [];
    } else if (activeMode.value === "day") {
      dailyPayload.value = { data: { todayTotal: [], date: dayDate.value } };
      records.value = [];
    } else {
      weeklyPayload.value = {
        data: {
          weekTotal: [],
          dailyData: [],
          startTime: rangeStart.value,
          endTime: rangeEnd.value,
        },
      };
      records.value = [];
    }
    uni.showToast({
      title: "暂无可用报告数据",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

function showExportTips() {
  uni.showModal({
    title: "导出说明",
    content:
      "当前支持更适合用户直接使用的分享摘要、详细报告和记录清单三种导出形式，并可一键复制到剪贴板。",
    showCancel: false,
    confirmText: "知道了",
  });
}

function copyExportContent() {
  if (exportFormat.value === "records" && !records.value.length) {
    uni.showModal({
      title: "暂无记录",
      content: "当前区间没有饮食记录，仍可复制一份空记录清单。",
      confirmText: "继续复制",
      success: (result) => {
        if (result.confirm) {
          copyExportPreviewToClipboard();
        }
      },
    });
    return;
  }

  copyExportPreviewToClipboard();
}

function copyExportPreviewToClipboard() {
  uni.setClipboardData({
    data: exportPreview.value,
    success: () => {
      closeExportPanel();
      uni.showToast({
        title: "导出内容已复制",
        icon: "success",
      });
    },
    fail: () => {
      uni.showToast({
        title: "复制失败，请稍后重试",
        icon: "none",
      });
    },
  });
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }

  uni.switchTab({
    url: "/pages/home/home",
  });
}

onShow(async () => {
  // 报告页依赖用户目标和历史记录，进入前必须有完整本地登录态。
  const isLoggedIn = uni.getStorageSync('isLoggedIn');
  const userInfo = uni.getStorageSync('userInfo');
  if (!isLoggedIn || !userInfo?.username) {
    uni.reLaunch({ url: "/pages/login/login" });
    return;
  }
  
  await loadTargetCalories();
  await loadReportData();
});
</script>

<style scoped>
.safe-area {
  min-height: 100vh;
  padding-top: calc(env(safe-area-inset-top) + 44rpx);
  padding-top: var(--app-header-top) !important;
  padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
  padding-bottom: calc(var(--app-safe-bottom) + 32rpx);
}

.reports-container {
  min-height: 100vh;
  padding: 0 28rpx 48rpx;
  padding-top: calc(env(safe-area-inset-top) + 44rpx);
  padding-top: var(--app-header-top) !important;
  background:
    radial-gradient(
      circle at top right,
      rgba(168, 198, 223, 0.35),
      transparent 28%
    ),
    linear-gradient(180deg, #f8fbff 0%, #eef4f8 100%);
}

.page-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96rpx;
  margin-bottom: 32rpx;
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
  color: #223547;
}

.page-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6c8197;
}

.mode-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.mode-tab {
  padding: 22rpx 0;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.78);
  text-align: center;
  font-size: 28rpx;
  color: #5d7389;
  box-shadow: 0 10rpx 26rpx rgba(106, 140, 175, 0.08);
}

.mode-tab.active {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #6a8caf 0%, #8cafc9 100%);
  color: #fff;
}

.mode-tab.active::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.34) 48%, transparent 100%);
  animation: tabShine 2.4s ease-in-out infinite;
}

.filter-card,
.chart-card,
.detail-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 16rpx 40rpx rgba(106, 140, 175, 0.08);
}

.filter-label {
  display: block;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  color: #6c8197;
}

.filter-hint {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #7390a7;
}

.range-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.picker-field {
  min-height: 104rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  border-radius: 18rpx;
  background: #f4f8fb;
  color: #26384b;
  font-size: 28rpx;
}

.query-btn {
  margin-top: 24rpx;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #4dba79 0%, #2f9f63 100%);
  color: #fff;
  font-size: 30rpx;
  border: none;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.summary-card {
  position: relative;
  overflow: hidden;
  min-height: 144rpx;
  padding: 24rpx 20rpx;
  box-sizing: border-box;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16rpx 40rpx rgba(106, 140, 175, 0.08);
}

.summary-card::before {
  content: "";
  position: absolute;
  right: -34rpx;
  top: -34rpx;
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: rgba(106, 140, 175, 0.1);
  animation: softPulse 3s ease-in-out infinite;
}

.summary-card.emphasis {
  background: linear-gradient(135deg, #6a8caf 0%, #88a9c0 100%);
}

.summary-label,
.summary-value,
.summary-unit {
  display: block;
}

.summary-label {
  font-size: 21rpx;
  color: #7d8ea0;
}

.summary-value {
  margin-top: 12rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: #23384a;
}

.summary-unit {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #8394a5;
}

.summary-card.emphasis .summary-label,
.summary-card.emphasis .summary-value,
.summary-card.emphasis .summary-unit {
  color: #fff;
}

.export-launch-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 209, 128, 0.22), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 247, 251, 0.94) 100%);
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 16rpx 40rpx rgba(106, 140, 175, 0.08);
}

.export-launch-card::after {
  content: "";
  position: absolute;
  right: -60rpx;
  top: -70rpx;
  width: 210rpx;
  height: 210rpx;
  border-radius: 50%;
  background: rgba(106, 140, 175, 0.1);
}

.export-launch-head {
  position: relative;
  z-index: 1;
  align-items: flex-start;
}

.export-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #72869b;
}

.export-badge {
  max-width: 240rpx;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: #eef5fb;
  font-size: 20rpx;
  color: #59738f;
  text-align: center;
}

.export-quick-row {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.export-quick-item {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.76);
  border: 1rpx solid rgba(106, 140, 175, 0.12);
  font-size: 22rpx;
  color: #5d7891;
}

.export-launch-btn {
  position: relative;
  z-index: 1;
  margin-top: 24rpx;
}

.export-block {
  margin-top: 24rpx;
}

.export-label {
  display: block;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  color: #698097;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.select-chip {
  min-width: 184rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: #f2f7fb;
  border: 1rpx solid rgba(106, 140, 175, 0.12);
  color: #587289;
  box-sizing: border-box;
  box-shadow: 0 8rpx 18rpx rgba(106, 140, 175, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.select-chip:active {
  transform: scale(0.98);
}

.select-chip.active {
  background: linear-gradient(135deg, #6a8caf 0%, #88a9c0 100%);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 14rpx 26rpx rgba(106, 140, 175, 0.2);
}

.chip-label,
.chip-desc {
  display: block;
}

.chip-label {
  font-size: 24rpx;
  font-weight: 700;
}

.chip-desc {
  margin-top: 6rpx;
  font-size: 20rpx;
  line-height: 1.35;
  color: #7a8fa3;
}

.select-chip.active .chip-desc {
  color: rgba(255, 255, 255, 0.82);
}

.export-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 24rpx;
}

.export-metric {
  position: relative;
  overflow: hidden;
  padding: 22rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.78);
  border: 1rpx solid rgba(106, 140, 175, 0.1);
  box-shadow: 0 10rpx 24rpx rgba(106, 140, 175, 0.06);
}

.export-metric::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 5rpx;
  background: linear-gradient(90deg, #8cb6d9, #ffd18a);
  opacity: 0.72;
}

.export-metric-label,
.export-metric-value {
  display: block;
}

.export-metric-label {
  font-size: 22rpx;
  color: #7a8fa3;
}

.export-metric-value {
  margin-top: 10rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #25394d;
}

.export-preview {
  margin-top: 24rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(106, 140, 175, 0.1);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.5);
}

.section-head.compact {
  margin-bottom: 16rpx;
}

.section-title.small {
  font-size: 28rpx;
}

.export-preview-text {
  display: block;
  font-size: 23rpx;
  line-height: 1.8;
  color: #425a70;
  white-space: pre-wrap;
  word-break: break-all;
}

.export-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.secondary-btn,
.export-btn {
  flex: 1;
}

.secondary-btn {
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 18rpx;
  background: #eef4f9;
  color: #49657e;
  font-size: 28rpx;
  border: none;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22rpx;
}

.report-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(24, 37, 52, 0.36);
  display: flex;
  align-items: flex-end;
}

.export-modal {
  width: 100%;
  max-height: 84vh;
  border-radius: 32rpx 32rpx 0 0;
  background: linear-gradient(180deg, #f9fcff 0%, #edf4f9 100%);
  box-shadow: 0 -18rpx 44rpx rgba(54, 79, 106, 0.14);
  display: flex;
  flex-direction: column;
}

.export-modal-header {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  padding: 28rpx 28rpx 20rpx;
  border-bottom: 1rpx solid rgba(109, 136, 161, 0.14);
}

.modal-close {
  width: 68rpx;
  height: 68rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4f6b84;
  font-size: 34rpx;
  flex-shrink: 0;
}

.export-modal-body {
  flex: 1;
  padding: 0 28rpx 8rpx;
  box-sizing: border-box;
}

.file-name {
  font-size: 24rpx;
  line-height: 1.5;
  word-break: break-all;
}

.export-modal .export-actions {
  padding: 18rpx 28rpx calc(env(safe-area-inset-bottom) + 24rpx);
  background: rgba(255, 255, 255, 0.94);
}

@media (max-width: 420px) {
  .export-metrics,
  .export-actions {
    grid-template-columns: 1fr;
  }

  .export-actions {
    display: grid;
  }

  .export-badge {
    max-width: 180rpx;
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #24384b;
}

.section-hint {
  font-size: 22rpx;
  color: #7f92a5;
}

.chart-list,
.detail-list,
.record-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.chart-item {
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: #f6f9fc;
}

.chart-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.chart-name,
.detail-name,
.record-name {
  font-size: 28rpx;
  color: #24384b;
  font-weight: 600;
}

.chart-number,
.detail-value,
.record-calorie {
  font-size: 26rpx;
  color: #567997;
}

.chart-track {
  height: 18rpx;
  border-radius: 999rpx;
  background: #dfe9f1;
  overflow: hidden;
}

.chart-fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #63c68c 0%, #6a8caf 100%);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 4rpx;
  border-bottom: 1rpx solid #edf2f6;
}

.detail-row:last-child {
  border-bottom: none;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f7fafc;
}

.record-image {
  width: 104rpx;
  height: 104rpx;
  border-radius: 18rpx;
  flex-shrink: 0;
}

.record-image.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dce7ef 0%, #bfd0df 100%);
  color: #4e6d89;
  font-size: 30rpx;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-meta {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #7f92a5;
}

.empty-box {
  padding: 60rpx 24rpx;
  border-radius: 22rpx;
  background: #f6f9fc;
  text-align: center;
}

.empty-box.compact {
  padding: 40rpx 20rpx;
}

.empty-title {
  display: block;
  font-size: 28rpx;
  color: #4c637a;
  font-weight: 600;
}

.empty-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #8394a5;
}

.animated-panel {
  animation: panelRise 0.38s ease both;
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

.filter-card,
.summary-card,
.export-launch-card,
.record-item,
.mode-tab,
.query-btn {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.mode-tab:active,
.query-btn:active,
.record-item:active,
.summary-card:active {
  transform: scale(0.985);
}

@keyframes tabShine {
  0% {
    transform: translateX(-100%);
  }
  50%,
  100% {
    transform: translateX(100%);
  }
}

@keyframes softPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.72;
  }
  50% {
    transform: scale(1.16);
    opacity: 1;
  }
}

@keyframes panelRise {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
