package com.example.foodsystem;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.google.gson.*;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpSession;

import java.io.InputStream;
import java.util.*;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@RestController
public class FoodController {
    private static final Logger log = LoggerFactory.getLogger(FoodController.class);

    @Value("${qwen.api.key}")
    private String qwenApiKey;
    
    // 内存缓存容器，查重
    private static final Map<String, LastFoodRecord> cache = new ConcurrentHashMap<>();
    
    // 内部类：存储用户最后一次识别记录
    private static class LastFoodRecord {
        private final String foodName;
        private final long timestamp;
        
        public LastFoodRecord(String foodName, long timestamp) {
            this.foodName = foodName;
            this.timestamp = timestamp;
        }
        
        public String getFoodName() {
            return foodName;
        }
        
        public long getTimestamp() {
            return timestamp;
        }
    }

    @Value("${aliyun.oss.endpoint}") private String endpoint;
    @Value("${aliyun.oss.accessKeyId}") private String accessKeyId;
    @Value("${aliyun.oss.accessKeySecret}") private String accessKeySecret;
    @Value("${aliyun.oss.bucketName}") private String bucketName;

    @Autowired private JdbcTemplate jdbcTemplate;


    @GetMapping("/api/home")
    public ResponseEntity<Map<String, Object>> apiHome(HttpSession session) {
        String user = (String) session.getAttribute("user");
        Map<String, Object> data = new HashMap<>();
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "请先登录");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        try {
            String userSql = "SELECT use_target, weight, goal_type FROM users WHERE username = ?";
            List<Map<String, Object>> userList = jdbcTemplate.queryForList(userSql, user);

            int useTarget = 0;
            double weight = 65.0;
            String goal = "maintain";

            if (!userList.isEmpty()) {
                Map<String, Object> userData = userList.get(0);
                useTarget = (userData.get("use_target") != null) ? ((Number) userData.get("use_target")).intValue() : 0;
                weight = (userData.get("weight") != null) ? ((Number) userData.get("weight")).doubleValue() : 65.0;
                goal = (userData.get("goal_type") != null) ? (String) userData.get("goal_type") : "maintain";
            }

            int targetCal = (int) (weight * 30);
            if ("lose".equals(goal)) targetCal -= 300;
            if ("gain".equals(goal)) targetCal += 300;

            String sqlToday = "SELECT SUM(total_calorie) FROM food_records WHERE username = ? AND DATE(create_time) = CURDATE()";
            Integer consumed = jdbcTemplate.queryForObject(sqlToday, Integer.class, user);
            if (consumed == null) consumed = 0;

            data.put("useTarget", useTarget);
            data.put("consumed", consumed);
            data.put("targetCal", targetCal);
            data.put("percent", Math.min(100, targetCal > 0 ? (consumed * 100 / targetCal) : 0));
            data.put("remaining", Math.max(0, targetCal - consumed));
            data.put("username", user);
        } catch (Exception e) {
            log.warn("apiHome failed", e);
            data.put("useTarget", 0);
            data.put("consumed", 0);
            data.put("targetCal", 1950);
            data.put("percent", 0);
            data.put("remaining", 1950);
            data.put("username", user);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/check-new-record")
    public ResponseEntity<Map<String, Object>> checkNewRecord(HttpSession session) {
        Map<String, Object> payload = new HashMap<>();
        String user = (String) session.getAttribute("user");

        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "请先登录");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        try {
            String sql = "SELECT id FROM food_records WHERE username = ? AND create_time > NOW() - INTERVAL 10 SECOND ORDER BY id DESC LIMIT 1";
            List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, user);

            if (!list.isEmpty()) {
                payload.put("hasNew", true);
                payload.put("recordId", list.get(0).get("id"));
            } else {
                payload.put("hasNew", false);
            }
        } catch (Exception e) {
            payload.put("hasNew", false);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", payload);
        return ResponseEntity.ok(response);
    }

    /**
     * 饮食历史（ history 页）：records、consumed、username。
     */
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> viewHistory(HttpSession session) {
        String user = (String) session.getAttribute("user");
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "请先登录");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        Map<String, Object> data = new HashMap<>();
        try {
            String sql = "SELECT * FROM food_records WHERE username = ? ORDER BY id DESC";
            List<Map<String, Object>> raw = jdbcTemplate.queryForList(sql, user);
            List<Map<String, Object>> records = new ArrayList<>();
            for (Map<String, Object> row : raw) {
                records.add(toRecordDto(row));
            }

            String sqlToday = "SELECT SUM(total_calorie) FROM food_records WHERE username = ? AND DATE(create_time) = CURDATE()";
            Integer consumed = jdbcTemplate.queryForObject(sqlToday, Integer.class, user);
            if (consumed == null) consumed = 0;

            data.put("username", user);
            data.put("records", records);
            data.put("consumed", consumed);
        } catch (Exception e) {
            log.warn("viewHistory failed", e);
            data.put("username", user);
            data.put("records", Collections.emptyList());
            data.put("consumed", 0);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/identify/web")
    public ResponseEntity<Map<String, Object>> identifyFoodWeb(@RequestParam("file") MultipartFile file, HttpSession session) {
        String currentUser = (String) session.getAttribute("user");
        if (currentUser == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "请先登录");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Map<String, Object> result = processImageAndAI(file, currentUser);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("username", currentUser);
        data.put("isFood", result.get("isFood"));
        data.put("dishName", result.get("name"));
        data.put("name", result.get("name"));
        data.put("calorie", result.get("calorie"));
        data.put("advice", result.get("advice"));
        data.put("weight", result.get("weight"));
        data.put("totalCal", result.get("totalCal"));
        data.put("protein", result.get("protein"));
        data.put("fat", result.get("fat"));
        data.put("carbs", result.get("carbs"));
        data.put("imageUrl", result.get("imageUrl"));
        data.put("duplicated", result.get("duplicated"));
        data.put("status", result.get("status"));

        if ("error".equals(result.get("status"))) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", String.valueOf(result.getOrDefault("advice", "处理失败")));
            response.put("data", data);
            return ResponseEntity.badRequest().body(response);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/user/toggle-target")
    public ResponseEntity<Map<String, Object>> toggleTarget(HttpSession session) {
        String user = (String) session.getAttribute("user");
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "请先登录");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        try {
            jdbcTemplate.update("UPDATE users SET use_target = IF(COALESCE(use_target,0) = 1, 0, 1) WHERE username = ?", user);
            Integer v = jdbcTemplate.queryForObject("SELECT use_target FROM users WHERE username = ?", Integer.class, user);
            Map<String, Object> data = new HashMap<>();
            data.put("useTarget", v != null ? v : 0);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("msg", "已切换目标展示");
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("toggleTarget failed", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "切换失败");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/api/identify/device")
    public ResponseEntity<Map<String, Object>> identifyForDevice(@RequestParam("file") MultipartFile file, @RequestParam("username") String username) {
        Map<String, Object> result = processImageAndAI(file, username);
        Map<String, Object> data = new LinkedHashMap<>(result);
        if ("error".equals(result.get("status"))) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", String.valueOf(result.getOrDefault("advice", "处理失败")));
            response.put("data", data);
            return ResponseEntity.badRequest().body(response);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> processImageAndAI(MultipartFile file, String username) {
        Map<String, Object> finalResult = new HashMap<>();
        try {
            log.info("收到识别请求: username={}, fileName={}, fileSize={}", username, file.getOriginalFilename(), file.getSize());

            // 1. 内存查重：在调用AI之前先检查
            LastFoodRecord lastRecord = cache.get(username);
            long currentTime = System.currentTimeMillis();
            
            // 调用AI进行识别
            FoodAnalysis analysis = analyzeFoodWithAI(file);
            log.info("AI 返回结果: username={}, isFood={}, name={}, perCal={}, weight={}",
                    username, analysis.isFood, analysis.name, analysis.perCal, analysis.weight);

            // 2. 检查是否重复（AI识别后再做一次检查，确保食物名称一致）
            if (analysis.isFood) {
                if (lastRecord != null && (currentTime - lastRecord.getTimestamp() < 60 * 1000) && analysis.name.equals(lastRecord.getFoodName())) {
                    log.info("内存查重发现重复: username={}, foodName={}, timeDiff={}ms",
                            username, analysis.name, currentTime - lastRecord.getTimestamp());
                    finalResult.put("status", "duplicate");
                    finalResult.put("message", "云端检测到重复，请勿频繁抓拍");
                    return finalResult;
                }
            }

            boolean duplicated = false;
            String imageUrl = "";
            if (analysis.isFood) {
                // 3. 更新内存缓存
                cache.put(username, new LastFoodRecord(analysis.name, currentTime));
                log.info("更新内存缓存: username={}, foodName={}, timestamp={}", username, analysis.name, currentTime);
                
                try {
                    imageUrl = uploadToOSS(file);
                    // 4. 异步更新数据库
                    saveRecordToDB(username, analysis, imageUrl);
                    log.info("存库成功: username={}, foodName={}, imageUrl={}", username, analysis.name, imageUrl);
                } catch (Exception e) {

                    log.error("数据库操作失败: username={}, error={}", username, e.getMessage());

                }
            }

            finalResult.put("status", "success");
            finalResult.put("isFood", analysis.isFood);
            finalResult.put("name", analysis.name);
            finalResult.put("calorie", analysis.perCal);
            finalResult.put("weight", analysis.weight);
            finalResult.put("totalCal", analysis.totalCal);
            finalResult.put("protein", analysis.protein);
            finalResult.put("fat", analysis.fat);
            finalResult.put("carbs", analysis.carbs);
            finalResult.put("advice", analysis.advice);
            finalResult.put("imageUrl", imageUrl);
            finalResult.put("duplicated", duplicated);
        } catch (Exception e) {
            log.info("处理失败: username={}, error={}", username, e.getMessage());
            finalResult.put("status", "error");
            finalResult.put("name", "处理失败");
            finalResult.put("advice", e.getMessage());
        }
        return finalResult;
    }

    private Map<String, Object> toRecordDto(Map<String, Object> row) {
        Map<String, Object> m = new LinkedHashMap<>();
        Object id = row.get("id");
        m.put("id", id != null ? ((Number) id).longValue() : null);
        m.put("foodName", str(row.get("food_name")));
        m.put("totalCalorie", num(row.get("total_calorie")));
        m.put("estimatedWeight", num(row.get("estimated_weight")));
        m.put("createTime", formatTime(row.get("create_time")));
        m.put("protein", num(row.get("protein")));
        m.put("fat", num(row.get("fat")));
        m.put("carbs", num(row.get("carbs")));
        String img = str(row.get("image_url"));
        m.put("imageUrl", img);
        m.put("imgUrl", img);
        m.put("advice", str(row.get("advice")));
        m.put("calorie", str(row.get("calorie")));
        return m;
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private static double num(Object o) {
        if (o == null) return 0;
        if (o instanceof Number) return ((Number) o).doubleValue();
        try {
            return Double.parseDouble(String.valueOf(o).trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private static String formatTime(Object o) {
        if (o == null) return "";
        if (o instanceof java.util.Date) {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            return sdf.format((java.util.Date) o);
        }
        if (o instanceof java.sql.Timestamp) {
            return new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format((java.util.Date) o);
        }
        return String.valueOf(o);
    }

    private FoodAnalysis analyzeFoodWithAI(MultipartFile file) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String smartPrompt = "你是一位资深的营养精算师。任务：识别图片中物体的属性。\n" +
                "1. 如果是食物：isFood设为true，给出名称、每100g热量(perCal)、根据餐具估算总重量(weight)、蛋白质(protein)、脂肪(fat)、碳水(carbs)以及100字内饮食建议。\n" +
                "2. 如果非食物：isFood设为false，准确给出名称，其他热量营养填0，建议改为趣味吐槽。严禁返回null。格式：{\"isFood\":true/false, \"name\":\"名\", \"perCal\":数字, \"weight\":数字, \"protein\":\"数字\", \"fat\":\"数字\", \"carbs\":\"数字\", \"advice\":\"建议\"}";

        JsonObject payload = new JsonObject();
        payload.addProperty("model", "qwen-vl-plus");
        JsonObject input = new JsonObject();
        JsonArray messages = new JsonArray();
        JsonObject message = new JsonObject();
        message.addProperty("role", "user");
        JsonArray content = new JsonArray();
        JsonObject imgP = new JsonObject();
        imgP.addProperty("image", "data:image/jpeg;base64," + base64Image);
        JsonObject txtP = new JsonObject();
        txtP.addProperty("text", smartPrompt);
        content.add(imgP);
        content.add(txtP);
        message.add("content", content);
        messages.add(message);
        input.add("messages", messages);
        payload.add("input", input);

        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build();
        okhttp3.RequestBody body = okhttp3.RequestBody.create(payload.toString(), MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url("https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation")
                .addHeader("Authorization", "Bearer " + qwenApiKey)
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            String raw = response.body().string();
            JsonObject root = JsonParser.parseString(raw).getAsJsonObject();
            String resultText = root.getAsJsonObject("output").getAsJsonArray("choices").get(0).getAsJsonObject()
                    .getAsJsonObject("message").getAsJsonArray("content").get(0).getAsJsonObject().get("text").getAsString();
            resultText = resultText.replaceAll("(?s)```json|```", "").trim();
            JsonObject foodData = JsonParser.parseString(resultText).getAsJsonObject();

            FoodAnalysis analysis = new FoodAnalysis();
            analysis.isFood = safeGetBoolean(foodData, "isFood", false);
            analysis.name = safeGetString(foodData, "name", "未知物体");
            analysis.advice = safeGetString(foodData, "advice", "AI分析中");
            analysis.weight = safeGetInt(foodData, "weight", 200);
            analysis.perCal = safeGetInt(foodData, "perCal", 100);
            analysis.totalCal = (analysis.perCal * analysis.weight) / 100;
            analysis.protein = safeGetString(foodData, "protein", "0");
            analysis.fat = safeGetString(foodData, "fat", "0");
            analysis.carbs = safeGetString(foodData, "carbs", "0");
            return analysis;
        }
    }

    private String uploadToOSS(MultipartFile file) throws Exception {
        String fileName = UUID.randomUUID() + ".jpg";
        OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
        try (InputStream is = file.getInputStream()) {
            ossClient.putObject(bucketName, fileName, is);
        } finally {
            ossClient.shutdown();
        }
        return "https://" + bucketName + "." + endpoint + "/" + fileName;
    }

    private void saveRecordToDB(String username, FoodAnalysis analysis, String imageUrl) {
        jdbcTemplate.update(
                "INSERT INTO food_records (username, food_name, calorie, total_calorie, estimated_weight, protein, fat, carbs, advice, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                username, analysis.name, String.valueOf(analysis.perCal), analysis.totalCal, analysis.weight,
                analysis.protein, analysis.fat, analysis.carbs, analysis.advice, imageUrl
        );
    }

    private static class FoodAnalysis {
        private boolean isFood;
        private String name;
        private String advice;
        private int weight;
        private int perCal;
        private int totalCal;
        private String protein;
        private String fat;
        private String carbs;
    }

    private String safeGetString(JsonObject obj, String key, String defaultValue) {
        return (obj.has(key) && !obj.get(key).isJsonNull()) ? obj.get(key).getAsString() : defaultValue;
    }
    private boolean safeGetBoolean(JsonObject obj, String key, boolean defaultValue) {
        if (obj.has(key) && !obj.get(key).isJsonNull()) {
            try { return obj.get(key).getAsBoolean(); } catch (Exception e) { return defaultValue; }
        }
        return defaultValue;
    }
    private int safeGetInt(JsonObject obj, String key, int defaultValue) {
        if (obj.has(key) && !obj.get(key).isJsonNull()) {
            try { return obj.get(key).getAsInt(); } catch (Exception e) { return defaultValue; }
        }
        return defaultValue;
    }

    /**
     * AI聊天接口
     */
    @PostMapping("/api/ai/chat")
    public ResponseEntity<Map<String, Object>> aiChat(@org.springframework.web.bind.annotation.RequestBody Map<String, Object> request, HttpSession session) {
        String user = (String) session.getAttribute("user");
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "请先登录");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        String content = String.valueOf(request.getOrDefault("content", ""));
        if (content.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "请输入问题");
            return ResponseEntity.badRequest().body(response);
        }

        // 获取历史对话记录
        List<Map<String, Object>> historyMessages = new ArrayList<>();
        if (request.containsKey("historyMessages")) {
            Object historyObj = request.get("historyMessages");
            if (historyObj instanceof List) {
                historyMessages = (List<Map<String, Object>>) historyObj;
            }
        }

        try {
            // 获取用户今日摄入热量
            String sqlToday = "SELECT SUM(total_calorie) FROM food_records WHERE username = ? AND DATE(create_time) = CURDATE()";
            Integer consumed = jdbcTemplate.queryForObject(sqlToday, Integer.class, user);
            if (consumed == null) consumed = 0;

            // 获取用户目标热量和剩余热量
            String userSql = "SELECT weight, goal_type FROM users WHERE username = ?";
            List<Map<String, Object>> userList = jdbcTemplate.queryForList(userSql, user);
            double weight = 65.0;
            String goal = "maintain";
            if (!userList.isEmpty()) {
                Map<String, Object> userData = userList.get(0);
                weight = (userData.get("weight") != null) ? ((Number) userData.get("weight")).doubleValue() : 65.0;
                goal = (userData.get("goal_type") != null) ? (String) userData.get("goal_type") : "maintain";
            }
            int targetCal = (int) (weight * 30);
            if ("lose".equals(goal)) targetCal -= 300;
            if ("gain".equals(goal)) targetCal += 300;
            int remaining = Math.max(0, targetCal - consumed);

            // 构建系统提示
            String systemPrompt = "你是零感食客智能管家，一个专业的饮食健康助手。\n" +
                    "用户信息：\n" +
                    "- 今日已摄入热量：" + consumed + " kcal\n" +
                    "- 今日目标热量：" + targetCal + " kcal\n" +
                    "- 剩余可摄入热量：" + remaining + " kcal\n\n" +
                    "请根据用户的问题，结合上述饮食数据，给出专业、友好的回答。\n" +
                    "如果用户的问题与饮食、营养、健康相关，请给出具体的建议。\n" +
                    "如果用户的问题与小程序功能相关，请详细解答。";

            // 调用通义千问API
            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(60, TimeUnit.SECONDS)
                    .readTimeout(60, TimeUnit.SECONDS)
                    .build();

            JsonObject payload = new JsonObject();
            payload.addProperty("model", "qwen-turbo");
            JsonObject input = new JsonObject();
            JsonArray messages = new JsonArray();

            // 添加系统消息
            JsonObject systemMessage = new JsonObject();
            systemMessage.addProperty("role", "system");
            systemMessage.addProperty("content", systemPrompt);
            messages.add(systemMessage);

            // 添加历史对话记录
            for (Map<String, Object> historyMsg : historyMessages) {
                JsonObject historyMessage = new JsonObject();
                historyMessage.addProperty("role", historyMsg.getOrDefault("role", "user").toString());
                historyMessage.addProperty("content", historyMsg.getOrDefault("content", "").toString());
                messages.add(historyMessage);
            }

            // 添加当前用户问题
            JsonObject userMessage = new JsonObject();
            userMessage.addProperty("role", "user");
            userMessage.addProperty("content", content);
            messages.add(userMessage);

            input.add("messages", messages);
            payload.add("input", input);

            String payloadString = payload.toString();
            log.info("最终发给AI的内容: " + payloadString);

            okhttp3.RequestBody body = okhttp3.RequestBody.create(payloadString, MediaType.parse("application/json"));
            Request httpRequest = new Request.Builder()
                    .url("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation")
                    .addHeader("Authorization", "Bearer " + qwenApiKey)
                    .post(body)
                    .build();

            try (Response response = client.newCall(httpRequest).execute()) {
                String raw = response.body().string();
                log.info("阿里云返回: " + raw);
                JsonObject root = JsonParser.parseString(raw).getAsJsonObject();

                // 安全解析JSON，qwen-plus模型从output.text获取回复
                String resultText = "抱歉，AI回复解析失败";
                try {
                    // 首先检查是否有错误
                    if (root.has("error")) {
                        resultText = "AI服务错误: " + root.get("error");
                        log.error("阿里云API错误: code={}, message={}", root.get("error"));
                    } else if (root.has("output")) {
                        JsonObject output = root.getAsJsonObject("output");
                        // qwen-plus模型使用output.text格式
                        if (output.has("text")) {
                            resultText = output.get("text").getAsString();
                        }
                        // qwen-vl等模型可能使用choices数组格式
                        else if (output.has("choices") && output.getAsJsonArray("choices").size() > 0) {
                            JsonObject choice = output.getAsJsonArray("choices").get(0).getAsJsonObject();
                            if (choice.has("message") && choice.getAsJsonObject("message").has("content")) {
                                resultText = choice.getAsJsonObject("message").get("content").getAsString();
                            }
                        }
                    }
                } catch (Exception parseEx) {
                    log.error("JSON解析失败: {}", parseEx.getMessage());
                    resultText = "抱歉，AI回复格式解析失败，请稍后再试";
                }

                Map<String, Object> data = new HashMap<>();
                data.put("response", resultText);
                data.put("consumed", consumed);
                data.put("remaining", remaining);

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("code", 200);
                responseBody.put("msg", "success");
                responseBody.put("data", data);
                return ResponseEntity.ok(responseBody);
            }
        } catch (Exception e) {
            log.error("AI聊天失败: user={}, error={}", user, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("msg", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }




    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "Diet Glasses API is Running");
        return ResponseEntity.ok(response);
    }
}
