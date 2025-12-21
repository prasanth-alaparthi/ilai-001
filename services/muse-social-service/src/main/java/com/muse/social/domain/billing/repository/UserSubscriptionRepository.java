package com.muse.social.domain.billing.repository;

import com.muse.social.domain.billing.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    Optional<UserSubscription> findByUserId(Long userId);

    Optional<UserSubscription> findByStripeCustomerId(String stripeCustomerId);

    Optional<UserSubscription> findByStripeSubscriptionId(String stripeSubscriptionId);
}
