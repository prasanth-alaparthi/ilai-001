package com.muse.social.billing.repository;

import com.muse.social.billing.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    Optional<UserSubscription> findByUserId(Long userId);

    Optional<UserSubscription> findByStripeCustomerId(String stripeCustomerId);

    @Query("SELECT u.tier FROM UserSubscription u WHERE u.userId = :userId")
    String getTierByUserId(Long userId);

    @Query("SELECT u.userId FROM UserSubscription u WHERE u.stripeCustomerId = :customerId")
    Long getUserIdByStripeCustomerId(String customerId);

    @Modifying
    @Query("UPDATE UserSubscription u SET u.tier = :tier, u.updatedAt = CURRENT_TIMESTAMP WHERE u.userId = :userId")
    void updateTier(Long userId, String tier);

    @Modifying
    @Query("UPDATE UserSubscription u SET u.stripeSubscriptionItemId = :itemId WHERE u.userId = :userId")
    void saveMeteredSubscriptionItem(Long userId, String itemId);
}
