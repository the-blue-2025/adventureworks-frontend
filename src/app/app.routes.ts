import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PersonsComponent } from './components/persons/persons.component';
import { VendorsComponent } from './components/vendors/vendors.component';
import { ShipMethodsComponent } from './components/ship-methods/ship-methods.component';
import { PurchaseOrdersComponent } from './components/purchase-orders/purchase-orders.component';
import { PurchaseOrderDetailsComponent } from './components/purchase-order-details/purchase-order-details.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'persons', component: PersonsComponent },
  { path: 'vendors', component: VendorsComponent },
  { path: 'ship-methods', component: ShipMethodsComponent },
  { path: 'purchase-orders', component: PurchaseOrdersComponent },
  { 
    path: 'purchase-orders/:id/details', 
    loadComponent: () => import('./components/purchase-order-details/purchase-order-details.component').then(m => m.PurchaseOrderDetailsComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
