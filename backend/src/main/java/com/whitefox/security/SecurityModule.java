package com.whitefox.security;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class SecurityModule {

    public void verify() {
        new Documenter(SecurityModule.class)
                .writeDocumentation();
    }
}