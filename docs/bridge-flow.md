# Sequence Diagram

## From ETH to KDA

### ETH => HypERC20
```mermaid
sequenceDiagram
    participant User
    participant HypNative as HypNative
    participant MailboxETH as MailboxEVM
    participant Relayer
    participant MailboxKDA as MailboxKDA
    participant HypERC20KDA as HypERC20

    User->>HypNative: call transferRemote
    HypNative->>HypNative: sends ETH to router (payable transferRemote)
    HypNative->>HypNative: emit SentTransferRemote
    HypNative->>MailboxETH: call dispatch
    MailboxETH->>MailboxETH: emits Dispatch and DispatchID
    MailboxETH->>MailboxETH: perform checks (igp)
    Relayer->>MailboxETH: listen for events
    Relayer->>MailboxKDA: call process

    MailboxKDA->>MailboxKDA: checks PROCESS-MLC (ism)
    MailboxKDA->>MailboxKDA: emits PROCESS and PROCESS-ID 

    MailboxKDA->>HypERC20KDA: call handle

    HypERC20KDA->>HypERC20KDA: emits RECEIVED_TRANSFER_REMOTE

    HypERC20KDA->>HypERC20KDA: call transfer (create-to) to recepient
```


### HypERC20 => ERC20Collateral
```mermaid
sequenceDiagram
    participant User
    participant HypERC20 as HypERC20
    participant MailboxETH as MailboxEVM
    participant Relayer
    participant MailboxKDA as MailboxKDA
    participant HypERC20KDA as HypERC20Collateral

    User->>HypERC20: call transferRemote
    HypERC20->>HypERC20: burn tokens

    HypERC20->>HypERC20: emit SentTransferRemote
    HypERC20->>MailboxETH: call dispatch
    MailboxETH->>MailboxETH: emits Dispatch and DispatchID
    MailboxETH->>MailboxETH: perform checks (igp)
    Relayer->>MailboxETH: listen for events
    Relayer->>MailboxKDA: call process

    MailboxKDA->>MailboxKDA: checks PROCESS-MLC (ism)
    MailboxKDA->>MailboxKDA: emits PROCESS and PROCESS-ID 

    MailboxKDA->>HypERC20KDA: call handle

    HypERC20KDA->>HypERC20KDA: emits RECEIVED_TRANSFER_REMOTE
```

### ERC20Collateral => HypERC20
```mermaid
sequenceDiagram
    participant User
    participant HypERC20ETH as HypERC20Collateral
    participant MailboxETH as MailboxEVM
    participant Relayer
    participant MailboxKDA as MailboxKDA
    participant HypERC20 as HypERC20

    User->>HypERC20ETH: call transferRemote
    HypERC20ETH->>HypERC20ETH: transfers to router (transferFrom)

    HypERC20ETH->>HypERC20ETH: emit SentTransferRemote
    HypERC20ETH->>MailboxETH: call dispatch
    MailboxETH->>MailboxETH: emits Dispatch and DispatchID
    MailboxETH->>MailboxETH: perform checks (igp)
    Relayer->>MailboxETH: listen for events
    Relayer->>MailboxKDA: call process

    MailboxKDA->>MailboxKDA: checks PROCESS-MLC (ism)
    MailboxKDA->>MailboxKDA: emits PROCESS and PROCESS-ID 

    MailboxKDA->>HypERC20: call handle

    HypERC20->>HypERC20: call transfer (crexate-to) to recepient
    HypERC20->>HypERC20: emits RECEIVED_TRANSFER_REMOTE
```

### ERC20Collateral => ERC20Collateral
```mermaid
sequenceDiagram
    participant User
    participant HypERC20ETH as HypERC20Collateral
    participant MailboxETH as MailboxEVM
    participant Relayer
    participant MailboxKDA as MailboxKDA
    participant HypERC20KDA as HypERC20Collateral

    User->>HypERC20ETH: call transferRemote
    HypERC20ETH->>HypERC20ETH: transfers to router (transferFrom)

    HypERC20ETH->>HypERC20ETH: emit SentTransferRemote
    HypERC20ETH->>MailboxETH: call dispatch
    MailboxETH->>MailboxETH: emits Dispatch and DispatchID
    MailboxETH->>MailboxETH: perform checks (igp)
    Relayer->>MailboxETH: listen for events
    Relayer->>MailboxKDA: call process

    MailboxKDA->>MailboxKDA: checks PROCESS-MLC (ism)
    MailboxKDA->>MailboxKDA: emits PROCESS and PROCESS-ID 

    MailboxKDA->>HypERC20KDA: call handle

    HypERC20KDA->>HypERC20KDA: emits RECEIVED_TRANSFER_REMOTE

    HypERC20KDA->>HypERC20KDA: call transfers to recepient
```

## From KDA to ETH

### HypERC20 => ETH 
```mermaid
sequenceDiagram
    participant User
    participant MailboxKDA as MailboxKDA
    participant HypERC20KDA as HypERC20
    participant Relayer
    participant MailboxETH as MailboxEVM
    participant HypNative as HypNative

    User->>MailboxKDA: call dispatch
    MailboxKDA->>HypERC20KDA: call transfer-remote
    HypERC20KDA->>HypERC20KDA: burn tokens
    HypERC20KDA->>HypERC20KDA: transfers to IGP (gas amount from quote-gas-payment)
    HypERC20KDA->>HypERC20KDA: emit SENT_TRANSFER_REMOTE

    MailboxKDA->>MailboxKDA: emits DISPATCH, DISPATCH-ID
    Relayer->>MailboxKDA: listen for events
    Relayer->>MailboxETH: call process
    MailboxETH->>MailboxETH: emits Process, ProcessID
    MailboxETH->>MailboxETH: checks recipientIsm -> verify (ISM)
    MailboxETH->>HypNative: call handle
    HypNative->>HypNative: sends ETH to recepient
    HypNative->>HypNative: emits ReceivedTransferRemote
```
### HypERC20Collateral => HypERC20
```mermaid
sequenceDiagram
    participant User
    participant MailboxKDA as MailboxKDA
    participant HypERC20KDA as HypERC20Colateral
    participant Relayer
    participant MailboxETH as MailboxEVM
    participant HypERC20ETH as HypERC20

    User->>MailboxKDA: call dispatch
    MailboxKDA->>HypERC20KDA: call transfer-remote
    HypERC20KDA->>HypERC20KDA: burn tokens
    HypERC20KDA->>HypERC20KDA: transfers to IGP (gas amount from quote-gas-payment)
    HypERC20KDA->>HypERC20KDA: emit SENT_TRANSFER_REMOTE

    MailboxKDA->>MailboxKDA: emits DISPATCH, DISPATCH-ID
    Relayer->>MailboxKDA: listen for events
    Relayer->>MailboxETH: call process
    MailboxETH->>MailboxETH: emits Process, ProcessID
    MailboxETH->>MailboxETH: checks recipientIsm -> verify (ISM)
    MailboxETH->>HypERC20ETH: call handle
    HypERC20ETH->>HypERC20ETH: mints to recepient
    HypERC20ETH->>HypERC20ETH: emits ReceivedTransferRemote
```
### HypERC20 => HypERC20Collateral 
```mermaid
sequenceDiagram
    participant User
    participant MailboxKDA as MailboxKDA
    participant HypERC20KDA as HypERC20KDA
    participant Relayer
    participant MailboxETH as MailboxEVM
    participant HypERC20ETH as HypERC20Collateral

    User->>MailboxKDA: call dispatch
    MailboxKDA->>HypERC20KDA: call transfer-remote
    HypERC20KDA->>HypERC20KDA: burns tokens
    HypERC20KDA->>HypERC20KDA: transfers to IGP (gas amount from quote-gas-payment)
    HypERC20KDA->>HypERC20KDA: emit SENT_TRANSFER_REMOTE

    MailboxKDA->>MailboxKDA: emits DISPATCH, DISPATCH-ID
    Relayer->>MailboxKDA: listen for events
    Relayer->>MailboxETH: call process
    MailboxETH->>MailboxETH: emits Process, ProcessID
    MailboxETH->>MailboxETH: checks recipientIsm -> verify (ISM)
    MailboxETH->>HypERC20ETH: call handle
    HypERC20ETH->>HypERC20ETH: transfers token to recepient
    HypERC20ETH->>HypERC20ETH: emits ReceivedTransferRemote
```

### HypERC20Collateral => HypERC20Collateral 
```mermaid
sequenceDiagram
    participant User
    participant MailboxKDA as MailboxKDA
    participant HypERC20KDA as HypERC20Collateral
    participant Relayer
    participant MailboxETH as MailboxEVM
    participant HypERC20ETH as HypERC20Collateral

    User->>MailboxKDA: call dispatch
    MailboxKDA->>HypERC20KDA: call transfer-remote
    HypERC20KDA->>HypERC20KDA: call transfers to router (amount)
    HypERC20KDA->>HypERC20KDA: transfers to IGP (gas amount from quote-gas-payment)
    HypERC20KDA->>HypERC20KDA: emit SENT_TRANSFER_REMOTE

    MailboxKDA->>MailboxKDA: emits DISPATCH, DISPATCH-ID
    Relayer->>MailboxKDA: listen for events
    Relayer->>MailboxETH: call process
    MailboxETH->>MailboxETH: emits Process, ProcessID
    MailboxETH->>MailboxETH: checks recipientIsm -> verify (ISM)
    MailboxETH->>HypERC20ETH: call handle
    HypERC20ETH->>HypERC20ETH: transfers token to recepient
    HypERC20ETH->>HypERC20ETH: emits ReceivedTransferRemote
```

