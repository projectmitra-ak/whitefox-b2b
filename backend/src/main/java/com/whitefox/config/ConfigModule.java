package com.whitefox.config;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class ConfigModule {

    public void verify() {
        new Documenter(ConfigModule.class)
                .writeDocumentation();
    }
}