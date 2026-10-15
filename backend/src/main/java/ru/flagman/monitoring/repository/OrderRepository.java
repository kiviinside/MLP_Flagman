package ru.flagman.monitoring.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.flagman.monitoring.model.Order;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    // Загружаем позиции и блюда заранее, чтобы DTO можно было безопасно собрать
    // при отключённом Open Session in View.
    @EntityGraph(attributePaths = {"orderItems", "orderItems.dish"})
    List<Order> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"orderItems", "orderItems.dish"})
    @Query("select distinct o from Order o where o.id = :id")
    java.util.Optional<Order> findDetailedById(@Param("id") Long id);
}
