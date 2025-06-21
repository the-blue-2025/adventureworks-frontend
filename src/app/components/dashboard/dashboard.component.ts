import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgbAccordionModule],
  template: `
    <div class="row">
      <div class="col-12">
        <h1 class="mb-4">AdventureWorks Data Management Dashboard</h1>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6 col-lg-3 mb-4">
        <div class="card text-center h-100">
          <div class="card-body">
            <i class="bi bi-people-fill fs-1 text-primary mb-3"></i>
            <h5 class="card-title">Persons</h5>
            <p class="card-text">Manage person information</p>
            <button class="btn btn-primary" (click)="navigateTo('/persons')">
              Manage Persons
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-6 col-lg-3 mb-4">
        <div class="card text-center h-100">
          <div class="card-body">
            <i class="bi bi-building-fill fs-1 text-success mb-3"></i>
            <h5 class="card-title">Vendors</h5>
            <p class="card-text">Manage vendor information</p>
            <button class="btn btn-success" (click)="navigateTo('/vendors')">
              Manage Vendors
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-6 col-lg-3 mb-4">
        <div class="card text-center h-100">
          <div class="card-body">
            <i class="bi bi-box fs-1 text-warning mb-3"></i>
            <h5 class="card-title">Ship Methods</h5>
            <p class="card-text">Configure shipping methods and rates</p>
            <button class="btn btn-warning" (click)="navigateTo('/ship-methods')">
              Manage Ship Methods
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-6 col-lg-3 mb-4">
        <div class="card text-center h-100">
          <div class="card-body">
            <i class="bi bi-cart-fill fs-1 text-info mb-3"></i>
            <h5 class="card-title">Purchase Orders</h5>
            <p class="card-text">Manage purchase orders and details</p>
            <button class="btn btn-info" (click)="navigateTo('/purchase-orders')">
              Manage Purchase Orders
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Quick Actions</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-2">
                <button class="btn btn-outline-primary w-100" (click)="navigateTo('/persons')">
                  <i class="bi bi-plus-circle"></i> Add Person
                </button>
              </div>
              <div class="col-md-3 mb-2">
                <button class="btn btn-outline-success w-100" (click)="navigateTo('/vendors')">
                  <i class="bi bi-plus-circle"></i> Add Vendor
                </button>
              </div>
              <div class="col-md-3 mb-2">
                <button class="btn btn-outline-warning w-100" (click)="navigateTo('/ship-methods')">
                  <i class="bi bi-plus-circle"></i> Add Ship Method
                </button>
              </div>
              <div class="col-md-3 mb-2">
                <button class="btn btn-outline-info w-100" (click)="navigateTo('/purchase-orders')">
                  <i class="bi bi-plus-circle"></i> Add Purchase Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s;
      border: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .bi {
      display: inline-block;
    }
  `]
})
export class DashboardComponent {
  private router = inject(Router);

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
} 