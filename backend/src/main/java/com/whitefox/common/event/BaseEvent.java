package com.whitefox.common.event;

import java.time.Instant;
import java.util.UUID;

public abstract class BaseEvent {
    private final String eventId;
    private final String eventType;
    private final Instant timestamp;
    private final UUID tenantId;
    private final UUID correlationId;
    private final UUID causationId;

    protected BaseEvent(String eventType, UUID tenantId) {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = eventType;
        this.timestamp = Instant.now();
        this.tenantId = tenantId;
        this.correlationId = UUID.randomUUID();
        this.causationId = null;
    }

    protected BaseEvent(String eventType, UUID tenantId, UUID correlationId, UUID causationId) {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = eventType;
        this.timestamp = Instant.now();
        this.tenantId = tenantId;
        this.correlationId = correlationId;
        this.causationId = causationId;
    }

    public String getEventId() {
        return eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public UUID getCorrelationId() {
        return correlationId;
    }

    public UUID getCausationId() {
        return causationId;
    }
}