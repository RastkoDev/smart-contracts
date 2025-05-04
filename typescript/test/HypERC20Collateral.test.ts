// Import necessary dependencies
import { expect } from "chai";
import hre from "hardhat";
import {
  parseUnits,
  stringToHex,
  walletActions,
  pad,
  zeroHash,
  keccak256,
  toHex,
  concat,
  parseEther,
} from "viem";
import type { PublicClient, WalletClient } from "viem";

describe("HypERC20Collateral", function () {
  let mockMailbox: any;
  let mockIGP: any;
  let mockISM: any;
  let proxyAdmin: any;
  let erc20Collateral: any;
  let hypERC20Collateral: any;
  let deployer: WalletClient;
  let beneficiary: WalletClient;
  let alice: WalletClient;
  let bob: WalletClient;
  let requiredAmount: bigint;
  let amount: bigint;
  let publicClient: PublicClient;

  // Test constants - mock values that would normally come from external sources
  const TOKEN_SYMBOL = "USDC";
  const TOKEN_DECIMALS = 6;
  const DESTINATION_DOMAIN = 626;
  const REMOTE_ROUTER_ADDRESS = "0x1111111111111111111111111111111111111111";
  const REMOTE_ROUTER_BYTES32 = pad(REMOTE_ROUTER_ADDRESS, { size: 32 });
  const KADENA_RECIPIENT = "k:a2b519095a054915b8403a5c0c461d6b5b119043";
  const ENCODED_KADENA_RECIPIENT = stringToHex(KADENA_RECIPIENT);
  const KADENA_CHAIN = 2;
  const MAX_KADENA_CHAIN_ID = 19;

  describe("deployment & upgradeability", function () {
    beforeEach(async function () {
      // Deploy fresh contracts for each test
      const [deployerWallet, beneficiaryWallet, aliceWallet] =
        await hre.viem.getWalletClients();

      // Set up wallet clients
      deployer = deployerWallet.extend(walletActions);
      beneficiary = beneficiaryWallet.extend(walletActions);
      alice = aliceWallet.extend(walletActions);

      // Deploy ERC20Collateral
      erc20Collateral = await (hre.viem.deployContract as any)(
        "ERC20CollateralDec",
        [],
        { walletClient: deployer },
      );
      await erc20Collateral.write.initialize([
        parseUnits("10000000", TOKEN_DECIMALS),
        TOKEN_SYMBOL,
        TOKEN_SYMBOL,
        TOKEN_DECIMALS,
      ]);

      // Deploy mock core contracts
      mockIGP = await (hre.viem.deployContract as any)(
        "MockInterchainGasPaymaster",
        [beneficiary.account!.address],
        { walletClient: deployer },
      );
      mockMailbox = await (hre.viem.deployContract as any)("MockMailbox", [], {
        walletClient: deployer,
      });
      mockISM = await (hre.viem.deployContract as any)("MockISM", [], {
        deployerWallet,
      });
      proxyAdmin = await (hre.viem.deployContract as any)("ProxyAdmin", [], {
        deployerWallet,
      });
    });

    it("Should deploy an upgradeable contract correctly", async function () {
      // Deploy implementation
      const hypERC20CollateralImpl = await (hre.viem.deployContract as any)(
        "HypERC20CollateralV1",
        [erc20Collateral.address, mockMailbox.address],
        { walletClient: deployer },
      );

      // Deploy proxy pointing to implementation
      const hypERC20CollateralProxy = await (hre.viem.deployContract as any)(
        "TransparentUpgradeableProxy",
        [hypERC20CollateralImpl.address, proxyAdmin.address, ""],
        { walletClient: deployer },
      );

      // Get contract instance through proxy
      const hypERC20Collateral = await hre.viem.getContractAt(
        "HypERC20CollateralV1",
        hypERC20CollateralProxy.address,
      );

      // Initialize
      await hypERC20Collateral.write.initialize([
        mockIGP.address,
        mockISM.address,
        deployer.account!.address,
      ]);
      await hypERC20Collateral.write.setMaxKadenaChainId([MAX_KADENA_CHAIN_ID]);

      // Verify version
      expect(await hypERC20Collateral.read.version()).to.equal(1);

      // Verify token details
      expect(
        (await hypERC20Collateral.read.wrappedToken()).toLowerCase(),
      ).to.equal(erc20Collateral.address);
    });

    it("Should correctly upgrade to V2", async function () {
      // Deploy V1 implementation
      const hypERC20CollateralImpl = await (hre.viem.deployContract as any)(
        "HypERC20CollateralV1",
        [erc20Collateral.address, mockMailbox.address],
        { walletClient: deployer },
      );

      // Deploy proxy pointing to V1 implementation
      const hypERC20CollateralProxy = await (hre.viem.deployContract as any)(
        "TransparentUpgradeableProxy",
        [hypERC20CollateralImpl.address, proxyAdmin.address, ""],
        { walletClient: deployer },
      );

      // Get V1 contract instance
      const hypERC20CollateralV1 = await hre.viem.getContractAt(
        "HypERC20CollateralV1",
        hypERC20CollateralProxy.address,
      );

      // Initialize V1
      await hypERC20CollateralV1.write.initialize([
        mockIGP.address,
        mockISM.address,
        deployer.account!.address,
      ]);
      await hypERC20CollateralV1.write.setMaxKadenaChainId([
        MAX_KADENA_CHAIN_ID,
      ]);

      // Transfer some tokens to alice
      const transferAmount = parseUnits("100", TOKEN_DECIMALS); // USCD has 6 decimals

      await erc20Collateral.write.transfer([
        alice.account!.address,
        transferAmount,
      ]);

      // Verify initial balance
      const initialBalance = await hypERC20CollateralV1.read.balanceOf([
        alice.account!.address,
      ]);
      expect(initialBalance).to.equal(transferAmount);

      // Set max Kadena chain ID to a differet value
      const newMaxChainId = 30;
      await hypERC20CollateralV1.write.setMaxKadenaChainId([newMaxChainId], {
        account: deployer.account,
      });

      expect(await hypERC20CollateralV1.read.getMaxKadenaChainId()).to.equal(
        newMaxChainId,
      );

      // Deploy V2 implementation
      const hypERC20CollateralImplV2 = await (hre.viem.deployContract as any)(
        "HypERC20CollateralV2",
        [erc20Collateral.address, mockMailbox.address],
        { walletClient: deployer },
      );

      // Upgrade proxy to V2 implementation
      await proxyAdmin.write.upgrade([
        hypERC20CollateralProxy.address,
        hypERC20CollateralImplV2.address,
      ]);

      // Get V2 contract instance
      const hypERC20CollateralV2 = await hre.viem.getContractAt(
        "HypERC20CollateralV2",
        hypERC20CollateralProxy.address,
      );

      // Verify upgraded version
      expect(await hypERC20CollateralV2.read.version()).to.equal(2);

      // Verify storage preserved
      expect(
        (await hypERC20CollateralV2.read.wrappedToken()).toLowerCase(),
      ).to.equal(erc20Collateral.address);

      // Verify balance is preserved after upgrade
      const upgradedBalance = await hypERC20CollateralV2.read.balanceOf([
        alice.account!.address,
      ]);
      expect(upgradedBalance).to.equal(transferAmount);

      // Test that a function (transfer) works with Alice's balance
      const newTransferAmount = parseUnits("10", TOKEN_DECIMALS); // KDA has 18 decimals
      await erc20Collateral.write.transfer(
        [deployer.account!.address, newTransferAmount],
        { account: alice.account },
      );

      // Verify balance after transfer
      const newBalance = await hypERC20CollateralV2.read.balanceOf([
        alice.account!.address,
      ]);
      expect(newBalance).to.equal(transferAmount - newTransferAmount);

      // Verify max Kadena chain ID is preserved after upgrade
      expect(await hypERC20CollateralV2.read.getMaxKadenaChainId()).to.equal(
        newMaxChainId,
      );
    });
  }); // End of deployment & upgradeability tests

  describe("token minting", function () {
    beforeEach(async function () {
      // Deploy fresh contracts for each test
      const [deployerWallet, beneficiaryWallet, aliceWallet] =
        await hre.viem.getWalletClients();

      // Set up wallet clients
      deployer = deployerWallet.extend(walletActions);
      beneficiary = beneficiaryWallet.extend(walletActions);
      alice = aliceWallet.extend(walletActions);

      // Deploy ERC20Collateral
      erc20Collateral = await (hre.viem.deployContract as any)(
        "ERC20CollateralDec",
        [],
        { walletClient: deployer },
      );
      await erc20Collateral.write.initialize([
        parseUnits("10000000", TOKEN_DECIMALS),
        TOKEN_SYMBOL,
        TOKEN_SYMBOL,
        TOKEN_DECIMALS,
      ]);

      // Deploy mock core contracts
      mockIGP = await (hre.viem.deployContract as any)(
        "MockInterchainGasPaymaster",
        [beneficiary.account!.address],
        { walletClient: deployer },
      );
      mockISM = await (hre.viem.deployContract as any)("MockISM", [], {
        deployerWallet,
      });
      proxyAdmin = await (hre.viem.deployContract as any)("ProxyAdmin", [], {
        deployerWallet,
      });

      // Deploy the mock mailbox
      mockMailbox = await (hre.viem.deployContract as any)("MockMailbox", [], {
        walletClient: deployer,
      });

      // Deploy real token implementation, not a mock. Here we are not testing upgradeability
      const hypERC20CollateralImpl = await (hre.viem.deployContract as any)(
        "HypERC20Collateral",
        [erc20Collateral.address, mockMailbox.address],
        { walletClient: deployer },
      );

      // Deploy proxy pointing to V1 implementation
      const hypERC20CollateralProxy = await (hre.viem.deployContract as any)(
        "TransparentUpgradeableProxy",
        [hypERC20CollateralImpl.address, proxyAdmin.address, ""],
        { walletClient: deployer },
      );

      // Get token contract instance
      hypERC20Collateral = await hre.viem.getContractAt(
        "HypERC20Collateral",
        hypERC20CollateralProxy.address,
      );

      // Initialize V1
      await hypERC20Collateral.write.initialize([
        mockIGP.address,
        mockISM.address,
        deployer.account!.address,
      ]);
      await hypERC20Collateral.write.setMaxKadenaChainId([MAX_KADENA_CHAIN_ID]);
    });
    it("does not have external minting function", async function () {
      await expect(hypERC20Collateral.write.mint()).to.be.rejectedWith(
        `Function "mint" not found on ABI`,
      );
    });
  }); // End of token minting tests

  describe("transferRemote", function () {
    beforeEach(async function () {
      // Deploy fresh contracts for each test
      const [deployerWallet, beneficiaryWallet, aliceWallet, bobWallet] =
        await hre.viem.getWalletClients();

      // Set up wallet clients
      deployer = deployerWallet.extend(walletActions);
      beneficiary = beneficiaryWallet.extend(walletActions);
      alice = aliceWallet.extend(walletActions);
      bob = bobWallet.extend(walletActions);

      // Deploy ERC20Collateral
      erc20Collateral = await (hre.viem.deployContract as any)(
        "ERC20CollateralDec",
        [],
        { walletClient: deployer },
      );
      await erc20Collateral.write.initialize([
        parseUnits("10000000", TOKEN_DECIMALS),
        TOKEN_SYMBOL,
        TOKEN_SYMBOL,
        TOKEN_DECIMALS,
      ]);

      // Deploy mock core contracts
      mockIGP = await (hre.viem.deployContract as any)(
        "MockInterchainGasPaymaster",
        [beneficiary.account!.address],
        { walletClient: deployer },
      );
      mockISM = await (hre.viem.deployContract as any)("MockISM", [], {
        deployerWallet,
      });
      proxyAdmin = await (hre.viem.deployContract as any)("ProxyAdmin", [], {
        deployerWallet,
      });

      // Deploy the mock mailbox
      mockMailbox = await (hre.viem.deployContract as any)("MockMailbox", [], {
        walletClient: deployer,
      });

      // Initialize the mock mailbox with the required hooks
      await mockMailbox.write.initialize([
        deployer.account!.address, // owner
        mockISM.address, // defaultIsm
        mockIGP.address, // defaultHook
        mockIGP.address, // requiredHook (same as defaultHook)
      ]);

      publicClient = await hre.viem.getPublicClient();

      // Deploy the test token, which allows minting
      const hypERC20CollateralImpl = await (hre.viem.deployContract as any)(
        "HypERC20Collateral",
        [erc20Collateral.address, mockMailbox.address],
        { walletClient: deployer },
      );

      // Deploy proxy pointing to V1 implementation
      const hypERC20CollateralProxy = await (hre.viem.deployContract as any)(
        "TransparentUpgradeableProxy",
        [hypERC20CollateralImpl.address, proxyAdmin.address, ""],
        { walletClient: deployer },
      );

      // Get token contract instance
      hypERC20Collateral = await hre.viem.getContractAt(
        "HypERC20Collateral",
        hypERC20CollateralProxy.address,
      );

      // Initialize V1
      await hypERC20Collateral.write.initialize([
        mockIGP.address,
        mockISM.address,
        deployer.account!.address,
      ]);
      await hypERC20Collateral.write.setMaxKadenaChainId([MAX_KADENA_CHAIN_ID]);

      // Configure the MockInterchainGasPaymaster with proper gas pricing. This is only for testing
      await mockIGP.write.setDefaultGasPrice([1n]); // Minimal value
      await mockIGP.write.setGasPrice([DESTINATION_DOMAIN, 1n]); // Minimal value

      // Enroll remote router
      await hypERC20Collateral.write.enrollRemoteRouter([
        DESTINATION_DOMAIN,
        REMOTE_ROUTER_BYTES32,
      ]);

      // Set up the default gas configurations with minimal value for testing
      const gasOverhead = BigInt(1000);

      // Configure the gas oracle with default exchange rate and gas price
      const tokenExchangeRate = BigInt(3348);
      const gasPrice = BigInt(10000000000);

      // Set up mock IGP with default configurations
      // This would happen outside of the tests in a real environment
      await mockIGP.write.setDestinationGasConfigs([
        [
          {
            remoteDomain: DESTINATION_DOMAIN,
            config: {
              gasOracle: mockIGP.address, // Self-referential for the mock
              gasOverhead: gasOverhead,
            },
          },
        ],
      ]);

      // Amount for testing
      amount = parseUnits("100", TOKEN_DECIMALS);

      // Transfer tokens for testing
      await erc20Collateral.write.transfer([alice.account!.address, amount]);
    });

    context("Success Test Cases", function () {
      it("Should update state and emit correct events without custom gas config", async function () {
        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // Check initial balances
        const balanceBeforeEth = await publicClient.getBalance({
          address: alice.account!.address,
        });
        const balanceBefore = await hypERC20Collateral.read.balanceOf([
          alice.account!.address,
        ]);
        const balanceBeforeContract = await hypERC20Collateral.read.balanceOf([
          hypERC20Collateral.address,
        ]);

        // Get required amount from the contract
        requiredAmount = await hypERC20Collateral.read.quoteGasPayment([
          DESTINATION_DOMAIN,
        ]);

        // Configure gas price for deterministic gas costs
        const gasPrice = parseUnits("20", 9);

        // Transfer remote with a safe payment amount
        const tx = await hypERC20Collateral.write.transferRemote(
          [DESTINATION_DOMAIN, ENCODED_KADENA_RECIPIENT, amount, KADENA_CHAIN],
          { value: requiredAmount, gasPrice: gasPrice, account: alice.account },
        );

        // Get transaction receipt
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Calculate gas costs
        const gasUsed = txReceipt.gasUsed;
        const gasCost = gasUsed * gasPrice;

        // Verify balances after transfer
        const balanceAfterEth = await publicClient.getBalance({
          address: alice.account!.address,
        });
        const balanceAfter = await hypERC20Collateral.read.balanceOf([
          alice.account!.address,
        ]);
        const balanceAfterContract = await hypERC20Collateral.read.balanceOf([
          hypERC20Collateral.address,
        ]);

        // Check ETH spent (gas + required amount)
        expect(balanceBeforeEth - balanceAfterEth).to.equal(
          gasCost + requiredAmount,
        );

        // Check tokens transfered
        expect(balanceBefore - balanceAfter).to.equal(amount);
        expect(balanceAfterContract - balanceBeforeContract).to.equal(amount);

        // Check events
        const transferEvents = await erc20Collateral.getEvents.Transfer({
          fromBlock: txReceipt.blockNumber,
          toBlock: txReceipt.blockNumber,
        });
        expect(transferEvents).to.have.lengthOf(1); // transfer (we are only unit testing the EVM side)
        expect(transferEvents[0].args.from.toLowerCase()).to.equal(
          alice.account!.address.toLowerCase(),
        );
        expect(transferEvents[0].args.to.toLowerCase()).to.equal(
          hypERC20Collateral.address.toLowerCase(),
        );
        expect(transferEvents[0].args.value).to.equal(amount);

        // Add check for SentTransferRemote event
        const sentEvents =
          await hypERC20Collateral.getEvents.SentTransferRemote({
            fromBlock: txReceipt.blockNumber,
            toBlock: txReceipt.blockNumber,
          });
        expect(sentEvents).to.have.lengthOf(1);
        expect(sentEvents[0].args.destination).to.equal(DESTINATION_DOMAIN);
        expect(sentEvents[0].args.recipientHash).to.equal(
          keccak256(ENCODED_KADENA_RECIPIENT),
        );
        expect(sentEvents[0].args.recipient).to.equal(ENCODED_KADENA_RECIPIENT);
        expect(sentEvents[0].args.amount).to.equal(amount);
      });

      it("Should update state and emit correct events with custom gas config", async function () {
        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // Check initial balances
        const balanceBeforeEth = await publicClient.getBalance({
          address: alice.account!.address,
        });
        const balanceBefore = await hypERC20Collateral.read.balanceOf([
          alice.account!.address,
        ]);
        const balanceBeforeContract = await hypERC20Collateral.read.balanceOf([
          hypERC20Collateral.address,
        ]);

        // Configure gas price for deterministic gas costs
        const gasPrice = parseUnits("20", 9);

        // Set custom gas limit for destination chain
        const gasLimit = 300000n;
        await hypERC20Collateral.write.setDestinationGas([
          [
            {
              domain: DESTINATION_DOMAIN,
              gas: gasLimit,
            },
          ],
        ]);

        // Get required amount from the contract
        requiredAmount = await hypERC20Collateral.read.quoteGasPayment([
          DESTINATION_DOMAIN,
        ]);

        // Transfer remote
        const tx = await hypERC20Collateral.write.transferRemote(
          [DESTINATION_DOMAIN, ENCODED_KADENA_RECIPIENT, amount, KADENA_CHAIN],
          { value: requiredAmount, gasPrice: gasPrice, account: alice.account },
        );

        // Get transaction receipt
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Calculate gas costs
        const gasUsed = txReceipt.gasUsed;
        const gasCost = gasUsed * gasPrice;

        // Verify balances after transfer
        const balanceAfterEth = await publicClient.getBalance({
          address: alice.account!.address,
        });
        const balanceAfter = await hypERC20Collateral.read.balanceOf([
          alice.account!.address,
        ]);
        const balanceAfterContract = await hypERC20Collateral.read.balanceOf([
          hypERC20Collateral.address,
        ]);

        // Check ETH spent (gas + required amount)
        expect(balanceBeforeEth - balanceAfterEth).to.equal(
          gasCost + requiredAmount,
        );

        // Check tokens transfered
        expect(balanceBefore - balanceAfter).to.equal(amount);
        expect(balanceAfterContract - balanceBeforeContract).to.equal(amount);

        // Check events
        const transferEvents = await erc20Collateral.getEvents.Transfer({
          fromBlock: txReceipt.blockNumber,
          toBlock: txReceipt.blockNumber,
        });
        expect(transferEvents).to.have.lengthOf(1); // transfer (we are only unit testing the EVM side)
        expect(transferEvents[0].args.from.toLowerCase()).to.equal(
          alice.account!.address.toLowerCase(),
        );
        expect(transferEvents[0].args.to.toLowerCase()).to.equal(
          hypERC20Collateral.address.toLowerCase(),
        );
        expect(transferEvents[0].args.value).to.equal(amount);

        // Add check for SentTransferRemote event
        const sentEvents =
          await hypERC20Collateral.getEvents.SentTransferRemote({
            fromBlock: txReceipt.blockNumber,
            toBlock: txReceipt.blockNumber,
          });
        expect(sentEvents).to.have.lengthOf(1);
        expect(sentEvents[0].args.destination).to.equal(DESTINATION_DOMAIN);
        expect(sentEvents[0].args.recipientHash).to.equal(
          keccak256(ENCODED_KADENA_RECIPIENT),
        );
        expect(sentEvents[0].args.recipient).to.equal(ENCODED_KADENA_RECIPIENT);
        expect(sentEvents[0].args.amount).to.equal(amount);
      });

      it("Should handle transfers with different Kadena chain IDs correctly", async function () {
        // Check initial balances
        const balanceBefore = await hypERC20Collateral.read.balanceOf([
          alice.account!.address,
        ]);
        const balanceBeforeContract = await hypERC20Collateral.read.balanceOf([
          hypERC20Collateral.address,
        ]);
        const alternativeChainID = 5; // Different Kadena chain ID

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // Transfer remote
        const tx = await hypERC20Collateral.write.transferRemote(
          [
            DESTINATION_DOMAIN,
            ENCODED_KADENA_RECIPIENT,
            amount,
            alternativeChainID,
          ],
          { value: requiredAmount, account: alice.account },
        );

        // Get transaction receipt
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Check tokens transfered
        const balanceAfter = await hypERC20Collateral.read.balanceOf([
          alice.account!.address,
        ]);
        const balanceAfterContract = await hypERC20Collateral.read.balanceOf([
          hypERC20Collateral.address,
        ]);
        expect(balanceBefore - balanceAfter).to.equal(amount);
        expect(balanceAfterContract - balanceBeforeContract).to.equal(amount);

        // Check SentTransferRemote event
        const sentEvents =
          await hypERC20Collateral.getEvents.SentTransferRemote({
            fromBlock: txReceipt.blockNumber,
            toBlock: txReceipt.blockNumber,
          });
        expect(sentEvents).to.have.lengthOf(1);
        expect(sentEvents[0].args.destination).to.equal(DESTINATION_DOMAIN);
        expect(sentEvents[0].args.recipientHash).to.equal(
          keccak256(ENCODED_KADENA_RECIPIENT),
        );
        expect(sentEvents[0].args.recipient).to.equal(ENCODED_KADENA_RECIPIENT);
        expect(sentEvents[0].args.amount).to.equal(amount);
      });

      it("Should handle different Kadena address formats correctly", async function () {
        // Different Kadena address format
        const alternativeKadenaAddress =
          "w:urh43QUY_A0k-AakxUl8eUpRjfreRC1KrDLD9YdmwA0:keys-any";
        const encodedAltKadenaAddress = stringToHex(alternativeKadenaAddress);

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // Transfer remote
        const tx = await hypERC20Collateral.write.transferRemote(
          [DESTINATION_DOMAIN, encodedAltKadenaAddress, amount, KADENA_CHAIN],
          { value: requiredAmount, account: alice.account },
        );

        // Get transaction receipt
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Check SentTransferRemote event recipient
        const sentEvents =
          await hypERC20Collateral.getEvents.SentTransferRemote({
            fromBlock: txReceipt.blockNumber,
            toBlock: txReceipt.blockNumber,
          });
        expect(sentEvents).to.have.lengthOf(1);
        expect(sentEvents[0].args.recipient).to.equal(encodedAltKadenaAddress);
      });

      it("Should handle transfers with different token amounts correctly", async function () {
        // Different token amounts
        const smallAmount = parseUnits("0.000001", TOKEN_DECIMALS); // Tiny amount
        const largeAmount = parseUnits("1000000", TOKEN_DECIMALS); // Large amount

        // Mint more tokens to ensure alice has enough
        await erc20Collateral.write.transfer([
          alice.account!.address,
          largeAmount,
        ]);

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, smallAmount],
          { account: alice.account },
        );

        // Test small amount transfer
        const txSmall = await hypERC20Collateral.write.transferRemote(
          [
            DESTINATION_DOMAIN,
            ENCODED_KADENA_RECIPIENT,
            smallAmount,
            KADENA_CHAIN,
          ],
          { value: requiredAmount, account: alice.account },
        );

        const receiptSmall = await publicClient.waitForTransactionReceipt({
          hash: txSmall,
        });

        // Check SentTransferRemote event for small amount
        const sentEventsSmall =
          await hypERC20Collateral.getEvents.SentTransferRemote({
            fromBlock: receiptSmall.blockNumber,
            toBlock: receiptSmall.blockNumber,
          });
        expect(sentEventsSmall[0].args.amount).to.equal(smallAmount);

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, largeAmount],
          { account: alice.account },
        );

        // Test large amount transfer
        const txLarge = await hypERC20Collateral.write.transferRemote(
          [
            DESTINATION_DOMAIN,
            ENCODED_KADENA_RECIPIENT,
            largeAmount,
            KADENA_CHAIN,
          ],
          { value: requiredAmount, account: alice.account },
        );

        const receiptLarge = await publicClient.waitForTransactionReceipt({
          hash: txLarge,
        });

        // Check SentTransferRemote event for large amount
        const sentEventsLarge =
          await hypERC20Collateral.getEvents.SentTransferRemote({
            fromBlock: receiptLarge.blockNumber,
            toBlock: receiptLarge.blockNumber,
          });
        expect(sentEventsLarge[0].args.amount).to.equal(largeAmount);
      });

      it("Should return a valid messageId when transferring tokens", async function () {
        // Get required amount from the contract
        requiredAmount = await hypERC20Collateral.read.quoteGasPayment([
          DESTINATION_DOMAIN,
        ]);

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // First simulate the call to get the return value. This is the only way to check the return vallue
        const { result: messageId } = await publicClient.simulateContract({
          address: hypERC20Collateral.address,
          abi: hypERC20Collateral.abi,
          functionName: "transferRemote",
          args: [
            DESTINATION_DOMAIN,
            ENCODED_KADENA_RECIPIENT,
            amount,
            KADENA_CHAIN,
          ],
          account: alice.account!.address,
          value: requiredAmount,
        });

        // Verify the messageId is a valid bytes32 value (not zero)
        expect(messageId).to.not.equal(zeroHash);
      });
    }); // End of Success Test Cases

    context("Error Test Cases", function () {
      it("Should revert when attempting to transfer more tokens than balance", async function () {
        // Get alice's current balance
        const aliceBalance = await hypERC20Collateral.read.balanceOf([
          alice.account!.address,
        ]);

        // Attempt to transfer more than the balance
        const excessiveAmount = aliceBalance + parseUnits("1", TOKEN_DECIMALS);

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, excessiveAmount],
          { account: alice.account },
        );

        // Expect the transaction to revert
        await expect(
          hypERC20Collateral.write.transferRemote(
            [
              DESTINATION_DOMAIN,
              ENCODED_KADENA_RECIPIENT,
              excessiveAmount,
              KADENA_CHAIN,
            ],
            { value: requiredAmount, account: alice.account },
          ),
        ).to.be.rejectedWith("ERC20: transfer amount exceeds balance");
      });

      it("Should revert when insufficient gas payment is provided", async function () {
        // Get required amount from the contract
        requiredAmount = await hypERC20Collateral.read.quoteGasPayment([
          DESTINATION_DOMAIN,
        ]);

        // Provide less than the required gas payment
        const insufficientGas = requiredAmount - parseEther("0.00001");

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // Expect the transaction to revert
        await expect(
          hypERC20Collateral.write.transferRemote(
            [
              DESTINATION_DOMAIN,
              ENCODED_KADENA_RECIPIENT,
              amount,
              KADENA_CHAIN,
            ],
            { value: insufficientGas, account: alice.account },
          ),
        ).to.be.rejectedWith("IGP: insufficient interchain gas payment");
      });

      it("Should revert when recipient address is empty", async function () {
        // Try with empty recipient bytes
        const emptyRecipient = stringToHex("");

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // Expect the transaction to revert
        await expect(
          hypERC20Collateral.write.transferRemote(
            [DESTINATION_DOMAIN, emptyRecipient, amount, KADENA_CHAIN],
            { value: requiredAmount, account: alice.account },
          ),
        ).to.be.rejectedWith("TokenRouter: recipient cannot be empty");
      });

      it("Should revert when transfer amount is zero", async function () {
        // Try with zero amount
        const zeroAmount = 0n;

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // Expect the transaction to revert
        await expect(
          hypERC20Collateral.write.transferRemote(
            [
              DESTINATION_DOMAIN,
              ENCODED_KADENA_RECIPIENT,
              zeroAmount,
              KADENA_CHAIN,
            ],
            { value: requiredAmount, account: alice.account },
          ),
        ).to.be.rejectedWith(
          "HypERC20Collateral: amount must be greater than 0",
        );
      });

      it("Should revert when destination domain has no enrolled router", async function () {
        // Use a domain that hasn't been enrolled
        const unenrolledDomain = 999;

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // Expect the transaction to revert
        await expect(
          hypERC20Collateral.write.transferRemote(
            [unenrolledDomain, ENCODED_KADENA_RECIPIENT, amount, KADENA_CHAIN],
            { value: requiredAmount, account: alice.account },
          ),
        ).to.be.rejectedWith("No router enrolled for domain: 999");
      });

      it("Should revert when called by account with no tokens", async function () {
        // Use an account with no tokens
        const noTokenAccount = bob;

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: noTokenAccount.account },
        );

        // Expect the transaction to revert
        await expect(
          hypERC20Collateral.write.transferRemote(
            [
              DESTINATION_DOMAIN,
              ENCODED_KADENA_RECIPIENT,
              amount,
              KADENA_CHAIN,
            ],
            { value: requiredAmount, account: noTokenAccount.account },
          ),
        ).to.be.rejectedWith("ERC20: transfer amount exceeds balance");
      });

      it("Should revert when Kadena chain ID is out of valid range", async function () {
        // Use an invalid Kadena chain ID (assuming valid range is 0-20)
        const invalidChainID = 21;

        // Approve the transfer
        await erc20Collateral.write.approve(
          [hypERC20Collateral.address, amount],
          { account: alice.account },
        );

        // Expect the transaction to revert
        await expect(
          hypERC20Collateral.write.transferRemote(
            [
              DESTINATION_DOMAIN,
              ENCODED_KADENA_RECIPIENT,
              amount,
              invalidChainID,
            ],
            { value: requiredAmount, account: alice.account },
          ),
        ).to.be.rejectedWith("TokenRouter: invalid Kadena chain ID");
      });
    }); // End of Error Test Cases
  }); // End of transferRemote tests

  describe("handle", function () {
    let recipientBytes32: `0x${string}`;
    let mailboxSigner: WalletClient;
    let chainIdBytes: `0x${string}`;
    let balanceBefore: bigint;

    beforeEach(async function () {
      // Deploy fresh contracts for each test
      const [deployerWallet, beneficiaryWallet, aliceWallet, bobWallet] =
        await hre.viem.getWalletClients();

      // Set up wallet clients
      deployer = deployerWallet.extend(walletActions);
      beneficiary = beneficiaryWallet.extend(walletActions);
      alice = aliceWallet.extend(walletActions);
      bob = bobWallet.extend(walletActions);

      // Deploy ERC20Collateral
      erc20Collateral = await (hre.viem.deployContract as any)(
        "ERC20CollateralDec",
        [],
        { walletClient: deployer },
      );
      await erc20Collateral.write.initialize([
        parseUnits("10000000", TOKEN_DECIMALS),
        TOKEN_SYMBOL,
        TOKEN_SYMBOL,
        TOKEN_DECIMALS,
      ]);

      // Deploy mock core contracts
      mockIGP = await (hre.viem.deployContract as any)(
        "MockInterchainGasPaymaster",
        [beneficiary.account!.address],
        { walletClient: deployer },
      );
      mockISM = await (hre.viem.deployContract as any)("MockISM", [], {
        walletClient: deployer,
      });
      proxyAdmin = await (hre.viem.deployContract as any)("ProxyAdmin", [], {
        walletClient: deployer,
      });

      // Deploy the mock mailbox
      mockMailbox = await (hre.viem.deployContract as any)("MockMailbox", [], {
        walletClient: deployer,
      });

      // Initialize the mock mailbox with the required hooks
      await mockMailbox.write.initialize([
        deployer.account!.address, // owner
        mockISM.address, // defaultIsm
        mockIGP.address, // defaultHook
        mockIGP.address, // requiredHook (same as defaultHook)
      ]);

      publicClient = await hre.viem.getPublicClient();

      // Deploy the test token
      const hypERC20CollateralImpl = await (hre.viem.deployContract as any)(
        "HypERC20Collateral",
        [erc20Collateral.address, mockMailbox.address],
        { walletClient: deployer },
      );

      // Deploy proxy pointing to implementation
      const hypERC20CollateralProxy = await (hre.viem.deployContract as any)(
        "TransparentUpgradeableProxy",
        [hypERC20CollateralImpl.address, proxyAdmin.address, ""],
        { walletClient: deployer },
      );

      // Get token contract instance
      hypERC20Collateral = await hre.viem.getContractAt(
        "HypERC20Collateral",
        hypERC20CollateralProxy.address,
      );

      // Initialize with initial maxKadenaChainId value
      await hypERC20Collateral.write.initialize([
        mockIGP.address,
        mockISM.address,
        deployer.account!.address,
      ]);
      await hypERC20Collateral.write.setMaxKadenaChainId([MAX_KADENA_CHAIN_ID]);

      // Enroll remote router for testing handle
      await hypERC20Collateral.write.enrollRemoteRouter([
        DESTINATION_DOMAIN,
        REMOTE_ROUTER_BYTES32,
      ]);

      amount = parseUnits("100", TOKEN_DECIMALS);
      chainIdBytes = toHex(KADENA_CHAIN, { size: 2 });

      // Set up recipient
      // Pad the recipient address to 32 bytes
      recipientBytes32 = pad(bob.account!.address as `0x${string}`, {
        size: 32,
      });

      // Get balance before processing
      balanceBefore = await hypERC20Collateral.read.balanceOf([
        bob.account!.address,
      ]);

      // Set balance for mailbox contract directly so that it can pay for gas
      await hre.network.provider.request({
        method: "hardhat_setBalance",
        params: [mockMailbox.address, "0x56BC75E2D63100000"], // 100 ETH in hex
      });

      // Get balance of mailbox after setting
      const mailboxBalance = await publicClient.getBalance({
        address: mockMailbox.address as `0x${string}`,
      });

      // Impersonate the mailbox
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [mockMailbox.address],
      });

      mailboxSigner = await hre.viem.getWalletClient(
        mockMailbox.address as `0x${string}`,
      );

      // Transfer tokens to hypERC20Collateral
      const transferAmount = parseUnits("1000000", TOKEN_DECIMALS); // USCD has 6 decimals

      await erc20Collateral.write.transfer([
        hypERC20Collateral.address,
        transferAmount,
      ]);
    });

    afterEach(async function () {
      // Stop impersonating the mailbox
      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [mockMailbox.address],
      });
    });

    context("Success Test Cases", function () {
      it("Should transfer tokens to recipient and emit ReceivedTransferRemote event", async function () {
        // Manually construct the message
        // viem's encodeAbiParameters doesn't work as expected
        const amountBytes32 = toHex(amount, { size: 32 });

        const formattedMessage = concat([
          amountBytes32, // 32 bytes for amount
          chainIdBytes, // 2 bytes for chain ID
          recipientBytes32, // 32 bytes for recipient
        ]);

        // Call handle using the impersonated mailbox
        const tx = await hypERC20Collateral.write.handle(
          [DESTINATION_DOMAIN, REMOTE_ROUTER_BYTES32, formattedMessage],
          { account: mailboxSigner.account },
        );

        // Get transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Verify tokens were transfered
        const balanceAfter = await hypERC20Collateral.read.balanceOf([
          bob.account!.address,
        ]);
        expect(balanceAfter - balanceBefore).to.equal(amount);

        // Verify event was emitted
        const events =
          await hypERC20Collateral.getEvents.ReceivedTransferRemote({
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
          });
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.origin).to.equal(DESTINATION_DOMAIN);
        expect(events[0].args.recipient).to.equal(recipientBytes32);
        expect(events[0].args.amount).to.equal(amount);
      });

      it("Should handle messages with small token amounts efficiently", async function () {
        const smallAmount = parseUnits("0.000001", TOKEN_DECIMALS); // Very small amount

        // Manually construct the message
        // viem's encodeAbiParameters doesn't work as expected
        const amountBytes32 = toHex(smallAmount, { size: 32 });

        const formattedMessage = concat([
          amountBytes32, // 32 bytes for amount
          chainIdBytes, // 2 bytes for chain ID
          recipientBytes32, // 32 bytes for recipient
        ]);

        // Process the message and track gas
        const tx = await hypERC20Collateral.write.handle(
          [DESTINATION_DOMAIN, REMOTE_ROUTER_BYTES32, formattedMessage],
          { account: mailboxSigner.account! },
        );

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Verify the recipient received tokens
        const balance = await hypERC20Collateral.read.balanceOf([
          bob.account!.address,
        ]);
        expect(balance).to.equal(balanceBefore + smallAmount);

        // Verify event was emitted
        const events =
          await hypERC20Collateral.getEvents.ReceivedTransferRemote({
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
          });
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.origin).to.equal(DESTINATION_DOMAIN);
        expect(events[0].args.recipient).to.equal(recipientBytes32);
        expect(events[0].args.amount).to.equal(smallAmount);
      });

      it("Should handle messages with large token amounts efficiently", async function () {
        const largeAmount = parseUnits("1000000", TOKEN_DECIMALS); // Very large amount

        // Manually construct the message
        // viem's encodeAbiParameters doesn't work as expected
        const amountBytes32 = toHex(largeAmount, { size: 32 });

        const formattedMessage = concat([
          amountBytes32, // 32 bytes for amount
          chainIdBytes, // 2 bytes for chain ID
          recipientBytes32, // 32 bytes for recipient
        ]);

        // Process the message and track gas
        const tx = await hypERC20Collateral.write.handle(
          [DESTINATION_DOMAIN, REMOTE_ROUTER_BYTES32, formattedMessage],
          { account: mailboxSigner.account! },
        );

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Verify the recipient received tokens
        const balance = await hypERC20Collateral.read.balanceOf([
          bob.account!.address,
        ]);
        expect(balance).to.equal(balanceBefore + largeAmount);

        // Verify event was emitted
        const events =
          await hypERC20Collateral.getEvents.ReceivedTransferRemote({
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
          });
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.origin).to.equal(DESTINATION_DOMAIN);
        expect(events[0].args.recipient).to.equal(recipientBytes32);
        expect(events[0].args.amount).to.equal(largeAmount);
      });

      it("Should handle multiple messages to the same recipient efficiently", async function () {
        // Manually construct the message
        // viem's encodeAbiParameters doesn't work as expected
        const amountBytes32 = toHex(amount, { size: 32 });

        const formattedMessage = concat([
          amountBytes32, // 32 bytes for amount
          chainIdBytes, // 2 bytes for chain ID
          recipientBytes32, // 32 bytes for recipient
        ]);

        // Process first message
        await hypERC20Collateral.write.handle(
          [DESTINATION_DOMAIN, REMOTE_ROUTER_BYTES32, formattedMessage],
          { account: mailboxSigner.account! },
        );

        // Process second message and track gas
        const tx = await hypERC20Collateral.write.handle(
          [DESTINATION_DOMAIN, REMOTE_ROUTER_BYTES32, formattedMessage],
          { account: mailboxSigner.account! },
        );

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Verify total tokens received
        const balance = await hypERC20Collateral.read.balanceOf([
          bob.account!.address,
        ]);
        expect(balance).to.equal(balanceBefore + amount * 2n);

        // Verify event was emitted
        const events =
          await hypERC20Collateral.getEvents.ReceivedTransferRemote({
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
          });
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.origin).to.equal(DESTINATION_DOMAIN);
        expect(events[0].args.recipient).to.equal(recipientBytes32);
        expect(events[0].args.amount).to.equal(amount);
      });

      it("Should handle messages with different recipients efficiently", async function () {
        const transferAmount1 = parseUnits("500", TOKEN_DECIMALS);
        const amount1Bytes32 = toHex(transferAmount1, { size: 32 });

        // Create message body 1
        const formattedMessage1 = concat([
          amount1Bytes32, // 32 bytes for amount
          chainIdBytes, // 2 bytes for chain ID
          recipientBytes32, // 32 bytes for recipient
        ]);

        const transferAmount2 = parseUnits("10000", TOKEN_DECIMALS);
        const amount2Bytes32 = toHex(transferAmount2, { size: 32 });

        // Second recipient (alice)
        const recipient2Bytes32 = pad(alice.account!.address as `0x${string}`, {
          size: 32,
        });

        // Create message body 2
        const formattedMessage2 = concat([
          amount2Bytes32, // 32 bytes for amount
          chainIdBytes, // 2 bytes for chain ID
          recipient2Bytes32, // 32 bytes for recipient
        ]);

        // Get Alice's balance before processing
        const balanceBeforeAlice = await hypERC20Collateral.read.balanceOf([
          alice.account!.address,
        ]);

        // Process first message
        const tx1 = await hypERC20Collateral.write.handle(
          [DESTINATION_DOMAIN, REMOTE_ROUTER_BYTES32, formattedMessage1],
          { account: mailboxSigner.account! },
        );

        const receipt1 = await publicClient.waitForTransactionReceipt({
          hash: tx1,
        });

        // Verify event was emitted
        const events1 =
          await hypERC20Collateral.getEvents.ReceivedTransferRemote({
            fromBlock: receipt1.blockNumber,
            toBlock: receipt1.blockNumber,
          });

        expect(events1).to.have.lengthOf(1);
        expect(events1[0].args.origin).to.equal(DESTINATION_DOMAIN);
        expect(events1[0].args.recipient).to.equal(recipientBytes32);
        expect(events1[0].args.amount).to.equal(transferAmount1);

        // Process second message and track gas
        const tx2 = await hypERC20Collateral.write.handle(
          [DESTINATION_DOMAIN, REMOTE_ROUTER_BYTES32, formattedMessage2],
          { account: mailboxSigner.account! },
        );

        const receipt2 = await publicClient.waitForTransactionReceipt({
          hash: tx2,
        });

        // Verify both recipients received tokens
        const balanceAfterBob = await hypERC20Collateral.read.balanceOf([
          bob.account!.address,
        ]);
        expect(balanceAfterBob).to.equal(balanceBefore + transferAmount1);
        const balanceAfterAlice = await hypERC20Collateral.read.balanceOf([
          alice.account!.address,
        ]);
        expect(balanceAfterAlice).to.equal(
          balanceBeforeAlice + transferAmount2,
        );

        // Verify event was emitted
        const events2 =
          await hypERC20Collateral.getEvents.ReceivedTransferRemote({
            fromBlock: receipt2.blockNumber,
            toBlock: receipt2.blockNumber,
          });

        expect(events2).to.have.lengthOf(1);
        expect(events2[0].args.origin).to.equal(DESTINATION_DOMAIN);
        expect(events2[0].args.recipient).to.equal(recipient2Bytes32);
        expect(events2[0].args.amount).to.equal(transferAmount2);
      });
    }); // End of Success Test Cases

    context("Error Test Cases", function () {
      it("Should revert when called by non-mailbox address", async function () {
        // Manually construct the message
        // viem's encodeAbiParameters doesn't work as expected
        const amountBytes32 = toHex(amount, { size: 32 });

        const formattedMessage = concat([
          amountBytes32, // 32 bytes for amount
          chainIdBytes, // 2 bytes for chain ID
          recipientBytes32, // 32 bytes for recipient
        ]);

        // Try to call handle from a non-mailbox address (deployer)
        await expect(
          hypERC20Collateral.write.handle(
            [DESTINATION_DOMAIN, REMOTE_ROUTER_BYTES32, formattedMessage],
            { account: deployer.account },
          ),
        ).to.be.rejectedWith("MailboxClient: sender not mailbox");
      });
      it("Should revert when message format is invalid", async function () {
        // Create an invalid message (too short)
        const invalidMessage = "0x1234";

        // Try to process the invalid message
        await expect(
          hypERC20Collateral.write.handle(
            [DESTINATION_DOMAIN, REMOTE_ROUTER_BYTES32, invalidMessage],
            { account: mailboxSigner.account! },
          ),
        ).to.be.rejected; // General revert check
      });

      it("Should revert when sender is not an enrolled router", async function () {
        // Use a sender that is not enrolled
        const unauthorizedSender = pad(
          "0x2222222222222222222222222222222222222222",
          { size: 32 },
        );

        // Manually construct the message
        // viem's encodeAbiParameters doesn't work as expected
        const amountBytes32 = toHex(amount, { size: 32 });

        const formattedMessage = concat([
          amountBytes32, // 32 bytes for amount
          chainIdBytes, // 2 bytes for chain ID
          recipientBytes32, // 32 bytes for recipient
        ]);

        // Try to process with an unauthorized sender
        await expect(
          hypERC20Collateral.write.handle(
            [DESTINATION_DOMAIN, unauthorizedSender, formattedMessage],
            { account: mailboxSigner.account! },
          ),
        ).to.be.rejectedWith("Enrolled router does not match sender");
      });
    }); // End of Error Test Cases
  }); // End of handle tests

  describe("setMaxKadenaChainId", function () {
    beforeEach(async function () {
      // Deploy fresh contracts for each test
      const [deployerWallet, beneficiaryWallet, aliceWallet, bobWallet] =
        await hre.viem.getWalletClients();

      // Set up wallet clients
      deployer = deployerWallet.extend(walletActions);
      beneficiary = beneficiaryWallet.extend(walletActions);
      alice = aliceWallet.extend(walletActions);
      bob = bobWallet.extend(walletActions);

      // Deploy ERC20Collateral
      erc20Collateral = await (hre.viem.deployContract as any)(
        "ERC20CollateralDec",
        [],
        { walletClient: deployer },
      );
      await erc20Collateral.write.initialize([
        parseUnits("10000000", TOKEN_DECIMALS),
        TOKEN_SYMBOL,
        TOKEN_SYMBOL,
        TOKEN_DECIMALS,
      ]);

      // Deploy mock core contracts
      mockIGP = await (hre.viem.deployContract as any)(
        "MockInterchainGasPaymaster",
        [beneficiary.account!.address],
        { walletClient: deployer },
      );
      mockISM = await (hre.viem.deployContract as any)("MockISM", [], {
        walletClient: deployer,
      });
      proxyAdmin = await (hre.viem.deployContract as any)("ProxyAdmin", [], {
        walletClient: deployer,
      });

      // Deploy the mock mailbox
      mockMailbox = await (hre.viem.deployContract as any)("MockMailbox", [], {
        walletClient: deployer,
      });

      // Initialize the mock mailbox with the required hooks
      await mockMailbox.write.initialize([
        deployer.account!.address, // owner
        mockISM.address, // defaultIsm
        mockIGP.address, // defaultHook
        mockIGP.address, // requiredHook (same as defaultHook)
      ]);

      publicClient = await hre.viem.getPublicClient();

      // Deploy the test token, which implements TokenRouter
      const hypERC20CollateralImpl = await (hre.viem.deployContract as any)(
        "HypERC20Collateral",
        [erc20Collateral.address, mockMailbox.address],
        { walletClient: deployer },
      );

      // Deploy proxy pointing to implementation
      const hypERC20CollateralProxy = await (hre.viem.deployContract as any)(
        "TransparentUpgradeableProxy",
        [hypERC20CollateralImpl.address, proxyAdmin.address, ""],
        { walletClient: deployer },
      );

      // Get token contract instance
      hypERC20Collateral = await hre.viem.getContractAt(
        "HypERC20Collateral",
        hypERC20CollateralProxy.address,
      );

      // Initialize with initial maxKadenaChainId value
      await hypERC20Collateral.write.initialize([
        mockIGP.address,
        mockISM.address,
        deployer.account!.address,
      ]);
      await hypERC20Collateral.write.setMaxKadenaChainId([MAX_KADENA_CHAIN_ID]);
    });

    context("Success Test Cases", function () {
      it("Should update maxKadenaChainId when called by owner", async function () {
        // Check initial value
        const initialMaxChainId =
          await hypERC20Collateral.read.getMaxKadenaChainId();
        expect(initialMaxChainId).to.equal(MAX_KADENA_CHAIN_ID);

        // Update the max chain ID
        const newMaxChainId = 10;
        const tx = await hypERC20Collateral.write.setMaxKadenaChainId(
          [newMaxChainId],
          {
            account: deployer.account,
          },
        );

        // Get transaction receipt
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Verify the max chain ID was updated
        const updatedMaxChainId =
          await hypERC20Collateral.read.getMaxKadenaChainId();
        expect(updatedMaxChainId).to.equal(newMaxChainId);

        // Check the event
        const events = await hypERC20Collateral.getEvents.MaxKadenaChainIdSet({
          fromBlock: txReceipt.blockNumber,
          toBlock: txReceipt.blockNumber,
        });
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.currentMaxKadenaChainId).to.equal(
          MAX_KADENA_CHAIN_ID,
        );
        expect(events[0].args.newMaxKadenaChainId).to.equal(newMaxChainId);
      });

      it("Should allow increasing the maxKadenaChainId", async function () {
        // Update to a smaller value first
        const smallerValue = 5;
        const tx = await hypERC20Collateral.write.setMaxKadenaChainId(
          [smallerValue],
          {
            account: deployer.account,
          },
        );

        // Get transaction receipt
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Verify the update
        expect(await hypERC20Collateral.read.getMaxKadenaChainId()).to.equal(
          smallerValue,
        );

        // Now increase to a higher value
        const higherValue = 25;
        await hypERC20Collateral.write.setMaxKadenaChainId([higherValue], {
          account: deployer.account,
        });

        // Verify the increase worked
        expect(await hypERC20Collateral.read.getMaxKadenaChainId()).to.equal(
          higherValue,
        );

        // Check the event
        const events = await hypERC20Collateral.getEvents.MaxKadenaChainIdSet({
          fromBlock: txReceipt.blockNumber,
          toBlock: txReceipt.blockNumber,
        });
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.currentMaxKadenaChainId).to.equal(smallerValue);
        expect(events[0].args.newMaxKadenaChainId).to.equal(higherValue);
      });

      it("Should allow setting maxKadenaChainId to zero", async function () {
        // Set to zero
        const tx = await hypERC20Collateral.write.setMaxKadenaChainId([0], {
          account: deployer.account,
        });

        // Get transaction receipt
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Verify the update
        expect(await hypERC20Collateral.read.getMaxKadenaChainId()).to.equal(0);

        // Check the event
        const events = await hypERC20Collateral.getEvents.MaxKadenaChainIdSet({
          fromBlock: txReceipt.blockNumber,
          toBlock: txReceipt.blockNumber,
        });
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.currentMaxKadenaChainId).to.equal(
          MAX_KADENA_CHAIN_ID,
        );
        expect(events[0].args.newMaxKadenaChainId).to.equal(0);
      });

      it("Should allow updating maxKadenaChainId multiple times", async function () {
        // Update multiple times
        const values = [5, 10, 15, 20];

        for (const value of values) {
          await hypERC20Collateral.write.setMaxKadenaChainId([value], {
            account: deployer.account,
          });

          // Verify each update
          expect(await hypERC20Collateral.read.getMaxKadenaChainId()).to.equal(
            value,
          );
        }
      });

      it("Should handle uint16 max value correctly", async function () {
        const maxUint16 = 65535; // Maximum value for uint16

        // Set to max possible value
        await hypERC20Collateral.write.setMaxKadenaChainId([maxUint16], {
          account: deployer.account,
        });

        // Verify it was set correctly
        expect(await hypERC20Collateral.read.getMaxKadenaChainId()).to.equal(
          maxUint16,
        );
      });
    }); // End of Success Test Cases

    context("Error Test Cases", function () {
      it("Should revert when called by non-owner account", async function () {
        // Attempt to update from a non-owner account
        await expect(
          hypERC20Collateral.write.setMaxKadenaChainId([10], {
            account: alice.account,
          }),
        ).to.be.rejectedWith("Ownable: caller is not the owner");
      });
      it("Should revert if the new value is the same as the current alue", async function () {
        // Attempt to update from a non-owner account
        await expect(
          hypERC20Collateral.write.setMaxKadenaChainId([MAX_KADENA_CHAIN_ID], {
            account: deployer.account,
          }),
        ).to.be.rejectedWith(
          "TokenRouter: new max chain ID is the same as the current max chain ID",
        );
      });
    }); // End of Error Test Cases
  }); // End of setMaxKadenaChainId tests

  describe("getMaxKadenaChainId", function () {
    beforeEach(async function () {
      // Deploy fresh contracts for each test
      const [deployerWallet, beneficiaryWallet, aliceWallet, bobWallet] =
        await hre.viem.getWalletClients();

      // Set up wallet clients
      deployer = deployerWallet.extend(walletActions);
      beneficiary = beneficiaryWallet.extend(walletActions);
      alice = aliceWallet.extend(walletActions);
      bob = bobWallet.extend(walletActions);

      // Deploy ERC20Collateral
      erc20Collateral = await (hre.viem.deployContract as any)(
        "ERC20CollateralDec",
        [],
        { walletClient: deployer },
      );
      await erc20Collateral.write.initialize([
        parseUnits("10000000", TOKEN_DECIMALS),
        TOKEN_SYMBOL,
        TOKEN_SYMBOL,
        TOKEN_DECIMALS,
      ]);

      // Deploy mock core contracts
      mockIGP = await (hre.viem.deployContract as any)(
        "MockInterchainGasPaymaster",
        [beneficiary.account!.address],
        { walletClient: deployer },
      );
      mockISM = await (hre.viem.deployContract as any)("MockISM", [], {
        walletClient: deployer,
      });
      proxyAdmin = await (hre.viem.deployContract as any)("ProxyAdmin", [], {
        walletClient: deployer,
      });

      // Deploy the mock mailbox
      mockMailbox = await (hre.viem.deployContract as any)("MockMailbox", [], {
        walletClient: deployer,
      });

      // Initialize the mock mailbox with the required hooks
      await mockMailbox.write.initialize([
        deployer.account!.address, // owner
        mockISM.address, // defaultIsm
        mockIGP.address, // defaultHook
        mockIGP.address, // requiredHook (same as defaultHook)
      ]);

      publicClient = await hre.viem.getPublicClient();

      // Deploy the test token, which implements TokenRouter
      const hypERC20CollateralImpl = await (hre.viem.deployContract as any)(
        "HypERC20Collateral",
        [erc20Collateral.address, mockMailbox.address],
        { walletClient: deployer },
      );

      // Deploy proxy pointing to implementation
      const hypERC20CollateralProxy = await (hre.viem.deployContract as any)(
        "TransparentUpgradeableProxy",
        [hypERC20CollateralImpl.address, proxyAdmin.address, ""],
        { walletClient: deployer },
      );

      // Get token contract instance
      hypERC20Collateral = await hre.viem.getContractAt(
        "HypERC20Collateral",
        hypERC20CollateralProxy.address,
      );

      // Initialize with initial maxKadenaChainId value
      await hypERC20Collateral.write.initialize([
        mockIGP.address,
        mockISM.address,
        deployer.account!.address,
      ]);
      await hypERC20Collateral.write.setMaxKadenaChainId([MAX_KADENA_CHAIN_ID]);
    });

    context("Success Test Cases", function () {
      it("Should return the initialized value", async function () {
        // Check that the initial value is correctly returned
        const maxChainId = await hypERC20Collateral.read.getMaxKadenaChainId();
        expect(maxChainId).to.equal(MAX_KADENA_CHAIN_ID);
      });

      it("Should return updated value after setting", async function () {
        // Update the value
        const newValue = 10;
        await hypERC20Collateral.write.setMaxKadenaChainId([newValue], {
          account: deployer.account,
        });

        // Verify the getter returns the updated value
        const maxChainId = await hypERC20Collateral.read.getMaxKadenaChainId();
        expect(maxChainId).to.equal(newValue);
      });

      it("Should return value directly from storage slot", async function () {
        // Convert the string to hex format first, then hash it
        const slotName = stringToHex(
          "kinesis.bridge.tokenrouter.maxKadenaChainId",
        );
        const storageSlot = keccak256(slotName);

        // Update the value
        const newValue = 15;
        await hypERC20Collateral.write.setMaxKadenaChainId([newValue], {
          account: deployer.account,
        });

        // Read directly from storage slot
        const rawStorage = await publicClient.getStorageAt({
          address: hypERC20Collateral.address,
          slot: storageSlot,
        });

        // Convert the hex string to a number
        const rawValue = rawStorage ? BigInt(rawStorage) : 0n;

        // Compare getter value with raw storage value
        const getterValue = await hypERC20Collateral.read.getMaxKadenaChainId();
        expect(Number(rawValue)).to.equal(getterValue);
      });

      it("Should be accessible to any account", async function () {
        // Just verify that the function is publicly accessible through the public client
        const maxChainId = await publicClient.readContract({
          address: hypERC20Collateral.address,
          abi: hypERC20Collateral.abi,
          functionName: "getMaxKadenaChainId",
          args: [], // Empty array for functions with no parameters
        });

        expect(maxChainId).to.equal(MAX_KADENA_CHAIN_ID);
      });

      it("Should maintain values after contract interactions", async function () {
        // Set a known value
        const testValue = 12;
        await hypERC20Collateral.write.setMaxKadenaChainId([testValue], {
          account: deployer.account,
        });

        // Perform some other contract interactions
        await hypERC20Collateral.write.enrollRemoteRouter([
          DESTINATION_DOMAIN,
          REMOTE_ROUTER_BYTES32,
        ]);

        // Value should remain unchanged
        const maxChainId = await hypERC20Collateral.read.getMaxKadenaChainId();
        expect(maxChainId).to.equal(testValue);
      });
    }); // End of Success Test Cases
  }); // End of getMaxKadenaChainId tests
}); // End of HypERC20Collateral tests
