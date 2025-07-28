import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { SalesOrderDetailDto, CreateSalesOrderDetailDto, UpdateSalesOrderDetailDto } from '../models/sales-order-detail.dto';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderDetailService {
  private httpRepository = inject(HttpRepository);

  async getSalesOrderDetails(salesOrderId: number): Promise<SalesOrderDetailDto[]> {
    try {
      const details = await firstValueFrom(this.httpRepository.get<SalesOrderDetailDto[]>(`/sales-orders/${salesOrderId}/details`));
      return details || [];
    } catch (err) {
      console.error('Failed to load sales order details:', err);
      return [];
    }
  }

  async getSalesOrderDetail(id: number): Promise<SalesOrderDetailDto | null> {
    try {
      const detail = await firstValueFrom(this.httpRepository.get<SalesOrderDetailDto>(`/sales-order-details/${id}`));
      return detail || null;
    } catch (err) {
      console.error('Failed to load sales order detail:', err);
      return null;
    }
  }

  async createSalesOrderDetail(detail: CreateSalesOrderDetailDto): Promise<SalesOrderDetailDto> {
    try {
      const newDetail = await firstValueFrom(this.httpRepository.post<SalesOrderDetailDto>(`/sales-orders/${detail.salesOrderId}/details`, detail));
      if (!newDetail) {
        throw new Error('Failed to create sales order detail');
      }
      return newDetail;
    } catch (err) {
      console.error('Failed to create sales order detail:', err);
      throw err;
    }
  }

  async updateSalesOrderDetail(id: number, detail: UpdateSalesOrderDetailDto): Promise<SalesOrderDetailDto> {
    try {
      const updatedDetail = await firstValueFrom(this.httpRepository.put<SalesOrderDetailDto>(`/sales-order-details/${id}`, detail));
      if (!updatedDetail) {
        throw new Error('Failed to update sales order detail');
      }
      return updatedDetail;
    } catch (err) {
      console.error('Failed to update sales order detail:', err);
      throw err;
    }
  }

  async deleteSalesOrderDetail(id: number): Promise<void> {
    try {
      await firstValueFrom(this.httpRepository.delete<void>(`/sales-order-details/${id}`));
    } catch (err) {
      console.error('Failed to delete sales order detail:', err);
      throw err;
    }
  }
} 