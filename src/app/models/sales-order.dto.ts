import { ShipMethodDto } from './ship-method.dto';
import { SalesOrderDetailDto, CreateSalesOrderDetailDto, UpdateSalesOrderDetailDto } from './sales-order-detail.dto';

export interface CustomerDto {
  customerId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  emailAddress: string;
}

export interface SalesPersonDto {
  businessEntityId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
}

export interface SalesOrderDto {
  salesOrderId: number;
  status: number;
  customerId: number;
  salesPersonId: number;
  orderDate: Date;
  shipDate: Date | null;
  subTotal: number;
  taxAmt: number;
  freight: number;
  totalDue: number;
  shipMethod?: ShipMethodDto;
  salesOrderDetails?: SalesOrderDetailDto[];
  customer?: CustomerDto;
  salesPerson?: SalesPersonDto;
}

export interface CreateSalesOrderDto {
  status: number;
  customerId: number;
  salesPersonId: number;
  shipMethodId: number;
  orderDate: Date;
  shipDate?: Date;
  subTotal: number;
  taxAmt: number;
  freight: number;
  salesOrderDetails?: CreateSalesOrderDetailDto[];
}

export interface UpdateSalesOrderDto {
  status?: number;
  customerId?: number;
  salesPersonId?: number;
  shipMethodId?: number;
  orderDate?: Date;
  shipDate?: Date;
  subTotal?: number;
  taxAmt?: number;
  freight?: number;
  salesOrderDetails?: CreateSalesOrderDetailDto[];
} 