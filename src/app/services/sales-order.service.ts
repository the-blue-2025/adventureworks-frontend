import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { SalesOrderDto, CreateSalesOrderDto, UpdateSalesOrderDto } from '../models/sales-order.dto';
import { SalesOrderDetailDto, CreateSalesOrderDetailDto, UpdateSalesOrderDetailDto } from '../models/sales-order-detail.dto';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderService {
  private httpRepository = inject(HttpRepository);

  // Signals for reactive parameters
  private searchQuerySignal = signal<string>('');
  private selectedSalesOrderId = signal<number | null>(null);
  private selectedDetailId = signal<number | null>(null);
  private customerFilter = signal<number | null>(null);
  private statusFilter = signal<string>('');

  // State signals for Sales Orders
  private salesOrdersSignal = signal<SalesOrderDto[]>([]);
  private selectedSalesOrderSignal = signal<SalesOrderDto | null>(null);
  private salesOrdersLoadingSignal = signal<boolean>(false);
  private salesOrdersErrorSignal = signal<string | null>(null);

  // State signals for Sales Order Details
  private salesOrderDetailsSignal = signal<SalesOrderDetailDto[]>([]);
  private selectedDetailSignal = signal<SalesOrderDetailDto | null>(null);
  private detailsLoadingSignal = signal<boolean>(false);
  private detailsErrorSignal = signal<string | null>(null);

  // Computed signals for Sales Orders
  public salesOrders = computed(() => this.salesOrdersSignal());
  public selectedSalesOrder = computed(() => this.selectedSalesOrderSignal());
  public salesOrdersLoading = computed(() => this.salesOrdersLoadingSignal());
  public salesOrdersError = computed(() => this.salesOrdersErrorSignal());
  public salesOrdersHasError = computed(() => !!this.salesOrdersError());

  // Computed signals for Sales Order Details
  public salesOrderDetails = computed(() => this.salesOrderDetailsSignal());
  public selectedDetail = computed(() => this.selectedDetailSignal());
  public detailsLoading = computed(() => this.detailsLoadingSignal());
  public detailsError = computed(() => this.detailsErrorSignal());
  public detailsHasError = computed(() => !!this.detailsError());

  // Combined computed signals
  public isLoading = computed(() => this.salesOrdersLoading() || this.detailsLoading());
  public hasError = computed(() => this.salesOrdersHasError() || this.detailsHasError());
  public isEmpty = computed(() => this.salesOrders().length === 0);
  public searchQuery = computed(() => this.searchQuerySignal());

  // Additional computed signals for details
  public detailsIsEmpty = computed(() => this.salesOrderDetails().length === 0);

  constructor() {
    // Auto-load sales orders when search query or filters change
    effect(() => {
      const query = this.searchQuerySignal();
      const customerId = this.customerFilter();
      const status = this.statusFilter();
      this.loadSalesOrders(query, customerId, status);
    });

    // Auto-load selected sales order when ID changes
    effect(() => {
      const id = this.selectedSalesOrderId();
      if (id) {
        this.loadSalesOrderById(id);
      } else {
        this.selectedSalesOrderSignal.set(null);
      }
    });

    // Auto-load sales order details when sales order changes
    effect(() => {
      const salesOrderId = this.selectedSalesOrderId();
      if (salesOrderId) {
        this.loadSalesOrderDetails(salesOrderId);
      } else {
        this.salesOrderDetailsSignal.set([]);
      }
    });

    // Auto-load selected detail when detail ID changes
    effect(() => {
      const detailId = this.selectedDetailId();
      if (detailId) {
        this.loadSalesOrderDetailById(detailId);
      } else {
        this.selectedDetailSignal.set(null);
      }
    });

    // Initial load of sales orders
    this.loadSalesOrders();
  }

  // Methods to update reactive parameters
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }

  setCustomerFilter(customerId: number | null): void {
    this.customerFilter.set(customerId);
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
  }

  selectSalesOrder(id: number | null): void {
    this.selectedSalesOrderId.set(id);
  }

  selectDetail(id: number | null): void {
    this.selectedDetailId.set(id);
  }

  // Data loading methods for Sales Orders
  private async loadSalesOrders(searchQuery?: string, customerId?: number | null, status?: string): Promise<void> {
    this.salesOrdersLoadingSignal.set(true);
    this.salesOrdersErrorSignal.set(null);

    try {
      let params = new HttpParams();
      
      if (searchQuery && searchQuery.trim()) {
        params = params.set('q', searchQuery.trim());
      }
      if (customerId) {
        params = params.set('customerId', customerId.toString());
      }
      if (status && status.trim()) {
        params = params.set('status', status.trim());
      }
      
      console.log('Loading sales orders with params:', params.toString());
      const orders = await firstValueFrom(this.httpRepository.get<SalesOrderDto[]>('/sales-orders', { params }));
      console.log('Received sales orders:', orders);
      this.salesOrdersSignal.set(orders || []);
    } catch (err) {
      console.error('Error loading sales orders:', err);
      this.salesOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to load sales orders');
    } finally {
      this.salesOrdersLoadingSignal.set(false);
    }
  }

  private async loadSalesOrderById(id: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.httpRepository.get<any>(`/sales-orders/${id}`));
      
      // Handle different response structures
      let order: SalesOrderDto | null = null;
      if (response && response.salesOrderId) {
        order = response;
      } else if (response && response.value && response.value.salesOrderId) {
        order = response.value;
      }
      
      this.selectedSalesOrderSignal.set(order || null);
    } catch (err) {
      this.salesOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to load sales order');
      this.selectedSalesOrderSignal.set(null);
    }
  }

  // Data loading methods for Sales Order Details
  private async loadSalesOrderDetails(salesOrderId: number): Promise<void> {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);

    try {
      const details = await firstValueFrom(this.httpRepository.get<SalesOrderDetailDto[]>(`/sales-orders/${salesOrderId}/details`));
      this.salesOrderDetailsSignal.set(details || []);
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to load sales order details');
    } finally {
      this.detailsLoadingSignal.set(false);
    }
  }

  private async loadSalesOrderDetailById(id: number): Promise<void> {
    try {
      const detail = await firstValueFrom(this.httpRepository.get<SalesOrderDetailDto>(`/sales-order-details/${id}`));
      this.selectedDetailSignal.set(detail || null);
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to load sales order detail');
      this.selectedDetailSignal.set(null);
    }
  }

  // CRUD operations for Sales Orders
  async getSalesOrder(id: number): Promise<SalesOrderDto | null> {
    try {
      const response = await firstValueFrom(this.httpRepository.get<any>(`/sales-orders/${id}`));
      
      // Handle different response structures
      let order: SalesOrderDto | null = null;
      if (response && response.salesOrderId) {
        order = response;
      } else if (response && response.value && response.value.salesOrderId) {
        order = response.value;
      }
      
      return order;
    } catch (err) {
      console.error('Failed to load sales order:', err);
      return null;
    }
  }

  async createSalesOrder(order: CreateSalesOrderDto): Promise<SalesOrderDto> {
    this.salesOrdersLoadingSignal.set(true);
    this.salesOrdersErrorSignal.set(null);

    try {
      const newOrder = await firstValueFrom(this.httpRepository.post<SalesOrderDto>('/sales-orders', order));
      if (newOrder) {
        this.salesOrdersSignal.update(orders => [...orders, newOrder]);
        return newOrder;
      }
      throw new Error('Failed to create sales order');
    } catch (err) {
      this.salesOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to create sales order');
      throw err;
    } finally {
      this.salesOrdersLoadingSignal.set(false);
    }
  }

  async updateSalesOrder(id: number, order: UpdateSalesOrderDto): Promise<SalesOrderDto> {
    this.salesOrdersLoadingSignal.set(true);
    this.salesOrdersErrorSignal.set(null);

    try {
      const updatedOrder = await firstValueFrom(this.httpRepository.put<SalesOrderDto>(`/sales-orders/${id}`, order));
      if (updatedOrder) {
        this.salesOrdersSignal.update(orders => 
          orders.map(o => o.salesOrderId === id ? updatedOrder : o)
        );
        
        if (this.selectedSalesOrderId() === id) {
          this.selectedSalesOrderSignal.set(updatedOrder);
        }
        
        return updatedOrder;
      }
      throw new Error('Failed to update sales order');
    } catch (err) {
      this.salesOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to update sales order');
      throw err;
    } finally {
      this.salesOrdersLoadingSignal.set(false);
    }
  }

  async deleteSalesOrder(id: number): Promise<void> {
    this.salesOrdersLoadingSignal.set(true);
    this.salesOrdersErrorSignal.set(null);

    try {
      await firstValueFrom(this.httpRepository.delete<void>(`/sales-orders/${id}`));
      
      this.salesOrdersSignal.update(orders => 
        orders.filter(o => o.salesOrderId !== id)
      );
      
      if (this.selectedSalesOrderId() === id) {
        this.selectSalesOrder(null);
      }
    } catch (err) {
      this.salesOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to delete sales order');
      throw err;
    } finally {
      this.salesOrdersLoadingSignal.set(false);
    }
  }

  // CRUD operations for Sales Order Details
  async getSalesOrderDetail(id: number): Promise<SalesOrderDetailDto | null> {
    try {
      const detail = await firstValueFrom(this.httpRepository.get<SalesOrderDetailDto>(`/sales-order-details/${id}`));
      return detail || null;
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to load sales order detail');
      return null;
    }
  }

  async createSalesOrderDetail(salesOrderId: number, detail: CreateSalesOrderDetailDto): Promise<SalesOrderDetailDto> {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);

    try {
      const newDetail = await firstValueFrom(this.httpRepository.post<SalesOrderDetailDto>(`/sales-orders/${salesOrderId}/details`, detail));
      if (newDetail) {
        this.salesOrderDetailsSignal.update(details => [...details, newDetail]);
        return newDetail;
      }
      throw new Error('Failed to create sales order detail');
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to create sales order detail');
      throw err;
    } finally {
      this.detailsLoadingSignal.set(false);
    }
  }

  async updateSalesOrderDetail(id: number, detail: UpdateSalesOrderDetailDto): Promise<SalesOrderDetailDto> {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);

    try {
      const updatedDetail = await firstValueFrom(this.httpRepository.put<SalesOrderDetailDto>(`/sales-order-details/${id}`, detail));
      if (updatedDetail) {
        this.salesOrderDetailsSignal.update(details => 
          details.map(d => d.salesOrderDetailId === id ? updatedDetail : d)
        );
        
        if (this.selectedDetailId() === id) {
          this.selectedDetailSignal.set(updatedDetail);
        }
        
        return updatedDetail;
      }
      throw new Error('Failed to update sales order detail');
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to update sales order detail');
      throw err;
    } finally {
      this.detailsLoadingSignal.set(false);
    }
  }

  async deleteSalesOrderDetail(id: number): Promise<void> {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);

    try {
      await firstValueFrom(this.httpRepository.delete<void>(`/sales-order-details/${id}`));
      
      this.salesOrderDetailsSignal.update(details => 
        details.filter(d => d.salesOrderDetailId !== id)
      );
      
      if (this.selectedDetailId() === id) {
        this.selectDetail(null);
      }
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to delete sales order detail');
      throw err;
    } finally {
      this.detailsLoadingSignal.set(false);
    }
  }

  // Utility methods
  reload(): void {
    this.loadSalesOrders(this.searchQuerySignal(), this.customerFilter(), this.statusFilter());
  }

  reloadDetails(): void {
    const salesOrderId = this.selectedSalesOrderId();
    if (salesOrderId) {
      this.loadSalesOrderDetails(salesOrderId);
    }
  }

  clearSearch(): void {
    this.searchQuerySignal.set('');
  }

  clearFilters(): void {
    this.customerFilter.set(null);
    this.statusFilter.set('');
  }

  clearError(): void {
    this.salesOrdersErrorSignal.set(null);
    this.detailsErrorSignal.set(null);
  }

  // Additional utility methods for details
  setSelectedSalesOrderDetail(id: number | null): void {
    this.selectDetail(id);
  }

  getSelectedSalesOrderDetail(): number | null {
    return this.selectedDetailId();
  }

  // Computed signals for filtered data
  public filteredSalesOrders = computed(() => {
    const orders = this.salesOrders();
    const query = this.searchQuerySignal();
    
    if (!query) return orders;
    
    return orders.filter((order: SalesOrderDto) => 
      order.salesOrderId?.toString().includes(query) ||
      order.customer?.firstName?.toLowerCase().includes(query.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(query.toLowerCase()) ||
      order.shipMethod?.name?.toLowerCase().includes(query.toLowerCase()) ||
      order.salesPerson?.firstName?.toLowerCase().includes(query.toLowerCase()) ||
      order.salesPerson?.lastName?.toLowerCase().includes(query.toLowerCase())
    );
  });

  public filteredDetails = computed(() => {
    const details = this.salesOrderDetails();
    const query = this.searchQuerySignal();
    
    if (!query) return details;
    
    return details.filter((detail: SalesOrderDetailDto) => 
      detail.productId?.toString().includes(query) ||
      detail.orderQty?.toString().includes(query) ||
      detail.unitPrice?.toString().includes(query) ||
      detail.lineTotal?.toString().includes(query)
    );
  });
} 