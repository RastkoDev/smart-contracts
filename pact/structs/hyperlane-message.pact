(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf")

(interface hyperlane-message

    (use token-message [token-message])

    (defschema hyperlane-message
        version:integer
        nonce:integer
        originDomain:integer
        sender:string
        destinationDomain:integer
        recipient:string
        messageBody:string
    )    
)