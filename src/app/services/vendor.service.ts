import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { VendorDto, CreateVendorDto, UpdateVendorDto } from '../models/vendor.dto';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private httpRepository = inject(HttpRepository);

  // State signals
  private vendorsSignal = signal<VendorDto[]>([]);
  private columnFiltersSignal = signal<{ [key: string]: any }>({});
  private selectedVendorSignal = signal<VendorDto | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Computed signals for easy access
  public vendors = computed(() => this.vendorsSignal());
  public columnFilters = computed(() => this.columnFiltersSignal());
  public selectedVendor = computed(() => this.selectedVendorSignal());
  public isLoading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public hasError = computed(() => !!this.error());
  public isEmpty = computed(() => this.vendors().length === 0 && !this.isLoading());

  constructor() {
    this.loadVendors();
  }

  // Methods to update reactive parameters
  setColumnFilter(column: string, value: any) {
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
    if (id) {
      const vendor = this.vendors().find(p => p.businessEntityId === id);
      this.selectedVendorSignal.set(vendor || null);
    } else {
      this.selectedVendorSignal.set(null);
    }
  }

  // Data loading methods
  private async loadVendors(): Promise<void> {
    if (this.vendorsSignal().length > 0 && !this.error()) return; // Load only once unless there was an error

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const endpoint = '/vendors';
      const response = await firstValueFrom(this.httpRepository.get<VendorDto[]>(endpoint));
      this.vendorsSignal.set(response || []);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // CRUD operations
  async createVendor(vendor: CreateVendorDto): Promise<VendorDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const newVendor = await firstValueFrom(this.httpRepository.post<VendorDto>('/vendors', vendor));
      this.vendorsSignal.update(vendors => [newVendor, ...vendors]);
      return newVendor;
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to create vendor');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateVendor(id: number, vendor: UpdateVendorDto): Promise<VendorDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const updatedVendor = await firstValueFrom(this.httpRepository.put<VendorDto>(`/vendors/${id}`, vendor));
      this.vendorsSignal.update(vendors => 
        vendors.map(p => p.businessEntityId === id ? updatedVendor : p)
      );
      
      if (this.selectedVendor()?.businessEntityId === id) {
        this.selectedVendorSignal.set(updatedVendor);
      }
      
      return updatedVendor;
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to update vendor');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deleteVendor(id: number): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(this.httpRepository.delete<void>(`/vendors/${id}`));
      
      this.vendorsSignal.update(vendors => 
        vendors.filter(p => p.businessEntityId !== id)
      );
      
      if (this.selectedVendor()?.businessEntityId === id) {
        this.selectVendor(null);
      }
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to delete vendor');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Utility methods
  reload(): void {
    this.vendorsSignal.set([]); // Clear existing data to force reload
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

  // Computed signal for filtered data
  public filteredVendors = computed(() => {
    const vendors = this.vendors();
    const filters = this.columnFilters();
    
    if (Object.keys(filters).length === 0) {
      return vendors;
    }

    return vendors.filter(vendor => {
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
} 