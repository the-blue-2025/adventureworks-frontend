import { Component, inject, OnInit, signal, computed, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrderDetailDto } from '../../models/purchase-order-detail.dto';
import { PurchaseOrderDetailFormComponent } from './purchase-order-detail-form.component';

@Component({
  selector: 'app-purchase-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule, PurchaseOrderDetailFormComponent],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2>Purchase Order Details</h2>
              <p class="text-muted" *ngIf="purchaseOrder()">
                Order #{{ purchaseOrder()?.purchaseOrderId }} - {{ purchaseOrder()?.vendor?.name }}
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
            <p class="mt-2">Loading purchase order details...</p>
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
          <!-- Purchase Order Info -->
          <div class="card mb-4" *ngIf="purchaseOrder()">
            <div class="card-header">
              <h5 class="mb-0">Purchase Order Information</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <strong>Order ID:</strong> {{ purchaseOrder()?.purchaseOrderId }}
                </div>
                <div class="col-md-3">
                  <strong>Vendor:</strong> {{ purchaseOrder()?.vendor?.name }}
                </div>
                <div class="col-md-3">
                  <strong>Ship Method:</strong> {{ purchaseOrder()?.shipMethod?.name }}
                </div>
                <div class="col-md-3">
                  <strong>Status:</strong> 
                  <span class="badge" [ngClass]="getStatusBadgeClass(purchaseOrder()?.status)">
                    {{ getStatusText(purchaseOrder()?.status) }}
                  </span>
                </div>
              </div>
              <div class="row mt-2">
                <div class="col-md-3">
                  <strong>Order Date:</strong> {{ purchaseOrder()?.orderDate | date }}
                </div>
                <div class="col-md-3">
                  <strong>Ship Date:</strong> {{ purchaseOrder()?.shipDate | date }}
                </div>
                <div class="col-md-3">
                  <strong>Sub Total:</strong> {{ purchaseOrder()?.subTotal | currency }}
                </div>
                <div class="col-md-3">
                  <strong>Total Due:</strong> {{ purchaseOrder()?.totalDue | currency }}
                </div>
              </div>
            </div>
          </div>

          <!-- Details Table -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Order Details ({{ details().length }})</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Order Qty</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                      <th>Received Qty</th>
                      <th>Rejected Qty</th>
                      <th>Stocked Qty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let detail of details()" class="cursor-pointer" (click)="selectDetail(detail.purchaseOrderDetailId)">
                      <td>{{ detail.productId }}</td>
                      <td>{{ detail.orderQty }}</td>
                      <td>{{ detail.unitPrice | currency }}</td>
                      <td>{{ detail.lineTotal | currency }}</td>
                      <td>{{ detail.receivedQty }}</td>
                      <td>{{ detail.rejectedQty }}</td>
                      <td>{{ detail.stockedQty }}</td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-primary" (click)="openEditModal(detail); $event.stopPropagation()">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn btn-outline-danger" (click)="deleteDetail(detail.purchaseOrderDetailId); $event.stopPropagation()">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty State -->
              <div class="text-center py-4" *ngIf="isEmpty()">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h4 class="mt-3">No Details Found</h4>
                <p class="text-muted">This purchase order doesn't have any details yet.</p>
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
      <app-purchase-order-detail-form
        *ngIf="purchaseOrderId()"
        [purchaseOrderId]="purchaseOrderId()!"
        [detail]="selectedDetailForEdit()"
        (saved)="onDetailSaved()"
        (cancelled)="closeModal()">
      </app-purchase-order-detail-form>
    </ng-template>
  `
})
export class PurchaseOrderDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private modalService = inject(NgbModal);
  protected purchaseOrderService = inject(PurchaseOrderService);

  // Template reference for modal
  @ViewChild('modalTemplate', { static: true }) modalTemplate!: TemplateRef<any>;

  // Component state
  private modalRef: NgbModalRef | null = null;
  private selectedDetailForEditSignal = signal<PurchaseOrderDetailDto | null>(null);

  // Computed signals from service
  protected purchaseOrder = this.purchaseOrderService.selectedPurchaseOrder;
  protected details = this.purchaseOrderService.purchaseOrderDetails;
  protected loading = this.purchaseOrderService.detailsLoading;
  protected hasError = this.purchaseOrderService.detailsHasError;
  protected errorMessage = this.purchaseOrderService.detailsError;
  protected isEmpty = this.purchaseOrderService.detailsIsEmpty;

  // Computed signals for component
  protected purchaseOrderId = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? parseInt(id, 10) : null;
  });

  protected selectedDetailForEdit = this.selectedDetailForEditSignal.asReadonly();

  ngOnInit(): void {
    const id = this.purchaseOrderId();
    if (id) {
      this.purchaseOrderService.selectPurchaseOrder(id);
    } else {
      this.goBack();
    }
  }

  selectDetail(detailId: number): void {
    this.purchaseOrderService.selectDetail(detailId);
  }

  openCreateModal(): void {
    const id = this.purchaseOrderId();
    if (!id) {
      console.error('No purchase order ID available');
      return;
    }
    this.selectedDetailForEditSignal.set(null);
    this.openModal();
  }

  openEditModal(detail: PurchaseOrderDetailDto): void {
    const id = this.purchaseOrderId();
    if (!id) {
      console.error('No purchase order ID available');
      return;
    }
    this.selectedDetailForEditSignal.set(detail);
    this.openModal();
  }

  private openModal(): void {
    const id = this.purchaseOrderId();
    if (!id) {
      console.error('Cannot open modal: No purchase order ID');
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
        await this.purchaseOrderService.deletePurchaseOrderDetail(detailId);
        // Details will be automatically updated via the service
      } catch (error) {
        console.error('Failed to delete detail:', error);
        alert('Failed to delete detail. Please try again.');
      }
    }
  }

  async reload(): Promise<void> {
    const id = this.purchaseOrderId();
    if (id) {
      this.purchaseOrderService.reloadDetails();
    }
  }

  goBack(): void {
    this.router.navigate(['/purchase-orders']);
  }

  getStatusBadgeClass(status?: number | null): string {
    switch (status) {
      case 1:
        return 'bg-warning'; // Pending
      case 2:
        return 'bg-success'; // Approved
      case 3:
        return 'bg-danger'; // Rejected
      case 4:
        return 'bg-info'; // Shipped
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(status?: number | null): string {
    switch (status) {
      case 1:
        return 'Pending';
      case 2:
        return 'Approved';
      case 3:
        return 'Rejected';
      case 4:
        return 'Shipped';
      default:
        return 'Unknown';
    }
  }
}
