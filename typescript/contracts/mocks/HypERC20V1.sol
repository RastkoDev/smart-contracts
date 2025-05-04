// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {TestHypERC20} from "../test/TestHypERC20.sol";

contract HypERC20V1 is TestHypERC20 {
    constructor(uint8 __decimals, address _mailbox) TestHypERC20(__decimals, _mailbox) {}

    function version() external pure returns (uint8) {
        return 1;
    }
}