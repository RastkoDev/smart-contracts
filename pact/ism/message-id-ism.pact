;; AbstractMessageIdMultisigIsm

(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf")

(enforce-guard (keyset-ref-guard "n_9b079bebc8a0d688e4b2f4279a114148d6760edf.bridge-admin"))

(module message-id-ism GOVERNANCE

  (implements ism-iface)

  (use hyperlane-message)
  (use ism-iface)

  ;;Tables
  (deftable contract-state:{ism-state})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "n_9b079bebc8a0d688e4b2f4279a114148d6760edf.upgrade-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "n_9b079bebc8a0d688e4b2f4279a114148d6760edf.bridge-admin"))

  (defun initialize:string (validators:[string] threshold:integer)
    (with-capability (ONLY_ADMIN)
      (if (and 
            (= 
              (length validators) 
              (length (distinct validators))
            )
            (> threshold 0) 
          )
          (insert contract-state "default"
            {
                "validators": validators,
                "threshold": threshold
            }
          )
          "Invalid validators or threshold"
      )
    )
  )

  ;; notice: Hyperlane ISM Types: 
  ;  UNUSED = 0,
  ;  ROUTING = 1,
  ;  AGGREGATION = 2,
  ;  LEGACY_MULTISIG = 3,
  ;  MERKLE_ROOT_MULTISIG = 4,
  ;  MESSAGE_ID_MULTISIG = 5,
  ;  NULL = 6, // used with relayer carrying no metadata
  ;  CCIP_READ = 7

  (defun module-type:integer ()
    5
  )

  (defun validators-and-threshold:object{ism-state} (message:object{hyperlane-message})
    (read contract-state "default")
  )

  (defun get-validators:[string] (message:object{hyperlane-message})
    (with-read contract-state "default"
      {
        "validators" := validators
      }
      validators
    )
  )

  (defun get-threshold:integer (message:object{hyperlane-message})
    (with-read contract-state "default"
      {
        "threshold" := threshold
      }
      threshold
    )
  )
  
)

(if (read-msg "init")
  [
    (create-table n_9b079bebc8a0d688e4b2f4279a114148d6760edf.message-id-ism.contract-state)
  ]
  "Upgrade complete")
