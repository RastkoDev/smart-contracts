// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract ERC20CollateralDec is ERC20Upgradeable {
    uint8 private _decimals;

    function initialize(uint256 _totalSupply, string memory _name, string memory _symbol, uint8 decimals_)
        external
        initializer
    {
        // Initialize ERC20 metadata
        __ERC20_init(_name, _symbol);
        _mint(msg.sender, _totalSupply);
        _decimals = decimals_;
    }

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
