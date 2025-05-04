;; IMailbox

(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf")

(interface mailbox-state-iface

   (defschema mailbox-state
      paused:bool
      nonce:integer
      latest-dispatched-id:string
   )

   (defschema dependency
      hook:module{hook-iface}
   )

   (defschema delivery
      block-number:integer
   )
   
   (defschema router-hash
      router-ref:module{router-iface}  
   )
)