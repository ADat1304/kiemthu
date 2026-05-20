package com.gateway_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "security.rate-limit")
public class RateLimitProperties {

    /** Maximum number of requests that can be held in the bucket. */
    private int capacity = 100;

    /** Number of tokens refilled every period. */
    private int refillTokens = 50;

    /** Period in seconds for refilling tokens. */
    private Duration refillPeriod = Duration.ofSeconds(60);

    /** Paths that should bypass rate limiting (e.g., health checks). */
    private List<String> whitelist = new ArrayList<>();

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public int getRefillTokens() {
        return refillTokens;
    }

    public void setRefillTokens(int refillTokens) {
        this.refillTokens = refillTokens;
    }

    public Duration getRefillPeriod() {
        return refillPeriod;
    }

    public void setRefillPeriod(Duration refillPeriod) {
        this.refillPeriod = refillPeriod;
    }

    public List<String> getWhitelist() {
        return whitelist;
    }

    public void setWhitelist(List<String> whitelist) {
        this.whitelist = whitelist;
    }
}
