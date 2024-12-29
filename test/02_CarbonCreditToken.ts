import { expect } from "chai";
import { ethers } from "hardhat";
import { CarbonCreditToken, CarbonProjectRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CarbonCreditToken", function() {
  let projectRegistry: CarbonProjectRegistry;
  let carbonToken: CarbonCreditToken;
  let admin: SignerWithAddress;
  let projectOwner: SignerWithAddress;
  let tokenManager: SignerWithAddress;
  let otherAccount: SignerWithAddress;

  const creditsMintedEvent = "CreditsMinted";
  const creditsMintedbatchEvent = "CreditsMintedBatch";

  const projectNotFoundError = "ProjectNotFound";
  const exceededMintAountError = "MintExceedsIssuedCredits";

  const initMintPct = 90;
  const projectId = 0;
  const ipfsCID = "Qm12345exampleCID";
  const uniqueVerificationId = "0000/2024";
  const carbonRemoved = 100000;

  async function deployContracts() {
    [admin, projectOwner, tokenManager, otherAccount] = await ethers.getSigners();
    const CarbonProjectRegistryFactory = await ethers.getContractFactory("CarbonProjectRegistry");
    projectRegistry = await CarbonProjectRegistryFactory.deploy(
      initMintPct,
      admin.address, 
      projectOwner.address
    );

    const CarbonCreditTokenFactory = await ethers.getContractFactory("CarbonCreditToken");
    carbonToken = await CarbonCreditTokenFactory.deploy(
      admin.address, 
      admin.address, 
      projectRegistry.getAddress()
    );

    await carbonToken.connect(admin).grantRole(
      await carbonToken.TOKEN_MANAGER_ROLE(), 
      tokenManager.address
    );
  }

  beforeEach(async function () {
    await deployContracts();
    // Add and accept a project for testing
    await projectRegistry.connect(projectOwner).addProject(
      carbonRemoved,
      ipfsCID,
      uniqueVerificationId
    );
    await projectRegistry.connect(admin).acceptProject(projectId);
  })

  describe("Minting", function() {
    it("Should successfully mint tokens for a project", async function () {
      const creditsIssued = await projectRegistry.getProjectIssuedCredits(projectId);

      
      // mint some credits
      const firstMint = creditsIssued / BigInt(2);
      
      const tx1 = await carbonToken.connect(tokenManager).mintCredits(
        projectOwner.address, 
        projectId, 
        firstMint, 
        "0x"
      );

      await expect(tx1).to.emit(carbonToken, creditsMintedEvent).withArgs(projectOwner.address, projectId, firstMint);
      
      const balanceFirst = await carbonToken.balanceOf(projectOwner.address, projectId);
      expect(balanceFirst).to.equal(firstMint);

      const secondMint = creditsIssued / BigInt(4);

      const tx2 = await carbonToken.connect(tokenManager).mintCredits(
        projectOwner.address, 
        projectId, 
        secondMint, 
        "0x"
      );

      await expect(tx2).to.emit(carbonToken, creditsMintedEvent).withArgs(projectOwner.address, projectId, secondMint);
      
      const balanceSecond = await carbonToken.balanceOf(projectOwner.address, projectId);
      expect(balanceSecond).to.equal(firstMint+secondMint);
    });

    it("Should revert minting for non-existent project", async function () {
      const nonExistentProjectId = 9999;
      
      await expect(
        carbonToken.connect(tokenManager).mintCredits(
          projectOwner.address, 
          nonExistentProjectId, 
          100, 
          "0x"
        )
      ).to.be.revertedWithCustomError(carbonToken, projectNotFoundError);
    });

    it("Should revert minting more credits than issued", async function () {
      const creditsIssued = await projectRegistry.getProjectIssuedCredits(projectId);
      
      await carbonToken.connect(tokenManager).mintCredits(
        projectOwner.address, 
        projectId, 
        creditsIssued - BigInt(2), 
        "0x"
      )

      await expect(
        carbonToken.connect(tokenManager).mintCredits(
          projectOwner.address, 
          projectId, 
          3, 
          "0x"
        )
      ).to.be.revertedWithCustomError(carbonToken, exceededMintAountError);
    });

    it("Should revert minting by non-token-manager", async function () {
      const creditsIssued = await projectRegistry.getProjectIssuedCredits(projectId);
      
      await expect(
        carbonToken.connect(otherAccount).mintCredits(
          projectOwner.address, 
          projectId, 
          creditsIssued, 
          "0x"
        )
      ).to.be.reverted;
    });
  });

  describe("Retiring Credits", function() {
    it("Should successfully retire credits", async function () {
      const creditsIssued = await projectRegistry.getProjectIssuedCredits(projectId);
      
      // Mint credits
      await carbonToken.connect(tokenManager).mintCredits(
        projectOwner.address, 
        projectId, 
        creditsIssued, 
        "0x"
      );

      // Retire some credits
      const retireAmount = creditsIssued / BigInt(2);
      const description = "Carbon offset retirement";

      const tx = await carbonToken.connect(projectOwner).retireCredits(
        projectId, 
        retireAmount, 
        description
      );

      // Check balance after retirement
      const balance = await carbonToken.balanceOf(projectOwner.address, projectId);
      expect(balance).to.equal(creditsIssued - retireAmount);

      // Check event emission
      await expect(tx)
        .to.emit(carbonToken, "CreditRetired")
        .withArgs(
          projectOwner.address, 
          projectId, 
          retireAmount, 
          await ethers.provider.getBlock('latest').then(block => block?.timestamp),
          description
        );
    });

    it("Should revert retiring credits with insufficient balance", async function () {
      await expect(
        carbonToken.connect(projectOwner).retireCredits(
          projectId, 
          100, 
          "Test retirement"
        )
      ).to.be.revertedWithCustomError(carbonToken, "InsufficientBalance");
    });
  });
  describe("Retirement tracking", function() {
    const retirementDescription1 = "First retirement";
    const retirementDescription2 = "Second retirement";
    
    beforeEach(async function () {
      // await deployContracts();
      // // Add and accept a project
      // await projectRegistry.connect(projectOwner).addProject(
      //   carbonRemoved,
      //   ipfsCID,
      //   uniqueVerificationId
      // );
      // await projectRegistry.connect(admin).acceptProject(projectId);
      
      // Mint full amount of credits to project owner
      const creditsIssued = await projectRegistry.getProjectIssuedCredits(projectId);
      await carbonToken.connect(tokenManager).mintCredits(
        projectOwner.address,
        projectId,
        creditsIssued,
        "0x"
      );
    });
  
    it("should correctly track user retirement history", async function () {
      const creditsIssued = await projectRegistry.getProjectIssuedCredits(projectId);
      const firstAmount = creditsIssued / BigInt(2);
      const secondAmount = creditsIssued / BigInt(4);
      
      // Make two retirements
      await carbonToken.connect(projectOwner).retireCredits(
        projectId,
        firstAmount,
        retirementDescription1
      );
      
      await carbonToken.connect(projectOwner).retireCredits(
        projectId,
        secondAmount,
        retirementDescription2
      );
  
      // Get retirement history
      const history = await carbonToken.getUserRetirementHistory(projectOwner.address);
      
      // Verify history length
      expect(history.length).to.equal(2);
      
      // Verify first retirement record
      expect(history[0].projectId).to.equal(projectId);
      expect(history[0].amount).to.equal(firstAmount);
      expect(history[0].description).to.equal(retirementDescription1);
      expect(history[0].retiree).to.equal(projectOwner.address);
      
      // Verify second retirement record
      expect(history[1].projectId).to.equal(projectId);
      expect(history[1].amount).to.equal(secondAmount);
      expect(history[1].description).to.equal(retirementDescription2);
      expect(history[1].retiree).to.equal(projectOwner.address);
    });
  
    it("should return empty array for user with no retirements", async function () {
      const history = await carbonToken.getUserRetirementHistory(otherAccount.address);
      expect(history.length).to.equal(0);
    });
  
    it("should correctly track total project retirements", async function () {
      const creditsIssued = await projectRegistry.getProjectIssuedCredits(projectId);
      const firstAmount = creditsIssued / BigInt(2);
      const secondAmount = creditsIssued / BigInt(4);
      
      // Initial total should be 0
      let totalRetired = await carbonToken.getProjectTotalRetirements(projectId);
      expect(totalRetired).to.equal(0);
      
      // Make first retirement
      await carbonToken.connect(projectOwner).retireCredits(
        projectId,
        firstAmount,
        retirementDescription1
      );
      
      // Check total after first retirement
      totalRetired = await carbonToken.getProjectTotalRetirements(projectId);
      expect(totalRetired).to.equal(firstAmount);
      
      // Make second retirement
      await carbonToken.connect(projectOwner).retireCredits(
        projectId,
        secondAmount,
        retirementDescription2
      );
      
      // Check total after second retirement
      totalRetired = await carbonToken.getProjectTotalRetirements(projectId);
      expect(totalRetired).to.equal(firstAmount + secondAmount);
    });
  
    it("should return zero total retirements for unused project", async function () {
      // Add a new project but don't retire any credits
      await projectRegistry.connect(projectOwner).addProject(
        carbonRemoved,
        "newIPFSCID",
        "0001/2024"
      );
      const newProjectId = 1;
      
      const totalRetired = await carbonToken.getProjectTotalRetirements(newProjectId);
      expect(totalRetired).to.equal(0);
    });
  });
});