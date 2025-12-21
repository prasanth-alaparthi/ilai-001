package com.muse.social.billing.controller;

import com.muse.social.billing.repository.UserSubscriptionRepository;
import com.muse.social.billing.service.FeatureFlagService;
import com.muse.social.billing.service.TokenUsageService;
import com.muse.social.billing.entity.UserSubscription;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.*;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Stripe Webhook Controller for handling subscription events.
 * Manages tier upgrades/downgrades and metered billing.
 */
@RestController
@RequestMapping("/api/webhooks/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    private final FeatureFlagService featureFlags;
    private final UserSubscriptionRepository subscriptionRepo;
    private final TokenUsageService tokenUsageService;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    // Stripe Price IDs (configure in application.yml)
    @Value("${stripe.prices.general:price_general_monthly}")
    private String priceGeneral;

    @Value("${stripe.prices.pro:price_pro_monthly}")
    private String pricePro;

    @Value("${stripe.prices.phd:price_phd_monthly}")
    private String pricePhd;

    @PostMapping
    public ResponseEntity<String> handleEvent(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.error("Webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        log.info("Received Stripe event: {}", event.getType());

        try {
            switch (event.getType()) {
                case "checkout.session.completed":
                    handleCheckoutComplete(event);
                    break;

                case "customer.subscription.created":
                case "customer.subscription.updated":
                    handleSubscriptionChange(event);
                    break;

                case "customer.subscription.deleted":
                    handleSubscriptionCancelled(event);
                    break;

                case "invoice.payment_succeeded":
                    handlePaymentSuccess(event);
                    break;

                case "invoice.payment_failed":
                    handlePaymentFailed(event);
                    break;

                case "invoice.upcoming":
                    handleUpcomingInvoice(event);
                    break;

                default:
                    log.debug("Unhandled event type: {}", event.getType());
            }
        } catch (Exception e) {
            log.error("Error processing webhook: {}", e.getMessage(), e);
            // Return 200 to prevent Stripe from retrying
            return ResponseEntity.ok("Error processed");
        }

        return ResponseEntity.ok("OK");
    }

    private void handleCheckoutComplete(Event event) throws Exception {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        String userIdStr = session.getClientReferenceId();
        if (userIdStr == null) {
            log.warn("No client_reference_id in checkout session");
            return;
        }

        Long userId = Long.parseLong(userIdStr);
        String customerId = session.getCustomer();
        String subscriptionId = session.getSubscription();

        // Create or update subscription record
        UserSubscription subscription = subscriptionRepo.findByUserId(userId)
                .orElse(UserSubscription.builder().userId(userId).build());

        subscription.setStripeCustomerId(customerId);
        subscription.setStripeSubscriptionId(subscriptionId);

        // Fetch subscription details from Stripe
        Subscription stripeSubscription = Subscription.retrieve(subscriptionId);

        for (SubscriptionItem item : stripeSubscription.getItems().getData()) {
            Price price = item.getPrice();
            String priceId = price.getId();
            String tier = mapPriceToTier(priceId);

            subscription.setTier(tier);

            // Store metered item ID if applicable
            if ("metered".equals(price.getRecurring().getUsageType())) {
                subscription.setStripeSubscriptionItemId(item.getId());
            }

            // Set billing period
            subscription.setCurrentPeriodStart(toLocalDateTime(stripeSubscription.getCurrentPeriodStart()));
            subscription.setCurrentPeriodEnd(toLocalDateTime(stripeSubscription.getCurrentPeriodEnd()));
        }

        subscription.setStatus("active");
        subscriptionRepo.save(subscription);

        // Enable features for the new tier
        featureFlags.enableTierFeatures(userIdStr, subscription.getTier());

        log.info("Checkout complete for user {}: tier={}", userId, subscription.getTier());
    }

    private void handleSubscriptionChange(Event event) throws Exception {
        Subscription subscription = (Subscription) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        String customerId = subscription.getCustomer();

        var userSubscription = subscriptionRepo.findByStripeCustomerId(customerId);
        if (userSubscription.isEmpty()) {
            log.warn("No subscription found for Stripe customer {}", customerId);
            return;
        }

        UserSubscription sub = userSubscription.get();

        // Determine tier from subscription items
        String tier = "free";
        for (SubscriptionItem item : subscription.getItems().getData()) {
            String priceId = item.getPrice().getId();
            tier = mapPriceToTier(priceId);

            // Update metered item ID
            if ("metered".equals(item.getPrice().getRecurring().getUsageType())) {
                sub.setStripeSubscriptionItemId(item.getId());
            }
        }

        sub.setTier(tier);
        sub.setStatus(subscription.getStatus());
        sub.setCurrentPeriodStart(toLocalDateTime(subscription.getCurrentPeriodStart()));
        sub.setCurrentPeriodEnd(toLocalDateTime(subscription.getCurrentPeriodEnd()));

        subscriptionRepo.save(sub);

        // Update feature flags based on status
        if ("active".equals(subscription.getStatus()) ||
                "trialing".equals(subscription.getStatus())) {
            featureFlags.enableTierFeatures(String.valueOf(sub.getUserId()), tier);
        } else {
            featureFlags.enableTierFeatures(String.valueOf(sub.getUserId()), "free");
        }

        log.info("Subscription updated for user {}: tier={}, status={}",
                sub.getUserId(), tier, subscription.getStatus());
    }

    private void handleSubscriptionCancelled(Event event) throws Exception {
        Subscription subscription = (Subscription) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        String customerId = subscription.getCustomer();

        var userSubscription = subscriptionRepo.findByStripeCustomerId(customerId);
        if (userSubscription.isPresent()) {
            UserSubscription sub = userSubscription.get();
            sub.setTier("free");
            sub.setStatus("canceled");
            subscriptionRepo.save(sub);

            featureFlags.enableTierFeatures(String.valueOf(sub.getUserId()), "free");

            log.info("Subscription cancelled for user {}", sub.getUserId());
        }
    }

    private void handlePaymentSuccess(Event event) {
        Invoice invoice = (Invoice) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        log.info("Payment succeeded for invoice {}: ${}",
                invoice.getId(), invoice.getAmountPaid() / 100.0);
    }

    private void handlePaymentFailed(Event event) throws Exception {
        Invoice invoice = (Invoice) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        String customerId = invoice.getCustomer();

        var userSubscription = subscriptionRepo.findByStripeCustomerId(customerId);
        if (userSubscription.isPresent()) {
            UserSubscription sub = userSubscription.get();
            sub.setStatus("past_due");
            subscriptionRepo.save(sub);

            log.warn("Payment failed for user {}, invoice {}",
                    sub.getUserId(), invoice.getId());

            // Optionally: Downgrade features after grace period
        }
    }

    private void handleUpcomingInvoice(Event event) {
        Invoice invoice = (Invoice) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

        String customerId = invoice.getCustomer();

        var userSubscription = subscriptionRepo.findByStripeCustomerId(customerId);
        if (userSubscription.isPresent()) {
            // Force sync any pending usage before invoice finalizes
            log.info("Triggering pre-invoice usage sync for customer {}", customerId);
            tokenUsageService.syncUsageToStripe();
        }
    }

    private String mapPriceToTier(String priceId) {
        if (priceId.equals(priceGeneral) || priceId.contains("general")) {
            return "general";
        } else if (priceId.equals(pricePro) || priceId.contains("pro")) {
            return "pro";
        } else if (priceId.equals(pricePhd) || priceId.contains("phd")) {
            return "phd";
        }
        return "free";
    }

    private LocalDateTime toLocalDateTime(Long epochSeconds) {
        if (epochSeconds == null)
            return null;
        return LocalDateTime.ofInstant(
                Instant.ofEpochSecond(epochSeconds),
                ZoneId.systemDefault());
    }
}
