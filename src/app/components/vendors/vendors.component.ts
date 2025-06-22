import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { VendorService, VendorFilters } from '../../services/vendor.service';
import { VendorDto, CreateVendorDto, UpdateVendorDto } from '../../models/vendor.dto';
import { VendorFormComponent } from './vendor-form.component';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, VendorFormComponent],
  template: `
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Vendors Management</h2>
          <div>
            <button class="btn btn-outline-secondary me-2" (click)="clearAllFilters()">
              <i class="bi bi-x-circle"></i> Clear All Filters
            </button>
            <button class="btn btn-success" (click)="openCreateModal()">
              <i class="bi bi-plus-circle"></i> Add Vendor
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="vendorService.isLoading()" class="text-center py-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="vendorService.hasError()" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      {{ vendorService.error() }}
    </div>

    <!-- Empty State -->
    <div *ngIf="!vendorService.isLoading() && vendorService.filteredVendors().length === 0" class="text-center py-5">
      <i class="bi bi-building fs-1 text-muted"></i>
      <h4 class="text-muted mt-3">No vendors found</h4>
      <p class="text-muted">Try adjusting your search criteria or add a new vendor.</p>
    </div>

    <!-- Data Table -->
    <div *ngIf="!vendorService.isLoading() && vendorService.filteredVendors().length > 0" class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Account Number</th>
            <th>Name</th>
            <th>Credit Rating</th>
            <th>Preferred Status</th>
            <th>Active Status</th>
            <th>Modified Date</th>
            <th>Actions</th>
          </tr>
          <tr class="filter-row">
            <td><input type="text" class="form-control form-control-sm" [(ngModel)]="columnFilters['businessEntityId']" (ngModelChange)="onFilterChange('businessEntityId', $event)"></td>
            <td><input type="text" class="form-control form-control-sm" [(ngModel)]="columnFilters['accountNumber']" (ngModelChange)="onFilterChange('accountNumber', $event)"></td>
            <td><input type="text" class="form-control form-control-sm" [(ngModel)]="columnFilters['name']" (ngModelChange)="onFilterChange('name', $event)"></td>
            <td>
              <select class="form-select form-select-sm" [(ngModel)]="columnFilters['creditRating']" (ngModelChange)="onFilterChange('creditRating', $event)">
                <option value="">All</option>
                <option value="1">Superior</option>
                <option value="2">Excellent</option>
                <option value="3">Above Average</option>
                <option value="4">Average</option>
                <option value="5">Below Average</option>
              </select>
            </td>
            <td>
              <select class="form-select form-select-sm" [(ngModel)]="columnFilters['preferredVendorStatus']" (ngModelChange)="onFilterChange('preferredVendorStatus', $event)">
                <option value="">Any</option>
                <option [ngValue]="true">Preferred</option>
                <option [ngValue]="false">Standard</option>
              </select>
            </td>
            <td>
              <select class="form-select form-select-sm" [(ngModel)]="columnFilters['activeFlag']" (ngModelChange)="onFilterChange('activeFlag', $event)">
                <option value="">Any</option>
                <option [ngValue]="true">Active</option>
                <option [ngValue]="false">Inactive</option>
              </select>
            </td>
            <td><input type="text" class="form-control form-control-sm" placeholder="MM/DD/YYYY" [(ngModel)]="columnFilters['modifiedDate']" (ngModelChange)="onFilterChange('modifiedDate', $event)"></td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let vendor of vendorService.filteredVendors()">
            <td>{{ vendor.businessEntityId }}</td>
            <td>
              <code>{{ vendor.accountNumber }}</code>
            </td>
            <td>
              <strong>{{ vendor.name }}</strong>
            </td>
            <td>
              <span class="badge" [ngClass]="getCreditRatingBadgeClass(vendor.creditRating)">
                {{ vendor.creditRating }}
              </span>
            </td>
            <td>
              <span class="badge" [ngClass]="vendor.preferredVendorStatus ? 'bg-success' : 'bg-secondary'">
                {{ vendor.preferredVendorStatus ? 'Preferred' : 'Standard' }}
              </span>
            </td>
            <td>
              <span class="badge" [ngClass]="vendor.activeFlag ? 'bg-success' : 'bg-danger'">
                {{ vendor.activeFlag ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>{{ vendor.modifiedDate | date:'short' }}</td>
            <td>
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" (click)="viewVendor(vendor)">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" (click)="editVendor(vendor)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="deleteVendor(vendor)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Vendor Form Modal -->
    <ng-template #vendorModal let-modal>
      <app-vendor-form
        [vendor]="selectedVendor()"
        (save)="onVendorSaved($event, modal)"
        (cancel)="closeModal(modal)"
      ></app-vendor-form>
    </ng-template>
  `
})
export class VendorsComponent implements OnInit {
  private modalService = inject(NgbModal);
  protected vendorService = inject(VendorService);

  columnFilters: { [key: string]: any } = {
    businessEntityId: '',
    accountNumber: '',
    name: '',
    creditRating: '',
    preferredVendorStatus: '',
    activeFlag: '',
    modifiedDate: ''
  };

  selectedVendor = signal<VendorDto | null>(null);

  @ViewChild('vendorModal') vendorModal!: any;

  ngOnInit(): void {
    // Component is ready
  }

  onFilterChange(column: string, value: any) {
    this.vendorService.setColumnFilter(column as keyof VendorFilters, value);
  }

  clearAllFilters(): void {
    this.columnFilters = {
      businessEntityId: '',
      accountNumber: '',
      name: '',
      creditRating: '',
      preferredVendorStatus: '',
      activeFlag: '',
      modifiedDate: ''
    };
    this.vendorService.clearFilters();
  }

  reload(): void {
    this.vendorService.reload();
  }

  openCreateModal(): void {
    this.selectedVendor.set(null);
    this.modalService.open(this.vendorModal, { size: 'lg' });
  }

  viewVendor(vendor: VendorDto): void {
    this.selectedVendor.set(vendor);
    this.modalService.open(this.vendorModal, { size: 'lg' });
  }

  editVendor(vendor: VendorDto): void {
    this.selectedVendor.set(vendor);
    this.modalService.open(this.vendorModal, { size: 'lg' });
  }

  async deleteVendor(vendor: VendorDto): Promise<void> {
    if (confirm(`Are you sure you want to delete vendor "${vendor.name}"?`)) {
      try {
        await this.vendorService.deleteVendor(vendor.businessEntityId);
        alert('Vendor deleted successfully');
      } catch (error) {
        alert('Failed to delete vendor');
      }
    }
  }

  onVendorSaved(vendor: VendorDto, modal: any): void {
    this.closeModal(modal);
    this.reload();
  }

  closeModal(modal: any): void {
    modal.close();
  }

  getCreditRatingBadgeClass(rating: number): string {
    if (rating >= 4) return 'bg-success';
    if (rating >= 3) return 'bg-warning';
    return 'bg-danger';
  }
} 