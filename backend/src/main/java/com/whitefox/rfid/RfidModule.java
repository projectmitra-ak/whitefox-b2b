package com.whitefox.rfid;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class RfidModule {

    public void verify() {
        new Documenter(RfidModule.class)
                .writeDocumentation();
    }
}