import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendorService } from '../../services/vendor.service';
import { VendorDto, CreateVendorDto, UpdateVendorDto } from '../../models/vendor.dto';

@Component({
  selector: 'app-vendor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">
        {{ isEditMode ? 'Edit Vendor' : 'Create New Vendor' }}
      </h4>
      <button type="button" class="btn-close" (click)="onCancel()"></button>
    </div>

    <form [formGroup]="vendorForm" (ngSubmit)="onSubmit()">
      <div class="modal-body">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="accountNumber" class="form-label">Account Number *</label>
            <input type="text" id="accountNumber" class="form-control" formControlName="accountNumber" placeholder="Account Number">
            <div *ngIf="vendorForm.get('accountNumber')?.invalid && vendorForm.get('accountNumber')?.touched" class="text-danger">
              Account number is required
            </div>
          </div>

          <div class="col-md-6 mb-3">
            <label for="name" class="form-label">Name *</label>
            <input type="text" id="name" class="form-control" formControlName="name" placeholder="Vendor Name">
            <div *ngIf="vendorForm.get('name')?.invalid && vendorForm.get('name')?.touched" class="text-danger">
              Name is required
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="creditRating" class="form-label">Credit Rating</label>
            <select id="creditRating" class="form-select" formControlName="creditRating">
              <option value="">Select Rating</option>
              <option value="1">Superior</option>
              <option value="2">Excellent</option>
              <option value="3">Above Average</option>
              <option value="4">Average</option>
              <option value="5">Below Average</option>
            </select>
          </div>

          <div class="col-md-6 mb-3">
            <label for="preferredVendorStatus" class="form-label">Preferred Vendor Status</label>
            <select id="preferredVendorStatus" class="form-select" formControlName="preferredVendorStatus">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="activeFlag" class="form-label">Active Status</label>
            <select id="activeFlag" class="form-select" formControlName="activeFlag">
              <option value="0">Inactive</option>
              <option value="1">Active</option>
            </select>
          </div>

          <div class="col-md-6 mb-3">
            <label for="purchasingWebServiceURL" class="form-label">Web Service URL</label>
            <input type="url" id="purchasingWebServiceURL" class="form-control" formControlName="purchasingWebServiceURL" placeholder="https://example.com">
          </div>
        </div>

        <!-- Display existing vendor info in view mode -->
        <div *ngIf="isViewMode && vendor" class="alert alert-info">
          <h6>Additional Information:</h6>
          <p><strong>Business Entity ID:</strong> {{ vendor.businessEntityId }}</p>
          <p><strong>Modified Date:</strong> {{ vendor.modifiedDate | date:'full' }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          {{ isViewMode ? 'Close' : 'Cancel' }}
        </button>
        <button *ngIf="!isViewMode" type="submit" class="btn btn-primary" [disabled]="vendorForm.invalid || isSubmitting">
          <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
          {{ isEditMode ? 'Update' : 'Create' }}
        </button>
      </div>
    </form>
  `
})
export class VendorFormComponent implements OnInit {
  @Input() vendor: VendorDto | null = null;
  @Output() save = new EventEmitter<VendorDto>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private vendorService = inject(VendorService);

  vendorForm!: FormGroup;
  isSubmitting = false;

  get isEditMode(): boolean {
    return !!this.vendor;
  }

  get isViewMode(): boolean {
    return false; // You can add logic to determine view mode if needed
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.vendorForm = this.fb.group({
      accountNumber: [this.vendor?.accountNumber || '', Validators.required],
      name: [this.vendor?.name || '', Validators.required],
      creditRating: [this.vendor?.creditRating || ''],
      preferredVendorStatus: [this.vendor?.preferredVendorStatus ?? 0],
      activeFlag: [this.vendor?.activeFlag ?? 1],
      purchasingWebServiceURL: [this.vendor?.purchasingWebServiceURL || '']
    });

    if (this.isViewMode) {
      this.vendorForm.disable();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.vendorForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.vendorForm.value;
      let result: VendorDto;

      if (this.isEditMode && this.vendor) {
        const updateData: UpdateVendorDto = formValue;
        result = await this.vendorService.updateVendor(this.vendor.businessEntityId, updateData);
      } else {
        const createData: CreateVendorDto = formValue;
        result = await this.vendorService.createVendor(createData);
      }

      this.save.emit(result);
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
} 