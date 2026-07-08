package com.demo.upimesh.service;

import com.demo.upimesh.crypto.HybridCryptoService;
import com.demo.upimesh.model.MeshPacket;
import com.demo.upimesh.model.PaymentInstruction;
import com.demo.upimesh.model.Transaction;
import io.swagger.v3.oas.annotations.media.Schema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class BridgeIngestionService {

    private static final Logger log = LoggerFactory.getLogger(BridgeIngestionService.class);

    private static final long DEFAULT_CLOCK_SKEW_SECONDS = 300;

    private final HybridCryptoService crypto;
    private final IdempotencyService idempotency;
    private final SettlementService settlement;

    @Value("${upi.mesh.packet-max-age-seconds:86400}")
    private long maxAgeSeconds;

    public BridgeIngestionService(HybridCryptoService crypto, IdempotencyService idempotency, SettlementService settlement) {
        this.crypto = crypto;
        this.idempotency = idempotency;
        this.settlement = settlement;
    }

    public IngestResult ingest(MeshPacket packet, String bridgeNodeId, int hopCount) {
        String packetHash;
        try {
            packetHash = crypto.hashCiphertext(packet.getCiphertext());
        } catch (Exception e) {
            log.error("Hash computation failed for bridge {}: {}", bridgeNodeId, e.getMessage());
            return IngestResult.invalid("?", "hash_failed");
        }

        if (!idempotency.claim(packetHash)) {
            log.info("DUPLICATE packet {} from bridge {} — dropped",
                    packetHash.substring(0, 12) + "...", bridgeNodeId);
            return IngestResult.duplicate(packetHash);
        }

        PaymentInstruction instruction;
        try {
            instruction = crypto.decrypt(packet.getCiphertext());
        } catch (Exception e) {
            log.warn("Decryption failed for packet {}: {}",
                    packetHash.substring(0, 12) + "...", e.getMessage());
            return IngestResult.invalid(packetHash, "decryption_failed");
        }

        long ageSeconds = (Instant.now().toEpochMilli() - instruction.getSignedAt()) / 1000;
        if (ageSeconds > maxAgeSeconds) {
            log.warn("Packet {} too old ({}s), rejected",
                    packetHash.substring(0, 12) + "...", ageSeconds);
            return IngestResult.invalid(packetHash, "stale_packet");
        }
        if (ageSeconds < -DEFAULT_CLOCK_SKEW_SECONDS) {
            return IngestResult.invalid(packetHash, "future_dated");
        }

        try {
            Transaction tx = settlement.settle(instruction, packetHash, bridgeNodeId, hopCount);
            return IngestResult.settled(packetHash, tx);
        } catch (Exception e) {
            log.error("Settlement error for packetHash={}: ", packetHash, e);
            return IngestResult.invalid(packetHash, "settlement_failed");
        }
    }

    @Schema(name = "IngestResult", description = "Result of ingesting a mesh packet into the server")
    public record IngestResult(
            @Schema(description = "Outcome of the ingestion", allowableValues = {"SETTLED", "DUPLICATE_DROPPED", "INVALID"}, example = "SETTLED")
            String outcome,

            @Schema(description = "SHA-256 hex hash of the packet ciphertext (used as idempotency key)", example = "abcdef0123456789...")
            String packetHash,

            @Schema(description = "Failure reason (null on success)", example = "decryption_failed", nullable = true)
            String reason,

            @Schema(description = "Transaction ID assigned on settlement (null if not settled)", example = "1", nullable = true)
            Long transactionId) {
        public static IngestResult settled(String hash, Transaction tx) {
            return new IngestResult("SETTLED", hash, null, tx.getId());
        }
        public static IngestResult duplicate(String hash) {
            return new IngestResult("DUPLICATE_DROPPED", hash, null, null);
        }
        public static IngestResult invalid(String hash, String reason) {
            return new IngestResult("INVALID", hash, reason, null);
        }
    }
}
