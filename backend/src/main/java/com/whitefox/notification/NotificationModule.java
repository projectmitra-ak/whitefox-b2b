package com.whitefox.notification;

import org.springframework.modulith.docs.Documenter;
import org.springframework.stereotype.Component;

@Component
public class NotificationModule {

    public void verify() {
        new Documenter(NotificationModule.class)
                .writeDocumentation();
    }
}