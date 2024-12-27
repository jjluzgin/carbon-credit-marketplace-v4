export interface SellOrderDto {
  orderId: number;
  seller: string;
  projectId: number;
  creditsAmount: number;
  totalPriceWei: number;
  expirationDate: number;
}