import { Component, inject, OnInit, signal, computed, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { SalesOrderService } from '../../services/sales-order.service';
import { SalesOrderDetailService } from '../../services/sales-order-detail.service';
import { CreateSalesOrderDto, UpdateSalesOrderDto } from '../../models/sales-order.dto';
import { CreateSalesOrderDetailDto, SalesOrderDetailDto } from '../../models/sales-order-detail.dto';
import { SalesOrderDetailFormComponent } from '../sales-order-details/sales-order-detail-form.component';

@Component({
  selector: 'app-sales-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModalModule, SalesOrderDetailFormComponent],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2>{{ isEditMode() ? 'Edit' : 'Create' }} Sales Order</h2>
              <p class="text-muted" *ngIf="isEditMode() && salesOrder()">
                Order #{{ salesOrder()?.salesOrderId }} - {{ salesOrder()?.customer?.firstName }} {{ salesOrder()?.customer?.lastName }}
              </p>
              <p class="text-muted" *ngIf="!isEditMode()">
                Add a new sales order with line items
              </p>
            </div>
            <div>
              <button class="btn btn-secondary me-2" (click)="goBack()">
                <i class="bi bi-arrow-left"></i> Back to Orders
              </button>
              <button class="btn btn-success" (click)="saveSalesOrder()" [disabled]="!isFormReady() || salesOrderForm.invalid || isSubmitting()">
                <span *ngIf="isSubmitting()" class="spinner-border spinner-border-sm me-2"></span>
                <i class="bi bi-check-circle"></i> {{ isEditMode() ? 'Save Changes' : 'Save Sales Order' }}
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
      <div *ngIf="!isLoading() && (!isEditMode() || salesOrder())" class="row">
        <!-- Sales Order Form -->
        <div class="col-12">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-cart"></i> Sales Order Information
              </h5>
            </div>
            <div class="card-body">
              <form [formGroup]="salesOrderForm">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="status" class="form-label">Status</label>
                    <select id="status" class="form-select" formControlName="status">
                      <option value="1">In Process</option>
                      <option value="2">Approved</option>
                      <option value="3">Backordered</option>
                      <option value="4">Rejected</option>
                      <option value="5">Shipped</option>
                      <option value="6">Cancelled</option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="orderDate" class="form-label">Order Date</label>
                    <input type="date" id="orderDate" class="form-control" formControlName="orderDate">
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="customerId" class="form-label">Customer ID *</label>
                    <input type="number" id="customerId" class="form-control" formControlName="customerId" placeholder="Customer ID">
                    <div *ngIf="salesOrderForm.get('customerId')?.invalid && salesOrderForm.get('customerId')?.touched" class="text-danger">
                      Customer ID is required
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="salesPersonId" class="form-label">Sales Person ID *</label>
                    <input type="number" id="salesPersonId" class="form-control" formControlName="salesPersonId" placeholder="Sales Person ID">
                    <div *ngIf="salesOrderForm.get('salesPersonId')?.invalid && salesOrderForm.get('salesPersonId')?.touched" class="text-danger">
                      Sales Person ID is required
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="shipMethodId" class="form-label">Ship Method ID *</label>
                    <input type="number" id="shipMethodId" class="form-control" formControlName="shipMethodId" placeholder="Ship Method ID">
                    <div *ngIf="salesOrderForm.get('shipMethodId')?.invalid && salesOrderForm.get('shipMethodId')?.touched" class="text-danger">
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
              <button class="btn btn-primary btn-sm" (click)="addDetail()" [disabled]="!isEditMode() && !salesOrderForm.valid">
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
                <p class="text-muted">Add line items to your sales order</p>
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
                          <strong>Discount:</strong> {{ detail.unitPriceDiscount | currency }}
                        </div>
                      </div>
                      <div class="row mt-2">
                        <div class="col-md-6">
                          <strong>Line Total:</strong> {{ (detail.orderQty * detail.unitPrice) - detail.unitPriceDiscount | currency }}
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
      <app-sales-order-detail-form
        [salesOrderId]="salesOrderId()"
        [detail]="selectedDetail()"
        (saved)="onDetailSaved($event, modal)"
        (cancelled)="closeModal(modal)"
      ></app-sales-order-detail-form>
    </ng-template>
  `
})
export class SalesOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private modalService = inject(NgbModal);
  private salesOrderService = inject(SalesOrderService);
  private salesOrderDetailService = inject(SalesOrderDetailService);

  salesOrderForm!: FormGroup;
  salesOrder = signal<any>(null);
  orderDetails = signal<CreateSalesOrderDetailDto[]>([]);
  selectedDetail = signal<SalesOrderDetailDto | null>(null);
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  detailsLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  @ViewChild('detailModal') detailModal!: any;

  // Computed properties
  isEditMode = computed(() => !!this.route.snapshot.paramMap.get('id'));
  salesOrderId = computed(() => this.salesOrder()?.salesOrderId || 0);

  isFormReady = computed(() => {
    return this.salesOrderForm && !this.isLoading();
  });

  totalAmount = computed(() => {
    return this.orderDetails().reduce((sum, detail) => sum + ((detail.orderQty * detail.unitPrice) - detail.unitPriceDiscount), 0);
  });

  totalDue = computed(() => {
    const formValue = this.salesOrderForm?.value;
    if (!formValue) return 0;
    return this.totalAmount() + (formValue.taxAmt || 0) + (formValue.freight || 0);
  });

  constructor() {
    // Effect to update subtotal when details change (only in edit mode)
    effect(() => {
      if (this.salesOrderForm && this.isEditMode()) {
        this.salesOrderForm.patchValue({ subTotal: this.totalAmount() });
      }
    });
  }

  ngOnInit(): void {
    // Reset submitting state
    this.isSubmitting.set(false);
    
    if (this.isEditMode()) {
      this.loadSalesOrder();
    } else {
      this.initForm();
    }
  }

  private async loadSalesOrder(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Invalid sales order ID');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const order = await this.salesOrderService.getSalesOrder(id);
      if (!order) {
        this.errorMessage.set('Sales order not found');
        return;
      }

      this.salesOrder.set(order);
      this.initForm();
      await this.loadOrderDetails(id);
    } catch (error) {
      console.error('Error loading sales order:', error);
      this.errorMessage.set('Failed to load sales order');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadOrderDetails(salesOrderId: number): Promise<void> {
    this.detailsLoading.set(true);
    try {
      const details = await this.salesOrderDetailService.getSalesOrderDetails(salesOrderId);
      // Convert to CreateSalesOrderDetailDto for consistency
      const createDetails: CreateSalesOrderDetailDto[] = details.map(detail => ({
        salesOrderId: detail.salesOrderId,
        productId: detail.productId,
        orderQty: detail.orderQty,
        unitPrice: detail.unitPrice,
        unitPriceDiscount: detail.unitPriceDiscount
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
      const order = this.salesOrder();
      this.salesOrderForm = this.fb.group({
        status: [order.status],
        customerId: [order.customerId, Validators.required],
        salesPersonId: [order.salesPersonId, Validators.required],
        shipMethodId: [order.shipMethod?.shipMethodId || null, Validators.required],
        orderDate: [order.orderDate ? new Date(order.orderDate).toISOString().substring(0, 10) : ''],
        shipDate: [order.shipDate ? new Date(order.shipDate).toISOString().substring(0, 10) : ''],
        subTotal: [order.subTotal || 0],
        taxAmt: [order.taxAmt || 0],
        freight: [order.freight || 0]
      });
    } else {
      this.salesOrderForm = this.fb.group({
        status: [1],
        customerId: [null, Validators.required],
        salesPersonId: [null, Validators.required],
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
      // In edit mode, detail is already a SalesOrderDetailDto
      this.selectedDetail.set(detail);
    } else {
      // In create mode, convert CreateSalesOrderDetailDto to SalesOrderDetailDto
      const detailForEdit: SalesOrderDetailDto = {
        salesOrderDetailId: index,
        salesOrderId: 0,
        productId: detail.productId,
        orderQty: detail.orderQty,
        unitPrice: detail.unitPrice,
        unitPriceDiscount: detail.unitPriceDiscount,
        lineTotal: (detail.orderQty * detail.unitPrice) - detail.unitPriceDiscount,
        modifiedDate: new Date()
      };
      this.selectedDetail.set(detailForEdit);
    }
    this.modalService.open(this.detailModal, { size: 'lg' });
  }

  async removeDetail(detail: any, index: number): Promise<void> {
    if (confirm('Are you sure you want to remove this detail?')) {
      if (this.isEditMode()) {
        try {
          await this.salesOrderDetailService.deleteSalesOrderDetail(detail.salesOrderDetailId);
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

  onDetailSaved(detail: SalesOrderDetailDto, modal: any): void {
    const createDetail: CreateSalesOrderDetailDto = {
      salesOrderId: detail.salesOrderId,
      productId: detail.productId,
      orderQty: detail.orderQty,
      unitPrice: detail.unitPrice,
      unitPriceDiscount: detail.unitPriceDiscount
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

  async saveSalesOrder(): Promise<void> {
    if (this.salesOrderForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.salesOrderForm.value;
      
      if (this.isEditMode()) {
        // Update existing sales order
        const updateData: UpdateSalesOrderDto = {
          ...formValue,
          subTotal: this.totalAmount(),
          totalDue: this.totalDue()
        };

        await this.salesOrderService.updateSalesOrder(this.salesOrderId(), updateData);
        alert('Sales order updated successfully!');
      } else {
        // Create new sales order
        const createData: CreateSalesOrderDto = {
          ...formValue,
          subTotal: this.totalAmount(),
          totalDue: this.totalAmount() + formValue.taxAmt + formValue.freight
        };

        const salesOrder = await this.salesOrderService.createSalesOrder(createData);

        // Add all the details
        for (const detail of this.orderDetails()) {
          await this.salesOrderDetailService.createSalesOrderDetail({
            ...detail,
            salesOrderId: salesOrder.salesOrderId
          });
        }

        alert('Sales order created successfully!');
      }

      this.router.navigate(['/sales-orders']);
    } catch (error) {
      console.error('Error saving sales order:', error);
      this.errorMessage.set(`Failed to ${this.isEditMode() ? 'update' : 'create'} sales order. Please try again.`);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/sales-orders']);
  }
} 