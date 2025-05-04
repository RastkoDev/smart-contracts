// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {Mailbox} from "@hyperlane-xyz/core/contracts/Mailbox.sol";

/**
 * @title Mock Mailbox that inherits from the actual Mailbox
 * @dev Simply wraps the original implementation for testing
 */
contract MockMailbox is Mailbox {
    constructor() Mailbox(1) {} // Use domain 1 for testing
}