import { Component, inject, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrderDetailDto, CreatePurchaseOrderDetailDto, UpdatePurchaseOrderDetailDto } from '../../models/purchase-order-detail.dto';

// Local type for form data
interface PurchaseOrderDetailFormData {
  purchaseOrderId: number;
  dueDate: string; // YYYY-MM-DD
  productId: number;
  orderQty: number;
  unitPrice: number;
  receivedQty?: number;
  rejectedQty?: number;
  stockedQty?: number;
}

@Component({
  selector: 'app-purchase-order-detail-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ isEditing() ? 'Edit' : 'Add' }} Purchase Order Detail</h4>
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
              <label for="receivedQty" class="form-label">Received Quantity</label>
              <input 
                type="number" 
                class="form-control" 
                id="receivedQty" 
                name="receivedQty"
                [ngModel]="formData().receivedQty" 
                (ngModelChange)="updateFormField('receivedQty', $event)" 
                min="0">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="rejectedQty" class="form-label">Rejected Quantity</label>
              <input 
                type="number" 
                class="form-control" 
                id="rejectedQty" 
                name="rejectedQty"
                [ngModel]="formData().rejectedQty" 
                (ngModelChange)="updateFormField('rejectedQty', $event)" 
                min="0">
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="stockedQty" class="form-label">Stocked Quantity</label>
              <input 
                type="number" 
                class="form-control" 
                id="stockedQty" 
                name="stockedQty"
                [ngModel]="formData().stockedQty" 
                (ngModelChange)="updateFormField('stockedQty', $event)" 
                min="0">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="dueDate" class="form-label">Due Date *</label>
              <input 
                type="date" 
                class="form-control" 
                id="dueDate" 
                name="dueDate"
                [ngModel]="formData().dueDate" 
                (ngModelChange)="updateFormField('dueDate', $event)" 
                required>
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
export class PurchaseOrderDetailFormComponent implements OnInit {
  @Input() purchaseOrderId!: number;
  @Input() detail: PurchaseOrderDetailDto | null = null;
  @Output() saved = new EventEmitter<PurchaseOrderDetailDto>();
  @Output() cancelled = new EventEmitter<void>();

  private purchaseOrderService = inject(PurchaseOrderService);

  // Form data
  protected formData = signal<PurchaseOrderDetailFormData>({
    purchaseOrderId: 0,
    dueDate: new Date().toISOString().substring(0, 10),
    productId: 0,
    orderQty: 0,
    unitPrice: 0,
    receivedQty: 0,
    rejectedQty: 0,
    stockedQty: 0
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
    return data.orderQty * data.unitPrice;
  });

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    if (this.detail) {
      this.formData.set({
        purchaseOrderId: this.detail.purchaseOrderId,
        dueDate: this.detail.dueDate ? new Date(this.detail.dueDate).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        productId: this.detail.productId || 0,
        orderQty: this.detail.orderQty || 0,
        unitPrice: this.detail.unitPrice || 0,
        receivedQty: this.detail.receivedQty || 0,
        rejectedQty: this.detail.rejectedQty || 0,
        stockedQty: this.detail.stockedQty || 0
      });
    } else {
      this.formData.set({
        purchaseOrderId: this.purchaseOrderId,
        dueDate: new Date().toISOString().substring(0, 10),
        productId: 0,
        orderQty: 0,
        unitPrice: 0,
        receivedQty: 0,
        rejectedQty: 0,
        stockedQty: 0
      });
    }
  }

  async save(): Promise<void> {
    if (!this.formData().productId || !this.formData().orderQty || !this.formData().unitPrice || !this.formData().dueDate) {
      this.errorSignal.set('Please fill in all required fields.');
      return;
    }

    this.savingSignal.set(true);
    this.errorSignal.set(null);

    try {
      let result: PurchaseOrderDetailDto;
      const formValue = this.formData();
      const payload = {
        ...formValue,
        dueDate: new Date(formValue.dueDate)
      };
      if (this.isEditing()) {
        const updateData: UpdatePurchaseOrderDetailDto = {
          productId: payload.productId,
          orderQty: payload.orderQty,
          unitPrice: payload.unitPrice,
          receivedQty: payload.receivedQty,
          rejectedQty: payload.rejectedQty,
          stockedQty: payload.stockedQty,
          dueDate: payload.dueDate
        };
        result = await this.purchaseOrderService.updatePurchaseOrderDetail(this.detail!.purchaseOrderDetailId, updateData);
      } else {
        result = await this.purchaseOrderService.createPurchaseOrderDetail(this.purchaseOrderId, payload);
      }
      this.saved.emit(result);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to save purchase order detail');
    } finally {
      this.savingSignal.set(false);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  updateFormField<K extends keyof PurchaseOrderDetailFormData>(key: K, value: PurchaseOrderDetailFormData[K]) {
    this.formData.set({ ...this.formData(), [key]: value });
  }
}
