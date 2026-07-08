package com.demo.upimesh.controller;

import com.demo.upimesh.crypto.ServerKeyHolder;
import com.demo.upimesh.model.*;
import com.demo.upimesh.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

@RestController
@RequestMapping("/api")
@Tag(name = "Mesh Network API", description = "Endpoints for the offline UPI mesh payment simulation")
public class ApiController {

    private static final Logger log = LoggerFactory.getLogger(ApiController.class);

    private final ServerKeyHolder serverKey;
    private final DemoService demo;
    private final MeshSimulatorService mesh;
    private final BridgeIngestionService bridge;
    private final IdempotencyService idempotency;
    private final AccountRepository accountRepo;
    private final TransactionRepository txRepo;

    public ApiController(ServerKeyHolder serverKey, DemoService demo,
                         MeshSimulatorService mesh, BridgeIngestionService bridge,
                         IdempotencyService idempotency,
                         AccountRepository accountRepo, TransactionRepository txRepo) {
        this.serverKey = serverKey;
        this.demo = demo;
        this.mesh = mesh;
        this.bridge = bridge;
        this.idempotency = idempotency;
        this.accountRepo = accountRepo;
        this.txRepo = txRepo;
    }

    @Operation(
            summary = "Get server public key",
            description = "Returns the server's RSA-2048 public key (Base64-encoded) that clients use for " +
                          "hybrid encryption of payment packets. The hybrid scheme wraps an AES-256-GCM session " +
                          "key with RSA-OAEP-SHA256."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Public key details",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    {
                                      "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
                                      "algorithm": "RSA-2048 / OAEP-SHA256",
                                      "hybridScheme": "RSA-OAEP encrypts an AES-256-GCM session key"
                                    }""")))
    })
    @GetMapping("/server-key")
    public Map<String, String> getServerPublicKey() {
        return Map.of(
                "publicKey", serverKey.getPublicKeyBase64(),
                "algorithm", "RSA-2048 / OAEP-SHA256",
                "hybridScheme", "RSA-OAEP encrypts an AES-256-GCM session key"
        );
    }

    @Operation(
            summary = "Create and inject a demo payment",
            description = "Encrypts a payment instruction using the server's public key, wraps it in a MeshPacket " +
                          "with the given TTL, and injects it into the simulated mesh on the specified start device. " +
                          "The packet then propagates via gossip until it reaches a bridge node or its TTL expires."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Packet created and injected",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    {
                                      "packetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                                      "ciphertextPreview": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
                                      "ttl": 5,
                                      "injectedAt": "phone-alice"
                                    }"""))),
            @ApiResponse(responseCode = "400", description = "Validation failure (missing/invalid fields)")
    })
    @PostMapping("/demo/send")
    public ResponseEntity<?> demoSend(@Valid @RequestBody DemoSendRequest req) throws Exception {
        MeshPacket packet = demo.createPacket(
                req.senderVpa, req.receiverVpa, req.amount, req.pin,
                req.ttl == null ? 5 : req.ttl);

        String startDevice = req.startDevice == null ? "phone-alice" : req.startDevice;
        mesh.inject(startDevice, packet);

        return ResponseEntity.ok(Map.of(
                "packetId", packet.getPacketId(),
                "ciphertextPreview", packet.getCiphertext().substring(0, 64) + "...",
                "ttl", packet.getTtl(),
                "injectedAt", startDevice
        ));
    }

    @Schema(name = "DemoSendRequest", description = "Request payload for creating a demo payment packet")
    public static class DemoSendRequest {
        @Schema(description = "Sender's VPA (e.g. alice@demo)", example = "alice@demo", requiredMode = Schema.RequiredMode.REQUIRED)
        public String senderVpa;

        @Schema(description = "Receiver's VPA (e.g. bob@demo)", example = "bob@demo", requiredMode = Schema.RequiredMode.REQUIRED)
        public String receiverVpa;

        @Schema(description = "Payment amount", example = "250.00", requiredMode = Schema.RequiredMode.REQUIRED)
        public BigDecimal amount;

        @Schema(description = "UPI PIN for the sender account (default for demo accounts: 1234)", example = "1234", requiredMode = Schema.RequiredMode.REQUIRED)
        public String pin;

        @Schema(description = "Time-to-live (max hops). Defaults to 5 if not provided", example = "5", defaultValue = "5")
        public Integer ttl;

        @Schema(description = "Name of the mesh device to inject into. Defaults to phone-alice", example = "phone-alice", defaultValue = "phone-alice")
        public String startDevice;
    }

    @Operation(
            summary = "Get mesh network state",
            description = "Returns the current state of all simulated mesh devices, including which packets " +
                          "each device holds, whether the device has internet (bridge capability), and the " +
                          "size of the server-side idempotency cache."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mesh state snapshot",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    {
                                      "devices": [
                                        {
                                          "deviceId": "phone-alice",
                                          "hasInternet": false,
                                          "packetCount": 2,
                                          "packetIds": ["a1b2c3d4", "e5f67890"]
                                        },
                                        {
                                          "deviceId": "phone-bridge",
                                          "hasInternet": true,
                                          "packetCount": 1,
                                          "packetIds": ["ab123456"]
                                        }
                                      ],
                                      "idempotencyCacheSize": 5
                                    }""")))
    })
    @GetMapping("/mesh/state")
    public Map<String, Object> meshState() {
        List<Map<String, Object>> deviceData = new ArrayList<>();
        for (VirtualDevice d : mesh.getDevices()) {
            deviceData.add(Map.of(
                    "deviceId", d.getDeviceId(),
                    "hasInternet", d.hasInternet(),
                    "packetCount", d.packetCount(),
                    "packetIds", d.getHeldPackets().stream()
                            .map(p -> p.getPacketId().substring(0, 8))
                            .toList()
            ));
        }
        return Map.of(
                "devices", deviceData,
                "idempotencyCacheSize", idempotency.size()
        );
    }

    @Operation(
            summary = "Run one gossip round",
            description = "Simulates one round of Bluetooth mesh gossip. Devices exchange packets they " +
                          "currently hold with neighboring devices. Returns how many packets moved and " +
                          "how many devices participated."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Gossip round completed",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    {
                                      "transfers": 3,
                                      "deviceCounts": 5
                                    }""")))
    })
    @PostMapping("/mesh/gossip")
    public Map<String, Object> meshGossip() {
        MeshSimulatorService.GossipResult r = mesh.gossipOnce();
        return Map.of(
                "transfers", r.transfers(),
                "deviceCounts", r.deviceCounts()
        );
    }

    @Operation(
            summary = "Flush bridge node packets",
            description = "Collects all packets held by internet-connected (bridge) devices and ingests them " +
                          "into the server for decryption, idempotency check, and settlement. Processes " +
                          "uploads in parallel."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bridge uploads processed",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    {
                                      "uploadsAttempted": 2,
                                      "results": [
                                        {
                                          "bridgeNode": "phone-bridge",
                                          "packetId": "a1b2c3d4",
                                          "outcome": "SETTLED",
                                          "reason": "",
                                          "transactionId": 1
                                        },
                                        {
                                          "bridgeNode": "phone-bridge",
                                          "packetId": "e5f67890",
                                          "outcome": "DUPLICATE_DROPPED",
                                          "reason": "",
                                          "transactionId": -1
                                        }
                                      ]
                                    }""")))
    })
    @PostMapping("/mesh/flush")
    public Map<String, Object> meshFlush() {
        List<MeshSimulatorService.BridgeUpload> uploads = mesh.collectBridgeUploads();
        Queue<Map<String, Object>> results = new ConcurrentLinkedQueue<>();

        uploads.parallelStream().forEach(up -> {
            BridgeIngestionService.IngestResult r =
                    bridge.ingest(up.packet(), up.bridgeNodeId(), 5 - up.packet().getTtl());
            results.add(Map.of(
                    "bridgeNode", up.bridgeNodeId(),
                    "packetId", up.packet().getPacketId().substring(0, 8),
                    "outcome", r.outcome(),
                    "reason", r.reason() == null ? "" : r.reason(),
                    "transactionId", r.transactionId() == null ? -1 : r.transactionId()
            ));
        });

        return Map.of(
                "uploadsAttempted", uploads.size(),
                "results", results
        );
    }

    @Operation(
            summary = "Reset mesh and idempotency cache",
            description = "Clears all packets from every simulated mesh device and purges the server-side " +
                          "idempotency cache. Useful to restart the simulation from a clean state."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mesh and cache cleared",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    {
                                      "status": "mesh and idempotency cache cleared"
                                    }""")))
    })
    @PostMapping("/mesh/reset")
    public Map<String, Object> meshReset() {
        mesh.resetMesh();
        idempotency.clear();
        return Map.of("status", "mesh and idempotency cache cleared");
    }

    @Operation(
            summary = "Ingest a mesh packet from a bridge node",
            description = "Accepts a MeshPacket delivered by a bridge node. The server decrypts the ciphertext, " +
                          "verifies idempotency via ciphertext hash, checks packet freshness, and settles the " +
                          "payment if valid. This is the primary ingestion endpoint for real-world bridge nodes."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Packet settled or duplicate (idempotent)",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    {
                                      "outcome": "SETTLED",
                                      "packetHash": "abcdef0123456789...",
                                      "reason": null,
                                      "transactionId": 1
                                    }"""))),
            @ApiResponse(responseCode = "400", description = "Invalid packet (decryption failure, stale, etc.)",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    {
                                      "outcome": "INVALID",
                                      "packetHash": "abcdef0123456789...",
                                      "reason": "decryption_failed",
                                      "transactionId": null
                                    }""")))
    })
    @PostMapping("/bridge/ingest")
    public ResponseEntity<?> ingest(
            @Valid @RequestBody
            @Parameter(description = "The mesh packet to ingest. Must have valid ciphertext encrypted with the server's public key.")
            MeshPacket packet,

            @RequestHeader(value = "X-Bridge-Node-Id", defaultValue = "unknown")
            @Parameter(description = "Identifier of the bridge node that delivered the packet", example = "phone-bridge")
            String bridgeNodeId,

            @RequestHeader(value = "X-Hop-Count", defaultValue = "0")
            @Parameter(description = "Number of hops the packet made through the mesh before reaching the bridge", example = "3")
            int hopCount) {

        BridgeIngestionService.IngestResult r = bridge.ingest(packet, bridgeNodeId, hopCount);
        HttpStatus status = switch (r.outcome()) {
            case "SETTLED" -> HttpStatus.OK;
            case "DUPLICATE_DROPPED" -> HttpStatus.OK;
            case "INVALID" -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
        return ResponseEntity.status(status).body(r);
    }

    @Operation(
            summary = "List all accounts",
            description = "Returns every registered account with current balance. Demo accounts include " +
                          "alice@demo, bob@demo, carol@demo, and dave@demo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of accounts",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    [
                                      {
                                        "vpa": "alice@demo",
                                        "holderName": "Alice",
                                        "balance": 9750.00,
                                        "version": 5,
                                        "pinHash": "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"
                                      }
                                    ]""")))
    })
    @GetMapping("/accounts")
    public List<Account> listAccounts() {
        return accountRepo.findAll();
    }

    @Operation(
            summary = "List recent transactions",
            description = "Returns the 20 most recently settled transactions, ordered by ID descending. " +
                          "Includes the packet hash (for idempotency), sender/receiver VPAs, amount, " +
                          "timestamps, bridge node info, and settlement status."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of transactions",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject("""
                                    [
                                      {
                                        "id": 1,
                                        "packetHash": "abcdef0123456789...",
                                        "senderVpa": "alice@demo",
                                        "receiverVpa": "bob@demo",
                                        "amount": 250.00,
                                        "signedAt": "2025-06-15T10:30:00Z",
                                        "settledAt": "2025-06-15T10:35:00Z",
                                        "bridgeNodeId": "phone-bridge",
                                        "hopCount": 3,
                                        "status": "SETTLED"
                                      }
                                    ]""")))
    })
    @GetMapping("/transactions")
    public ResponseEntity<?> listTransactions() {
        try {
            List<Transaction> txs = txRepo.findTop20ByOrderByIdDesc();
            return ResponseEntity.ok(txs);
        } catch (Exception e) {
            log.error("Failed to fetch transactions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to retrieve transaction history. Please try again later."));
        }
    }
}
