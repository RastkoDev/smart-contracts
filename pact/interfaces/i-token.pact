;; IMessageRecipient // IRouter

(namespace "NAMESPACE")

(interface token-iface
    (defcap TRANSFER_FROM (sender:string amount:decimal)
        @doc "Capability to transfer tokens from a sender"
        @managed)
    
    (defcap TRANSFER_TO (chainId:integer)
        @doc "Capability to transfer tokens to a receiver on a target chain"
        @managed)

    (defun precision:integer ()
        "Returns the precision of the token, e.g. 18 for ETH, 6 for USDC")

    (defun transfer-from (sender:string amount:decimal)
        @doc "Transfers tokens from the sender's account to the bridge")

    (defun transfer-to (receiver:string receiver-guard:guard amount:decimal chainId:integer)
        @doc "Transfers tokens from bridge to a receiver on a target chain"))