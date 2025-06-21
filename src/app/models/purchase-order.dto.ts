import { ShipMethodDto } from './ship-method.dto';
import { PurchaseOrderDetailDto, CreatePurchaseOrderDetailDto, UpdatePurchaseOrderDetailDto } from './purchase-order-detail.dto';

export interface EmployeeDto {
  businessEntityId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
}

interface VendorDto {
  businessEntityId: number;
  name: string;
  accountNumber: string;
}

export interface PurchaseOrderDto {
  purchaseOrderId: number;
  status: number;
  vendorId: number;
  orderDate: Date;
  shipDate: Date | null;
  subTotal: number;
  taxAmt: number;
  freight: number;
  totalDue: number;
  shipMethod?: ShipMethodDto;
  purchaseOrderDetails?: PurchaseOrderDetailDto[];
  employee?: EmployeeDto;
  vendor?: VendorDto;
}

export interface CreatePurchaseOrderDto {
  status: number;
  employeeId: number;
  vendorId: number;
  shipMethodId: number;
  orderDate: Date;
  shipDate?: Date;
  subTotal: number;
  taxAmt: number;
  freight: number;
  purchaseOrderDetails?: CreatePurchaseOrderDetailDto[];
}

export interface UpdatePurchaseOrderDto {
  status?: number;
  employeeId?: number;
  vendorId?: number;
  shipMethodId?: number;
  orderDate?: Date;
  shipDate?: Date;
  subTotal?: number;
  taxAmt?: number;
  freight?: number;
  purchaseOrderDetails?: CreatePurchaseOrderDetailDto[];
} 