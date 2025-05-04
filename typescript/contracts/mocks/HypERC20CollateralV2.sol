// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {HypERC20Collateral} from "../HypERC20Collateral.sol";

contract HypERC20CollateralV2 is HypERC20Collateral {
    constructor(address erc20, address _mailbox) HypERC20Collateral(erc20, _mailbox) {}

    function version() external pure returns (uint8) {
        return 2;
    }
}
