# Critical Pact Functions for Bridging on Kadena

This section outlines the key Pact functions that are critical for token bridging on the Kadena side. These functions cover message dispatch and processing, token management, gas payments, interchain security, and validator announcements. They work together to ensure a secure and reliable bridge between chains.

---

## Mailbox Module

The **mailbox.pact** module is responsible for managing the lifecycle of Hyperlane messages. Its main functions include:

- **Initialization & State Management**

  - `initialize`: Sets up the contract’s state with initial values such as the nonce and a paused flag.
  - `pause` / `unpause`: Allows the bridge to be temporarily disabled or re-enabled for maintenance or emergency purposes.
  - `nonce`: Retrieves the current nonce, which is used to ensure message uniqueness.

- **Message Dispatch**
  - `dispatch`:
    - Constructs a message object using `prepare-dispatch-parameters` with details like version, nonce, origin/destination domains, sender, recipient, and message body.
    - Increments the nonce and stores the latest dispatched message ID.
    - Invokes a post-dispatch hook via the defined dependency to perform any additional actions.
    - Emits `DISPATCH` and `DISPATCH-ID` events to log the outgoing message.
- **Message Processing**
  - `process`:
    - Validates an incoming Hyperlane message (e.g., checks version, destination, and uniqueness).
    - Ensures the bridge is not paused.
    - Decodes the token message using `hyperlane-decode-token-message`.
    - Calls the appropriate router’s `handle` function to credit the recipient.
    - Emits `PROCESS` and `PROCESS-ID` events to record successful processing.
- **Additional Functions**
  - `store-router` and `get-router-hash`: Manage router references for cross-chain transfers.
  - `prepare-dispatch-parameters`: Packages message parameters into a structured object for dispatch.

---

## hyp-erc20 Module

The **hyp-erc20.pact** module implements ERC20 token bridging logic by integrating with the router interface. Its responsibilities include:

- **Account & Token Management**

  - `create-account`: Creates a new account with an associated security guard.
  - `transfer-from`: Burns tokens from the sender’s account as part of the bridge operation.
  - `transfer-create-to`: Mints tokens into the recipient’s account once the message is processed.
  - `transfer-create-to-crosschain`: Facilitates cross-chain transfers through a multi-step yield/resume process.

- **Router Integration**
  - Implements functions from the router interface that enable seamless interaction with the **mailbox** module during message dispatch and processing.

---

## IGP Module (Interchain Gas Paymaster)

The **igp.pact** module manages gas payments required to relay messages to destination chains. Key aspects include:

- **Treasury Initialization**

  - `initialize`: Sets up the treasury account used to collect gas fees.

- **Gas Payment Calculation**
  - `quote-gas-payment`: Calculates the gas fee based on the remote domain’s gas price and the current token exchange rate. This function reads the gas amount from a dedicated table and applies a formula to determine the required payment.
- **Gas Payment Processing**
  - `pay-for-gas`: Transfers the computed gas fee from the sender’s account to the treasury and emits a `GAS_PAYMENT` event to log the transaction.

---

## Domain Routing ISM

The **domain-routing-ism** module implements interchain security through an ISM (Interchain Security Module) interface. Its functions include:

- **Module Management**

  - `initialize`: Registers ISM modules for different destination domains.
  - `set-domain` and `remove-domain`: Activate or deactivate ISM modules for specific domains.
  - `get-domains` and `get-module`: Retrieve active ISM modules to validate incoming messages.

- **Message Validation**
  - Provides functions such as `get-validators` and `get-threshold` to extract the necessary parameters for multisig or routing-based message verification.

---

## Validator-Announce Module

The **validator-announce.pact** module maintains off-chain validator information required by relayers. It includes:

- **Validator Announcements**
  - `announce`: Registers a validator’s signature and storage location. This function ensures that a given validator’s announcement is unique by hashing their information before insertion.
- **Retrieval Functions**
  - Functions to fetch announced storage locations (`get-announced-storage-location`) and a list of all known validators (`get-announced-validators`). Only admins can add validators.

---

## Merkle-Tree ISM (Abstract Merkle Root Multisig ISM)

The **merkle-tree-ism.pact** module leverages a Merkle tree-based multisig approach for secure message verification:

- **Setup**
  - `initialize`: Configures the module with a list of validators and a threshold value.
- **Validation**
  - `get-validators` and `get-threshold`: Retrieve the validators and the required threshold for multisig verification, ensuring that messages are authenticated using Merkle proofs.

---

## Token Message Interface

The **token-message** interface standardizes the format for token transfer messages:

- **Message Formatting & Decoding**
  - `format`: Encodes the token transfer details (recipient, amount, and chain ID) into a compact byte string.
  - Helper functions such as `recipient`, `amount`, and `metadata` extract specific parts of the token message for processing by various modules.
