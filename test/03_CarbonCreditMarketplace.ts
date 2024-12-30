import { expect } from "chai";
import { ethers } from "hardhat";
import {
  CarbonCreditMarketplace,
  CarbonCreditToken,
  CarbonProjectRegistry,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { bigint } from "hardhat/internal/core/params/argumentTypes";

describe("CarbonCreditMarketplace", function () {
  let marketplace: CarbonCreditMarketplace;
  let carbonToken: CarbonCreditToken;
  let projectRegistry: CarbonProjectRegistry;

  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let auditor: SignerWithAddress;

  const orderCreatedEvent = "OrderCreated";
  const orderClosedEvent = "OrderClosed";
  const expiredOrderClosedEvent = "ExpiredOrderClosed";
  const orderFilledEvent = "OrderFilled";
  const orderNotExpiredEvent = "OrderNotExpired";
  const togglePauseEvent = "MarketplacePauseStatusChanged";
  const updateFeeEvent = "PlatformFeeUpdated";

  const insufficientBalanceError = "InsufficientBalance";
  const inactiveOrderError = "InactiveOrder";
  const insufficientPaymentError = "InsufficientPayment";
  const invalidPriceError = "InvalidPrice";
  const notOrderOwnerError = "NotOrderOwner";
  const orderInactiveError = "InactiveOrder";
  const transferNotApprocedError = "TransferNotApproved";

  // Project and credit details
  const initMintPct = 90;
  const projectId = 0;
  const ipfsCID = "Qm12345exampleCID";
  const uniqueVerificationId = "0000/2024";
  const carbonRemoved = 500000;

  const SEVEN_DAYS = 7 * 24 * 60 * 60;

  // Deployment helper function
  async function deployContracts() {
    [owner, seller, buyer, auditor] = await ethers.getSigners();

    // Deploy Project Registry
    const ProjectRegistryFactory = await ethers.getContractFactory(
      "CarbonProjectRegistry"
    );
    projectRegistry = await ProjectRegistryFactory.deploy(
      initMintPct,
      owner.address,
      seller.address
    );

    // Deploy Carbon Credit Token
    const CarbonTokenFactory =
      await ethers.getContractFactory("CarbonCreditToken");
    carbonToken = await CarbonTokenFactory.deploy(
      owner.address,
      owner.address,
      await projectRegistry.getAddress()
    );

    // Deploy Marketplace
    const MarketplaceFactory = await ethers.getContractFactory(
      "CarbonCreditMarketplace"
    );
    marketplace = await MarketplaceFactory.deploy(
      await carbonToken.getAddress(),
      owner.address
    );
    // Add project as seller
    await projectRegistry
      .connect(seller)
      .addProject(carbonRemoved, ipfsCID, uniqueVerificationId);
    // Approve and mint credits by auditor
    await projectRegistry
      .connect(owner)
      .grantRole(await projectRegistry.AUDITOR_ROLE(), auditor.address);
    await projectRegistry.connect(auditor).acceptProject(projectId);
    const toBeMinted = await projectRegistry.getProjectIssuedCredits(projectId);

    // Mint tokens to seller
    await carbonToken
      .connect(owner)
      .mintCredits(seller.address, projectId, toBeMinted, "0x");
  }

  beforeEach(async function () {
    await deployContracts();
    // Approve marketplace contract to spend tokens on sellers account
    await carbonToken
      .connect(seller)
      .setApprovalForAll(await marketplace.getAddress(), true);
  });

  describe("Editing Market Variables", function () {
    it("Should allow contract owner to pause market", async function () {
      let marketplacePaused = await marketplace.marketplacePaused();
      expect(marketplacePaused).to.be.false;
      const tx = await marketplace.connect(owner).toggleMarketplacePause();
      expect(tx).to.emit(marketplace, togglePauseEvent).withArgs(true);
      marketplacePaused = await marketplace.marketplacePaused();
      expect(marketplacePaused).to.be.true;
    });

    it("Should allow contract owner to update market fee", async function () {
      const initialFee = 120;
      const newFee = 130;
      let marketFee = await marketplace.platformFeeBasisPoints();
      expect(marketFee).to.equal(initialFee);
      await expect(marketplace.updatePlatformFee(newFee))
        .to.emit(marketplace, updateFeeEvent)
        .withArgs(newFee);

      marketFee = await marketplace.platformFeeBasisPoints();
      expect(marketFee).to.equal(newFee); //
    });

    it("Should prevent non-owner from updating platform fee", async function () {
      await expect(marketplace.connect(buyer).updatePlatformFee(150)).to.be
        .revertedWithCustomError;
    });

    it("Should prevent setting platform fee above 10%", async function () {
      await expect(marketplace.updatePlatformFee(1001)).to.be // 10.01%
        .revertedWithCustomError;
    });

    it("Should receive ETH and update contract balance", async function () {
      const initialBalance = await marketplace.accountBalances(
        marketplace.getAddress()
      );
      const sendAmount = ethers.parseEther("1");

      await owner.sendTransaction({
        to: marketplace.getAddress(),
        value: sendAmount,
      });

      const finalBalance = await marketplace.accountBalances(
        marketplace.getAddress()
      );
      expect(finalBalance).to.equal(initialBalance + sendAmount);
    });
    it("Should emit event when receiving unknown function call", async function () {
      const randomData = "0x123456";

      const tx = await buyer.sendTransaction({
        to: marketplace.getAddress(),
        value: ethers.parseEther("1"),
        data: randomData,
      });

      await expect(tx)
        .to.emit(marketplace, "FallbackCalled")
        .withArgs(buyer.address, ethers.parseEther("1"), randomData);
    });
  });

  describe("Order Creation", function () {
    it("Should allow creating a sell order for valid carbon credits", async function () {
      const creditAmount = 300;
      const pricePerCredit = ethers.parseEther("0.1"); // 0.1 ETH per credit

      const sellerInitBalance = await carbonToken.balanceOf(
        seller.address,
        projectId
      );
      const contractInitBalance = await carbonToken.balanceOf(
        marketplace.getAddress(),
        projectId
      );

      // Create sell order
      const tx = await marketplace.connect(seller).createSellOrder(
        projectId,
        creditAmount,
        pricePerCredit // Order price on nagu nimetus kogu orderi pricele mitte uniti price
      );
      const firstOrderId = 0;
      const timestamp1 = await ethers.provider
        .getBlock("latest")
        .then((block) => block!.timestamp);
      const expirationTime = timestamp1 + 7 * 24 * 60 * 60;
      await expect(tx)
        .to.emit(marketplace, orderCreatedEvent)
        .withArgs(
          firstOrderId,
          seller.address,
          projectId,
          creditAmount,
          BigInt(creditAmount) * pricePerCredit,
          expirationTime
        );

      // Verify order details
      const order = await marketplace.tradeOrders(firstOrderId);
      const timestamp2 = await ethers.provider
        .getBlock("latest")
        .then((block) => block!.timestamp);
      expect(order.seller).to.equal(seller.address);
      expect(order.projectId).to.equal(projectId);
      expect(order.creditsAmount).to.equal(300);
      expect(order.expirationTimestamp).to.equal(timestamp2 + SEVEN_DAYS);
      expect(order.isActive).to.be.true;
      const sellerEndBalance = await carbonToken.balanceOf(
        seller.address,
        projectId
      );
      const contractEndBalance = await carbonToken.balanceOf(
        marketplace.getAddress(),
        projectId
      );
      expect(sellerEndBalance).to.equal(
        sellerInitBalance - BigInt(creditAmount)
      );
      expect(contractEndBalance).to.equal(
        contractInitBalance + BigInt(creditAmount)
      );
    });

    it("Should prevent creating a sell order for non-existent or non-audited project", async function () {
      const sellAmount = 300;
      await expect(
        marketplace.connect(seller).createSellOrder(
          999, // Non-existent project ID, users balance should be 0
          sellAmount,
          ethers.parseEther("0.1")
        )
      )
        .to.be.revertedWithCustomError(marketplace, insufficientBalanceError)
        .withArgs(sellAmount);
    });

    it("Should prevent creating a sell order with insufficient token balance", async function () {
      await expect(
        marketplace.connect(seller).createSellOrder(
          projectId,
          carbonRemoved + 1, // More than seller's balance
          ethers.parseEther("0.1")
        )
      )
        .to.be.revertedWithCustomError(marketplace, insufficientBalanceError)
        .withArgs(carbonRemoved + 1);
    });

    it("Should not create a sell order for user who does not allow contract to spend credits", async function () {
      await expect(
        marketplace
          .connect(buyer)
          .createSellOrder(projectId, carbonRemoved, ethers.parseEther("0.1"))
      ).to.be.revertedWithCustomError(marketplace, transferNotApprocedError);
    });

    it("Should prevent creating a free sell order", async function () {
      await expect(
        marketplace.connect(seller).createSellOrder(projectId, carbonRemoved, 0)
      )
        .to.be.revertedWithCustomError(marketplace, invalidPriceError)
        .withArgs(0);
    });

    it("Should prevent creting a sell order when market is paused", async function () {
      // Pause market
      await marketplace.connect(owner).toggleMarketplacePause();
      // Try to post a sell order
      await expect(
        marketplace
          .connect(seller)
          .createSellOrder(projectId, carbonRemoved, ethers.parseEther("0.1"))
      ).to.be.rejectedWith("Trading is paused");
    });
  });

  describe("Order Removal", function () {
    const sellAmount = BigInt(300);
    const sellPricePerCredit = ethers.parseEther("0.1");
    const totalSellPrice = sellAmount * sellPricePerCredit;

    beforeEach(async function () {
      // Create sell order
      await marketplace
        .connect(seller)
        .createSellOrder(projectId, sellAmount, sellPricePerCredit);
    });

    it("Should allow order owner to remove their order", async function () {
      const sellerInitialBalance = await carbonToken.balanceOf(
        seller.address,
        projectId
      );
      const firstOrderId = 0;
      await expect(marketplace.connect(seller).closeSellOrder(firstOrderId))
        .to.emit(marketplace, orderClosedEvent)
        .withArgs(
          firstOrderId,
          seller.address,
          projectId,
          sellAmount,
          totalSellPrice
        );

      // Verify order is inactive
      const order = await marketplace.tradeOrders(firstOrderId);
      expect(order.isActive).to.be.false;
      expect(order.expirationTimestamp).to.equal(0);
      const sellerEndBalance = await carbonToken.balanceOf(
        seller.address,
        projectId
      );
      expect(sellerEndBalance).to.equal(
        sellerInitialBalance + order.creditsAmount
      );
    });

    it("Should prevent non-owners from cancelling an order", async function () {
      const firstOrderId = 0;
      await expect(
        marketplace.connect(buyer).closeSellOrder(firstOrderId)
      ).to.be.revertedWithCustomError(marketplace, notOrderOwnerError);
    });

    it("Should prevent closing an inactive order", async function () {
      const firstOrderId = 0;
      await marketplace.connect(seller).closeSellOrder(firstOrderId);
      // Try removing same order again
      await expect(
        marketplace.connect(seller).closeSellOrder(firstOrderId)
      ).to.be.revertedWithCustomError(marketplace, inactiveOrderError);
    });
  });

  describe("Order Expiration", function () {
    beforeEach(async function () {
      await owner.sendTransaction({
        to: marketplace.getAddress(),
        value: ethers.parseEther("0.1"),
      });
    });

    it("Should batch close multiple expired orders and pay rewards", async function () {
      // Create multiple orders with moderate value to ensure contract can pay rewards
      const orderIds = [];
      const orderValue = ethers.parseEther("0.01"); // Small enough that rewards can be paid
      const orderAmount = BigInt(100);
      const orderTotalPrice = orderValue * orderAmount;

      for (let i = 0; i < 3; i++) {
        await marketplace
          .connect(seller)
          .createSellOrder(projectId, orderAmount, orderValue);
        orderIds.push(i);
      }

      // Fast forward time
      await time.increase(7 * 24 * 60 * 60 + 1);

      const initialOwnerBalance = await marketplace.accountBalances(
        owner.address
      );
      const initialContractBalance = await marketplace.accountBalances(
        marketplace.getAddress()
      );
      
      // Batch close
      const tx = await marketplace
        .connect(owner)
        .batchCloseExpiredOrders(orderIds);

      // Calculate expected reward
      const reward = await marketplace.closeExpiredOrderReward();
      const expectedTotalPayout = BigInt(orderIds.length)*(orderTotalPrice * reward)/BigInt(10000);

      // Verify balances changed correctly if contract had sufficient funds
      if (expectedTotalPayout <= initialContractBalance) {
        const finalOwnerBalance = await marketplace.accountBalances(
          owner.address
        );
        const finalContractBalance = await marketplace.accountBalances(
          marketplace.getAddress()
        );

        expect(finalOwnerBalance).to.equal(
          initialOwnerBalance + expectedTotalPayout
        );
        expect(finalContractBalance).to.equal(
          initialContractBalance - expectedTotalPayout
        );
      }
    });

    it("Should only pay rewards for orders that don't exceed contract balance", async function () {
      // Create multiple orders with increasing values
      const orderIds = [];
      const values = [
        ethers.parseEther("0.01"), // Small reward
        ethers.parseEther("0.1"), // Medium reward
        ethers.parseEther("1.0"), // Large reward
      ];
      const amount = BigInt(100);

      for (let i = 0; i < values.length; i++) {
        await marketplace
          .connect(seller)
          .createSellOrder(projectId, amount, values[i]);
        orderIds.push(i);
      }

      // Fast forward time
      await time.increase(7 * 24 * 60 * 60 + 1);

      const initialOwnerBalance = await marketplace.accountBalances(
        owner.address
      );
      
      const reward = await marketplace.closeExpiredOrderReward();
      let maxPayout: bigint = BigInt(0);
      for(const value in values){
        maxPayout += ((ethers.parseEther("1.11") * amount * reward)/BigInt(10000));
      }

      // Batch close
      await marketplace.connect(owner).batchCloseExpiredOrders(orderIds);

      // Verify all orders are closed regardless of reward payment
      for (let orderId of orderIds) {
        const order = await marketplace.tradeOrders(orderId);
        expect(order.isActive).to.be.false;
      }

      // Verify final balance doesn't exceed initial contract balance
      const finalOwnerBalance = await marketplace.accountBalances(
        owner.address
      );
      expect(finalOwnerBalance - initialOwnerBalance).to.be.lessThan(
        maxPayout
      );
    });

    it("Should handle mix of expired and non-expired orders", async function () {
      // Create orders
      const orderIds = []; // Using existing orders from beforeEach
      const orderValue = ethers.parseEther("0.01"); // Small enough that rewards can be paid
      const orderAmount = BigInt(100);
      const orderTotalPrice = orderValue * orderAmount;

      for (let i = 0; i < 2; i++) {
        await marketplace
          .connect(seller)
          .createSellOrder(projectId, orderAmount, orderValue);
        orderIds.push(i);
      }

      // Fast forward time
      await time.increase((7 * 24 * 60 * 60));

      // Create a new order that won't be expired
      await marketplace
        .connect(seller)
        .createSellOrder(projectId, orderAmount, orderValue);
      orderIds.push(orderIds.length);

      const tx = await marketplace
        .connect(owner)
        .batchCloseExpiredOrders(orderIds);

      // First order should be active, second and third not expired
      const order0 = await marketplace.tradeOrders(0);
      const order1 = await marketplace.tradeOrders(1);
      const order2 = await marketplace.tradeOrders(2);

      expect(order0.isActive).to.be.false;
      expect(order1.isActive).to.be.false;
      expect(order2.isActive).to.be.true;

      // Verify OrderNotExpired events were emitted
      await expect(tx)
        .to.emit(marketplace, "OrderNotExpired")
        .withArgs(2);
    });
  });

  describe("Trade Execution", function () {
    const orderId = 0;
    const orderAmount = 250;
    const pricePerCredit = ethers.parseEther("0.001");
    const orderTotalPrice = BigInt(orderAmount) * pricePerCredit;

    beforeEach(async function () {
      // Approve marketplace to spend tokens
      await carbonToken
        .connect(seller)
        .setApprovalForAll(await marketplace.getAddress(), true);

      // Create sell order
      await marketplace
        .connect(seller)
        .createSellOrder(projectId, orderAmount, pricePerCredit);
    });

    it("Should execute a trade successfully", async function () {
      const initialSellerBalance = await marketplace.accountBalances(
        seller.address
      );

      // Check event emission
      await expect(
        marketplace
          .connect(buyer)
          .executeTrade(orderId, { value: orderTotalPrice })
      )
        .to.emit(marketplace, orderFilledEvent)
        .withArgs(
          orderId,
          projectId,
          buyer.address,
          seller.address,
          orderAmount,
          orderTotalPrice
        );

      // Verify token transfer
      const buyerBalance = await carbonToken.balanceOf(
        buyer.address,
        projectId
      );
      expect(buyerBalance).to.equal(orderAmount);

      // Verify seller received payment
      const finalSellerBalance = await marketplace.accountBalances(
        seller.address
      );
      const feePercentage = await marketplace.platformFeeBasisPoints();
      const sellerProceeds =
        orderTotalPrice - (orderTotalPrice * feePercentage) / BigInt(10000);
      // console.log(`Seller init balance: ${initialSellerBalance}, Sell price: ${orderTotalPrice}, proceeds: ${sellerProceeds}`);
      expect(finalSellerBalance).to.equal(
        initialSellerBalance + sellerProceeds
      );
    });

    it("Should handle multiple trades in sequence", async function () {
      // Create second order
      await marketplace
        .connect(seller)
        .createSellOrder(projectId, orderAmount, pricePerCredit);

      // Execute two trades with excess payment
      await marketplace.connect(buyer).executeTrade(0, {
        value: orderTotalPrice,
      });

      await marketplace.connect(buyer).executeTrade(1, {
        value: orderTotalPrice,
      });

      // Verify orders were filled
      const order1 = await marketplace.tradeOrders(0);
      const order2 = await marketplace.tradeOrders(1);
      expect(order1.isActive).to.be.false;
      expect(order2.isActive).to.be.false;
    });

    it("Should prevent trading an inactive order", async function () {
      // Cancel the order first
      await marketplace.connect(seller).closeSellOrder(orderId);

      await expect(
        marketplace
          .connect(buyer)
          .executeTrade(orderId, { value: ethers.parseEther("0.001") })
      ).to.be.revertedWithCustomError(marketplace, orderInactiveError);
    });

    it("Should revert when executing expired order", async function () {
      // Fast forward time past expiration
      await time.increase(7 * 24 * 60 * 60 + 1);
      // Try to execute expired order
      await expect(
        marketplace
          .connect(buyer)
          .executeTrade(orderId, { value: orderTotalPrice })
      )
        .to.be.revertedWithCustomError(marketplace, "ExpiredOrder")
        .withArgs(orderId);
    });

    it("Should refund user overpayments", async function () {
      const overpayAmount = ethers.parseEther("2");
      const paymentAmount = orderTotalPrice + overpayAmount;
      // Get buyer's initial balance
      const initialBuyerBalance = await marketplace.accountBalances(
        buyer.address
      );
      // Execute trade with excess payment
      const tx = await marketplace.connect(buyer).executeTrade(orderId, {
        value: paymentAmount,
      });
      // Get buyer's final balance
      const finalBuyerBalance = await marketplace.accountBalances(
        buyer.address
      );
      // Calculate expected balance: initial - orderPrice - gasSpent
      const expectedBalance = initialBuyerBalance + overpayAmount;
      // Verify buyer received the refund (within small margin of error for gas estimation)
      expect(finalBuyerBalance).to.equal(expectedBalance);
    });

    it("Should revert when not paying enough money to buy", async function () {
      await expect(
        marketplace
          .connect(buyer)
          .executeTrade(orderId, { value: orderTotalPrice - BigInt(200) })
      ).to.be.revertedWithCustomError(marketplace, insufficientPaymentError);
    });
  });
  describe("Withdraw account balance", function () {
    it("Should allow user to withdraw account balance", async function () {
      // First, add some balance to account through compliting a trade
      await marketplace
        .connect(seller)
        .createSellOrder(projectId, 100, ethers.parseEther("0.001"));
      await marketplace
        .connect(buyer)
        .executeTrade(0, { value: ethers.parseEther("1") });

      const initialMarketplaceBalance = await marketplace.accountBalances(
        seller.address
      );

      // Withdraw
      const withdrawAmount = initialMarketplaceBalance / 2n;
      await marketplace
        .connect(seller)
        .withdrawAccountBalance(seller.address, withdrawAmount);

      const finalMarketplaceBalance = await marketplace.accountBalances(
        seller.address
      );

      expect(finalMarketplaceBalance).to.equal(
        initialMarketplaceBalance - withdrawAmount
      );
    });

    it("Should prevent withdrawing more than account balance", async function () {
      const excessiveAmount =
        (await marketplace.accountBalances(seller.address)) + 1n;
      await expect(
        marketplace
          .connect(seller)
          .withdrawAccountBalance(seller.address, excessiveAmount)
      ).to.be.revertedWithCustomError(marketplace, "InsufficientBalance");
    });
  });
});
