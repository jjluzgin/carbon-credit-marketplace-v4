
import { prepareEvent } from "thirdweb";

export const preparedAddProjectEvent = prepareEvent({
  signature:
    "event ProjectAdded(uint256 indexed projectId, address indexed projectOwner, string verificationId, uint8 status, uint256 carbonReduced, string ipfsCID)",
});

export const preparedProjectStatusChangedEvent = prepareEvent({
  signature:
    "event ProjectStatusChanged(uint256 indexed projectId, uint8 indexed newStatus, address indexed auditor, uint256 creditsIssued, uint256 changeTimestamp)",
});

export interface ProjectAddedEvent {
  projectId: bigint;
  projectOwner: string;
  verificationId: string;
  status: number;
  carbonReduced: bigint;
  ipfsCID: string;
}

export interface  ProjectStatusChangedEvent {
  projectId: bigint,
  newStatus: number,
  auditor: string,
  creditsIssued: bigint,
  changeTimestamp: bigint
}


// const ProjectAddEventListener = ({contract, eventName}) => {
//    // State to track processed events to prevent duplicate updates
//    const [processedEvents, setProcessedEvents] = useState(new Set());

//    // Listen to contract events
//    const { data: events } = useContractEvents({
//      contract,
//      eventName, // Specify the specific event you want to listen to
//      subscribe: true
//    });
// }

