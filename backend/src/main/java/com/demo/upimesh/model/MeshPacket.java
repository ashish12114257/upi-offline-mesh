package com.demo.upimesh.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

/**
 * The over-the-wire format. This is what hops from phone to phone via Bluetooth.
 *
 * The intermediate phones can read the OUTER fields (packetId, ttl, createdAt)
 * because they need them for routing and dedup. They CANNOT read `ciphertext` —
 * that's encrypted with the server's public key.
 *
 * NOTE on outer-field tampering:
 *   A malicious intermediate could change `packetId` or `createdAt`. That's why
 *   we use the ciphertext's hash (not packetId) as the idempotency key on the
 *   server. The ciphertext is authenticated by hybrid encryption, so any
 *   tampering inside the encrypted blob is detected on decryption.
 */
@Schema(name = "MeshPacket", description = "Over-the-wire packet format for Bluetooth mesh relay")
public class MeshPacket {

    @NotBlank
    @Schema(description = "UUID used by intermediate nodes for gossip deduplication", example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    private String packetId;

    @Min(0)
    @Schema(description = "Hops remaining before the packet expires; intermediates decrement this", example = "5")
    private int ttl;

    @NotNull
    @Schema(description = "Epoch milliseconds when the sender created the packet", example = "1749265800000")
    private Long createdAt;

    @NotBlank
    @Schema(description = "Base64-encoded hybrid ciphertext: RSA-OAEP-wrapped AES-256-GCM session key + encrypted payload",
            example = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...")
    private String ciphertext;

    public MeshPacket() {}

    public String getPacketId() { return packetId; }
    public void setPacketId(String packetId) { this.packetId = packetId; }

    public int getTtl() { return ttl; }
    public void setTtl(int ttl) { this.ttl = ttl; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public String getCiphertext() { return ciphertext; }
    public void setCiphertext(String ciphertext) { this.ciphertext = ciphertext; }
}
