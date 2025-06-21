import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ShipMethodService } from '../../services/ship-method.service';
import { ShipMethodDto, CreateShipMethodDto, UpdateShipMethodDto } from '../../models/ship-method.dto';
import { ShipMethodFormComponent } from './ship-method-form.component';

@Component({
  selector: 'app-ship-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, ShipMethodFormComponent],
  template: `
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Ship Methods Management</h2>
          <button class="btn btn-warning" (click)="openCreateModal()">
            <i class="bi bi-plus-circle"></i> Add Ship Method
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
            placeholder="Search ship methods by name..."
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          >
          <button class="btn btn-outline-secondary" type="button" (click)="clearSearch()">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>
      </div>
      <div class="col-md-4">
        <button class="btn btn-outline-warning w-100" (click)="reload()">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="shipMethodService.isLoading()" class="text-center py-5">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="shipMethodService.hasError()" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      {{ shipMethodService.error() }}
    </div>

    <!-- Empty State -->
    <div *ngIf="!shipMethodService.isLoading() && shipMethodService.isEmpty()" class="text-center py-5">
      <i class="bi bi-truck fs-1 text-muted"></i>
      <h4 class="text-muted mt-3">No ship methods found</h4>
      <p class="text-muted">Try adjusting your search criteria or add a new ship method.</p>
    </div>

    <!-- Data Table -->
    <div *ngIf="!shipMethodService.isLoading() && !shipMethodService.isEmpty()" class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Base Rate</th>
            <th>Rate</th>
            <th>Total Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let shipMethod of shipMethodService.shipMethods()">
            <td>{{ shipMethod.shipMethodId }}</td>
            <td>
              <strong>{{ shipMethod.name }}</strong>
            </td>
            <td>
              <span class="badge bg-info">{{ shipMethod.shipBase | currency }}</span>
            </td>
            <td>
              <span class="badge bg-secondary">{{ shipMethod.shipRate | currency }}</span>
            </td>
            <td>
              <span class="badge bg-success">{{ shipMethod.shipBase + shipMethod.shipRate | currency }}</span>
            </td>
            <td>
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" (click)="viewShipMethod(shipMethod)">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" (click)="editShipMethod(shipMethod)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="deleteShipMethod(shipMethod)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Ship Method Form Modal -->
    <ng-template #shipMethodModal let-modal>
      <app-ship-method-form
        [shipMethod]="selectedShipMethod()"
        (save)="onShipMethodSaved($event, modal)"
        (cancel)="closeModal(modal)"
      ></app-ship-method-form>
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
  `]
})
export class ShipMethodsComponent implements OnInit {
  private modalService = inject(NgbModal);
  protected shipMethodService = inject(ShipMethodService);

  searchQuery = '';
  selectedShipMethod = signal<ShipMethodDto | null>(null);
  @ViewChild('shipMethodModal') shipMethodModal!: any;

  ngOnInit(): void {
    // Component is ready
  }

  onSearch(): void {
    this.shipMethodService.setSearchQuery(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.shipMethodService.clearSearch();
  }

  reload(): void {
    this.shipMethodService.reload();
  }

  openCreateModal(): void {
    this.selectedShipMethod.set(null);
    this.modalService.open(this.shipMethodModal, { size: 'lg' });
  }

  viewShipMethod(shipMethod: ShipMethodDto): void {
    this.selectedShipMethod.set(shipMethod);
    this.modalService.open(this.shipMethodModal, { size: 'lg' });
  }

  editShipMethod(shipMethod: ShipMethodDto): void {
    this.selectedShipMethod.set(shipMethod);
    this.modalService.open(this.shipMethodModal, { size: 'lg' });
  }

  async deleteShipMethod(shipMethod: ShipMethodDto): Promise<void> {
    if (confirm(`Are you sure you want to delete ship method "${shipMethod.name}"?`)) {
      try {
        await this.shipMethodService.deleteShipMethod(shipMethod.shipMethodId);
        alert('Ship method deleted successfully');
      } catch (error) {
        alert('Failed to delete ship method');
      }
    }
  }

  onShipMethodSaved(shipMethod: ShipMethodDto, modal: any): void {
    this.closeModal(modal);
    this.reload();
  }

  closeModal(modal: any): void {
    modal.close();
  }
} 