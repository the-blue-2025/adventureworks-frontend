import { Component, inject, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesOrderService } from '../../services/sales-order.service';
import { SalesOrderDetailDto, CreateSalesOrderDetailDto, UpdateSalesOrderDetailDto } from '../../models/sales-order-detail.dto';

// Local type for form data
interface SalesOrderDetailFormData {
  salesOrderId: number;
  productId: number;
  orderQty: number;
  unitPrice: number;
  unitPriceDiscount: number;
}

@Component({
  selector: 'app-sales-order-detail-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ isEditing() ? 'Edit' : 'Add' }} Sales Order Detail</h4>
      <button type="button" class="btn-close" (click)="cancel()"></button>
    </div>

    <div class="modal-body">
      <form #form="ngForm" (ngSubmit)="save()">
        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="productId" class="form-label">Product ID *</label>
              <input 
                type="number" 
                class="form-control" 
                id="productId" 
                name="productId"
                [ngModel]="formData().productId" 
                (ngModelChange)="updateFormField('productId', $event)" 
                required
                min="1">
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="orderQty" class="form-label">Order Quantity *</label>
              <input 
                type="number" 
                class="form-control" 
                id="orderQty" 
                name="orderQty"
                [ngModel]="formData().orderQty" 
                (ngModelChange)="updateFormField('orderQty', $event)" 
                required
                min="1">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="unitPrice" class="form-label">Unit Price *</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input 
                  type="number" 
                  class="form-control" 
                  id="unitPrice" 
                  name="unitPrice"
                  [ngModel]="formData().unitPrice" 
                  (ngModelChange)="updateFormField('unitPrice', $event)" 
                  required
                  min="0"
                  step="0.01">
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="unitPriceDiscount" class="form-label">Unit Price Discount</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input 
                  type="number" 
                  class="form-control" 
                  id="unitPriceDiscount" 
                  name="unitPriceDiscount"
                  [ngModel]="formData().unitPriceDiscount" 
                  (ngModelChange)="updateFormField('unitPriceDiscount', $event)" 
                  min="0"
                  step="0.01">
              </div>
            </div>
          </div>
        </div>

        <!-- Calculated Fields (Read-only) -->
        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label class="form-label">Line Total</label>
              <input 
                type="text" 
                class="form-control" 
                [value]="lineTotal() | currency" 
                readonly>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div class="alert alert-danger" *ngIf="error()">
          {{ error() }}
        </div>

        <!-- Form Actions -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="cancel()">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            [disabled]="!form.valid || saving()">
            <span class="spinner-border spinner-border-sm me-2" *ngIf="saving()"></span>
            {{ isEditing() ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class SalesOrderDetailFormComponent implements OnInit {
  @Input() salesOrderId!: number;
  @Input() detail: SalesOrderDetailDto | null = null;
  @Output() saved = new EventEmitter<SalesOrderDetailDto>();
  @Output() cancelled = new EventEmitter<void>();

  private salesOrderService = inject(SalesOrderService);

  // Form data
  protected formData = signal<SalesOrderDetailFormData>({
    salesOrderId: 0,
    productId: 0,
    orderQty: 0,
    unitPrice: 0,
    unitPriceDiscount: 0
  });

  // Component state
  private savingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Computed signals
  protected saving = this.savingSignal.asReadonly();
  protected error = this.errorSignal.asReadonly();
  protected isEditing = computed(() => !!this.detail);
  protected lineTotal = computed(() => {
    const data = this.formData();
    return (data.orderQty * data.unitPrice) - data.unitPriceDiscount;
  });

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    if (this.detail) {
      this.formData.set({
        salesOrderId: this.detail.salesOrderId,
        productId: this.detail.productId || 0,
        orderQty: this.detail.orderQty || 0,
        unitPrice: this.detail.unitPrice || 0,
        unitPriceDiscount: this.detail.unitPriceDiscount || 0
      });
    } else {
      this.formData.set({
        salesOrderId: this.salesOrderId,
        productId: 0,
        orderQty: 0,
        unitPrice: 0,
        unitPriceDiscount: 0
      });
    }
  }

  async save(): Promise<void> {
    if (!this.formData().productId || !this.formData().orderQty || !this.formData().unitPrice) {
      this.errorSignal.set('Please fill in all required fields.');
      return;
    }

    this.savingSignal.set(true);
    this.errorSignal.set(null);

    try {
      let result: SalesOrderDetailDto;
      const formValue = this.formData();
      
      if (this.isEditing()) {
        const updateData: UpdateSalesOrderDetailDto = {
          productId: formValue.productId,
          orderQty: formValue.orderQty,
          unitPrice: formValue.unitPrice,
          unitPriceDiscount: formValue.unitPriceDiscount
        };
        result = await this.salesOrderService.updateSalesOrderDetail(this.detail!.salesOrderDetailId, updateData);
      } else {
        result = await this.salesOrderService.createSalesOrderDetail(this.salesOrderId, formValue);
      }
      this.saved.emit(result);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to save sales order detail');
    } finally {
      this.savingSignal.set(false);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  updateFormField<K extends keyof SalesOrderDetailFormData>(key: K, value: SalesOrderDetailFormData[K]) {
    this.formData.set({ ...this.formData(), [key]: value });
  }
} 