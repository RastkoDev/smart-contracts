(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf") 

(enforce-guard (keyset-ref-guard "n_9b079bebc8a0d688e4b2f4279a114148d6760edf.bridge-admin"))

(module kinesis-gas-station GOVERNANCE

  ;; Imports 
  (implements gas-payer-v1)
  (use coin)
  (use guards1)

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "n_9b079bebc8a0d688e4b2f4279a114148d6760edf.upgrade-admin"))

  (defcap GAS_PAYER:bool
    ( user:string
      limit:integer
      price:decimal
    )
    (create-user-guard(coin.gas-only))
    (n_9b079bebc8a0d688e4b2f4279a114148d6760edf.guards1.max-gas-price 0.00000001)
    (n_9b079bebc8a0d688e4b2f4279a114148d6760edf.guards1.max-gas-limit limit)
    (enforce (= "cont" (at "tx-type" (read-msg))) "Can only be used inside an cont tx")
    (compose-capability (ALLOW_GAS))
  )

  (defcap ALLOW_GAS () true)

  (defun create-gas-payer-guard:guard ()
    (create-user-guard (gas-payer-guard))
  )

  (defun gas-payer-guard ()
    (require-capability (GAS))
    (require-capability (ALLOW_GAS))
  )

)