package ru.flagman.monitoring.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.flagman.monitoring.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> { }
