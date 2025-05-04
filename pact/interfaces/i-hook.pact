;; IPostDispatchHook

(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf")

(interface hook-iface

    (use hyperlane-message [hyperlane-message])

    (defun post-dispatch:bool (id:string message:object{hyperlane-message}))
)