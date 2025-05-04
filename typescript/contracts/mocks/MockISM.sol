// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import { IInterchainSecurityModule } from "@hyperlane-xyz/core/contracts/interfaces/IInterchainSecurityModule.sol";

/**
 * @title Mock Interchain Security Module
 * @dev A simplified implementation of ISM for testing purposes
 */
contract MockISM is IInterchainSecurityModule {
    // Use a constant module type matching the original implementation
    uint8 private constant MODULE_TYPE = 1;
    
    // Always return true for verification in tests
    function verify(bytes calldata _metadata, bytes calldata _message) external pure returns (bool) {
        // Suppress unused variable warnings
        (_metadata, _message);
        return true;
    }
    
    // Return the module type
    function moduleType() external pure returns (uint8) {
        return MODULE_TYPE;
    }
}