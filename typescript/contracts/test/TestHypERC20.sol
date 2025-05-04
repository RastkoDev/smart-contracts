// TestHypERC20.sol
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {HypERC20} from "../HypERC20.sol";

/**
 * @title Test version of HypERC20 with additional testing functionality
 * @dev This contract should NEVER be deployed to production
 */
contract TestHypERC20 is HypERC20 {
    constructor(uint8 __decimals, address _mailbox) 
        HypERC20(__decimals, _mailbox) {}

    /**
     * @notice Testing-only function to mint tokens
     * @dev This function should never exist in production code
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }
}