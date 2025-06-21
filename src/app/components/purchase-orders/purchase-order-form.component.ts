import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrderDto, CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../../models/purchase-order.dto';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">
        {{ isEditMode ? 'Edit Purchase Order' : 'Create New Purchase Order' }}
      </h4>
      <button type="button" class="btn-close" (click)="onCancel()"></button>
    </div>

    <form [formGroup]="purchaseOrderForm" (ngSubmit)="onSubmit()">
      <div class="modal-body">
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
            <label for="orderDate" class="form-label">Order Date</label>
            <input type="date" id="orderDate" class="form-control" formControlName="orderDate">
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="shipDate" class="form-label">Ship Date</label>
            <input type="date" id="shipDate" class="form-control" formControlName="shipDate">
          </div>

          <div class="col-md-6 mb-3">
            <label for="subTotal" class="form-label">Sub Total</label>
            <input type="number" id="subTotal" class="form-control" formControlName="subTotal" placeholder="0.00" step="0.01" min="0">
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="taxAmt" class="form-label">Tax Amount</label>
            <input type="number" id="taxAmt" class="form-control" formControlName="taxAmt" placeholder="0.00" step="0.01" min="0">
          </div>

          <div class="col-md-6 mb-3">
            <label for="freight" class="form-label">Freight</label>
            <input type="number" id="freight" class="form-control" formControlName="freight" placeholder="0.00" step="0.01" min="0">
          </div>
        </div>

        <!-- Display existing purchase order info in view mode -->
        <div *ngIf="isViewMode && purchaseOrder" class="alert alert-info">
          <h6>Additional Information:</h6>
          <p><strong>Purchase Order ID:</strong> {{ purchaseOrder.purchaseOrderId }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          {{ isViewMode ? 'Close' : 'Cancel' }}
        </button>
        <button *ngIf="!isViewMode" type="submit" class="btn btn-primary" [disabled]="purchaseOrderForm.invalid || isSubmitting">
          <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
          {{ isEditMode ? 'Update' : 'Create' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .form-label {
      font-weight: 500;
    }
    
    .text-danger {
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  `]
})
export class PurchaseOrderFormComponent implements OnInit {
  @Input() purchaseOrder: PurchaseOrderDto | null = null;
  @Output() save = new EventEmitter<PurchaseOrderDto>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private purchaseOrderService = inject(PurchaseOrderService);

  purchaseOrderForm!: FormGroup;
  isSubmitting = false;

  get isEditMode(): boolean {
    return !!this.purchaseOrder;
  }

  get isViewMode(): boolean {
    return false; // You can add logic to determine view mode if needed
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.purchaseOrderForm = this.fb.group({
      status: [this.purchaseOrder?.status || 1],
      employeeId: [this.purchaseOrder?.employee?.businessEntityId || '', Validators.required],
      vendorId: [this.purchaseOrder?.vendorId || '', Validators.required],
      shipMethodId: [this.purchaseOrder?.shipMethod?.shipMethodId || '', Validators.required],
      orderDate: [this.purchaseOrder?.orderDate || ''],
      shipDate: [this.purchaseOrder?.shipDate || ''],
      subTotal: [this.purchaseOrder?.subTotal || 0],
      taxAmt: [this.purchaseOrder?.taxAmt || 0],
      freight: [this.purchaseOrder?.freight || 0]
    });

    if (this.isViewMode) {
      this.purchaseOrderForm.disable();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.purchaseOrderForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.purchaseOrderForm.value;
      let result: PurchaseOrderDto;

      if (this.isEditMode && this.purchaseOrder) {
        const updateData: UpdatePurchaseOrderDto = formValue;
        result = await this.purchaseOrderService.updatePurchaseOrder(this.purchaseOrder.purchaseOrderId, updateData);
      } else {
        const createData: CreatePurchaseOrderDto = formValue;
        result = await this.purchaseOrderService.createPurchaseOrder(createData);
      }

      this.save.emit(result);
    } catch (error) {
      console.error('Error saving purchase order:', error);
      alert('Failed to save purchase order. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
} 