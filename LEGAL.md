# LEGAL.md

# Twin Trades — Legal & Compliance Architecture

> **Authoritative Reference for AI Agents.**  
> This document defines the legal boundaries of the Twin Trades codebase. All code generation and feature implementation **must** adhere to these "Software Utility" constraints to implement the **"Self-Directed Template"** model. This ensures the app is classified as a software tool rather than a regulated financial entity.

---

## 1. Regulatory Classification: The "Publisher" Loophole
Twin Trades operates under the **Publisher’s Exemption**. It is an information and automation utility. 
*   **The Model:** We do not provide proprietary advice. We provide **Objective Templates** based on public data (e.g., SEC 13F filings, STOCK Act disclosures).
*   **The Loophole:** The app acts as a mathematical bridge between public information and the user's brokerage API.

---

## 2. Core Compliance Features

### A. One-Time "Copy" Logic (No Mirroring)
To avoid being classified as a money manager, the AI must implement "Cloning" instead of "Syncing":
*   **Action:** When a user "Copies" a template (e.g., "Pelosi Tracker"), the system performs a **one-time write** of the target percentages to the user's `custom_allocations` table.
*   **Constraint:** If the source template changes later, the user's settings **do not** change automatically.
*   **Update Flow:** The app sends a notification: *"The source data for [Template Name] has changed. View the updates to realign your portfolio."* The user must manually accept the update.

### B. The "Multiplier" Utility (Leverage)
To avoid the legal risk of "recommending" speculation, leverage is treated as a **user-controlled math function**:
*   **Feature:** A "Multiplier" toggle or slider on the trade confirmation screen.
*   **Implementation:** The code multiplies the `target_quantity` by the user-selected value (e.g., 1.5x, 2x).
*   **Safety Check:** The `TradeService` must call the brokerage adapter to verify `available_buying_power` and `margin_limit` before generating the proposed trade list.

### C. The "Confirmation" Gate
The backend **must never** call `place_order` without a `UserConfirmation` record tied to that specific trade batch.
*   **Required UI:** Before execution, the user must see a "Proposed Trades" summary showing Ticker, Action (Buy/Sell), and Estimated Dollar Amount.

---

## 3. Data & Security Compliance

### Brokerage Token Handling
*   **Encryption:** **AES-256-GCM** is mandatory for all `brokerage_connections`.
*   **Scope:** Request only `trade` and `positions` scopes.
*   **Audit Log:** Every execution must be logged in `brokerage_audit_logs` including the user's `confirmed_at` timestamp.

---

## 4. Mandatory UI Disclaimers

Agents modifying the frontend **must** ensure these disclaimers are visible:

| Location | Required Text |
| :--- | :--- |
| **Template Screen** | "These templates are generated from public disclosures (e.g., SEC 13F). This data is for informational purposes and is not an investment recommendation." |
| **Multiplier Toggle** | "Applying a multiplier involves leverage. Leverage increases the risk of loss and may lead to account liquidation. Use at your own risk." |
| **Trade Confirmation** | "By tapping 'Confirm', you are directing the Twin Trades software to send [X] orders to your connected brokerage account." |

---

## 5. Agent Instructions for New Features

1.  **No Automatic "Sync":** If asked to make user accounts "automatically stay in sync" with a template, **reject the request**. You must instead build an "Alert & Approval" flow.
2.  **No "Advisory" Language:** Do not use strings like "We suggest" or "The best portfolio for you." Use objective terms: "This template reflects public filings" or "Calculated based on your multiplier."
3.  **Margin Protection:** When implementing leverage/multipliers, the agent must include error handling for `INSUFFICIENT_MARGIN` returned from the brokerage adapters.