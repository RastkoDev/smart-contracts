// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {GasRouter} from "@hyperlane-xyz/core/contracts/client/GasRouter.sol";
import {MailboxClient} from "@hyperlane-xyz/core/contracts/client/MailboxClient.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import {TokenMessage} from "./TokenMessage.sol";
import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";

/**
 * @title Hyperlane Token Router that extends Router with abstract token (ERC20/ERC721) remote transfer functionality.
 * @author Abacus Works
 */
abstract contract TokenRouter is GasRouter {
    using TypeCasts for bytes32;
    using TypeCasts for address;
    using TokenMessage for bytes;

    // ============ KINESIS BRIDGE EXTENSIONS ============
    bytes32 private constant MAX_KADENA_CHAIN_ID_SLOT = keccak256("kinesis.bridge.tokenrouter.maxKadenaChainId");

    /**
     * @dev Emitted on `transferRemote` when a transfer message is dispatched.
     * @param destination The identifier of the destination chain.
     * @param recipientHash The hash of the recipient for filtering.
     * @param recipient The address of the recipient on the destination chain.
     * @param amount The amount of tokens burnt on the origin chain.
     */
    event SentTransferRemote(
        uint32 indexed destination, bytes32 indexed recipientHash, bytes recipient, uint256 amount
    );

    /**
     * @dev Emitted on `_handle` when a transfer message is processed.
     * @param origin The identifier of the origin chain.
     * @param recipient The address of the recipient on the destination chain.
     * @param amount The amount of tokens minted on the destination chain.
     */
    event ReceivedTransferRemote(uint32 indexed origin, bytes32 indexed recipient, uint256 amount);

    /**
     * @dev Emitted when the maximum Kadena chain ID is set.
     * @param currentMaxKadenaChainId The current maximum Kadena chain ID.
     * @param newMaxKadenaChainId The new maximum Kadena chain ID.
     */
    event MaxKadenaChainIdSet(uint16 indexed currentMaxKadenaChainId, uint16 indexed newMaxKadenaChainId);

    constructor(address _mailbox) GasRouter(_mailbox) {}

    /**
     * @notice Transfers `_amountOrId` token to `_recipient` on `_destination` domain.
     * @dev Delegates transfer logic to `_transferFromSender` implementation.
     * @dev Emits `SentTransferRemote` event on the origin chain.
     * @param _destination The identifier of the destination chain.
     * @param _recipient The address of the recipient on the destination chain.
     * @param _amountOrId The amount or identifier of tokens to be sent to the remote recipient.
     * @param _chainID The chain (0-20) of the Kadena network
     * @return messageId The identifier of the dispatched message.
     */
    function transferRemote(uint32 _destination, bytes calldata _recipient, uint256 _amountOrId, uint16 _chainID)
        external
        payable
        virtual
        returns (bytes32 messageId)
    {
        return _transferRemote(_destination, _recipient, _amountOrId, _chainID, msg.value);
    }

    /**
     * @notice Transfers `_amountOrId` token to `_recipient` on `_destination` domain.
     * @dev Delegates transfer logic to `_transferFromSender` implementation.
     * @dev Emits `SentTransferRemote` event on the origin chain.
     * @param _destination The identifier of the destination chain.
     * @param _recipient The address of the recipient on the destination chain.
     * @param _amountOrId The amount or identifier of tokens to be sent to the remote recipient.
     * @param _gasPayment The amount of native token to pay for interchain gas.
     * @return messageId The identifier of the dispatched message.
     */
    function _transferRemote(
        uint32 _destination,
        bytes calldata _recipient,
        uint256 _amountOrId,
        uint16 _chainID,
        uint256 _gasPayment
    ) internal virtual returns (bytes32 messageId) {
        require(_recipient.length > 0, "TokenRouter: recipient cannot be empty");

        require(_chainID <= getMaxKadenaChainId(), "TokenRouter: invalid Kadena chain ID");

        _transferFromSender(_amountOrId);

        messageId = _dispatch(_destination, _gasPayment, TokenMessage.format(_recipient, _amountOrId, _chainID));

        emit SentTransferRemote(_destination, keccak256(abi.encodePacked(_recipient)), _recipient, _amountOrId);
    }

    /**
     * @dev Should transfer `_amountOrId` of tokens from `msg.sender` to this token router.
     * @dev Called by `transferRemote` before message dispatch.
     * @dev Optionally returns `metadata` associated with the transfer to be passed in message.
     */
    function _transferFromSender(uint256 _amountOrId) internal virtual returns (bytes memory metadata);

    /**
     * @notice Returns the balance of `account` on this token router.
     * @param account The address to query the balance of.
     * @return The balance of `account`.
     */
    function balanceOf(address account) external virtual returns (uint256);

    /**
     * @dev Mints tokens to recipient when router receives transfer message.
     * @dev Emits `ReceivedTransferRemote` event on the destination chain.
     * @param _origin The identifier of the origin chain.
     * @param _message The encoded remote transfer message containing the recipient address and amount.
     */
    function _handle(uint32 _origin, bytes32, bytes calldata _message) internal virtual override {
        bytes32 recipient = _message.recipient();
        uint256 amount = _message.amount();
        bytes calldata metadata = _message.metadata();
        _transferTo(recipient.bytes32ToAddress(), amount, metadata);
        emit ReceivedTransferRemote(_origin, recipient, amount);
    }

    /**
     * @dev Should transfer `_amountOrId` of tokens from this token router to `_recipient`.
     * @dev Called by `handle` after message decoding.
     * @dev Optionally handles `metadata` associated with transfer passed in message.
     */
    function _transferTo(address _recipient, uint256 _amountOrId, bytes calldata metadata) internal virtual;

    // ============ KINESIS BRIDGE EXTENSION ============
    // The following functions were added to the original Hyperlane TokenRouter
    // to support Kadena cross-chain functionality

    /**
     * @notice Sets the maximum allowed Kadena chain ID for cross-chain transfers
     * @param _newMaxChainId The new maximum Kadena chain ID value
     */
    function setMaxKadenaChainId(uint16 _newMaxChainId) public onlyOwner {
        uint16 currentMaxChainId = getMaxKadenaChainId();
        require(
            currentMaxChainId != _newMaxChainId, "TokenRouter: new max chain ID is the same as the current max chain ID"
        );

        StorageSlot.getUint256Slot(MAX_KADENA_CHAIN_ID_SLOT).value = _newMaxChainId;
        emit MaxKadenaChainIdSet(currentMaxChainId, _newMaxChainId);
    }

    /**
     * @notice Returns the maximum allowed Kadena chain ID for cross-chain transfers
     * @return The current maximum Kadena chain ID value
     */
    function getMaxKadenaChainId() public view returns (uint16) {
        return uint16(StorageSlot.getUint256Slot(MAX_KADENA_CHAIN_ID_SLOT).value);
    }
}
