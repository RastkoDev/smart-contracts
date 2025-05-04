;; IGasOracle

(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf")

(interface gas-oracle-iface

    (defschema remote-gas-data-input
        domain:integer
        token-exchange-rate:decimal
        gas-price:decimal
    )
    
    (defschema remote-gas-data
        token-exchange-rate:decimal
        gas-price:decimal
    )

    (defun set-remote-gas-data-configs:bool 
        (configs:[object{remote-gas-data-input}])
        @doc "Sets the remote gas data for many remotes at a time."
    )

    (defun set-remote-gas-data:bool 
        (config:object{remote-gas-data-input})
        @doc " Sets the remote gas data using the values in `config`"
    )

    (defun get-exchange-rate-and-gas-price:object{remote-gas-data}
        (domain:integer)
        @doc "Returns the stored `remote-gas-data` for the `domain`"
    )
)