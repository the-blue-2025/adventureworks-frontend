import { Component, inject, OnInit, signal, computed, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SalesOrderService } from '../../services/sales-order.service';
import { SalesOrderDetailDto } from '../../models/sales-order-detail.dto';
import { SalesOrderDetailFormComponent } from './sales-order-detail-form.component';

interface GroupedDetails {
  groupKey: string;
  groupName: string;
  details: SalesOrderDetailDto[];
  isExpanded: boolean;
  totalAmount: number;
}

@Component({
  selector: 'app-sales-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule, SalesOrderDetailFormComponent],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2>Sales Order Details</h2>
              <p class="text-muted" *ngIf="salesOrder()">
                Order #{{ salesOrder()?.salesOrderId }} - {{ salesOrder()?.customer?.firstName }} {{ salesOrder()?.customer?.lastName }}
              </p>
            </div>
            <div>
              <button class="btn btn-primary" (click)="openCreateModal()">
                <i class="bi bi-plus"></i> Add Detail
              </button>
              <button class="btn btn-secondary ms-2" (click)="goBack()">
                <i class="bi bi-arrow-left"></i> Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="row" *ngIf="loading()">
        <div class="col">
          <div class="text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading sales order details...</p>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div class="row" *ngIf="hasError()">
        <div class="col">
          <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">Error</h4>
            <p>{{ errorMessage() }}</p>
            <button class="btn btn-outline-danger" (click)="reload()">Retry</button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="row" *ngIf="!loading() && !hasError()">
        <div class="col">
          <!-- Sales Order Info -->
          <div class="card mb-4" *ngIf="salesOrder()">
            <div class="card-header">
              <h5 class="mb-0">Sales Order Information</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <strong>Order ID:</strong> {{ salesOrder()?.salesOrderId }}
                </div>
                <div class="col-md-3">
                  <strong>Customer:</strong> {{ salesOrder()?.customer?.firstName }} {{ salesOrder()?.customer?.lastName }}
                </div>
                <div class="col-md-3">
                  <strong>Ship Method:</strong> {{ salesOrder()?.shipMethod?.name }}
                </div>
                <div class="col-md-3">
                  <strong>Status:</strong> 
                  <span class="badge" [ngClass]="getStatusBadgeClass(salesOrder()?.status)">
                    {{ getStatusText(salesOrder()?.status) }}
                  </span>
                </div>
              </div>
              <div class="row mt-2">
                <div class="col-md-3">
                  <strong>Order Date:</strong> {{ salesOrder()?.orderDate | date }}
                </div>
                <div class="col-md-3">
                  <strong>Ship Date:</strong> {{ salesOrder()?.shipDate | date }}
                </div>
                <div class="col-md-3">
                  <strong>Sub Total:</strong> {{ salesOrder()?.subTotal | currency }}
                </div>
                <div class="col-md-3">
                  <strong>Total Due:</strong> {{ salesOrder()?.totalDue | currency }}
                </div>
              </div>
            </div>
          </div>

          <!-- Details Table -->
          <div class="card">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Order Details ({{ details().length }})</h5>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" 
                          [class.active]="groupBy() === 'none'"
                          (click)="setGroupBy('none')">
                    No Grouping
                  </button>
                  <button class="btn btn-outline-secondary" 
                          [class.active]="groupBy() === 'product'"
                          (click)="setGroupBy('product')">
                    Group by Product
                  </button>
                  <button class="btn btn-outline-secondary" 
                          [class.active]="groupBy() === 'price'"
                          (click)="setGroupBy('price')">
                    Group by Price Range
                  </button>
                </div>
              </div>
            </div>
            <div class="card-body">
              <!-- Grouped View -->
              <div *ngIf="groupBy() !== 'none'">
                <div *ngFor="let group of groupedDetails()" class="mb-3">
                  <!-- Group Header -->
                  <div class="group-header d-flex align-items-center p-2 bg-light border rounded cursor-pointer"
                       (click)="toggleGroup(group.groupKey)">
                    <i class="bi me-2" 
                       [class.bi-chevron-down]="group.isExpanded"
                       [class.bi-chevron-right]="!group.isExpanded"></i>
                    <span class="fw-bold">{{ group.groupName }}</span>
                    <span class="badge bg-secondary ms-2">{{ group.details.length }} items</span>
                    <span class="ms-auto fw-bold">{{ group.totalAmount | currency }}</span>
                  </div>
                  
                  <!-- Group Details -->
                  <div *ngIf="group.isExpanded" class="mt-2">
                    <div class="table-responsive">
                      <table class="table table-sm table-striped">
                        <thead>
                          <tr>
                            <th>Product ID</th>
                            <th>Order Qty</th>
                            <th>Unit Price</th>
                            <th>Discount</th>
                            <th>Line Total</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let detail of group.details" class="cursor-pointer" (click)="selectDetail(detail.salesOrderDetailId)">
                            <td>{{ detail.productId }}</td>
                            <td>{{ detail.orderQty }}</td>
                            <td>{{ detail.unitPrice | currency }}</td>
                            <td>{{ detail.unitPriceDiscount | currency }}</td>
                            <td>{{ detail.lineTotal | currency }}</td>
                            <td>
                              <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" (click)="openEditModal(detail); $event.stopPropagation()">
                                  <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" (click)="deleteDetail(detail.salesOrderDetailId); $event.stopPropagation()">
                                  <i class="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Regular View -->
              <div *ngIf="groupBy() === 'none'">
                <div class="table-responsive">
                  <table class="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Order Qty</th>
                        <th>Unit Price</th>
                        <th>Discount</th>
                        <th>Line Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let detail of details()" class="cursor-pointer" (click)="selectDetail(detail.salesOrderDetailId)">
                        <td>{{ detail.productId }}</td>
                        <td>{{ detail.orderQty }}</td>
                        <td>{{ detail.unitPrice | currency }}</td>
                        <td>{{ detail.unitPriceDiscount | currency }}</td>
                        <td>{{ detail.lineTotal | currency }}</td>
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" (click)="openEditModal(detail); $event.stopPropagation()">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" (click)="deleteDetail(detail.salesOrderDetailId); $event.stopPropagation()">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Empty State -->
              <div class="text-center py-4" *ngIf="isEmpty()">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h4 class="mt-3">No Details Found</h4>
                <p class="text-muted">This sales order doesn't have any details yet.</p>
                <button class="btn btn-primary" (click)="openCreateModal()">
                  <i class="bi bi-plus"></i> Add First Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Template -->
    <ng-template #modalTemplate>
      <app-sales-order-detail-form
        *ngIf="salesOrderId()"
        [salesOrderId]="salesOrderId()!"
        [detail]="selectedDetailForEdit()"
        (saved)="onDetailSaved()"
        (cancelled)="closeModal()">
      </app-sales-order-detail-form>
    </ng-template>
  `
})
export class SalesOrderDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private modalService = inject(NgbModal);
  protected salesOrderService = inject(SalesOrderService);

  // Template reference for modal
  @ViewChild('modalTemplate', { static: true }) modalTemplate!: TemplateRef<any>;

  // Component state
  private modalRef: NgbModalRef | null = null;
  private selectedDetailForEditSignal = signal<SalesOrderDetailDto | null>(null);
  private groupBySignal = signal<'none' | 'product' | 'price'>('none');
  private expandedGroupsSignal = signal<Set<string>>(new Set());

  // Computed signals from service
  protected salesOrder = this.salesOrderService.selectedSalesOrder;
  protected details = this.salesOrderService.salesOrderDetails;
  protected loading = this.salesOrderService.detailsLoading;
  protected hasError = this.salesOrderService.detailsHasError;
  protected errorMessage = this.salesOrderService.detailsError;
  protected isEmpty = this.salesOrderService.detailsIsEmpty;

  // Computed signals for component
  protected salesOrderId = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? parseInt(id, 10) : null;
  });

  protected selectedDetailForEdit = this.selectedDetailForEditSignal.asReadonly();
  protected groupBy = this.groupBySignal.asReadonly();

  // Computed signal for grouped details
  protected groupedDetails = computed(() => {
    const details = this.details();
    const groupBy = this.groupBySignal();
    const expandedGroups = this.expandedGroupsSignal();

    if (groupBy === 'none') {
      return [];
    }

    const groups = new Map<string, GroupedDetails>();

    details.forEach(detail => {
      let groupKey = '';
      let groupName = '';

      if (groupBy === 'product') {
        groupKey = `product-${detail.productId}`;
        groupName = `Product ${detail.productId}`;
      } else if (groupBy === 'price') {
        const priceRange = this.getPriceRange(detail.unitPrice);
        groupKey = `price-${priceRange}`;
        groupName = priceRange;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupKey,
          groupName,
          details: [],
          isExpanded: expandedGroups.has(groupKey),
          totalAmount: 0
        });
      }

      const group = groups.get(groupKey)!;
      group.details.push(detail);
      group.totalAmount += detail.lineTotal;
    });

    return Array.from(groups.values()).sort((a, b) => a.groupName.localeCompare(b.groupName));
  });

  ngOnInit(): void {
    const id = this.salesOrderId();
    if (id) {
      this.salesOrderService.selectSalesOrder(id);
    } else {
      this.goBack();
    }
  }

  selectDetail(detailId: number): void {
    this.salesOrderService.selectDetail(detailId);
  }

  openCreateModal(): void {
    const id = this.salesOrderId();
    if (!id) {
      console.error('No sales order ID available');
      return;
    }
    this.selectedDetailForEditSignal.set(null);
    this.openModal();
  }

  openEditModal(detail: SalesOrderDetailDto): void {
    const id = this.salesOrderId();
    if (!id) {
      console.error('No sales order ID available');
      return;
    }
    this.selectedDetailForEditSignal.set(detail);
    this.openModal();
  }

  private openModal(): void {
    const id = this.salesOrderId();
    if (!id) {
      console.error('Cannot open modal: No sales order ID');
      return;
    }
    
    this.modalRef = this.modalService.open(this.modalTemplate, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }

  async onDetailSaved(): Promise<void> {
    this.closeModal();
    await this.reload();
  }

  async deleteDetail(detailId: number): Promise<void> {
    if (confirm('Are you sure you want to delete this detail?')) {
      try {
        await this.salesOrderService.deleteSalesOrderDetail(detailId);
        // Details will be automatically updated via the service
      } catch (error) {
        console.error('Failed to delete detail:', error);
        alert('Failed to delete detail. Please try again.');
      }
    }
  }

  async reload(): Promise<void> {
    const id = this.salesOrderId();
    if (id) {
      this.salesOrderService.reloadDetails();
    }
  }

  goBack(): void {
    this.router.navigate(['/sales-orders']);
  }

  getStatusBadgeClass(status?: number | null): string {
    switch (status) {
      case 1:
        return 'bg-warning'; // In Process
      case 2:
        return 'bg-success'; // Approved
      case 3:
        return 'bg-info'; // Backordered
      case 4:
        return 'bg-danger'; // Rejected
      case 5:
        return 'bg-primary'; // Shipped
      case 6:
        return 'bg-secondary'; // Cancelled
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(status?: number | null): string {
    switch (status) {
      case 1:
        return 'In Process';
      case 2:
        return 'Approved';
      case 3:
        return 'Backordered';
      case 4:
        return 'Rejected';
      case 5:
        return 'Shipped';
      case 6:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  // Grouping methods
  setGroupBy(groupBy: 'none' | 'product' | 'price'): void {
    this.groupBySignal.set(groupBy);
  }

  toggleGroup(groupKey: string): void {
    const expandedGroups = new Set(this.expandedGroupsSignal());
    if (expandedGroups.has(groupKey)) {
      expandedGroups.delete(groupKey);
    } else {
      expandedGroups.add(groupKey);
    }
    this.expandedGroupsSignal.set(expandedGroups);
  }

  getPriceRange(unitPrice: number): string {
    if (unitPrice < 100) {
      return 'Under $100';
    } else if (unitPrice < 500) {
      return '$100 - $499';
    } else if (unitPrice < 1000) {
      return '$500 - $999';
    } else {
      return '$1000+';
    }
  }
} 