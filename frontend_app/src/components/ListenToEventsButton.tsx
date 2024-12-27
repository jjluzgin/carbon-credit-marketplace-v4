import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { readContract, watchContractEvents } from "thirdweb";
import { carbonTokenContract, marketplaceContract, projectRegistryContract } from "@/constants/constants";
import {
  CreditRetiredEvent,
  CreditsMintedEvent,
  OrderClosedEvent,
  OrderCreatedEvent,
  OrderFilledEvent,
  ProjectAddedEvent,
  ProjectStatusChangedEvent,
  preparedAddProjectEvent,
  preparedCreditRetiredEvent,
  preparedCreditsMintedEvent,
  preparedOrderClosedEvent,
  preparedOrderCreatedEvent,
  preparedOrderFilledEvent,
  preparedProjectStatusChangedEvent,
} from "@/constants/events";
import { eventNames } from "process";
import { SellOrderDto } from "../../../shared/types/OrderDto";

const ListenEventsButton = () => {
  const [isListening, setIsListening] = useState(false);
  const unwatchRegistryRef = useRef<(() => void) | null>(null);
  const unwatchTokenRef = useRef<(() => void) | null>(null);
  const unwatchMarketplaceRef = useRef<(() => void) | null>(null);

  const startListening = () => {
    // If already listening, do nothing
    if (isListening) return;

    try {
      const unwatchProjectRegistry = watchContractEvents({
        contract: projectRegistryContract,
        events: [preparedAddProjectEvent, preparedProjectStatusChangedEvent],
        onEvents: (events) => {
          events.forEach((event) => {
            if (event.eventName === "ProjectAdded") {
              const eventData = event.args as ProjectAddedEvent;
              console.log(`ProjectAdded received: ${eventData.projectId}`);
              handleProjectAddedEvent(eventData);
            } else if (event.eventName === "ProjectStatusChanged") {
              const eventData = event.args as ProjectStatusChangedEvent;
              console.log(`ProjectStatusChanged received: ${eventData.projectId}`);
              handleProjectStatusChangedEvent(eventData);
            }
          });
        },
      });

      const unwatchTokenContract = watchContractEvents({
        contract: carbonTokenContract,
        events: [preparedCreditsMintedEvent, preparedCreditRetiredEvent],
        onEvents: (events) => {
          events.forEach((event) => {
            if (event.eventName === "CreditsMinted") {
              const eventData = event.args as CreditsMintedEvent;
              console.log(`CreditsMinted received: ${eventData.projectId}`);
              handleCreditsMintedEvent(eventData);
            } else if (event.eventName === "CreditRetired") {
              const eventData = event.args as CreditRetiredEvent;
              console.log(`CreditsRetired received: ${eventData.projectId}`);
              handleCreditsRetiredEvent(eventData);
            }
          });
        },
      });

      const unwatchMarketplaceContract = watchContractEvents({
        contract: marketplaceContract,
        events: [preparedOrderCreatedEvent, preparedOrderClosedEvent, preparedOrderFilledEvent],
        onEvents: (events) => {
          events.forEach((event) => {
            if (event.eventName === "OrderCreated") {
              const eventData = event.args as OrderCreatedEvent;
              console.log(`OrderCreated received: ${eventData.orderId}, ProjectId: ${eventData.projectId}`);
              handleOrderCreatedEvent(eventData);
            } else if (event.eventName === "OrderClosed") {
              const eventData = event.args as OrderClosedEvent;
              console.log(`OrderClosed received: ${eventData.orderId}, ProjectId: ${eventData.projectId}`);
              handleOrderClosedEvent(eventData);
            } else if (event.eventName === "OrderFilled") {
              const eventData = event.args as OrderFilledEvent;
              console.log(`OrderFilled received: ${eventData.orderId}, ProjectId: ${eventData.projectId}`);
              handleOrderFilledEvent(eventData);
            }
          });
        },
      });

      // Store the unwatch function
      unwatchRegistryRef.current = unwatchProjectRegistry;
      unwatchTokenRef.current = unwatchTokenContract;
      unwatchMarketplaceRef.current = unwatchMarketplaceContract;
      setIsListening(true);
    } catch (error) {
      console.error("Error starting event listener:", error);
    }
  };

  const stopListening = () => {
    if (unwatchRegistryRef.current) {
      unwatchRegistryRef.current();
      unwatchRegistryRef.current = null;
    }
    if (unwatchTokenRef.current) {
      unwatchTokenRef.current();
      unwatchTokenRef.current = null;
    }
    if (unwatchMarketplaceRef.current) {
      unwatchMarketplaceRef.current();
      unwatchMarketplaceRef.current = null;
    }
    setIsListening(false);
  };

  const handleProjectAddedEvent = async (eventData: ProjectAddedEvent) => {
    await axios
      .post("http://localhost:5000/api/addProject", {
        projectId: eventData.projectId === BigInt(0) ? "0" : eventData.projectId.toString(),
        owner: eventData.projectOwner,
        verificationId: eventData.verificationId,
        status: eventData.status.toString(),
        carbonReduction: eventData.carbonReduced.toString(),
        ipfsCID: eventData.ipfsCID,
      })
      .then((response) => {
        console.log("Project added successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error adding project:", error);
      });
  };

  const handleProjectStatusChangedEvent = async (eventData: ProjectStatusChangedEvent) => {
    await axios
      .put(`http://localhost:5000/api/updateProject/${eventData.projectId}`, {
        auditor: eventData.auditor,
        status: eventData.newStatus,
        creditsIssued: eventData.creditsIssued.toString(),
        authenticationDate: eventData.changeTimestamp.toString(),
      })
      .then((response) => {
        console.log("Project updated successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error updating project:", error);
      });
  };

  const addTokenHolding = async (address: string, projectId: bigint) => {
    await axios
      .post("http://localhost:5000/api/addTokenHolding", {
        userAddress: address,
        projectId: projectId.toString(),
      })
      .then((response) => {
        console.log("Token holding added successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error adding token holding:", error);
      });
  }

  const handleCreditsMintedEvent = async (eventData: CreditsMintedEvent) => {
    addTokenHolding(eventData.to, eventData.projectId);
  };

  const handleOrderCreatedEvent = async (eventData: OrderCreatedEvent) => {
    await axios
      .post("http://localhost:5000/api/addSellOrder", {
        orderId: eventData.orderId.toString(),
        seller: eventData.seller,
        projectId: eventData.projectId.toString(),
        creditsAmount: eventData.creditsAmount.toString(),
        totalPrice: eventData.orderPrice.toString(),
        expirationDate: eventData.expirationDate.toString(),
      })
      .then((response) => {
        console.log("Order added successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error adding order:", error);
      });
  };

  const handleOrderClosedEvent = async (eventData: OrderClosedEvent) => {
    await axios
      .delete(`http://localhost:5000/api/orders/${eventData.orderId}`)
      .then((response) => {
        console.log("Order closed successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error closing order:", error);
      });
  };

  const checkEmptyBalance = async (address: string, projectId: bigint) => {
    const balance = await readContract({
      contract: carbonTokenContract,
      method: "function balanceOf(address account, uint256 id) view returns (uint256)",
      params: [address, projectId],
    });
    const { data } = await axios.get(`http://localhost:5000/api/orders/${address}`);
    const userOrders: SellOrderDto[] = data.orders;
    console.log(userOrders);
    const sameProjectOrders = userOrders.filter((order) => BigInt(order.projectId) === projectId);
    if (parseInt(balance.toString()) === 0 && sameProjectOrders.length === 0) {
      await axios
        .delete("http://localhost:5000/api/removeTokenHolding", {
          params: {
            userAddress: address,
            projectId: projectId.toString(),
          },
        })
        .then((response) => {
          console.log("Token holding removed successfully:", response.data);
        })
        .catch((error) => {
          console.error("Error removing token holding:", error);
        });
    }
  }

  const handleCreditsRetiredEvent = async (eventData: CreditRetiredEvent) => {
    checkEmptyBalance(eventData.retiree, eventData.projectId);
  };

  const handleOrderFilledEvent = async (eventData: OrderFilledEvent) => {
    // Remove order
    await axios
      .delete(`http://localhost:5000/api/orders/${eventData.orderId}`)
      .then((response) => {
        console.log("Order closed successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error closing order:", error);
      });
    // Check if seller has any balance left
    checkEmptyBalance(eventData.seller, eventData.projectId);
    // Update buyer token holding
    addTokenHolding(eventData.buyer, eventData.projectId);
  };

  return (
    <div>
      <Button onClick={isListening ? stopListening : startListening}>
        {isListening ? "Stop Listening" : "Start Listening"}
      </Button>
    </div>
  );
};

export default ListenEventsButton;
