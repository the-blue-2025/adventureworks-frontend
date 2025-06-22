import { Component, inject, OnInit, signal, computed, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrderDetailService } from '../../services/purchase-order-detail.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../../models/purchase-order.dto';
import { CreatePurchaseOrderDetailDto, PurchaseOrderDetailDto } from '../../models/purchase-order-detail.dto';
import { PurchaseOrderDetailFormComponent } from '../purchase-order-details/purchase-order-detail-form.component';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModalModule, PurchaseOrderDetailFormComponent],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2>{{ isEditMode() ? 'Edit' : 'Create' }} Purchase Order</h2>
              <p class="text-muted" *ngIf="isEditMode() && purchaseOrder()">
                Order #{{ purchaseOrder()?.purchaseOrderId }} - {{ purchaseOrder()?.vendor?.name }}
              </p>
              <p class="text-muted" *ngIf="!isEditMode()">
                Add a new purchase order with line items
              </p>
            </div>
            <div>
              <button class="btn btn-secondary me-2" (click)="goBack()">
                <i class="bi bi-arrow-left"></i> Back to Orders
              </button>
              <button class="btn btn-success" (click)="savePurchaseOrder()" [disabled]="!isFormReady() || purchaseOrderForm.invalid || isSubmitting()">
                <span *ngIf="isSubmitting()" class="spinner-border spinner-border-sm me-2"></span>
                <i class="bi bi-check-circle"></i> {{ isEditMode() ? 'Save Changes' : 'Save Purchase Order' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="text-center py-5">
        <div class="spinner-border text-info" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Error Display -->
      <div *ngIf="errorMessage()" class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle"></i>
        {{ errorMessage() }}
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading() && (!isEditMode() || purchaseOrder())" class="row">
        <!-- Purchase Order Form -->
        <div class="col-12">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-cart"></i> Purchase Order Information
              </h5>
            </div>
            <div class="card-body">
              <form [formGroup]="purchaseOrderForm">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="status" class="form-label">Status</label>
                    <select id="status" class="form-select" formControlName="status">
                      <option value="1">Pending</option>
                      <option value="2">Approved</option>
                      <option value="3">Rejected</option>
                      <option value="4">Complete</option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="orderDate" class="form-label">Order Date</label>
                    <input type="date" id="orderDate" class="form-control" formControlName="orderDate">
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="employeeId" class="form-label">Employee ID *</label>
                    <input type="number" id="employeeId" class="form-control" formControlName="employeeId" placeholder="Employee ID">
                    <div *ngIf="purchaseOrderForm.get('employeeId')?.invalid && purchaseOrderForm.get('employeeId')?.touched" class="text-danger">
                      Employee ID is required
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="vendorId" class="form-label">Vendor ID *</label>
                    <input type="number" id="vendorId" class="form-control" formControlName="vendorId" placeholder="Vendor ID">
                    <div *ngIf="purchaseOrderForm.get('vendorId')?.invalid && purchaseOrderForm.get('vendorId')?.touched" class="text-danger">
                      Vendor ID is required
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="shipMethodId" class="form-label">Ship Method ID *</label>
                    <input type="number" id="shipMethodId" class="form-control" formControlName="shipMethodId" placeholder="Ship Method ID">
                    <div *ngIf="purchaseOrderForm.get('shipMethodId')?.invalid && purchaseOrderForm.get('shipMethodId')?.touched" class="text-danger">
                      Ship Method ID is required
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="shipDate" class="form-label">Ship Date</label>
                    <input type="date" id="shipDate" class="form-control" formControlName="shipDate">
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label for="subTotal" class="form-label">Sub Total</label>
                    <input type="number" id="subTotal" class="form-control" formControlName="subTotal" placeholder="0.00" step="0.01" min="0" [readonly]="isEditMode()">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label for="taxAmt" class="form-label">Tax Amount</label>
                    <input type="number" id="taxAmt" class="form-control" formControlName="taxAmt" placeholder="0.00" step="0.01" min="0">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label for="freight" class="form-label">Freight</label>
                    <input type="number" id="freight" class="form-control" formControlName="freight" placeholder="0.00" step="0.01" min="0">
                  </div>
                </div>

                <div class="row" *ngIf="isEditMode()">
                  <div class="col-12">
                    <div class="alert alert-info">
                      <strong>Total Due:</strong> {{ totalDue() | currency }}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Order Details -->
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">
                <i class="bi bi-list-ul"></i> Order Details
              </h5>
              <button class="btn btn-primary btn-sm" (click)="addDetail()" [disabled]="!isEditMode() && !purchaseOrderForm.valid">
                <i class="bi bi-plus-circle"></i> Add Detail
              </button>
            </div>
            <div class="card-body">
              <!-- Loading State for Details -->
              <div *ngIf="isEditMode() && detailsLoading()" class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <!-- Empty State -->
              <div *ngIf="(!isEditMode() || !detailsLoading()) && orderDetails().length === 0" class="text-center py-4">
                <i class="bi bi-list-ul fs-1 text-muted"></i>
                <h6 class="text-muted mt-2">No order details yet</h6>
                <p class="text-muted">Add line items to your purchase order</p>
              </div>

              <!-- Details List -->
              <div *ngIf="(!isEditMode() || !detailsLoading()) && orderDetails().length > 0">
                <div *ngFor="let detail of orderDetails(); let i = index" class="border rounded p-3 mb-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <div class="row">
                        <div class="col-md-3">
                          <strong>Product ID:</strong> {{ detail.productId }}
                        </div>
                        <div class="col-md-3">
                          <strong>Qty:</strong> {{ detail.orderQty }}
                        </div>
                        <div class="col-md-3">
                          <strong>Price:</strong> {{ detail.unitPrice | currency }}
                        </div>
                        <div class="col-md-3">
                          <strong>Total:</strong> {{ detail.orderQty * detail.unitPrice | currency }}
                        </div>
                      </div>
                      <div class="row mt-2">
                        <div class="col-md-6">
                          <strong>Due Date:</strong> {{ detail.dueDate | date:'short' }}
                        </div>
                        <div class="col-md-6">
                          <strong>Received:</strong> {{ detail.receivedQty || 0 }} | <strong>Rejected:</strong> {{ detail.rejectedQty || 0 }}
                        </div>
                      </div>
                    </div>
                    <div class="ms-2">
                      <button class="btn btn-sm btn-outline-warning me-1" (click)="editDetail(detail, i)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" (click)="removeDetail(detail, i)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Summary -->
                <div class="border-top pt-3">
                  <div class="row">
                    <div class="col-md-6">
                      <strong>Total Items:</strong> {{ orderDetails().length }}
                    </div>
                    <div class="col-md-6">
                      <strong>Total Amount:</strong> {{ totalAmount() | currency }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Form Modal -->
    <ng-template #detailModal let-modal>
      <app-purchase-order-detail-form
        [purchaseOrderId]="purchaseOrderId()"
        [detail]="selectedDetail()"
        (saved)="onDetailSaved($event, modal)"
        (cancelled)="closeModal(modal)"
      ></app-purchase-order-detail-form>
    </ng-template>
  `
})
export class PurchaseOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private modalService = inject(NgbModal);
  private purchaseOrderService = inject(PurchaseOrderService);
  private purchaseOrderDetailService = inject(PurchaseOrderDetailService);

  purchaseOrderForm!: FormGroup;
  purchaseOrder = signal<any>(null);
  orderDetails = signal<CreatePurchaseOrderDetailDto[]>([]);
  selectedDetail = signal<PurchaseOrderDetailDto | null>(null);
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  detailsLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  @ViewChild('detailModal') detailModal!: any;

  // Computed properties
  isEditMode = computed(() => !!this.route.snapshot.paramMap.get('id'));
  purchaseOrderId = computed(() => this.purchaseOrder()?.purchaseOrderId || 0);

  isFormReady = computed(() => {
    return this.purchaseOrderForm && !this.isLoading();
  });

  totalAmount = computed(() => {
    return this.orderDetails().reduce((sum, detail) => sum + (detail.orderQty * detail.unitPrice), 0);
  });

  totalDue = computed(() => {
    const formValue = this.purchaseOrderForm?.value;
    if (!formValue) return 0;
    return this.totalAmount() + (formValue.taxAmt || 0) + (formValue.freight || 0);
  });

  constructor() {
    // Effect to update subtotal when details change (only in edit mode)
    effect(() => {
      if (this.purchaseOrderForm && this.isEditMode()) {
        this.purchaseOrderForm.patchValue({ subTotal: this.totalAmount() });
      }
    });
  }

  ngOnInit(): void {
    // Reset submitting state
    this.isSubmitting.set(false);
    
    if (this.isEditMode()) {
      this.loadPurchaseOrder();
    } else {
      this.initForm();
    }
  }

  private async loadPurchaseOrder(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Invalid purchase order ID');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const order = await this.purchaseOrderService.getPurchaseOrder(id);
      if (!order) {
        this.errorMessage.set('Purchase order not found');
        return;
      }

      this.purchaseOrder.set(order);
      this.initForm();
      await this.loadOrderDetails(id);
    } catch (error) {
      console.error('Error loading purchase order:', error);
      this.errorMessage.set('Failed to load purchase order');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadOrderDetails(purchaseOrderId: number): Promise<void> {
    this.detailsLoading.set(true);
    try {
      const details = await this.purchaseOrderDetailService.getPurchaseOrderDetails(purchaseOrderId);
      // Convert to CreatePurchaseOrderDetailDto for consistency
      const createDetails: CreatePurchaseOrderDetailDto[] = details.map(detail => ({
        purchaseOrderId: detail.purchaseOrderId,
        dueDate: detail.dueDate,
        orderQty: detail.orderQty,
        productId: detail.productId,
        unitPrice: detail.unitPrice,
        receivedQty: detail.receivedQty,
        rejectedQty: detail.rejectedQty,
        stockedQty: detail.stockedQty
      }));
      this.orderDetails.set(createDetails);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      this.detailsLoading.set(false);
    }
  }

  private initForm(): void {
    if (this.isEditMode()) {
      const order = this.purchaseOrder();
      this.purchaseOrderForm = this.fb.group({
        status: [order.status],
        employeeId: [order.employee?.businessEntityId || null, Validators.required],
        vendorId: [order.vendorId, Validators.required],
        shipMethodId: [order.shipMethod?.shipMethodId || null, Validators.required],
        orderDate: [order.orderDate ? new Date(order.orderDate).toISOString().substring(0, 10) : ''],
        shipDate: [order.shipDate ? new Date(order.shipDate).toISOString().substring(0, 10) : ''],
        subTotal: [order.subTotal || 0],
        taxAmt: [order.taxAmt || 0],
        freight: [order.freight || 0]
      });
    } else {
      this.purchaseOrderForm = this.fb.group({
        status: [1],
        employeeId: [null, Validators.required],
        vendorId: [null, Validators.required],
        shipMethodId: [null, Validators.required],
        orderDate: [new Date().toISOString().substring(0, 10)],
        shipDate: [''],
        subTotal: [0],
        taxAmt: [0],
        freight: [0]
      });
    }
  }

  addDetail(): void {
    this.selectedDetail.set(null);
    this.modalService.open(this.detailModal, { size: 'lg' });
  }

  editDetail(detail: any, index: number): void {
    if (this.isEditMode()) {
      // In edit mode, detail is already a PurchaseOrderDetailDto
      this.selectedDetail.set(detail);
    } else {
      // In create mode, convert CreatePurchaseOrderDetailDto to PurchaseOrderDetailDto
      const detailForEdit: PurchaseOrderDetailDto = {
        purchaseOrderDetailId: index,
        purchaseOrderId: 0,
        dueDate: new Date(detail.dueDate),
        orderQty: detail.orderQty,
        productId: detail.productId,
        unitPrice: detail.unitPrice,
        lineTotal: detail.orderQty * detail.unitPrice,
        receivedQty: detail.receivedQty || 0,
        rejectedQty: detail.rejectedQty || 0,
        stockedQty: detail.stockedQty || 0
      };
      this.selectedDetail.set(detailForEdit);
    }
    this.modalService.open(this.detailModal, { size: 'lg' });
  }

  async removeDetail(detail: any, index: number): Promise<void> {
    if (confirm('Are you sure you want to remove this detail?')) {
      if (this.isEditMode()) {
        try {
          await this.purchaseOrderDetailService.deletePurchaseOrderDetail(detail.purchaseOrderDetailId);
          const details = this.orderDetails().filter(d => d !== detail);
          this.orderDetails.set(details);
        } catch (error) {
          console.error('Error removing detail:', error);
          alert('Failed to remove detail');
        }
      } else {
        const details = [...this.orderDetails()];
        details.splice(index, 1);
        this.orderDetails.set(details);
      }
    }
  }

  onDetailSaved(detail: PurchaseOrderDetailDto, modal: any): void {
    const createDetail: CreatePurchaseOrderDetailDto = {
      purchaseOrderId: detail.purchaseOrderId,
      dueDate: detail.dueDate,
      orderQty: detail.orderQty,
      productId: detail.productId,
      unitPrice: detail.unitPrice,
      receivedQty: detail.receivedQty,
      rejectedQty: detail.rejectedQty,
      stockedQty: detail.stockedQty
    };

    const details = [...this.orderDetails()];
    
    if (this.isEditMode()) {
      const index = details.findIndex(d => d === this.selectedDetail());
      if (index >= 0) {
        details[index] = createDetail;
      } else {
        details.push(createDetail);
      }
    } else {
      details.push(createDetail);
    }
    
    this.orderDetails.set(details);
    this.closeModal(modal);
  }

  closeModal(modal: any): void {
    modal.close();
  }

  async savePurchaseOrder(): Promise<void> {
    if (this.purchaseOrderForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.purchaseOrderForm.value;
      
      if (this.isEditMode()) {
        // Update existing purchase order
        const updateData: UpdatePurchaseOrderDto = {
          ...formValue,
          subTotal: this.totalAmount(),
          totalDue: this.totalDue()
        };

        await this.purchaseOrderService.updatePurchaseOrder(this.purchaseOrderId(), updateData);
        alert('Purchase order updated successfully!');
      } else {
        // Create new purchase order
        const createData: CreatePurchaseOrderDto = {
          ...formValue,
          subTotal: this.totalAmount(),
          totalDue: this.totalAmount() + formValue.taxAmt + formValue.freight
        };

        const purchaseOrder = await this.purchaseOrderService.createPurchaseOrder(createData);

        // Add all the details
        for (const detail of this.orderDetails()) {
          await this.purchaseOrderDetailService.createPurchaseOrderDetail({
            ...detail,
            purchaseOrderId: purchaseOrder.purchaseOrderId
          });
        }

        alert('Purchase order created successfully!');
      }

      this.router.navigate(['/purchase-orders']);
    } catch (error) {
      console.error('Error saving purchase order:', error);
      this.errorMessage.set(`Failed to ${this.isEditMode() ? 'update' : 'create'} purchase order. Please try again.`);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/purchase-orders']);
  }
} 