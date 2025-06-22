import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { VendorDto, CreateVendorDto, UpdateVendorDto } from '../models/vendor.dto';

export interface VendorFilters {
  businessEntityId?: string;
  accountNumber?: string;
  name?: string;
  creditRating?: number;
  preferredVendorStatus?: boolean;
  activeFlag?: boolean;
  purchasingWebServiceURL?: string;
  modifiedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private httpRepository = inject(HttpRepository);

  // Reactive parameters using signals
  private columnFiltersSignal = signal<VendorFilters>({});
  private selectedVendorIdSignal = signal<number | null>(null);

  // State signals
  private vendorsSignal = signal<VendorDto[]>([]);
  private selectedVendorSignal = signal<VendorDto | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public computed signals for components
  public vendors = computed(() => this.vendorsSignal());
  public selectedVendor = computed(() => this.selectedVendorSignal());
  public isLoading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public hasError = computed(() => !!this.error());
  public isEmpty = computed(() => this.vendors().length === 0 && !this.isLoading());
  public columnFilters = computed(() => this.columnFiltersSignal());

  // Filtered vendors with reactive filtering
  public filteredVendors = computed(() => {
    const vendors = this.vendors();
    const filters = this.columnFiltersSignal();
    
    if (Object.keys(filters).length === 0) {
      return vendors;
    }

    return vendors.filter((vendor: VendorDto) => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true;
        const query = value.toString().toLowerCase();

        switch (key) {
          case 'businessEntityId':
            return vendor.businessEntityId.toString().includes(query);
          case 'accountNumber':
            return vendor.accountNumber.toLowerCase().includes(query);
          case 'name':
            return vendor.name.toLowerCase().includes(query);
          case 'creditRating':
            return vendor.creditRating.toString() === query;
          case 'preferredVendorStatus':
            if (value === true) return vendor.preferredVendorStatus;
            if (value === false) return !vendor.preferredVendorStatus;
            return true;
          case 'activeFlag':
            if (value === true) return vendor.activeFlag;
            if (value === false) return !vendor.activeFlag;
            return true;
          case 'purchasingWebServiceURL':
            return (vendor.purchasingWebServiceURL || '').toLowerCase().includes(query);
          case 'modifiedDate':
            return new Date(vendor.modifiedDate).toLocaleDateString().includes(query);
          default:
            return true;
        }
      });
    });
  });

  constructor() {
    // Auto-load selected vendor when ID changes
    effect(() => {
      const id = this.selectedVendorIdSignal();
      if (id) {
        this.loadVendorById(id);
      } else {
        this.selectedVendorSignal.set(null);
      }
    });

    // Initial load
    this.loadVendors();
  }

  // Methods to update reactive parameters
  setColumnFilter(column: keyof VendorFilters, value: any): void {
    this.columnFiltersSignal.update(filters => {
      const newFilters = { ...filters };
      if (value !== null && value !== undefined && value !== '') {
        newFilters[column] = value;
      } else {
        delete newFilters[column];
      }
      return newFilters;
    });
  }

  selectVendor(id: number | null): void {
    this.selectedVendorIdSignal.set(id);
  }

  // Data loading methods
  private async loadVendors(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await this.httpRepository.get<any>('/vendors').toPromise();
      
      // Handle different response structures
      let vendors: VendorDto[] = [];
      if (Array.isArray(response)) {
        vendors = response;
      } else if (response && typeof response === 'object' && 'value' in response && Array.isArray((response as any).value)) {
        vendors = (response as any).value;
      } else if (response && typeof response === 'object' && 'value' in response) {
        vendors = [(response as any).value];
      }
      
      this.vendorsSignal.set(vendors || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to load vendors');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private async loadVendorById(id: number): Promise<void> {
    try {
      const response = await this.httpRepository.get<any>(`/vendors/${id}`).toPromise();
      
      // Handle different response structures
      let vendor: VendorDto | null = null;
      if (response && (response as VendorDto).businessEntityId) {
        vendor = response as VendorDto;
      } else if (response && typeof response === 'object' && 'value' in response && (response as any).value && (response as any).value.businessEntityId) {
        vendor = (response as any).value as VendorDto;
      }
      
      this.selectedVendorSignal.set(vendor || null);
    } catch (error) {
      console.error(`Error loading vendor ${id}:`, error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to load vendor');
      this.selectedVendorSignal.set(null);
    }
  }

  // CRUD operations
  async createVendor(vendor: CreateVendorDto): Promise<VendorDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const newVendor = await this.httpRepository.post<VendorDto>('/vendors', vendor).toPromise();
      if (newVendor) {
        // Add to current list
        this.vendorsSignal.update(vendors => [newVendor, ...vendors]);
        return newVendor;
      }
      throw new Error('Failed to create vendor');
    } catch (error) {
      console.error('Error creating vendor:', error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to create vendor');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateVendor(id: number, vendor: UpdateVendorDto): Promise<VendorDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const updatedVendor = await this.httpRepository.put<VendorDto>(`/vendors/${id}`, vendor).toPromise();
      if (updatedVendor) {
        // Update in current list
        this.vendorsSignal.update(vendors => 
          vendors.map(p => p.businessEntityId === id ? updatedVendor : p)
        );
        
        // Update selected vendor if it's the one being edited
        if (this.selectedVendorIdSignal() === id) {
          this.selectedVendorSignal.set(updatedVendor);
        }
        
        return updatedVendor;
      }
      throw new Error('Failed to update vendor');
    } catch (error) {
      console.error('Error updating vendor:', error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to update vendor');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deleteVendor(id: number): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.httpRepository.delete<void>(`/vendors/${id}`).toPromise();
      
      // Remove from current list
      this.vendorsSignal.update(vendors => 
        vendors.filter(p => p.businessEntityId !== id)
      );
      
      // Clear selection if it's the deleted vendor
      if (this.selectedVendorIdSignal() === id) {
        this.selectVendor(null);
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to delete vendor');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Utility methods
  reload(): void {
    this.loadVendors();
  }

  clearFilters(): void {
    this.columnFiltersSignal.set({});
  }

  // Helper methods for vendor status
  getVendorStatus(vendor: VendorDto): string {
    if (!vendor.activeFlag) return 'Inactive';
    if (vendor.preferredVendorStatus) return 'Preferred';
    return 'Active';
  }

  getCreditRatingText(vendor: VendorDto): string {
    switch (vendor.creditRating) {
      case 1: return 'Superior';
      case 2: return 'Excellent';
      case 3: return 'Above Average';
      case 4: return 'Average';
      case 5: return 'Below Average';
      default: return 'Unknown';
    }
  }

  // Method to get vendor by ID (useful for components that need to load a specific vendor)
  getVendorById(id: number): Observable<VendorDto | null> {
    return this.httpRepository.get<any>(`/vendors/${id}`).pipe(
      map(response => {
        if (response && (response as VendorDto).businessEntityId) {
          return response as VendorDto;
        } else if (response && typeof response === 'object' && 'value' in response && (response as any).value && (response as any).value.businessEntityId) {
          return (response as any).value as VendorDto;
        }
        return null;
      }),
      catchError(error => {
        console.error(`Error loading vendor ${id}:`, error);
        return of(null);
      })
    );
  }

  // Method to get vendors with custom filters (for advanced use cases)
  getVendorsWithFilters(filters: VendorFilters): Observable<VendorDto[]> {
    return this.httpRepository.get<any>('/vendors').pipe(
      map(response => {
        let vendors: VendorDto[] = [];
        if (Array.isArray(response)) {
          vendors = response;
        } else if (response && typeof response === 'object' && 'value' in response && Array.isArray((response as any).value)) {
          vendors = (response as any).value;
        } else if (response && typeof response === 'object' && 'value' in response) {
          vendors = [(response as any).value];
        }
        
        return vendors.filter((vendor: VendorDto) => {
          return Object.entries(filters).every(([key, value]) => {
            if (value === null || value === undefined || value === '') return true;
            const query = value.toString().toLowerCase();

            switch (key) {
              case 'businessEntityId':
                return vendor.businessEntityId.toString().includes(query);
              case 'accountNumber':
                return vendor.accountNumber.toLowerCase().includes(query);
              case 'name':
                return vendor.name.toLowerCase().includes(query);
              case 'creditRating':
                return vendor.creditRating.toString() === query;
              case 'preferredVendorStatus':
                if (value === true) return vendor.preferredVendorStatus;
                if (value === false) return !vendor.preferredVendorStatus;
                return true;
              case 'activeFlag':
                if (value === true) return vendor.activeFlag;
                if (value === false) return !vendor.activeFlag;
                return true;
              case 'purchasingWebServiceURL':
                return (vendor.purchasingWebServiceURL || '').toLowerCase().includes(query);
              default:
                return true;
            }
          });
        });
      }),
      catchError(error => {
        console.error('Error loading vendors with filters:', error);
        return of([]);
      })
    );
  }
} 