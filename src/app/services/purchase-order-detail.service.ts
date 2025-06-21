import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { PurchaseOrderDetailDto, CreatePurchaseOrderDetailDto, UpdatePurchaseOrderDetailDto } from '../models/purchase-order-detail.dto';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderDetailService {
  private httpRepository = inject(HttpRepository);

  async getPurchaseOrderDetail(id: number): Promise<PurchaseOrderDetailDto | null> {
    try {
      const detail = await firstValueFrom(this.httpRepository.get<PurchaseOrderDetailDto>(`/purchase-order-details/${id}`));
      return detail || null;
    } catch (err) {
      console.error('Failed to load purchase order detail:', err);
      return null;
    }
  }

  async createPurchaseOrderDetail(detail: CreatePurchaseOrderDetailDto): Promise<PurchaseOrderDetailDto> {
    try {
      const newDetail = await firstValueFrom(this.httpRepository.post<PurchaseOrderDetailDto>(`/purchase-orders/${detail.purchaseOrderId}/details`, detail));
      if (newDetail) {
        return newDetail;
      }
      throw new Error('Failed to create purchase order detail');
    } catch (err) {
      console.error('Failed to create purchase order detail:', err);
      throw err;
    }
  }

  async updatePurchaseOrderDetail(id: number, detail: UpdatePurchaseOrderDetailDto): Promise<PurchaseOrderDetailDto> {
    try {
      const updatedDetail = await firstValueFrom(this.httpRepository.put<PurchaseOrderDetailDto>(`/purchase-order-details/${id}`, detail));
      if (updatedDetail) {
        return updatedDetail;
      }
      throw new Error('Failed to update purchase order detail');
    } catch (err) {
      console.error('Failed to update purchase order detail:', err);
      throw err;
    }
  }

  async deletePurchaseOrderDetail(id: number): Promise<void> {
    try {
      await firstValueFrom(this.httpRepository.delete<void>(`/purchase-order-details/${id}`));
    } catch (err) {
      console.error('Failed to delete purchase order detail:', err);
      throw err;
    }
  }

  async getPurchaseOrderDetails(purchaseOrderId: number): Promise<PurchaseOrderDetailDto[]> {
    try {
      const details = await firstValueFrom(this.httpRepository.get<PurchaseOrderDetailDto[]>(`/purchase-orders/${purchaseOrderId}/details`));
      return details || [];
    } catch (err) {
      console.error('Failed to load purchase order details:', err);
      return [];
    }
  }
} 