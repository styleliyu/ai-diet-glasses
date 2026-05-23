package com.example.foodsystem;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
  入口：将前端路由转发到静态 index.html。

 */
@Controller
public class SpaForwardController {

    @GetMapping({"/login", "/register"})
    public String spaEntry() {
        return "forward:/index.html";
    }
}
