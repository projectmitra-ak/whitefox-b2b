package com.whitefox.analytics;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsModule {

    public void verify() {
        new Documenter(AnalyticsModule.class)
                .writeDocumentation();
    }
}