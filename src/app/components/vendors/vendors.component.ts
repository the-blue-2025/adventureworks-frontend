import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { VendorService } from '../../services/vendor.service';
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
          <button class="btn btn-success" (click)="openCreateModal()">
            <i class="bi bi-plus-circle"></i> Add Vendor
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search vendors by name or account number..."
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          >
          <button class="btn btn-outline-secondary" type="button" (click)="clearSearch()">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>
      </div>
      <div class="col-md-4">
        <button class="btn btn-outline-success w-100" (click)="reload()">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
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
    <div *ngIf="!vendorService.isLoading() && vendorService.isEmpty()" class="text-center py-5">
      <i class="bi bi-building fs-1 text-muted"></i>
      <h4 class="text-muted mt-3">No vendors found</h4>
      <p class="text-muted">Try adjusting your search criteria or add a new vendor.</p>
    </div>

    <!-- Data Table -->
    <div *ngIf="!vendorService.isLoading() && !vendorService.isEmpty()" class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Account Number</th>
            <th>Name</th>
            <th>Credit Rating</th>
            <th>Status</th>
            <th>Web Service URL</th>
            <th>Modified Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let vendor of vendorService.vendors()">
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
              <div class="d-flex flex-column gap-1">
                <span class="badge" [ngClass]="vendor.preferredVendorStatus ? 'bg-success' : 'bg-secondary'">
                  {{ vendor.preferredVendorStatus ? 'Preferred' : 'Standard' }}
                </span>
                <span class="badge" [ngClass]="vendor.activeFlag ? 'bg-success' : 'bg-danger'">
                  {{ vendor.activeFlag ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </td>
            <td>
              <span *ngIf="vendor.purchasingWebServiceURL; else noUrl">
                <a [href]="vendor.purchasingWebServiceURL" target="_blank" class="text-decoration-none">
                  <i class="bi bi-link-45deg"></i> View
                </a>
              </span>
              <ng-template #noUrl>
                <span class="text-muted">-</span>
              </ng-template>
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
    
    code {
      background-color: #f8f9fa;
      padding: 2px 4px;
      border-radius: 3px;
    }
  `]
})
export class VendorsComponent implements OnInit {
  private modalService = inject(NgbModal);
  protected vendorService = inject(VendorService);

  searchQuery = '';
  selectedVendor = signal<VendorDto | null>(null);

  @ViewChild('vendorModal') vendorModal!: any;

  ngOnInit(): void {
    // Component is ready
  }

  onSearch(): void {
    this.vendorService.setSearchQuery(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.vendorService.clearSearch();
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