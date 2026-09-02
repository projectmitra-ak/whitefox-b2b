package com.whitefox.reconciliation;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class ReconciliationModule {

    public void verify() {
        new Documenter(ReconciliationModule.class)
                .writeDocumentation();
    }
}