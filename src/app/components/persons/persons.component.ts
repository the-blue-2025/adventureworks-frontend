import { Component, inject, OnInit, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { PersonService } from '../../services/person.service';
import { PersonDto, CreatePersonDto, UpdatePersonDto } from '../../models/person.dto';
import { PersonFormComponent } from './person-form.component';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, NgbPaginationModule, PersonFormComponent],
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
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearch($event)"
          >
          <button class="btn btn-outline-secondary" type="button" (click)="clearSearch()">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>
      </div>
      <div class="col-md-3">
        <select class="form-select" [ngModel]="selectedPersonType()" (ngModelChange)="onPersonTypeChange($event)">
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
    @if (personService.isLoading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    }

    <!-- Error State -->
    @if (personService.hasError()) {
      <div class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle"></i>
        {{ personService.error() }}
      </div>
    }

    <!-- Empty State -->
    @if (!personService.isLoading() && personService.filteredPersons().length === 0) {
      <div class="text-center py-5">
        <i class="bi bi-people fs-1 text-muted"></i>
        <h4 class="text-muted mt-3">No persons found</h4>
        <p class="text-muted">Try adjusting your search criteria or add a new person.</p>
      </div>
    }

    <!-- Data Table -->
    @if (!personService.isLoading() && personService.filteredPersons().length > 0) {
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead class="table-dark">
            <tr>
              <th class="sortable" (click)="sortBy('businessEntityId')">
                ID<i class="bi" [ngClass]="getSortIcon('businessEntityId')"></i>
              </th>
              <th class="sortable" (click)="sortBy('firstName')">
                Name<i class="bi" [ngClass]="getSortIcon('firstName')"></i>
              </th>
              <th class="sortable" (click)="sortBy('personType')">
                Type<i class="bi" [ngClass]="getSortIcon('personType')"></i>
              </th>
              <th class="sortable" (click)="sortBy('title')">
                Title<i class="bi" [ngClass]="getSortIcon('title')"></i>
              </th>
              <th class="sortable" (click)="sortBy('emailPromotion')">
                Email Promotion<i class="bi" [ngClass]="getSortIcon('emailPromotion')"></i>
              </th>
              <th class="sortable" (click)="sortBy('modifiedDate')">
                Modified Date<i class="bi" [ngClass]="getSortIcon('modifiedDate')"></i>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (person of getPaginatedPersons(); track person.businessEntityId) {
              <tr>
                <td>{{ person.businessEntityId }}</td>
                <td>
                  <strong>{{ person.firstName }} {{ person.lastName }}</strong>
                  @if (person.middleName) {
                    <br>
                    <small class="text-muted">{{ person.middleName }}</small>
                  }
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
            }
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-muted">
            Showing {{ getStartIndex() + 1 }} to {{ getEndIndex() }} of {{ personService.filteredPersons().length }} persons
          </div>
          <ngb-pagination
            [collectionSize]="personService.filteredPersons().length"
            [page]="currentPage()"
            [pageSize]="pageSize()"
            [boundaryLinks]="true"
            [maxSize]="5"
            [rotate]="true"
            [ellipses]="true"
            class="d-flex justify-content-center"
            (pageChange)="onPageChange($event)"
          >
            <ng-template ngbPaginationFirst>First</ng-template>
            <ng-template ngbPaginationLast>Last</ng-template>
            <ng-template ngbPaginationPrevious>Previous</ng-template>
            <ng-template ngbPaginationNext>Next</ng-template>
          </ngb-pagination>
          <div class="d-flex align-items-center">
            <label for="pageSizeSelect" class="form-label me-2 mb-0">Items per page:</label>
            <select 
              id="pageSizeSelect" 
              class="form-select form-select-sm" 
              style="width: auto;"
              [ngModel]="pageSize()" 
              (ngModelChange)="onPageSizeChange($event)"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>
    }

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
    
    .sortable {
      cursor: pointer;
      user-select: none;
    }
    
    .sortable:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .badge {
      font-size: 0.75em;
    }
    
    .table-responsive {
      border-radius: 0.375rem;
      overflow: hidden;
    }
    
    .table tbody tr:hover {
      background-color: rgba(0, 123, 255, 0.05);
    }
  `]
})
export class PersonsComponent implements OnInit {
  private modalService = inject(NgbModal);
  protected personService = inject(PersonService);

  // Reactive signals for component state
  searchQuery = signal('');
  selectedPersonType = signal('');
  selectedPerson = signal<PersonDto | null>(null);

  // Pagination signals
  currentPage = signal(1);
  pageSize = signal(25);

  // Sorting signals
  sortColumn = signal('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  @ViewChild('personModal') personModal!: any;

  // Computed signals for better performance
  sortedPersons = computed(() => {
    const persons = this.personService.filteredPersons();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return persons;

    return [...persons].sort((a, b) => {
      const aValue = this.getSortValue(a, column);
      const bValue = this.getSortValue(b, column);

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  paginatedPersons = computed(() => {
    const persons = this.sortedPersons();
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return persons.slice(startIndex, endIndex);
  });

  ngOnInit(): void {
    // Component is now reactive and will automatically update when service signals change
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.personService.setSearchQuery(query);
    this.resetPagination();
  }

  onPersonTypeChange(type: string): void {
    this.selectedPersonType.set(type);
    this.personService.setPersonType(type);
    this.resetPagination();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.personService.clearSearch();
    this.resetPagination();
  }

  reload(): void {
    this.personService.reload();
  }

  sortBy(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(direction => direction === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'bi-arrow-down-up';
    return this.sortDirection() === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  getPaginatedPersons(): PersonDto[] {
    return this.paginatedPersons();
  }

  getStartIndex(): number {
    return (this.currentPage() - 1) * this.pageSize();
  }

  getEndIndex(): number {
    return Math.min(this.getStartIndex() + this.pageSize(), this.personService.filteredPersons().length);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  resetPagination(): void {
    this.currentPage.set(1);
  }

  openCreateModal(): void {
    this.selectedPerson.set(null);
    this.modalService.open(this.personModal, { size: 'lg' });
  }

  viewPerson(person: PersonDto): void {
    this.selectedPerson.set(person);
    this.personService.selectPerson(person.businessEntityId);
    this.modalService.open(this.personModal, { size: 'lg' });
  }

  editPerson(person: PersonDto): void {
    this.selectedPerson.set(person);
    this.personService.selectPerson(person.businessEntityId);
    this.modalService.open(this.personModal, { size: 'lg' });
  }

  async deletePerson(person: PersonDto): Promise<void> {
    if (confirm(`Are you sure you want to delete ${person.firstName} ${person.lastName}?`)) {
      try {
        await this.personService.deletePerson(person.businessEntityId);
        // The service will automatically refresh the data
      } catch (error) {
        console.error('Error deleting person:', error);
        // Error handling is managed by the service
      }
    }
  }

  onPersonSaved(person: PersonDto, modal: any): void {
    modal.close();
    // The service will automatically refresh the data
  }

  closeModal(modal: any): void {
    modal.close();
  }

  getPersonTypeBadgeClass(personType: string): string {
    const badgeClasses: { [key: string]: string } = {
      'EM': 'bg-primary',
      'SC': 'bg-success',
      'VC': 'bg-warning',
      'IN': 'bg-info',
      'SP': 'bg-secondary',
      'GC': 'bg-dark'
    };
    return badgeClasses[personType] || 'bg-secondary';
  }

  private getSortValue(person: PersonDto, column: string): any {
    switch (column) {
      case 'businessEntityId':
        return person.businessEntityId;
      case 'firstName':
        return `${person.firstName} ${person.lastName}`.toLowerCase();
      case 'personType':
        return person.personType;
      case 'title':
        return person.title || '';
      case 'emailPromotion':
        return person.emailPromotion;
      case 'modifiedDate':
        return new Date(person.modifiedDate);
      default:
        return '';
    }
  }
} 