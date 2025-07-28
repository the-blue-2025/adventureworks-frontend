import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PersonsComponent } from './components/persons/persons.component';
import { VendorsComponent } from './components/vendors/vendors.component';
import { ShipMethodsComponent } from './components/ship-methods/ship-methods.component';
import { PurchaseOrdersComponent } from './components/purchase-orders/purchase-orders.component';
import { PurchaseOrderDetailsComponent } from './components/purchase-order-details/purchase-order-details.component';
import { SalesOrdersComponent } from './components/sales-orders/sales-orders.component';
import { SalesOrderDetailsComponent } from './components/sales-order-details/sales-order-details.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'persons', component: PersonsComponent },
  { path: 'vendors', component: VendorsComponent },
  { path: 'ship-methods', component: ShipMethodsComponent },
  { path: 'purchase-orders', component: PurchaseOrdersComponent },
  { 
    path: 'purchase-orders/create', 
    loadComponent: () => import('./components/purchase-orders/purchase-order-form.component').then(m => m.PurchaseOrderFormComponent)
  },
  { 
    path: 'purchase-orders/:id/edit', 
    loadComponent: () => import('./components/purchase-orders/purchase-order-form.component').then(m => m.PurchaseOrderFormComponent)
  },
  { 
    path: 'purchase-orders/:id/details', 
    loadComponent: () => import('./components/purchase-order-details/purchase-order-details.component').then(m => m.PurchaseOrderDetailsComponent)
  },
  { path: 'sales-orders', component: SalesOrdersComponent },
  { 
    path: 'sales-orders/create', 
    loadComponent: () => import('./components/sales-orders/sales-order-form.component').then(m => m.SalesOrderFormComponent)
  },
  { 
    path: 'sales-orders/:id/edit', 
    loadComponent: () => import('./components/sales-orders/sales-order-form.component').then(m => m.SalesOrderFormComponent)
  },
  { 
    path: 'sales-orders/:id/details', 
    loadComponent: () => import('./components/sales-order-details/sales-order-details.component').then(m => m.SalesOrderDetailsComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
