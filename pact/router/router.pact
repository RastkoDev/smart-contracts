(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module router GOVERNANCE
    (implements router-iface)

    ;; Imports
    (use router-iface)
    (use hyperlane-message)
    (use token-message)

    ;; Tables
    (deftable contract-state:{col-state})
    (deftable routers:{router-address})

    ;; Capabilities
    (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))
    (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))

    (defcap INTERNAL () true)
   
    (defcap TRANSFER_REMOTE:bool (destination:integer sender:string recipient:string amount:decimal)
        (enforce (!= destination "0") "Invalid destination")
        (enforce (!= sender "") "Sender cannot be empty.")
        (enforce (!= recipient "") "Recipient cannot be empty.")
        (enforce-unit amount)
        (enforce (> amount 0.0) "Transfer must be positive."))

    ;; Events
    (defcap RECEIVED_TRANSFER_REMOTE (origin:integer recipient:string amount:decimal)
        @doc "Emitted on `transferRemote` when a transfer message is dispatched"
        @event true)

    (defun precision:integer () 18)

    (defun get-adjusted-amount:decimal (amount:decimal)
      (* amount (dec (^ 10 (precision)))))
  
    (defun get-adjusted-amount-back:decimal (amount:decimal)
      (* amount (dec (^ 10 (- 18 (precision))))))
  
    (defun get-collateral-asset ()
      (with-read contract-state "default"
        { "token" := token:module{fungible-v2, fungible-xchain-v1} }
        token))
  
    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; Router ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  
    (defun enroll-remote-router:bool (domain:integer address:string)
      (with-capability (ONLY_ADMIN)
        (enforce (!= domain 0) "Domain cannot be zero")
        (write routers (int-to-str 10 domain)
          { "remote-address": address })
        true))
  
    (defun has-remote-router:string (domain:integer)
      (with-default-read routers (int-to-str 10 domain)
        { "remote-address": "empty" }
        { "remote-address" := remote-address }
        (enforce (!= remote-address "empty") "Remote router is not available.")
        remote-address))
  
    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; TokenRouter ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  
    (defun transfer-remote:string (destination:integer sender:string recipient-tm:string amount:decimal)
      (with-capability (TRANSFER_REMOTE destination sender recipient-tm amount)
        (let ((receiver-router:string (has-remote-router destination)))
          (transfer-from sender amount)
          receiver-router)))
  
    (defun handle:bool (origin:integer sender:string chainId:integer reciever:string receiver-guard:guard amount:decimal)
      (require-capability (mailbox.ONLY_MAILBOX_CALL hyp-erc20-collateral origin sender chainId reciever receiver-guard amount))
      (let ((router-address:string (has-remote-router origin)))
        (enforce (= sender router-address) "Sender is not router")
        (with-capability (INTERNAL)
          (if (= (int-to-str 10 chainId) (at "chain-id" (chain-data)))
            (transfer-create-to reciever receiver-guard (get-adjusted-amount-back amount))
            (transfer-create-to-crosschain reciever receiver-guard (get-adjusted-amount-back amount) (int-to-str 10 chainId))))
        (emit-event (RECEIVED_TRANSFER_REMOTE origin reciever (get-adjusted-amount-back amount)))
        true))
)

(if (read-msg "init")
  [
    (create-table NAMESPACE.router.contract-state)
    (create-table NAMESPACE.router.routers)
  ]
  "Upgrade complete")