import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesOrderService } from '../../services/sales-order.service';
import { SalesOrderDto } from '../../models/sales-order.dto';

interface GroupedSalesOrders {
  groupKey: string;
  groupName: string;
  orders: SalesOrderDto[];
  isExpanded: boolean;
  totalAmount: number;
  orderCount: number;
}

@Component({
  selector: 'app-sales-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Sales Orders Management</h2>
          <button class="btn btn-info" (click)="createNewSalesOrder()">
            <i class="bi bi-plus-circle"></i> Add Sales Order
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search sales orders..."
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          >
          <button class="btn btn-outline-secondary" type="button" (click)="clearSearch()">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>
      </div>
      <div class="col-md-2">
        <select class="form-select" [(ngModel)]="selectedStatus" (change)="onStatusChange()">
          <option value="">All Statuses</option>
          <option value="1">In Process</option>
          <option value="2">Approved</option>
          <option value="3">Backordered</option>
          <option value="4">Rejected</option>
          <option value="5">Shipped</option>
          <option value="6">Cancelled</option>
        </select>
      </div>
      <div class="col-md-3">
        <div class="btn-group w-100" role="group">
          <button class="btn btn-outline-secondary" 
                  [class.active]="groupBy() === 'none'"
                  (click)="setGroupBy('none')">
            No Grouping
          </button>
          <button class="btn btn-outline-secondary" 
                  [class.active]="groupBy() === 'customer'"
                  (click)="setGroupBy('customer')">
            Group by Customer
          </button>
        </div>
      </div>
      <div class="col-md-3">
        <button class="btn btn-outline-info w-100" (click)="reload()">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="salesOrderService.isLoading()" class="text-center py-5">
      <div class="spinner-border text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>



    <!-- Empty State -->
    <div *ngIf="!salesOrderService.isLoading() && salesOrderService.salesOrders().length === 0" class="text-center py-5">
      <i class="bi bi-cart fs-1 text-muted"></i>
      <h4 class="text-muted mt-3">No sales orders found</h4>
      <p class="text-muted">Try adjusting your search criteria or add a new sales order.</p>
    </div>

    <!-- Data Table -->
    <div *ngIf="!salesOrderService.isLoading() && salesOrderService.salesOrders().length > 0">
      
      <!-- Grouped View -->
      <div *ngIf="groupBy() !== 'none'">
        <!-- Column Headers for Grouped View -->
        <div class="table-responsive mb-3">
          <table class="table table-sm table-dark">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Sales Person</th>
                <th>Order Date</th>
                <th>Ship Date</th>
                <th>Ship Method</th>
                <th>Total Due</th>
                <th>Actions</th>
              </tr>
            </thead>
          </table>
        </div>
        
        <div *ngFor="let group of groupedSalesOrders()" class="mb-4">
          <!-- Group Header -->
          <div class="group-header d-flex align-items-center p-3 bg-light border rounded cursor-pointer"
               (click)="toggleGroup(group.groupKey)">
            <i class="bi me-2" 
               [class.bi-chevron-down]="group.isExpanded"
               [class.bi-chevron-right]="!group.isExpanded"></i>
            <span class="fw-bold">{{ group.groupName }}</span>
            <span class="badge bg-secondary ms-2">{{ group.orderCount }} orders</span>
            <span class="ms-auto fw-bold text-success">{{ group.totalAmount | currency }}</span>
          </div>
          
          <!-- Group Details -->
          <div *ngIf="group.isExpanded" class="mt-2">
            <div class="table-responsive">
              <table class="table table-sm table-striped">
                <tbody>
                  <tr *ngFor="let so of group.orders" 
                      (click)="viewDetails(so)" 
                      class="cursor-pointer">
                    <td>{{ so.salesOrderId }}</td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadgeClass(so.status)">
                        {{ getStatusText(so.status) }}
                      </span>
                    </td>
                    <td>
                      <span *ngIf="so.salesPerson; else noSalesPerson">
                        {{ so.salesPerson.firstName }} {{ so.salesPerson.lastName }}
                      </span>
                      <ng-template #noSalesPerson>
                        <span class="text-muted">N/A</span>
                      </ng-template>
                    </td>
                    <td>{{ so.orderDate | date:'short' }}</td>
                    <td>
                      <span *ngIf="so.shipDate; else noShipDate">
                        {{ so.shipDate | date:'short' }}
                      </span>
                      <ng-template #noShipDate>
                        <span class="text-muted">Not set</span>
                      </ng-template>
                    </td>
                    <td>
                      <span *ngIf="so.shipMethod; else noShipMethod">
                        {{ so.shipMethod.name }}
                      </span>
                      <ng-template #noShipMethod>
                        <span class="text-muted">N/A</span>
                      </ng-template>
                    </td>
                    <td>
                      <strong class="text-success">{{ so.totalDue | currency }}</strong>
                      <br>
                      <small class="text-muted">
                        Sub: {{ so.subTotal | currency }} | Tax: {{ so.taxAmt | currency }} | Freight: {{ so.freight | currency }}
                      </small>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm" role="group" (click)="$event.stopPropagation()">
                        <button class="btn btn-outline-info" (click)="viewDetails(so)" title="View Details">
                          <i class="bi bi-list-ul"></i>
                        </button>
                        <button class="btn btn-outline-warning" (click)="editSalesOrder(so)">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" (click)="deleteSalesOrder(so)">
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
      <div *ngIf="groupBy() === 'none'" class="table-responsive">
        <table class="table table-striped table-hover">
          <thead class="table-dark">
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Customer</th>
              <th>Sales Person</th>
              <th>Order Date</th>
              <th>Ship Date</th>
              <th>Ship Method</th>
              <th>Total Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let so of salesOrderService.salesOrders()" 
                (click)="viewDetails(so)" 
                class="cursor-pointer"
                style="cursor: pointer;">
              <td>{{ so.salesOrderId }}</td>
              <td>
                <span class="badge" [ngClass]="getStatusBadgeClass(so.status)">
                  {{ getStatusText(so.status) }}
                </span>
              </td>
              <td>
                <strong>{{ so.customer?.firstName }} {{ so.customer?.lastName }}</strong>
                <br>
                <small class="text-muted">{{ so.customer?.emailAddress || '' }}</small>
              </td>
              <td>
                <span *ngIf="so.salesPerson; else noSalesPerson">
                  {{ so.salesPerson.firstName }} {{ so.salesPerson.lastName }}
                </span>
                <ng-template #noSalesPerson>
                  <span class="text-muted">N/A</span>
                </ng-template>
              </td>
              <td>{{ so.orderDate | date:'short' }}</td>
              <td>
                <span *ngIf="so.shipDate; else noShipDate">
                  {{ so.shipDate | date:'short' }}
                </span>
                <ng-template #noShipDate>
                  <span class="text-muted">Not set</span>
                </ng-template>
              </td>
              <td>
                <span *ngIf="so.shipMethod; else noShipMethod">
                  {{ so.shipMethod.name }}
                </span>
                <ng-template #noShipMethod>
                  <span class="text-muted">N/A</span>
                </ng-template>
              </td>
              <td>
                <strong class="text-success">{{ so.totalDue | currency }}</strong>
                <br>
                <small class="text-muted">
                  Sub: {{ so.subTotal | currency }} | Tax: {{ so.taxAmt | currency }} | Freight: {{ so.freight | currency }}
                </small>
              </td>
              <td>
                <div class="btn-group" role="group" (click)="$event.stopPropagation()">
                  <button class="btn btn-sm btn-outline-info" (click)="viewDetails(so)" title="View Details">
                    <i class="bi bi-list-ul"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-warning" (click)="editSalesOrder(so)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteSalesOrder(so)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class SalesOrdersComponent implements OnInit {
  private router = inject(Router);
  protected salesOrderService = inject(SalesOrderService);

  searchQuery = '';
  selectedStatus = '';
  groupBy = signal<'none' | 'customer'>('none');
  expandedGroups = signal<Set<string>>(new Set());

  ngOnInit(): void {
    // Component is ready
  }

  // Computed signal for grouped sales orders
  groupedSalesOrders = computed(() => {
    const orders = this.salesOrderService.salesOrders();
    const groupByValue = this.groupBy();
    const expandedGroupsSet = this.expandedGroups();

    if (groupByValue === 'none') {
      return [];
    }

    const groups = new Map<string, GroupedSalesOrders>();

    orders.forEach(order => {
      let groupKey = '';
      let groupName = '';

      if (groupByValue === 'customer') {
        const customerName = order.customer ? 
          `${order.customer.firstName} ${order.customer.lastName}` : 
          'Unknown Customer';
        groupKey = `customer-${customerName}`;
        groupName = customerName;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupKey,
          groupName,
          orders: [],
          isExpanded: expandedGroupsSet.has(groupKey),
          totalAmount: 0,
          orderCount: 0
        });
      }

      const group = groups.get(groupKey)!;
      group.orders.push(order);
      group.totalAmount += order.totalDue || 0;
      group.orderCount++;
    });

    return Array.from(groups.values()).sort((a, b) => a.groupName.localeCompare(b.groupName));
  });

  onSearch(): void {
    console.log('Search triggered with query:', this.searchQuery);
    this.salesOrderService.setSearchQuery(this.searchQuery);
  }

  onStatusChange(): void {
    this.salesOrderService.setStatusFilter(this.selectedStatus);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.salesOrderService.clearSearch();
    this.salesOrderService.clearFilters();
  }

  reload(): void {
    this.salesOrderService.reload();
  }

  createNewSalesOrder(): void {
    this.router.navigate(['/sales-orders/create']);
  }

  viewDetails(so: SalesOrderDto): void {
    this.router.navigate(['/sales-orders', so.salesOrderId, 'details']);
  }

  editSalesOrder(so: SalesOrderDto): void {
    this.router.navigate(['/sales-orders', so.salesOrderId, 'edit']);
  }

  async deleteSalesOrder(so: SalesOrderDto): Promise<void> {
    if (confirm(`Are you sure you want to delete sales order #${so.salesOrderId}?`)) {
      try {
        await this.salesOrderService.deleteSalesOrder(so.salesOrderId);
        alert('Sales order deleted successfully');
      } catch (error) {
        alert('Failed to delete sales order');
      }
    }
  }

  getStatusBadgeClass(status: number): string {
    const classes: { [key: number]: string } = {
      1: 'bg-warning',   // In Process
      2: 'bg-success',   // Approved
      3: 'bg-info',      // Backordered
      4: 'bg-danger',    // Rejected
      5: 'bg-primary',   // Shipped
      6: 'bg-secondary'  // Cancelled
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusText(status: number): string {
    const texts: { [key: number]: string } = {
      1: 'In Process',
      2: 'Approved',
      3: 'Backordered',
      4: 'Rejected',
      5: 'Shipped',
      6: 'Cancelled'
    };
    return texts[status] || 'Unknown';
  }

  // Grouping methods
  setGroupBy(groupBy: 'none' | 'customer'): void {
    this.groupBy.set(groupBy);
  }

  toggleGroup(groupKey: string): void {
    const expandedGroupsSet = new Set(this.expandedGroups());
    if (expandedGroupsSet.has(groupKey)) {
      expandedGroupsSet.delete(groupKey);
    } else {
      expandedGroupsSet.add(groupKey);
    }
    this.expandedGroups.set(expandedGroupsSet);
  }
} 