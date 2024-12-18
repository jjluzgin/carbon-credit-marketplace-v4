export interface UserProjectDto {
  verificationId: string;
  ipfsCID: string;
  status: number;
  carbonRemoved: number;
  creditsIssued: number;
  authenticationDate: number;
}

export interface PendingProjectDto {
  projectId: number;
  verificationId: string;
  ipfsCID: string;
  carbonRemoved: number;
}
