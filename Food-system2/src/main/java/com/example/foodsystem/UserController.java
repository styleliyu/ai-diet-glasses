package com.example.foodsystem;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
public class UserController {
    private static final String RESET_CODE_KEY = "reset_code";
    private static final String RESET_EMAIL_KEY = "reset_email";
    private static final String RESET_CODE_TIME_KEY = "reset_code_time";
    private static final long RESET_CODE_EXPIRE_MILLIS = 5 * 60 * 1000L;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MailService mailService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> request, HttpSession session) {
        String username = (String) request.get("username");
        String password = (String) request.get("password");
        String normalizedUsername = username == null ? "" : username.trim();
        String normalizedPassword = password == null ? "" : password.trim();
        String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, normalizedUsername, normalizedPassword);

        if (users.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "用户名或密码错误");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        session.setAttribute("user", users.get(0).get("username"));
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "登录成功");
        Map<String, Object> data = new HashMap<>();
        data.put("username", users.get(0).get("username"));
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> request) {
        String username = (String) request.get("username");
        String password = (String) request.get("password");
        String email = (String) request.get("email");
        String normalizedUsername = username == null ? "" : username.trim();
        String normalizedPassword = password == null ? "" : password.trim();
        String normalizedEmail = email == null ? "" : email.trim();

        if (normalizedUsername.length() < 3) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "用户名至少 3 位");
            return ResponseEntity.badRequest().body(response);
        }

        if (normalizedPassword.length() < 6) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "密码至少 6 位");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String emailValue = normalizedEmail.isEmpty() ? null : normalizedEmail;
            jdbcTemplate.update("INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
                    normalizedUsername, normalizedPassword, emailValue);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("msg", "注册成功");
            Map<String, Object> data = new HashMap<>();
            data.put("username", normalizedUsername);
            if (emailValue != null) {
                data.put("email", emailValue);
            }
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "用户名或邮箱已存在");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/api/user/forgot-username")
    public ResponseEntity<Map<String, Object>> forgotUsername(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String normalizedEmail = email == null ? "" : email.trim();
        if (normalizedEmail.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "邮箱不能为空");
            return ResponseEntity.badRequest().body(response);
        }

        String sql = "SELECT username FROM users WHERE email = ?";
        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, normalizedEmail);

        if (users.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "该邮箱未绑定账号");
            return ResponseEntity.badRequest().body(response);
        }

        String username = (String) users.get(0).get("username");
        mailService.sendMail(normalizedEmail, "【智能膳食眼镜】找回用户名", "您好，您在该邮箱下注册的用户名是：" + username);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "用户名已发送至您的邮箱");
        Map<String, Object> data = new HashMap<>();
        data.put("sent", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/user/send-reset-code")
    public ResponseEntity<Map<String, Object>> sendResetCode(@RequestBody Map<String, Object> request, HttpSession session) {
        String email = (String) request.get("email");
        String username = (String) request.get("username");
        String normalizedEmail = email == null ? "" : email.trim();
        String normalizedUsername = username == null ? "" : username.trim();

        if (normalizedEmail.isEmpty() && normalizedUsername.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "邮箱或用户名不能为空");
            return ResponseEntity.badRequest().body(response);
        }

        String userEmail = normalizedEmail;
        if (normalizedEmail.isEmpty() && !normalizedUsername.isEmpty()) {
            String emailSql = "SELECT email FROM users WHERE username = ?";
            List<Map<String, Object>> result = jdbcTemplate.queryForList(emailSql, normalizedUsername);
            if (result == null || result.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 400);
                response.put("msg", "用户名不存在");
                return ResponseEntity.badRequest().body(response);
            }
            userEmail = (String) result.get(0).get("email");
            if (userEmail == null || userEmail.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 400);
                response.put("msg", "该用户未绑定邮箱，请先绑定邮箱后再试");
                return ResponseEntity.badRequest().body(response);
            }
        }

        String checkSql = "SELECT count(*) FROM users WHERE email = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userEmail);
        if (count == null || count == 0) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "邮箱不存在");
            return ResponseEntity.badRequest().body(response);
        }

        String code = String.format("%06d", new Random().nextInt(1000000));

        session.setAttribute(RESET_CODE_KEY, code);
        session.setAttribute(RESET_EMAIL_KEY, userEmail);
        session.setAttribute(RESET_CODE_TIME_KEY, Instant.now().toEpochMilli());

        mailService.sendMail(userEmail, "【智能膳食眼镜】重置密码验证码", "您的验证码是：" + code + "。请在5分钟内完成重置。");
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "验证码已发送");
        Map<String, Object> data = new HashMap<>();
        data.put("sent", true);
        data.put("email", userEmail);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/user/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, Object> request, HttpSession session) {
        String email = (String) request.get("email");
        String code = (String) request.get("code");
        String newPassword = (String) request.get("newPassword");
        String normalizedEmail = email == null ? "" : email.trim();
        String normalizedCode = code == null ? "" : code.trim();
        String normalizedPassword = newPassword == null ? "" : newPassword.trim();
        if (normalizedEmail.isEmpty() || normalizedCode.isEmpty() || normalizedPassword.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "参数不能为空");
            return ResponseEntity.badRequest().body(response);
        }

        String sessionCode = (String) session.getAttribute(RESET_CODE_KEY);
        String sessionEmail = (String) session.getAttribute(RESET_EMAIL_KEY);
        Long codeTime = (Long) session.getAttribute(RESET_CODE_TIME_KEY);
        long now = Instant.now().toEpochMilli();
        boolean isExpired = codeTime == null || now - codeTime > RESET_CODE_EXPIRE_MILLIS;

        if (!isExpired && sessionCode != null && sessionCode.equals(normalizedCode) && normalizedEmail.equals(sessionEmail)) {
            jdbcTemplate.update("UPDATE users SET password = ? WHERE email = ?", normalizedPassword, normalizedEmail);
            clearResetSession(session);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("msg", "密码修改成功，请重新登录");
            Map<String, Object> data = new HashMap<>();
            data.put("ok", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        }
        clearResetSession(session);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 400);
        response.put("msg", "验证码错误或已失效");
        return ResponseEntity.badRequest().body(response);
    }

    private void clearResetSession(HttpSession session) {
        session.removeAttribute(RESET_CODE_KEY);
        session.removeAttribute(RESET_EMAIL_KEY);
        session.removeAttribute(RESET_CODE_TIME_KEY);
    }

    @GetMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        session.invalidate();
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "已退出");
        Map<String, Object> data = new HashMap<>();
        data.put("ok", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/records/{id}")
    public ResponseEntity<Map<String, Object>> deleteRecordApi(@PathVariable Long id, HttpSession session) {
        return doDeleteRecord(id, session);
    }

    /**
     * 兼容旧前端路径：删除一条饮食记录。
     */
    @GetMapping("/delete-record/{id}")
    public ResponseEntity<Map<String, Object>> deleteRecordLegacy(@PathVariable Long id, HttpSession session) {
        return doDeleteRecord(id, session);
    }

    private ResponseEntity<Map<String, Object>> doDeleteRecord(Long id, HttpSession session) {
        Object user = session.getAttribute("user");
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "请先登录");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        jdbcTemplate.update("DELETE FROM food_records WHERE id = ? AND username = ?", id, user);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "已删除");
        Map<String, Object> data = new HashMap<>();
        data.put("deleted", true);
        data.put("id", id);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    // 绑定邮箱发送验证码接口
    @PostMapping("/api/user/bind-send-code")
    public ResponseEntity<Map<String, Object>> bindSendCode(@RequestBody Map<String, Object> request, HttpSession session) {
        String username = (String) request.get("username");
        String password = (String) request.get("password");
        String email = (String) request.get("email");
        String normalizedUsername = username == null ? "" : username.trim();
        String normalizedPassword = password == null ? "" : password.trim();
        String normalizedEmail = email == null ? "" : email.trim();

        if (normalizedUsername.isEmpty() || normalizedPassword.isEmpty() || normalizedEmail.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "参数不能为空");
            return ResponseEntity.badRequest().body(response);
        }

        // 校验用户名和密码
        String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, normalizedUsername, normalizedPassword);
        if (users.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "用户名或密码错误");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // 检查邮箱是否已被其他用户占用
        String checkSql = "SELECT count(*) FROM users WHERE email = ? AND username != ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, normalizedEmail, normalizedUsername);
        if (count != null && count > 0) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "该邮箱已被其他用户占用");
            return ResponseEntity.badRequest().body(response);
        }

        // 生成验证码
        String code = String.format("%06d", new Random().nextInt(1000000));

        // 存入Session
        session.setAttribute("bind_code", code);
        session.setAttribute("bind_email", normalizedEmail);
        session.setAttribute("bind_username", normalizedUsername);
        session.setAttribute("bind_code_time", Instant.now().toEpochMilli());

        // 发送邮件
        mailService.sendMail(normalizedEmail, "【智能膳食眼镜】绑定邮箱验证码", "您的验证码是：" + code + "。请在5分钟内完成绑定。");

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "验证码已发送");
        Map<String, Object> data = new HashMap<>();
        data.put("sent", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    // 执行绑定邮箱接口
    @PostMapping("/api/user/execute-bind-email")
    public ResponseEntity<Map<String, Object>> executeBindEmail(@RequestBody Map<String, Object> request, HttpSession session) {
        String username = (String) request.get("username");
        String password = (String) request.get("password");
        String email = (String) request.get("email");
        String code = (String) request.get("code");
        String normalizedUsername = username == null ? "" : username.trim();
        String normalizedPassword = password == null ? "" : password.trim();
        String normalizedEmail = email == null ? "" : email.trim();
        String normalizedCode = code == null ? "" : code.trim();

        if (normalizedUsername.isEmpty() || normalizedPassword.isEmpty() || normalizedEmail.isEmpty() || normalizedCode.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("msg", "参数不能为空");
            return ResponseEntity.badRequest().body(response);
        }

        // 校验用户名和密码
        String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, normalizedUsername, normalizedPassword);
        if (users.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 401);
            response.put("msg", "用户名或密码错误");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // 校验验证码
        String sessionCode = (String) session.getAttribute("bind_code");
        String sessionEmail = (String) session.getAttribute("bind_email");
        String sessionUsername = (String) session.getAttribute("bind_username");
        Long codeTime = (Long) session.getAttribute("bind_code_time");
        long now = Instant.now().toEpochMilli();
        boolean isExpired = codeTime == null || now - codeTime > RESET_CODE_EXPIRE_MILLIS;

        if (!isExpired && sessionCode != null && sessionCode.equals(normalizedCode) && normalizedEmail.equals(sessionEmail) && normalizedUsername.equals(sessionUsername)) {
            // 执行绑定
            jdbcTemplate.update("UPDATE users SET email = ? WHERE username = ?", normalizedEmail, normalizedUsername);
            
            // 清除Session
            session.removeAttribute("bind_code");
            session.removeAttribute("bind_email");
            session.removeAttribute("bind_username");
            session.removeAttribute("bind_code_time");

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("msg", "邮箱绑定成功");
            Map<String, Object> data = new HashMap<>();
            data.put("ok", true);
            data.put("email", normalizedEmail);
            response.put("data", data);
            return ResponseEntity.ok(response);
        }

        // 清除Session
        session.removeAttribute("bind_code");
        session.removeAttribute("bind_email");
        session.removeAttribute("bind_username");
        session.removeAttribute("bind_code_time");

        Map<String, Object> response = new HashMap<>();
        response.put("code", 400);
        response.put("msg", "验证码错误或已失效");
        return ResponseEntity.badRequest().body(response);
    }
}
