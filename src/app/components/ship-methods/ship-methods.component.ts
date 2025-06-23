import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShipMethodService } from '../../services/ship-method.service';
import { ShipMethodDto, CreateShipMethodDto, UpdateShipMethodDto } from '../../models/ship-method.dto';

@Component({
  selector: 'app-ship-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Ship Methods Management</h2>
          <button class="btn btn-warning" (click)="addNewShipMethod()">
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
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- New Ship Method Row (when adding) -->
          <tr *ngIf="isAddingNew" class="table-warning">
            <td>
              <span class="badge bg-secondary">New</span>
            </td>
            <td>
              <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Ship Method Name"
                formControlName="name"
                [class.is-invalid]="shipMethodForm.get('name')?.invalid && shipMethodForm.get('name')?.touched"
              >
              <div *ngIf="shipMethodForm.get('name')?.invalid && shipMethodForm.get('name')?.touched" class="text-danger small">
                Name is required
              </div>
            </td>
            <td>
              <input 
                type="number" 
                class="form-control form-control-sm" 
                placeholder="0.00" 
                step="0.01" 
                min="0"
                formControlName="shipBase"
                [class.is-invalid]="shipMethodForm.get('shipBase')?.invalid && shipMethodForm.get('shipBase')?.touched"
              >
              <div *ngIf="shipMethodForm.get('shipBase')?.invalid && shipMethodForm.get('shipBase')?.touched" class="text-danger small">
                Required, min 0
              </div>
            </td>
            <td>
              <input 
                type="number" 
                class="form-control form-control-sm" 
                placeholder="0.00" 
                step="0.01" 
                min="0"
                formControlName="shipRate"
                [class.is-invalid]="shipMethodForm.get('shipRate')?.invalid && shipMethodForm.get('shipRate')?.touched"
              >
              <div *ngIf="shipMethodForm.get('shipRate')?.invalid && shipMethodForm.get('shipRate')?.touched" class="text-danger small">
                Required, min 0
              </div>
            </td>
            <td>
              <span class="badge bg-success">
                {{ (shipMethodForm.get('shipBase')?.value || 0) + (shipMethodForm.get('shipRate')?.value || 0) | currency }}
              </span>
            </td>
            <td>
              <div class="form-check d-flex justify-content-center">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  formControlName="isActive"
                  id="newIsActive"
                >
              </div>
            </td>
            <td>
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-success" (click)="saveNewShipMethod()" [disabled]="shipMethodForm.invalid || isSubmitting">
                  <i class="bi bi-check"></i>
                </button>
                <button class="btn btn-sm btn-danger" (click)="cancelAdd()">
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </td>
          </tr>

          <!-- Existing Ship Method Rows -->
          <tr *ngFor="let shipMethod of shipMethodService.shipMethods(); trackBy: trackByShipMethodId" [class.table-warning]="editingShipMethodId() === shipMethod.shipMethodId">
            <td>{{ shipMethod.shipMethodId }}</td>
            <ng-container *ngIf="editingShipMethodId() === shipMethod.shipMethodId; else viewRow">
              <div [formGroup]="getEditingForm(shipMethod.shipMethodId)" style="display: contents;">
                <td>
                  <input type="text" class="form-control form-control-sm" placeholder="Ship Method Name"
                    formControlName="name"
                    [class.is-invalid]="getEditingForm(shipMethod.shipMethodId).get('name')?.invalid && getEditingForm(shipMethod.shipMethodId).get('name')?.touched">
                  <div *ngIf="getEditingForm(shipMethod.shipMethodId).get('name')?.invalid && getEditingForm(shipMethod.shipMethodId).get('name')?.touched" class="text-danger small">
                    Name is required
                  </div>
                </td>
                <td>
                  <input type="number" class="form-control form-control-sm" placeholder="0.00" step="0.01" min="0"
                    formControlName="shipBase"
                    [class.is-invalid]="getEditingForm(shipMethod.shipMethodId).get('shipBase')?.invalid && getEditingForm(shipMethod.shipMethodId).get('shipBase')?.touched">
                  <div *ngIf="getEditingForm(shipMethod.shipMethodId).get('shipBase')?.invalid && getEditingForm(shipMethod.shipMethodId).get('shipBase')?.touched" class="text-danger small">
                    Required, min 0
                  </div>
                </td>
                <td>
                  <input type="number" class="form-control form-control-sm" placeholder="0.00" step="0.01" min="0"
                    formControlName="shipRate"
                    [class.is-invalid]="getEditingForm(shipMethod.shipMethodId).get('shipRate')?.invalid && getEditingForm(shipMethod.shipMethodId).get('shipRate')?.touched">
                  <div *ngIf="getEditingForm(shipMethod.shipMethodId).get('shipRate')?.invalid && getEditingForm(shipMethod.shipMethodId).get('shipRate')?.touched" class="text-danger small">
                    Required, min 0
                  </div>
                </td>
                <td>
                  <span class="badge bg-success">
                    {{ (getEditingForm(shipMethod.shipMethodId).get('shipBase')?.value || 0) + (getEditingForm(shipMethod.shipMethodId).get('shipRate')?.value || 0) | currency }}
                  </span>
                </td>
                <td>
                  <div class="form-check d-flex justify-content-center">
                    <input class="form-check-input" type="checkbox" formControlName="isActive" [id]="'isActive' + shipMethod.shipMethodId">
                  </div>
                </td>
                <td>
                  <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-success" (click)="saveShipMethod(shipMethod)" [disabled]="getEditingForm(shipMethod.shipMethodId).invalid || isSubmitting">
                      <i class="bi bi-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="cancelEdit()">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </td>
              </div>
            </ng-container>
            <ng-template #viewRow>
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
                <span class="badge bg-success">{{ getTotalRate(shipMethod) | currency }}</span>
              </td>
              <td>
                <div class="d-flex justify-content-center">
                  <span class="badge" [ngClass]="shipMethod.isActive ? 'bg-success' : 'bg-secondary'">
                    <i class="bi" [ngClass]="shipMethod.isActive ? 'bi-check-circle' : 'bi-x-circle'"></i>
                    {{ shipMethod.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </td>
              <td>
                <div class="btn-group" role="group">
                  <button class="btn btn-sm btn-outline-warning" (click)="editShipMethod(shipMethod)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteShipMethod(shipMethod)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </ng-template>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class ShipMethodsComponent implements OnInit {
  private fb = inject(FormBuilder);
  protected shipMethodService = inject(ShipMethodService);

  searchQuery = '';
  editingShipMethodId = signal<number | null>(null);
  isAddingNew = false;
  isSubmitting = false;
  shipMethodForm!: FormGroup;
  editingForms = new Map<number, FormGroup>();

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.shipMethodForm = this.fb.group({
      name: ['', Validators.required],
      shipBase: ['', [Validators.required, Validators.min(0)]],
      shipRate: ['', [Validators.required, Validators.min(0)]],
      isActive: [true],
    });
  }

  private createEditingForm(shipMethod: ShipMethodDto): FormGroup {
    return this.fb.group({
      name: [shipMethod.name, Validators.required],
      shipBase: [shipMethod.shipBase, [Validators.required, Validators.min(0)]],
      shipRate: [shipMethod.shipRate, [Validators.required, Validators.min(0)]],
      isActive: [shipMethod.isActive],
    });
  }

  getEditingForm(shipMethodId: number): FormGroup {
    return this.editingForms.get(shipMethodId) as FormGroup;
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

  addNewShipMethod(): void {
    this.isAddingNew = true;
    this.editingShipMethodId.set(null);
    this.shipMethodForm.reset();
  }

  editShipMethod(shipMethod: ShipMethodDto): void {
    const form = this.createEditingForm(shipMethod);
    this.editingForms.set(shipMethod.shipMethodId, form);
    this.isAddingNew = false;
    this.editingShipMethodId.set(shipMethod.shipMethodId);
  }

  async saveNewShipMethod(): Promise<void> {
    if (this.shipMethodForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const createData: CreateShipMethodDto = this.shipMethodForm.value;
      await this.shipMethodService.createShipMethod(createData);
      this.cancelAdd();
      this.reload();
    } catch (error) {
      console.error('Error creating ship method:', error);
      alert('Failed to create ship method. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  async saveShipMethod(shipMethod: ShipMethodDto): Promise<void> {
    const editingForm = this.getEditingForm(shipMethod.shipMethodId);
    if (editingForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const updateData: UpdateShipMethodDto = editingForm.value;
      await this.shipMethodService.updateShipMethod(shipMethod.shipMethodId, updateData);
      this.cancelEdit();
      this.reload();
    } catch (error) {
      console.error('Error updating ship method:', error);
      alert('Failed to update ship method. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  cancelAdd(): void {
    this.isAddingNew = false;
    this.shipMethodForm.reset();
  }

  cancelEdit(): void {
    const editingId = this.editingShipMethodId();
    if (editingId) {
      this.editingForms.delete(editingId);
    }
    this.editingShipMethodId.set(null);
  }

  async deleteShipMethod(shipMethod: ShipMethodDto): Promise<void> {
    if (confirm(`Are you sure you want to delete ship method "${shipMethod.name}"?`)) {
      try {
        await this.shipMethodService.deleteShipMethod(shipMethod.shipMethodId);
        alert('Ship method deleted successfully');
        this.reload();
      } catch (error) {
        alert('Failed to delete ship method');
      }
    }
  }

  getTotalRate(shipMethod: ShipMethodDto): number | null {
    if (shipMethod && typeof shipMethod.shipBase === 'number' && typeof shipMethod.shipRate === 'number') {
      return shipMethod.shipBase + shipMethod.shipRate;
    }
    return null;
  }

  trackByShipMethodId(index: number, shipMethod: ShipMethodDto): number {
    return shipMethod.shipMethodId;
  }
} 