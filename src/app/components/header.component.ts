import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/dashboard">Home</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link" routerLink="/persons" routerLinkActive="active">Persons</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/vendors" routerLinkActive="active">Vendors</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/ship-methods" routerLinkActive="active">Ship Methods</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/purchase-orders" routerLinkActive="active">Purchase Orders</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/sales-orders" routerLinkActive="active">Sales Orders</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `
})
export class HeaderComponent {} 