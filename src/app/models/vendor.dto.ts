export interface VendorDto {
  businessEntityId: number;
  accountNumber: string;
  name: string;
  creditRating: number;
  preferredVendorStatus: boolean;
  activeFlag: boolean;
  purchasingWebServiceURL: string | null;
  modifiedDate: Date;
}

export interface CreateVendorDto {
  accountNumber: string;
  name: string;
  creditRating: number;
  preferredVendorStatus?: boolean;
  activeFlag?: boolean;
  purchasingWebServiceURL?: string;
}

export interface UpdateVendorDto {
  accountNumber?: string;
  name?: string;
  creditRating?: number;
  preferredVendorStatus?: boolean;
  activeFlag?: boolean;
  purchasingWebServiceURL?: string;
} 