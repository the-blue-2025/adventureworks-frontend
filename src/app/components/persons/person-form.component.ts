import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PersonService } from '../../services/person.service';
import { PersonDto, CreatePersonDto, UpdatePersonDto } from '../../models/person.dto';

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">
        {{ isEditMode ? 'Edit Person' : 'Create New Person' }}
      </h4>
      <button type="button" class="btn-close" (click)="onCancel()"></button>
    </div>

    <form [formGroup]="personForm" (ngSubmit)="onSubmit()">
      <div class="modal-body">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="personType" class="form-label">Person Type *</label>
            <select id="personType" class="form-select" formControlName="personType">
              <option value="">Select Type</option>
              <option value="EM">Employee</option>
              <option value="SC">Store Contact</option>
              <option value="VC">Vendor Contact</option>
              <option value="IN">Individual Customer</option>
              <option value="SP">Sales Person</option>
              <option value="GC">General Contact</option>
            </select>
            <div *ngIf="personForm.get('personType')?.invalid && personForm.get('personType')?.touched" class="text-danger">
              Person type is required
            </div>
          </div>

          <div class="col-md-6 mb-3">
            <label for="title" class="form-label">Title</label>
            <input type="text" id="title" class="form-control" formControlName="title" placeholder="Mr., Ms., Dr., etc.">
          </div>
        </div>

        <div class="row">
          <div class="col-md-4 mb-3">
            <label for="firstName" class="form-label">First Name *</label>
            <input type="text" id="firstName" class="form-control" formControlName="firstName" placeholder="First Name">
            <div *ngIf="personForm.get('firstName')?.invalid && personForm.get('firstName')?.touched" class="text-danger">
              First name is required
            </div>
          </div>

          <div class="col-md-4 mb-3">
            <label for="middleName" class="form-label">Middle Name</label>
            <input type="text" id="middleName" class="form-control" formControlName="middleName" placeholder="Middle Name">
          </div>

          <div class="col-md-4 mb-3">
            <label for="lastName" class="form-label">Last Name *</label>
            <input type="text" id="lastName" class="form-control" formControlName="lastName" placeholder="Last Name">
            <div *ngIf="personForm.get('lastName')?.invalid && personForm.get('lastName')?.touched" class="text-danger">
              Last name is required
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="suffix" class="form-label">Suffix</label>
            <input type="text" id="suffix" class="form-control" formControlName="suffix" placeholder="Jr., Sr., III, etc.">
          </div>

          <div class="col-md-6 mb-3">
            <label for="emailPromotion" class="form-label">Email Promotion</label>
            <select id="emailPromotion" class="form-select" formControlName="emailPromotion">
              <option value="0">No</option>
              <option value="1">Yes</option>
              <option value="2">Yes (Partner)</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="col-12 mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="nameStyle" formControlName="nameStyle">
              <label class="form-check-label" for="nameStyle">
                Western Name Style (First Last)
              </label>
            </div>
          </div>
        </div>

        <!-- Display existing person info in view mode -->
        <div *ngIf="isViewMode && person" class="alert alert-info">
          <h6>Additional Information:</h6>
          <p><strong>Business Entity ID:</strong> {{ person.businessEntityId }}</p>
          <p><strong>Modified Date:</strong> {{ person.modifiedDate | date:'full' }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          {{ isViewMode ? 'Close' : 'Cancel' }}
        </button>
        <button *ngIf="!isViewMode" type="submit" class="btn btn-primary" [disabled]="personForm.invalid || isSubmitting">
          <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
          {{ isEditMode ? 'Update' : 'Create' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .form-label {
      font-weight: 500;
    }
    
    .text-danger {
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  `]
})
export class PersonFormComponent implements OnInit {
  @Input() person: PersonDto | null = null;
  @Output() save = new EventEmitter<PersonDto>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private personService = inject(PersonService);

  personForm!: FormGroup;
  isSubmitting = false;

  get isEditMode(): boolean {
    return !!this.person;
  }

  get isViewMode(): boolean {
    return false; // You can add logic to determine view mode if needed
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.personForm = this.fb.group({
      personType: [this.person?.personType || '', Validators.required],
      title: [this.person?.title || ''],
      firstName: [this.person?.firstName || '', Validators.required],
      middleName: [this.person?.middleName || ''],
      lastName: [this.person?.lastName || '', Validators.required],
      suffix: [this.person?.suffix || ''],
      emailPromotion: [this.person?.emailPromotion || 0],
      nameStyle: [this.person?.nameStyle ?? true]
    });

    if (this.isViewMode) {
      this.personForm.disable();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.personForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.personForm.value;
      let result: PersonDto;

      if (this.isEditMode && this.person) {
        const updateData: UpdatePersonDto = formValue;
        result = await this.personService.updatePerson(this.person.businessEntityId, updateData);
      } else {
        const createData: CreatePersonDto = formValue;
        result = await this.personService.createPerson(createData);
      }

      this.save.emit(result);
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Failed to save person. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
} 