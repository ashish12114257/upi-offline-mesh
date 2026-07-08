package com.demo.upimesh.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IdempotencyService {

    private final Map<String, Instant> seen = new ConcurrentHashMap<>();

    @Value("${upi.mesh.idempotency-ttl-seconds:86400}")
    private long ttlSeconds;

    public boolean claim(String packetHash) {
        Instant now = Instant.now();
        Instant[] holder = new Instant[1];
        boolean claimed = seen.compute(packetHash, (k, existing) -> {
            if (existing == null || now.isAfter(existing.plusSeconds(ttlSeconds))) {
                holder[0] = null;
                return now;
            }
            holder[0] = existing;
            return existing;
        }) == now;
        return claimed;
    }

    public int size() {
        return seen.size();
    }

    @Scheduled(fixedDelay = 60_000)
    public void evictExpired() {
        Instant cutoff = Instant.now().minusSeconds(ttlSeconds);
        seen.entrySet().removeIf(e -> e.getValue().isBefore(cutoff));
    }

    public void clear() {
        seen.clear();
    }
}
