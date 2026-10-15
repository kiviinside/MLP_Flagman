package ru.flagman.monitoring.dto;

/** Реальные агрегаты главной страницы, рассчитанные по данным БД. */
public record DashboardDto(
        long productCount, long expiringBatchCount, long expiredBatchCount,
        long availableDishCount, long totalDishCount, long activeOrderCount) { }
