import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { watchContractEvents } from "thirdweb";
import { carbonTokenContract, projectRegistryContract } from "@/constants/constants";
import {
  CreditsMintedEvent,
  ProjectAddedEvent,
  ProjectStatusChangedEvent,
  preparedAddProjectEvent,
  preparedCreditsMintedEvent,
  preparedProjectStatusChangedEvent,
} from "@/constants/events";

const ListenEventsButton = () => {
  const [isListening, setIsListening] = useState(false);
  const unwatchRegistryRef = useRef<(() => void) | null>(null);
  const unwatchTokenRef = useRef<(() => void) | null>(null);

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
        events: [preparedCreditsMintedEvent],
        onEvents: (events) => {
          events.forEach((event) => {
            if (event.eventName === "CreditsMinted") {
              const eventData = event.args as CreditsMintedEvent;
              console.log(`CreditsMinted received: ${eventData.projectId}`);
              handleCreditsMintedEvent(eventData);
            }
          })
        }
      })

      // Store the unwatch function
      unwatchRegistryRef.current = unwatchProjectRegistry;
      unwatchTokenRef.current = unwatchTokenContract;
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
    if(unwatchTokenRef.current){
      unwatchTokenRef.current();
      unwatchTokenRef.current = null;
    }
    setIsListening(false);
  };

  const handleProjectAddedEvent = (eventData: ProjectAddedEvent) => {
    axios
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

  const handleProjectStatusChangedEvent = (eventData: ProjectStatusChangedEvent) => {
    axios
      .put(`http://localhost:5000/api/updateProject/${eventData.projectId}`, {
        auditor: eventData.auditor,
        status: eventData.newStatus,
        creditsIssued: eventData.creditsIssued.toString(),
        authenticationDate: eventData.changeTimestamp.toString(),
      })
      .then((response) => {
        console.log("Project added successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error adding project:", error);
      });
  };

  const handleCreditsMintedEvent = (eventData: CreditsMintedEvent) => {
    axios.post("http://localhost:5000/api/addTokenHolding", {
      userAddress: eventData.to,
      projectId: eventData.projectId.toString()
    })
    .then((response) => {
      console.log("Token holding added successfully:", response.data);
    })
    .catch((error) => {
      console.error("Error adding token holding:", error);
    });
  }

  return (
    <div>
      <Button onClick={isListening ? stopListening : startListening}>
        {isListening ? "Stop Listening" : "Start Listening"}
      </Button>
    </div>
  );
};

export default ListenEventsButton;
