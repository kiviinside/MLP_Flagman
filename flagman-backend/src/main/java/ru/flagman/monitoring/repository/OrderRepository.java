package ru.flagman.monitoring.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.flagman.monitoring.model.Order;

public interface OrderRepository extends JpaRepository<Order, Long> { }
