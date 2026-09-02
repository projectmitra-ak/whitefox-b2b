package com.whitefox.billing;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class BillingModule {

    public void verify() {
        new Documenter(BillingModule.class)
                .writeDocumentation();
    }
}