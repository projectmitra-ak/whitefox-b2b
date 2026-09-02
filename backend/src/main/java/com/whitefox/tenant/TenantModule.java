package com.whitefox.tenant;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class TenantModule {

    public void verify() {
        new Documenter(TenantModule.class)
                .writeDocumentation();
    }
}