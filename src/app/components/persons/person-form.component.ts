import { Component, EventEmitter, Input, Output, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { PersonService } from '../../services/person.service';
import { PersonDto, CreatePersonDto, UpdatePersonDto } from '../../models/person.dto';

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    .readonly-form .form-control[readonly],
    .readonly-form .form-select:disabled,
    .readonly-form .form-control:disabled,
    .readonly-form .form-select[disabled] {
      background-color: #f8f9fa !important;
      border-color: #dee2e6 !important;
      color: #495057 !important;
      cursor: not-allowed !important;
      opacity: 0.8 !important;
      pointer-events: none !important;
    }
    
    .readonly-form .form-select:disabled,
    .readonly-form .form-select[disabled] {
      background-image: none !important;
      user-select: none !important;
    }
    
    .readonly-form .form-select:disabled:focus,
    .readonly-form .form-select[disabled]:focus {
      box-shadow: none !important;
      border-color: #dee2e6 !important;
      outline: none !important;
    }
    
    .readonly-form .form-check-input:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
      pointer-events: none !important;
    }
    
    .readonly-form .form-label {
      font-weight: 600;
      color: #495057;
    }
  `],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">
        {{ isViewMode() ? 'View Person' : (isEditMode() ? 'Edit Person' : 'Create New Person') }}
      </h4>
      <button type="button" class="btn-close" (click)="onCancel()"></button>
    </div>

    <form [formGroup]="personForm" (ngSubmit)="onSubmit()" [class.readonly-form]="isViewMode()">
      <div class="modal-body">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="personType" class="form-label">Person Type *</label>
            <select id="personType" class="form-select" formControlName="personType" [disabled]="isViewMode()">
              <option value="">Select Type</option>
              <option value="EM">Employee</option>
              <option value="SC">Store Contact</option>
              <option value="VC">Vendor Contact</option>
              <option value="IN">Individual Customer</option>
              <option value="SP">Sales Person</option>
              <option value="GC">General Contact</option>
            </select>
            @if (personForm.get('personType')?.invalid && personForm.get('personType')?.touched) {
              <div class="text-danger">
                Person type is required
              </div>
            }
          </div>

          <div class="col-md-6 mb-3">
            <label for="title" class="form-label">Title</label>
            <input type="text" id="title" class="form-control" formControlName="title" placeholder="Mr., Ms., Dr., etc." [readonly]="isViewMode()">
          </div>
        </div>

        <div class="row">
          <div class="col-md-4 mb-3">
            <label for="firstName" class="form-label">First Name *</label>
            <input type="text" id="firstName" class="form-control" formControlName="firstName" placeholder="First Name" [readonly]="isViewMode()">
            @if (personForm.get('firstName')?.invalid && personForm.get('firstName')?.touched) {
              <div class="text-danger">
                First name is required
              </div>
            }
          </div>

          <div class="col-md-4 mb-3">
            <label for="middleName" class="form-label">Middle Name</label>
            <input type="text" id="middleName" class="form-control" formControlName="middleName" placeholder="Middle Name" [readonly]="isViewMode()">
          </div>

          <div class="col-md-4 mb-3">
            <label for="lastName" class="form-label">Last Name *</label>
            <input type="text" id="lastName" class="form-control" formControlName="lastName" placeholder="Last Name" [readonly]="isViewMode()">
            @if (personForm.get('lastName')?.invalid && personForm.get('lastName')?.touched) {
              <div class="text-danger">
                Last name is required
              </div>
            }
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="suffix" class="form-label">Suffix</label>
            <input type="text" id="suffix" class="form-control" formControlName="suffix" placeholder="Jr., Sr., III, etc." [readonly]="isViewMode()">
          </div>

          <div class="col-md-6 mb-3">
            <label for="emailPromotion" class="form-label">Email Promotion</label>
            <select id="emailPromotion" class="form-select" formControlName="emailPromotion" [disabled]="isViewMode()">
              <option value="0">No</option>
              <option value="1">Yes</option>
              <option value="2">Yes (Partner)</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="col-12 mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="nameStyle" formControlName="nameStyle" [disabled]="isViewMode()">
              <label class="form-check-label" for="nameStyle">
                Western Name Style (First Last)
              </label>
            </div>
          </div>
        </div>

        <!-- Display existing person info in view mode -->
        @if (isViewMode() && personSignal()) {
          <div class="alert alert-info">
            <h6>Additional Information:</h6>
            <p><strong>Business Entity ID:</strong> {{ personSignal()?.businessEntityId }}</p>
            <p><strong>Modified Date:</strong> {{ personSignal()?.modifiedDate | date:'full' }}</p>
          </div>
        }

        <!-- Form validation summary -->
        @if (formErrors().length > 0) {
          <div class="alert alert-danger">
            <h6>Please fix the following errors:</h6>
            <ul class="mb-0">
              @for (error of formErrors(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        }
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          {{ isViewMode() ? 'Close' : 'Cancel' }}
        </button>
        @if (!isViewMode()) {
          <button type="submit" class="btn btn-primary" [disabled]="personForm.invalid || isSubmitting()">
            @if (isSubmitting()) {
              <span class="spinner-border spinner-border-sm me-2"></span>
            }
            {{ isEditMode() ? 'Update' : 'Create' }}
          </button>
        }
      </div>
    </form>
  `
})
export class PersonFormComponent implements OnInit {
  @Input() set person(value: PersonDto | null) {
    this.personSignal.set(value);
  }
  @Input() set viewMode(value: boolean) {
    this.viewModeSignal.set(value);
  }
  @Output() save = new EventEmitter<PersonDto>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private personService = inject(PersonService);

  // Reactive signals
  personSignal = signal<PersonDto | null>(null);
  viewModeSignal = signal(false);
  isSubmitting = signal(false);

  personForm = this.fb.group({
    personType: ['', [Validators.required, this.personTypeValidator()]],
    title: [''],
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    middleName: ['', Validators.maxLength(50)],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    suffix: ['', Validators.maxLength(10)],
    emailPromotion: [0, [Validators.min(0), Validators.max(2)]],
    nameStyle: [true]
  });

  // Computed signals for reactive UI
  isEditMode = computed(() => !!this.personSignal() && !this.viewModeSignal());
  isViewMode = computed(() => this.viewModeSignal());

  formErrors = computed(() => {
    const errors: string[] = [];
    const controls = this.personForm.controls;

    // Check each control for errors
    Object.keys(controls).forEach(key => {
      const control = controls[key as keyof typeof controls];
      if (control.invalid && control.touched) {
        if (control.errors?.['required']) {
          errors.push(`${this.getFieldLabel(key)} is required`);
        }
        if (control.errors?.['minlength']) {
          errors.push(`${this.getFieldLabel(key)} must be at least ${control.errors['minlength'].requiredLength} characters`);
        }
        if (control.errors?.['maxlength']) {
          errors.push(`${this.getFieldLabel(key)} must not exceed ${control.errors['maxlength'].requiredLength} characters`);
        }
        if (control.errors?.['min']) {
          errors.push(`${this.getFieldLabel(key)} must be at least ${control.errors['min'].min}`);
        }
        if (control.errors?.['max']) {
          errors.push(`${this.getFieldLabel(key)} must not exceed ${control.errors['max'].max}`);
        }
        if (control.errors?.['invalidPersonType']) {
          errors.push('Please select a valid person type');
        }
      }
    });

    return errors;
  });

  constructor() {
    // Auto-populate form when person changes
    effect(() => {
      const person = this.personSignal();
      if (person) {
        this.personForm.patchValue({
          personType: person.personType || '',
          title: person.title || '',
          firstName: person.firstName || '',
          middleName: person.middleName || '',
          lastName: person.lastName || '',
          suffix: person.suffix || '',
          emailPromotion: person.emailPromotion || 0,
          nameStyle: person.nameStyle ?? true
        });
      } else {
        this.personForm.reset({
          personType: '',
          title: '',
          firstName: '',
          middleName: '',
          lastName: '',
          suffix: '',
          emailPromotion: 0,
          nameStyle: true
        });
      }
    });

    // Disable/enable form controls based on view mode
    effect(() => {
      const isView = this.viewModeSignal();
      if (isView) {
        this.personForm.disable();
      } else {
        this.personForm.enable();
      }
    });
  }

  ngOnInit(): void {
    // Component is now reactive and will automatically update when inputs change
  }

  async onSubmit(): Promise<void> {
    if (this.personForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.personForm.controls).forEach(key => {
        const control = this.personForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.personForm.value;
      let result: PersonDto;

      if (this.isEditMode() && this.personSignal()) {
        const updateData: UpdatePersonDto = formValue as UpdatePersonDto;
        result = await this.personService.updatePerson(this.personSignal()!.businessEntityId, updateData);
      } else {
        const createData: CreatePersonDto = formValue as CreatePersonDto;
        result = await this.personService.createPerson(createData);
      }

      this.save.emit(result);
    } catch (error) {
      console.error('Error saving person:', error);
      // Error handling is managed by the service
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // Custom validator for person type
  private personTypeValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const validTypes = ['EM', 'SC', 'VC', 'IN', 'SP', 'GC'];
      const value = control.value;
      
      if (!value) {
        return null; // Let required validator handle empty values
      }
      
      if (!validTypes.includes(value)) {
        return { 'invalidPersonType': { value: control.value } };
      }
      
      return null;
    };
  }

  // Helper method to get human-readable field labels
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      personType: 'Person Type',
      title: 'Title',
      firstName: 'First Name',
      middleName: 'Middle Name',
      lastName: 'Last Name',
      suffix: 'Suffix',
      emailPromotion: 'Email Promotion',
      nameStyle: 'Name Style'
    };
    
    return labels[fieldName] || fieldName;
  }
} 