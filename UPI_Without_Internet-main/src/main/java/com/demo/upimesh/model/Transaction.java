package com.demo.upimesh.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Permanent record of every settled transaction. Once written, never modified.
 * The packetHash is the idempotency key — uniqueness is enforced at the DB level
 * as a defense-in-depth fallback if the Redis-style cache layer ever fails.
 */
@Entity
@Table(name = "transactions")
@Schema(name = "Transaction", description = "Permanent record of a settled payment")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "Auto-generated primary key", example = "1")
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    @Schema(description = "SHA-256 hex of the encrypted packet (used as idempotency key)", example = "abcdef0123456789...")
    private String packetHash;

    @Column(nullable = false)
    @Schema(description = "Sender's VPA", example = "alice@demo")
    private String senderVpa;

    @Column(nullable = false)
    @Schema(description = "Receiver's VPA", example = "bob@demo")
    private String receiverVpa;

    @Column(nullable = false, precision = 19, scale = 2)
    @Schema(description = "Transaction amount", example = "250.00")
    private BigDecimal amount;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    @Column(nullable = false)
    @Schema(description = "Timestamp when the sender originally signed the packet (offline)", example = "2025-06-15T10:30:00Z")
    private Instant signedAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    @Column(nullable = false)
    @Schema(description = "Timestamp when the backend processed and settled the payment", example = "2025-06-15T10:35:00Z")
    private Instant settledAt;

    @Column(nullable = false)
    @Schema(description = "Identifier of the bridge node that delivered the packet", example = "phone-bridge")
    private String bridgeNodeId;

    @Column(nullable = false)
    @Schema(description = "Number of mesh hops the packet made before reaching the bridge", example = "3")
    private int hopCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Schema(description = "Settlement status", example = "SETTLED")
    private Status status;

    @Schema(description = "Settlement status", enumAsRef = true)
    public enum Status { SETTLED, REJECTED }

    public Transaction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPacketHash() { return packetHash; }
    public void setPacketHash(String packetHash) { this.packetHash = packetHash; }

    public String getSenderVpa() { return senderVpa; }
    public void setSenderVpa(String senderVpa) { this.senderVpa = senderVpa; }

    public String getReceiverVpa() { return receiverVpa; }
    public void setReceiverVpa(String receiverVpa) { this.receiverVpa = receiverVpa; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }

    public Instant getSettledAt() { return settledAt; }
    public void setSettledAt(Instant settledAt) { this.settledAt = settledAt; }

    public String getBridgeNodeId() { return bridgeNodeId; }
    public void setBridgeNodeId(String bridgeNodeId) { this.bridgeNodeId = bridgeNodeId; }

    public int getHopCount() { return hopCount; }
    public void setHopCount(int hopCount) { this.hopCount = hopCount; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}
