import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { PurchaseOrderDto, CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../models/purchase-order.dto';
import { PurchaseOrderDetailDto, CreatePurchaseOrderDetailDto, UpdatePurchaseOrderDetailDto } from '../models/purchase-order-detail.dto';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private httpRepository = inject(HttpRepository);

  // Signals for reactive parameters
  private searchQuerySignal = signal<string>('');
  private selectedPurchaseOrderId = signal<number | null>(null);
  private selectedDetailId = signal<number | null>(null);
  private vendorFilter = signal<number | null>(null);
  private statusFilter = signal<string>('');

  // State signals for Purchase Orders
  private purchaseOrdersSignal = signal<PurchaseOrderDto[]>([]);
  private selectedPurchaseOrderSignal = signal<PurchaseOrderDto | null>(null);
  private purchaseOrdersLoadingSignal = signal<boolean>(false);
  private purchaseOrdersErrorSignal = signal<string | null>(null);

  // State signals for Purchase Order Details
  private purchaseOrderDetailsSignal = signal<PurchaseOrderDetailDto[]>([]);
  private selectedDetailSignal = signal<PurchaseOrderDetailDto | null>(null);
  private detailsLoadingSignal = signal<boolean>(false);
  private detailsErrorSignal = signal<string | null>(null);

  // Computed signals for Purchase Orders
  public purchaseOrders = computed(() => this.purchaseOrdersSignal());
  public selectedPurchaseOrder = computed(() => this.selectedPurchaseOrderSignal());
  public purchaseOrdersLoading = computed(() => this.purchaseOrdersLoadingSignal());
  public purchaseOrdersError = computed(() => this.purchaseOrdersErrorSignal());
  public purchaseOrdersHasError = computed(() => !!this.purchaseOrdersError());

  // Computed signals for Purchase Order Details
  public purchaseOrderDetails = computed(() => this.purchaseOrderDetailsSignal());
  public selectedDetail = computed(() => this.selectedDetailSignal());
  public detailsLoading = computed(() => this.detailsLoadingSignal());
  public detailsError = computed(() => this.detailsErrorSignal());
  public detailsHasError = computed(() => !!this.detailsError());

  // Combined computed signals
  public isLoading = computed(() => this.purchaseOrdersLoading() || this.detailsLoading());
  public hasError = computed(() => this.purchaseOrdersHasError() || this.detailsHasError());
  public isEmpty = computed(() => this.purchaseOrders().length === 0);
  public searchQuery = computed(() => this.searchQuerySignal());

  // Additional computed signals for details
  public detailsIsEmpty = computed(() => this.purchaseOrderDetails().length === 0);

  constructor() {
    // Auto-load purchase orders when search query or filters change
    effect(() => {
      const query = this.searchQuerySignal();
      const vendorId = this.vendorFilter();
      const status = this.statusFilter();
      this.loadPurchaseOrders(query, vendorId, status);
    });

    // Auto-load selected purchase order when ID changes
    effect(() => {
      const id = this.selectedPurchaseOrderId();
      if (id) {
        this.loadPurchaseOrderById(id);
      } else {
        this.selectedPurchaseOrderSignal.set(null);
      }
    });

    // Auto-load purchase order details when purchase order changes
    effect(() => {
      const purchaseOrderId = this.selectedPurchaseOrderId();
      if (purchaseOrderId) {
        this.loadPurchaseOrderDetails(purchaseOrderId);
      } else {
        this.purchaseOrderDetailsSignal.set([]);
      }
    });

    // Auto-load selected detail when detail ID changes
    effect(() => {
      const detailId = this.selectedDetailId();
      if (detailId) {
        this.loadPurchaseOrderDetailById(detailId);
      } else {
        this.selectedDetailSignal.set(null);
      }
    });

    // Initial load of purchase orders
    this.loadPurchaseOrders();
  }

  // Methods to update reactive parameters
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }

  setVendorFilter(vendorId: number | null): void {
    this.vendorFilter.set(vendorId);
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
  }

  selectPurchaseOrder(id: number | null): void {
    this.selectedPurchaseOrderId.set(id);
  }

  selectDetail(id: number | null): void {
    this.selectedDetailId.set(id);
  }

  // Data loading methods for Purchase Orders
  private async loadPurchaseOrders(searchQuery?: string, vendorId?: number | null, status?: string): Promise<void> {
    this.purchaseOrdersLoadingSignal.set(true);
    this.purchaseOrdersErrorSignal.set(null);

    try {
      let params = new HttpParams();
      
      if (searchQuery && searchQuery.trim()) {
        params = params.set('q', searchQuery.trim());
      }
      if (vendorId) {
        params = params.set('vendorId', vendorId.toString());
      }
      if (status && status.trim()) {
        params = params.set('status', status.trim());
      }
      
      const orders = await firstValueFrom(this.httpRepository.get<PurchaseOrderDto[]>('/purchase-orders', { params }));
      this.purchaseOrdersSignal.set(orders || []);
    } catch (err) {
      this.purchaseOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to load purchase orders');
    } finally {
      this.purchaseOrdersLoadingSignal.set(false);
    }
  }

  private async loadPurchaseOrderById(id: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.httpRepository.get<any>(`/purchase-orders/${id}`));
      
      // Handle different response structures
      let order: PurchaseOrderDto | null = null;
      if (response && response.purchaseOrderId) {
        order = response;
      } else if (response && response.value && response.value.purchaseOrderId) {
        order = response.value;
      }
      
      this.selectedPurchaseOrderSignal.set(order || null);
    } catch (err) {
      this.purchaseOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to load purchase order');
      this.selectedPurchaseOrderSignal.set(null);
    }
  }

  // Data loading methods for Purchase Order Details
  private async loadPurchaseOrderDetails(purchaseOrderId: number): Promise<void> {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);

    try {
      const details = await firstValueFrom(this.httpRepository.get<PurchaseOrderDetailDto[]>(`/purchase-orders/${purchaseOrderId}/details`));
      this.purchaseOrderDetailsSignal.set(details || []);
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to load purchase order details');
    } finally {
      this.detailsLoadingSignal.set(false);
    }
  }

  private async loadPurchaseOrderDetailById(id: number): Promise<void> {
    try {
      const detail = await firstValueFrom(this.httpRepository.get<PurchaseOrderDetailDto>(`/purchase-order-details/${id}`));
      this.selectedDetailSignal.set(detail || null);
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to load purchase order detail');
      this.selectedDetailSignal.set(null);
    }
  }

  // CRUD operations for Purchase Orders
  async getPurchaseOrder(id: number): Promise<PurchaseOrderDto | null> {
    try {
      const response = await firstValueFrom(this.httpRepository.get<any>(`/purchase-orders/${id}`));
      
      // Handle different response structures
      let order: PurchaseOrderDto | null = null;
      if (response && response.purchaseOrderId) {
        order = response;
      } else if (response && response.value && response.value.purchaseOrderId) {
        order = response.value;
      }
      
      return order;
    } catch (err) {
      console.error('Failed to load purchase order:', err);
      return null;
    }
  }

  async createPurchaseOrder(order: CreatePurchaseOrderDto): Promise<PurchaseOrderDto> {
    this.purchaseOrdersLoadingSignal.set(true);
    this.purchaseOrdersErrorSignal.set(null);

    try {
      const newOrder = await firstValueFrom(this.httpRepository.post<PurchaseOrderDto>('/purchase-orders', order));
      if (newOrder) {
        this.purchaseOrdersSignal.update(orders => [...orders, newOrder]);
        return newOrder;
      }
      throw new Error('Failed to create purchase order');
    } catch (err) {
      this.purchaseOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to create purchase order');
      throw err;
    } finally {
      this.purchaseOrdersLoadingSignal.set(false);
    }
  }

  async updatePurchaseOrder(id: number, order: UpdatePurchaseOrderDto): Promise<PurchaseOrderDto> {
    this.purchaseOrdersLoadingSignal.set(true);
    this.purchaseOrdersErrorSignal.set(null);

    try {
      const updatedOrder = await firstValueFrom(this.httpRepository.put<PurchaseOrderDto>(`/purchase-orders/${id}`, order));
      if (updatedOrder) {
        this.purchaseOrdersSignal.update(orders => 
          orders.map(o => o.purchaseOrderId === id ? updatedOrder : o)
        );
        
        if (this.selectedPurchaseOrderId() === id) {
          this.selectedPurchaseOrderSignal.set(updatedOrder);
        }
        
        return updatedOrder;
      }
      throw new Error('Failed to update purchase order');
    } catch (err) {
      this.purchaseOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to update purchase order');
      throw err;
    } finally {
      this.purchaseOrdersLoadingSignal.set(false);
    }
  }

  async deletePurchaseOrder(id: number): Promise<void> {
    this.purchaseOrdersLoadingSignal.set(true);
    this.purchaseOrdersErrorSignal.set(null);

    try {
      await firstValueFrom(this.httpRepository.delete<void>(`/purchase-orders/${id}`));
      
      this.purchaseOrdersSignal.update(orders => 
        orders.filter(o => o.purchaseOrderId !== id)
      );
      
      if (this.selectedPurchaseOrderId() === id) {
        this.selectPurchaseOrder(null);
      }
    } catch (err) {
      this.purchaseOrdersErrorSignal.set(err instanceof Error ? err.message : 'Failed to delete purchase order');
      throw err;
    } finally {
      this.purchaseOrdersLoadingSignal.set(false);
    }
  }

  // CRUD operations for Purchase Order Details
  async getPurchaseOrderDetail(id: number): Promise<PurchaseOrderDetailDto | null> {
    try {
      const detail = await firstValueFrom(this.httpRepository.get<PurchaseOrderDetailDto>(`/purchase-order-details/${id}`));
      return detail || null;
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to load purchase order detail');
      return null;
    }
  }

  async createPurchaseOrderDetail(purchaseOrderId: number, detail: CreatePurchaseOrderDetailDto): Promise<PurchaseOrderDetailDto> {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);

    try {
      const newDetail = await firstValueFrom(this.httpRepository.post<PurchaseOrderDetailDto>(`/purchase-orders/${purchaseOrderId}/details`, detail));
      if (newDetail) {
        this.purchaseOrderDetailsSignal.update(details => [...details, newDetail]);
        return newDetail;
      }
      throw new Error('Failed to create purchase order detail');
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to create purchase order detail');
      throw err;
    } finally {
      this.detailsLoadingSignal.set(false);
    }
  }

  async updatePurchaseOrderDetail(id: number, detail: UpdatePurchaseOrderDetailDto): Promise<PurchaseOrderDetailDto> {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);

    try {
      const updatedDetail = await firstValueFrom(this.httpRepository.put<PurchaseOrderDetailDto>(`/purchase-order-details/${id}`, detail));
      if (updatedDetail) {
        this.purchaseOrderDetailsSignal.update(details => 
          details.map(d => d.purchaseOrderDetailId === id ? updatedDetail : d)
        );
        
        if (this.selectedDetailId() === id) {
          this.selectedDetailSignal.set(updatedDetail);
        }
        
        return updatedDetail;
      }
      throw new Error('Failed to update purchase order detail');
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to update purchase order detail');
      throw err;
    } finally {
      this.detailsLoadingSignal.set(false);
    }
  }

  async deletePurchaseOrderDetail(id: number): Promise<void> {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);

    try {
      await firstValueFrom(this.httpRepository.delete<void>(`/purchase-order-details/${id}`));
      
      this.purchaseOrderDetailsSignal.update(details => 
        details.filter(d => d.purchaseOrderDetailId !== id)
      );
      
      if (this.selectedDetailId() === id) {
        this.selectDetail(null);
      }
    } catch (err) {
      this.detailsErrorSignal.set(err instanceof Error ? err.message : 'Failed to delete purchase order detail');
      throw err;
    } finally {
      this.detailsLoadingSignal.set(false);
    }
  }

  // Utility methods
  reload(): void {
    this.loadPurchaseOrders(this.searchQuerySignal(), this.vendorFilter(), this.statusFilter());
  }

  reloadDetails(): void {
    const purchaseOrderId = this.selectedPurchaseOrderId();
    if (purchaseOrderId) {
      this.loadPurchaseOrderDetails(purchaseOrderId);
    }
  }

  clearSearch(): void {
    this.searchQuerySignal.set('');
  }

  clearFilters(): void {
    this.vendorFilter.set(null);
    this.statusFilter.set('');
  }

  clearError(): void {
    this.purchaseOrdersErrorSignal.set(null);
    this.detailsErrorSignal.set(null);
  }

  // Additional utility methods for details
  setSelectedPurchaseOrderDetail(id: number | null): void {
    this.selectDetail(id);
  }

  getSelectedPurchaseOrderDetail(): number | null {
    return this.selectedDetailId();
  }

  // Computed signals for filtered data
  public filteredPurchaseOrders = computed(() => {
    const orders = this.purchaseOrders();
    const query = this.searchQuerySignal();
    
    if (!query) return orders;
    
    return orders.filter((order: PurchaseOrderDto) => 
      order.purchaseOrderId?.toString().includes(query) ||
      order.vendor?.name?.toLowerCase().includes(query.toLowerCase()) ||
      order.shipMethod?.name?.toLowerCase().includes(query.toLowerCase()) ||
      order.employee?.firstName?.toLowerCase().includes(query.toLowerCase()) ||
      order.employee?.lastName?.toLowerCase().includes(query.toLowerCase())
    );
  });

  public filteredDetails = computed(() => {
    const details = this.purchaseOrderDetails();
    const query = this.searchQuerySignal();
    
    if (!query) return details;
    
    return details.filter((detail: PurchaseOrderDetailDto) => 
      detail.productId?.toString().includes(query) ||
      detail.orderQty?.toString().includes(query) ||
      detail.unitPrice?.toString().includes(query) ||
      detail.lineTotal?.toString().includes(query)
    );
  });
} 