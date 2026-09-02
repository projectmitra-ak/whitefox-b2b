package com.whitefox.integration;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class IntegrationModule {

    public void verify() {
        new Documenter(IntegrationModule.class)
                .writeDocumentation();
    }
}