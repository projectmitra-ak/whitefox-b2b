package com.whitefox.laundry;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class LaundryModule {

    public void verify() {
        new Documenter(LaundryModule.class)
                .writeDocumentation();
    }
}