export interface ShipMethodDto {
  shipMethodId: number;
  name: string;
  shipBase: number;
  shipRate: number;
}

export interface CreateShipMethodDto {
  name: string;
  shipBase: number;
  shipRate: number;
}

export interface UpdateShipMethodDto {
  name?: string;
  shipBase?: number;
  shipRate?: number;
} 