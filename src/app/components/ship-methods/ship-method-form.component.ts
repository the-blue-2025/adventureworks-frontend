import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShipMethodService } from '../../services/ship-method.service';
import { ShipMethodDto, CreateShipMethodDto, UpdateShipMethodDto } from '../../models/ship-method.dto';

@Component({
  selector: 'app-ship-method-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">
        {{ isEditMode ? 'Edit Ship Method' : 'Create New Ship Method' }}
      </h4>
      <button type="button" class="btn-close" (click)="onCancel()"></button>
    </div>

    <form [formGroup]="shipMethodForm" (ngSubmit)="onSubmit()">
      <div class="modal-body">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="name" class="form-label">Name *</label>
            <input type="text" id="name" class="form-control" formControlName="name" placeholder="Ship Method Name">
            <div *ngIf="shipMethodForm.get('name')?.invalid && shipMethodForm.get('name')?.touched" class="text-danger">
              Name is required
            </div>
          </div>

          <div class="col-md-6 mb-3">
            <label for="shipBase" class="form-label">Ship Base *</label>
            <input type="number" id="shipBase" class="form-control" formControlName="shipBase" placeholder="0.00" step="0.01" min="0">
            <div *ngIf="shipMethodForm.get('shipBase')?.invalid && shipMethodForm.get('shipBase')?.touched" class="text-danger">
              Ship base is required and must be a positive number
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="shipRate" class="form-label">Ship Rate *</label>
            <input type="number" id="shipRate" class="form-control" formControlName="shipRate" placeholder="0.00" step="0.01" min="0">
            <div *ngIf="shipMethodForm.get('shipRate')?.invalid && shipMethodForm.get('shipRate')?.touched" class="text-danger">
              Ship rate is required and must be a positive number
            </div>
          </div>
        </div>

        <!-- Display existing ship method info in view mode -->
        <div *ngIf="isViewMode && shipMethod" class="alert alert-info">
          <h6>Additional Information:</h6>
          <p><strong>Ship Method ID:</strong> {{ shipMethod.shipMethodId }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          {{ isViewMode ? 'Close' : 'Cancel' }}
        </button>
        <button *ngIf="!isViewMode" type="submit" class="btn btn-primary" [disabled]="shipMethodForm.invalid || isSubmitting">
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
export class ShipMethodFormComponent implements OnInit {
  @Input() shipMethod: ShipMethodDto | null = null;
  @Output() save = new EventEmitter<ShipMethodDto>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private shipMethodService = inject(ShipMethodService);

  shipMethodForm!: FormGroup;
  isSubmitting = false;

  get isEditMode(): boolean {
    return !!this.shipMethod;
  }

  get isViewMode(): boolean {
    return false; // You can add logic to determine view mode if needed
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.shipMethodForm = this.fb.group({
      name: [this.shipMethod?.name || '', Validators.required],
      shipBase: [this.shipMethod?.shipBase || '', [Validators.required, Validators.min(0)]],
      shipRate: [this.shipMethod?.shipRate || '', [Validators.required, Validators.min(0)]],
    });

    if (this.isViewMode) {
      this.shipMethodForm.disable();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.shipMethodForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.shipMethodForm.value;
      let result: ShipMethodDto;

      if (this.isEditMode && this.shipMethod) {
        const updateData: UpdateShipMethodDto = formValue;
        result = await this.shipMethodService.updateShipMethod(this.shipMethod.shipMethodId, updateData);
      } else {
        const createData: CreateShipMethodDto = formValue;
        result = await this.shipMethodService.createShipMethod(createData);
      }

      this.save.emit(result);
    } catch (error) {
      console.error('Error saving ship method:', error);
      alert('Failed to save ship method. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
} 