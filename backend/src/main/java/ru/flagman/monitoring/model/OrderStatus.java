package ru.flagman.monitoring.model;

public enum OrderStatus {
    CREATED,
    READY,
    RECEIVED_BY_VISITOR,
    PAID,
    /** Legacy status retained for orders created by older versions. */
    COMPLETED,
    CANCELLED_OUT_OF_STOCK
}
