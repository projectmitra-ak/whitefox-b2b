package com.whitefox.asset;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class AssetModule {

    public void verify() {
        new Documenter(AssetModule.class)
                .writeDocumentation();
    }
}