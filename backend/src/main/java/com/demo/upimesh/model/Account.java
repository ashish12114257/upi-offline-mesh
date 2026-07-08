package com.demo.upimesh.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Simulated bank account. In a real system this would live in the bank's core,
 * not in our service. For the demo, we own the ledger.
 */
@Entity
@Table(name = "accounts")
@Schema(name = "Account", description = "Simulated bank account for the demo")
public class Account {

    @Id
    @Schema(description = "Virtual Payment Address (unique identifier)", example = "alice@demo")
    private String vpa;

    @Column(nullable = false)
    @Schema(description = "Account holder's display name", example = "Alice")
    private String holderName;

    @Column(nullable = false, precision = 19, scale = 2)
    @Schema(description = "Current account balance", example = "9750.00")
    private BigDecimal balance;

    @Version
    @Schema(description = "Optimistic locking version (incremented on each update)", example = "5")
    private Long version;

    @Column(nullable = false)
    @JsonIgnore
    @Schema(description = "SHA-256 hex hash of the UPI PIN (hidden from API responses)", example = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", accessMode = Schema.AccessMode.READ_ONLY)
    private String pinHash;

    public Account() {}

    public Account(String vpa, String holderName, BigDecimal balance) {
        this.vpa = vpa;
        this.holderName = holderName;
        this.balance = balance;
    }

    public Account(String vpa, String holderName, BigDecimal balance, String pinHash) {
        this.vpa = vpa;
        this.holderName = holderName;
        this.balance = balance;
        this.pinHash = pinHash;
    }

    public String getVpa() { return vpa; }
    public void setVpa(String vpa) { this.vpa = vpa; }

    public String getHolderName() { return holderName; }
    public void setHolderName(String holderName) { this.holderName = holderName; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public String getPinHash() { return pinHash; }
    public void setPinHash(String pinHash) { this.pinHash = pinHash; }
}
