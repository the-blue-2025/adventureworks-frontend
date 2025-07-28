export interface SalesOrderDetailDto {
  salesOrderDetailId: number;
  salesOrderId: number;
  productId: number;
  orderQty: number;
  unitPrice: number;
  unitPriceDiscount: number;
  lineTotal: number;
  modifiedDate: Date;
}

export interface CreateSalesOrderDetailDto {
  salesOrderId: number;
  productId: number;
  orderQty: number;
  unitPrice: number;
  unitPriceDiscount: number;
}

export interface UpdateSalesOrderDetailDto {
  productId?: number;
  orderQty?: number;
  unitPrice?: number;
  unitPriceDiscount?: number;
} 