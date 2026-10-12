package ru.flagman.monitoring.service;

/** Публикуется после любого изменения остатков; SseHub рассылает обновления после коммита. */
public record StockChangedEvent() { }
