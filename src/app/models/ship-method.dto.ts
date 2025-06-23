export interface ShipMethodDto {
  shipMethodId: number;
  name: string;
  shipBase: number;
  shipRate: number;
  isActive: boolean;
}

export interface CreateShipMethodDto {
  name: string;
  shipBase: number;
  shipRate: number;
  isActive: boolean;
}

export interface UpdateShipMethodDto {
  name?: string;
  shipBase?: number;
  shipRate?: number;
  isActive?: boolean;
} 