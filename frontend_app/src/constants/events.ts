import { prepareEvent } from "thirdweb";

export const preparedAddProjectEvent = prepareEvent({
  signature:
    "event ProjectAdded(uint256 indexed projectId, address indexed projectOwner, string verificationId, uint8 status, uint256 carbonReduced, string ipfsCID)",
});

export const preparedProjectStatusChangedEvent = prepareEvent({
  signature:
    "event ProjectStatusChanged(uint256 indexed projectId, uint8 indexed newStatus, address indexed auditor, uint256 creditsIssued, uint256 changeTimestamp)",
});

export const preparedCreditsMintedEvent = prepareEvent({
  signature: "event CreditsMinted(address indexed to, uint256 indexed projectId, uint256 amount)",
});

export const preparedCreditRetiredEvent = prepareEvent({
  signature:
    "event CreditRetired(address indexed retiree, uint256 indexed projectId, uint256 amount, uint256 timestamp, string emissionDescription)",
});

export const preparedOrderCreatedEvent = prepareEvent({
  signature:
    "event OrderCreated(uint256 indexed orderId, address indexed seller, uint256 indexed projectId, uint256 creditsAmount, uint256 orderPrice, uint256 expirationDate)",
});

export const preparedOrderClosedEvent = prepareEvent({
  signature:
    "event OrderClosed(uint256 indexed orderId, address indexed closedBy, uint256 indexed projectId, uint256 creditsAmount, uint256 orderPrice)",
});

export const preparedOrderFilledEvent = prepareEvent({
  signature:
    "event OrderFilled(uint256 indexed orderId, uint256 projectId, address indexed buyer, address indexed seller, uint256 amountFilled, uint256 totalPrice)",
});

export interface ProjectAddedEvent {
  projectId: bigint;
  projectOwner: string;
  verificationId: string;
  status: number;
  carbonReduced: bigint;
  ipfsCID: string;
}

export interface ProjectStatusChangedEvent {
  projectId: bigint;
  newStatus: number;
  auditor: string;
  creditsIssued: bigint;
  changeTimestamp: bigint;
}

export interface CreditsMintedEvent {
  to: string;
  projectId: bigint;
  amount: bigint;
}

export interface OrderCreatedEvent {
  orderId: bigint;
  seller: string;
  projectId: bigint;
  creditsAmount: bigint;
  orderPrice: bigint;
  expirationDate: bigint;
}

export interface OrderClosedEvent {
  orderId: bigint;
  closedBy: string;
  projectId: bigint;
  creditsAmount: bigint;
  orderPrice: bigint;
}

export interface CreditRetiredEvent {
  retiree: string;
  projectId: bigint;
  amount: bigint;
  timestamp: bigint;
  emissionDescription: string;
}

export interface OrderFilledEvent {
  orderId: bigint, 
  projectId: bigint, 
  buyer: string, 
  seller: string,
  amountFilled: bigint, 
  totalPrice: bigint
}
