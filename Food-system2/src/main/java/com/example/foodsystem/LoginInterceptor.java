package com.example.foodsystem;

import com.google.gson.Gson;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;



@Component
public class LoginInterceptor implements HandlerInterceptor {

    private final Gson gson = new Gson();

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws Exception {
        String uri = request.getRequestURI();
        String ctx = request.getContextPath();
        if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
            uri = uri.substring(ctx.length());
        }
        if (uri.isEmpty()) {
            uri = "/";
        }

        if (isStaticOrPublic(uri)) {
            return true;
        }

        HttpSession session = request.getSession(false);
        Object user = session != null ? session.getAttribute("user") : null;
        if (user != null) {
            return true;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("code", 401);
        body.put("msg", "请先登录");
        byte[] json = gson.toJson(body).getBytes(StandardCharsets.UTF_8);
        response.setContentLength(json.length);
        response.getOutputStream().write(json);
        return false;
    }

    private boolean isStaticOrPublic(String uri) {
        // 根路径允许访问，返回API状态
        if ("/".equals(uri)
                || "/index.html".equals(uri)
                || "/favicon.ico".equals(uri)) {
            return true;
        }
        if (uri.startsWith("/assets/")
                || uri.startsWith("/static/")
                || uri.startsWith("/error")) {
            return true;
        }
        // 登录、注册
        if ("/login".equals(uri) || "/register".equals(uri)) {
            return true;
        }
        if ("/logout".equals(uri)) {
            return true;
        }
        // 找回密码、重置密码
        if (uri.startsWith("/api/user/forgot-username")
                || uri.startsWith("/api/user/send-reset-code")
                || uri.startsWith("/api/user/reset-password")) {
            return true;
        }
        // 绑定邮箱
        if (uri.startsWith("/api/user/bind-send-code")
                || uri.startsWith("/api/user/execute-bind-email")) {
            return true;
        }
        // 硬件设备识别（凭参数 username，非 Session）
        if ("/api/identify/device".equals(uri)) {
            return true;
        }
        return false;
    }
}
