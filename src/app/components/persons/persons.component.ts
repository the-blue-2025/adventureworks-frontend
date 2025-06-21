import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { PersonService } from '../../services/person.service';
import { PersonDto, CreatePersonDto, UpdatePersonDto } from '../../models/person.dto';
import { PersonFormComponent } from './person-form.component';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, PersonFormComponent],
  template: `
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Persons Management</h2>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <i class="bi bi-plus-circle"></i> Add Person
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search persons..."
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          >
          <button class="btn btn-outline-secondary" type="button" (click)="clearSearch()">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>
      </div>
      <div class="col-md-3">
        <select class="form-select" [(ngModel)]="selectedPersonType" (change)="onPersonTypeChange()">
          <option value="">All Types</option>
          <option value="EM">Employee</option>
          <option value="SC">Store Contact</option>
          <option value="VC">Vendor Contact</option>
          <option value="IN">Individual Customer</option>
          <option value="SP">Sales Person</option>
          <option value="GC">General Contact</option>
        </select>
      </div>
      <div class="col-md-3">
        <button class="btn btn-outline-primary w-100" (click)="reload()">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="personService.isLoading()" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="personService.hasError()" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      {{ personService.error() }}
    </div>

    <!-- Empty State -->
    <div *ngIf="!personService.isLoading() && personService.isEmpty()" class="text-center py-5">
      <i class="bi bi-people fs-1 text-muted"></i>
      <h4 class="text-muted mt-3">No persons found</h4>
      <p class="text-muted">Try adjusting your search criteria or add a new person.</p>
    </div>

    <!-- Data Table -->
    <div *ngIf="!personService.isLoading() && !personService.isEmpty()" class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Title</th>
            <th>Email Promotion</th>
            <th>Modified Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let person of personService.persons()">
            <td>{{ person.businessEntityId }}</td>
            <td>
              <strong>{{ person.firstName }} {{ person.lastName }}</strong>
              <br>
              <small class="text-muted" *ngIf="person.middleName">{{ person.middleName }}</small>
            </td>
            <td>
              <span class="badge" [ngClass]="getPersonTypeBadgeClass(person.personType)">
                {{ person.personType }}
              </span>
            </td>
            <td>{{ person.title || '-' }}</td>
            <td>
              <span class="badge" [ngClass]="person.emailPromotion > 0 ? 'bg-success' : 'bg-secondary'">
                {{ person.emailPromotion > 0 ? 'Yes' : 'No' }}
              </span>
            </td>
            <td>{{ person.modifiedDate | date:'short' }}</td>
            <td>
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" (click)="viewPerson(person)">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" (click)="editPerson(person)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="deletePerson(person)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Person Form Modal -->
    <ng-template #personModal let-modal>
      <app-person-form
        [person]="selectedPerson()"
        (save)="onPersonSaved($event, modal)"
        (cancel)="closeModal(modal)"
      ></app-person-form>
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
export class PersonsComponent implements OnInit {
  private modalService = inject(NgbModal);
  protected personService = inject(PersonService);

  searchQuery = '';
  selectedPersonType = '';
  selectedPerson = signal<PersonDto | null>(null);

  @ViewChild('personModal') personModal!: any;

  ngOnInit(): void {
    // Component is ready
  }

  onSearch(): void {
    this.personService.setSearchQuery(this.searchQuery);
  }

  onPersonTypeChange(): void {
    this.personService.setPersonType(this.selectedPersonType);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedPersonType = '';
    this.personService.clearSearch();
  }

  reload(): void {
    this.personService.reload();
  }

  openCreateModal(): void {
    this.selectedPerson.set(null);
    this.modalService.open(this.personModal, { size: 'lg' });
  }

  viewPerson(person: PersonDto): void {
    this.selectedPerson.set(person);
    this.modalService.open(this.personModal, { size: 'lg' });
  }

  editPerson(person: PersonDto): void {
    this.selectedPerson.set(person);
    this.modalService.open(this.personModal, { size: 'lg' });
  }

  async deletePerson(person: PersonDto): Promise<void> {
    if (confirm(`Are you sure you want to delete ${person.firstName} ${person.lastName}?`)) {
      try {
        await this.personService.deletePerson(person.businessEntityId);
        alert('Person deleted successfully');
      } catch (error) {
        alert('Failed to delete person');
      }
    }
  }

  onPersonSaved(person: PersonDto, modal: any): void {
    this.closeModal(modal);
    this.reload();
  }

  closeModal(modal: any): void {
    modal.close();
  }

  getPersonTypeBadgeClass(personType: string): string {
    const classes: { [key: string]: string } = {
      'EM': 'bg-primary',
      'SC': 'bg-success',
      'VC': 'bg-warning',
      'IN': 'bg-info',
      'SP': 'bg-secondary',
      'GC': 'bg-dark'
    };
    return classes[personType] || 'bg-secondary';
  }
} 