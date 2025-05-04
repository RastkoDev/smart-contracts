// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {HypNative} from "../HypNative.sol";

contract HypNativeV2 is HypNative {
    constructor(address _mailbox) HypNative(_mailbox) {}

    function version() external pure returns (uint8) {
        return 2;
    }
}
