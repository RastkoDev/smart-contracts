(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf")

(interface token-message
    
    (defschema token-message
        recipient:string
        amount:decimal
        chainId:integer
    )
)
