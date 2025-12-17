package com.muse.ai.repository;

import com.muse.ai.entity.PaymentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, UUID> {

    List<PaymentRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<PaymentRequest> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<PaymentRequest> findByStatus(String status);

    Optional<PaymentRequest> findByTransactionId(String transactionId);

    Optional<PaymentRequest> findByOrderId(String orderId);

    Optional<PaymentRequest> findByPaymentId(String paymentId);

    boolean existsByTransactionId(String transactionId);
}
