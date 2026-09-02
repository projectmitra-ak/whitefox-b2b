package com.whitefox.inventory;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class InventoryModule {

    public void verify() {
        new Documenter(InventoryModule.class)
                .writeDocumentation();
    }
}