import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrderDto, CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../../models/purchase-order.dto';
import { PurchaseOrderFormComponent } from './purchase-order-form.component';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, PurchaseOrderFormComponent],
  template: `
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Purchase Orders Management</h2>
          <button class="btn btn-info" (click)="openCreateModal()">
            <i class="bi bi-plus-circle"></i> Add Purchase Order
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search purchase orders..."
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          >
          <button class="btn btn-outline-secondary" type="button" (click)="clearSearch()">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>
      </div>
      <div class="col-md-3">
        <select class="form-select" [(ngModel)]="selectedStatus" (change)="onStatusChange()">
          <option value="">All Statuses</option>
          <option value="1">Pending</option>
          <option value="2">Approved</option>
          <option value="3">Rejected</option>
          <option value="4">Complete</option>
        </select>
      </div>
      <div class="col-md-3">
        <button class="btn btn-outline-info w-100" (click)="reload()">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="purchaseOrderService.isLoading()" class="text-center py-5">
      <div class="spinner-border text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="purchaseOrderService.hasError()" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      {{ purchaseOrderService.purchaseOrdersError() }}
    </div>

    <!-- Empty State -->
    <div *ngIf="!purchaseOrderService.isLoading() && purchaseOrderService.isEmpty()" class="text-center py-5">
      <i class="bi bi-cart fs-1 text-muted"></i>
      <h4 class="text-muted mt-3">No purchase orders found</h4>
      <p class="text-muted">Try adjusting your search criteria or add a new purchase order.</p>
    </div>

    <!-- Data Table -->
    <div *ngIf="!purchaseOrderService.isLoading() && !purchaseOrderService.isEmpty()" class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Vendor</th>
            <th>Employee</th>
            <th>Order Date</th>
            <th>Ship Date</th>
            <th>Ship Method</th>
            <th>Total Due</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let po of purchaseOrderService.purchaseOrders()" 
              (click)="viewDetails(po)" 
              class="cursor-pointer"
              style="cursor: pointer;">
            <td>{{ po.purchaseOrderId }}</td>
            <td>
              <span class="badge" [ngClass]="getStatusBadgeClass(po.status)">
                {{ getStatusText(po.status) }}
              </span>
            </td>
            <td>
              <strong>{{ po.vendor?.name || 'N/A' }}</strong>
              <br>
              <small class="text-muted">{{ po.vendor?.accountNumber || '' }}</small>
            </td>
            <td>
              <span *ngIf="po.employee; else noEmployee">
                {{ po.employee.firstName }} {{ po.employee.lastName }}
              </span>
              <ng-template #noEmployee>
                <span class="text-muted">N/A</span>
              </ng-template>
            </td>
            <td>{{ po.orderDate | date:'short' }}</td>
            <td>
              <span *ngIf="po.shipDate; else noShipDate">
                {{ po.shipDate | date:'short' }}
              </span>
              <ng-template #noShipDate>
                <span class="text-muted">Not set</span>
              </ng-template>
            </td>
            <td>
              <span *ngIf="po.shipMethod; else noShipMethod">
                {{ po.shipMethod.name }}
              </span>
              <ng-template #noShipMethod>
                <span class="text-muted">N/A</span>
              </ng-template>
            </td>
            <td>
              <strong class="text-success">{{ po.totalDue | currency }}</strong>
              <br>
              <small class="text-muted">
                Sub: {{ po.subTotal | currency }} | Tax: {{ po.taxAmt | currency }} | Freight: {{ po.freight | currency }}
              </small>
            </td>
            <td>
              <div class="btn-group" role="group" (click)="$event.stopPropagation()">
                <button class="btn btn-sm btn-outline-info" (click)="viewDetails(po)" title="View Details">
                  <i class="bi bi-list-ul"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" (click)="viewPurchaseOrder(po)">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" (click)="editPurchaseOrder(po)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="deletePurchaseOrder(po)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Purchase Order Form Modal -->
    <ng-template #purchaseOrderModal let-modal>
      <app-purchase-order-form
        [purchaseOrder]="selectedPurchaseOrder()"
        (save)="onPurchaseOrderSaved($event, modal)"
        (cancel)="closeModal(modal)"
      ></app-purchase-order-form>
    </ng-template>
  `,
  styles: [`
    .table th {
      white-space: nowrap;
    }
    
    .btn-group .btn {
      margin-right: 2px;
    }
    
    .btn-group .btn:last-child {
      margin-right: 0;
    }

    .table tbody tr {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .table tbody tr:hover {
      background-color: rgba(0, 123, 255, 0.1) !important;
    }

    .table tbody tr:active {
      background-color: rgba(0, 123, 255, 0.2) !important;
    }
  `]
})
export class PurchaseOrdersComponent implements OnInit {
  private modalService = inject(NgbModal);
  private router = inject(Router);
  protected purchaseOrderService = inject(PurchaseOrderService);

  searchQuery = '';
  selectedStatus = '';
  selectedPurchaseOrder = signal<PurchaseOrderDto | null>(null);

  @ViewChild('purchaseOrderModal') purchaseOrderModal!: any;

  ngOnInit(): void {
    // Component is ready
  }

  onSearch(): void {
    this.purchaseOrderService.setSearchQuery(this.searchQuery);
  }

  onStatusChange(): void {
    // You can implement status filtering here
    this.purchaseOrderService.reload();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.purchaseOrderService.clearSearch();
  }

  reload(): void {
    this.purchaseOrderService.reload();
  }

  viewDetails(po: PurchaseOrderDto): void {
    this.router.navigate(['/purchase-orders', po.purchaseOrderId, 'details']);
  }

  openCreateModal(): void {
    this.selectedPurchaseOrder.set(null);
    this.modalService.open(this.purchaseOrderModal, { size: 'xl' });
  }

  viewPurchaseOrder(po: PurchaseOrderDto): void {
    this.selectedPurchaseOrder.set(po);
    this.modalService.open(this.purchaseOrderModal, { size: 'xl' });
  }

  editPurchaseOrder(po: PurchaseOrderDto): void {
    this.selectedPurchaseOrder.set(po);
    this.modalService.open(this.purchaseOrderModal, { size: 'xl' });
  }

  async deletePurchaseOrder(po: PurchaseOrderDto): Promise<void> {
    if (confirm(`Are you sure you want to delete purchase order #${po.purchaseOrderId}?`)) {
      try {
        await this.purchaseOrderService.deletePurchaseOrder(po.purchaseOrderId);
        alert('Purchase order deleted successfully');
      } catch (error) {
        alert('Failed to delete purchase order');
      }
    }
  }

  onPurchaseOrderSaved(po: PurchaseOrderDto, modal: any): void {
    this.closeModal(modal);
    this.reload();
  }

  closeModal(modal: any): void {
    modal.close();
  }

  getStatusBadgeClass(status: number): string {
    const classes: { [key: number]: string } = {
      1: 'bg-warning',
      2: 'bg-success',
      3: 'bg-danger',
      4: 'bg-info'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusText(status: number): string {
    const texts: { [key: number]: string } = {
      1: 'Pending',
      2: 'Approved',
      3: 'Rejected',
      4: 'Complete'
    };
    return texts[status] || 'Unknown';
  }
} 