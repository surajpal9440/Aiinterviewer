package com.interviewer.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebConfig — serves frontend static files from the /frontend directory.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve CSS files
        registry.addResourceHandler("/css/**")
                .addResourceLocations("file:../frontend/css/");

        // Serve JS files
        registry.addResourceHandler("/js/**")
                .addResourceLocations("file:../frontend/js/");

        // Serve HTML files at root level
        registry.addResourceHandler("/*.html")
                .addResourceLocations("file:../frontend/");
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
