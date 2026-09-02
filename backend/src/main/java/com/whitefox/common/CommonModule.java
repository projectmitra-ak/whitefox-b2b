package com.whitefox.common;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class CommonModule {

    public void verify() {
        new Documenter(CommonModule.class)
                .writeDocumentation();
    }
}