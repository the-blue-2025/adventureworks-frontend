import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { VendorDto, CreateVendorDto, UpdateVendorDto } from '../models/vendor.dto';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private httpRepository = inject(HttpRepository);

  // Signals for reactive parameters
  private searchQuerySignal = signal<string>('');
  private selectedVendorId = signal<number | null>(null);
  private filterType = signal<'all' | 'active' | 'preferred'>('all');

  // State signals
  private vendorsSignal = signal<VendorDto[]>([]);
  private selectedVendorSignal = signal<VendorDto | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Computed signals for easy access
  public vendors = computed(() => this.vendorsSignal());
  public selectedVendor = computed(() => this.selectedVendorSignal());
  public isLoading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public hasError = computed(() => !!this.error());
  public isEmpty = computed(() => this.vendors().length === 0);
  public searchQuery = computed(() => this.searchQuerySignal());

  constructor() {
    // Auto-load vendors when search query or filter changes
    effect(() => {
      const query = this.searchQuerySignal();
      const filter = this.filterType();
      this.loadVendors(query, filter);
    });

    // Auto-load selected vendor when ID changes
    effect(() => {
      const id = this.selectedVendorId();
      if (id) {
        this.loadVendorById(id);
      } else {
        this.selectedVendorSignal.set(null);
      }
    });

    // Initial load of vendors
    this.loadVendors();
  }

  // Methods to update reactive parameters
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }

  setFilterType(filter: 'all' | 'active' | 'preferred'): void {
    this.filterType.set(filter);
  }

  selectVendor(id: number | null): void {
    this.selectedVendorId.set(id);
  }

  // Data loading methods
  private async loadVendors(searchQuery?: string, filterType: 'all' | 'active' | 'preferred' = 'all'): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      let endpoint = '/vendors';
      if (searchQuery) {
        endpoint = `/vendors/search?q=${searchQuery}`;
      } else if (filterType === 'active') {
        endpoint = '/vendors/active';
      } else if (filterType === 'preferred') {
        endpoint = '/vendors/preferred';
      }
      
      const response = await firstValueFrom(this.httpRepository.get<any>(endpoint));
      
      // Handle different response structures
      let vendors: VendorDto[] = [];
      if (Array.isArray(response)) {
        vendors = response;
      } else if (response && Array.isArray(response.value)) {
        vendors = response.value;
      } else if (response && response.value) {
        vendors = [response.value];
      }
      
      this.vendorsSignal.set(vendors || []);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private async loadVendorById(id: number): Promise<void> {
    try {
      const vendor = await firstValueFrom(this.httpRepository.get<VendorDto>(`/vendors/${id}`));
      this.selectedVendorSignal.set(vendor || null);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load vendor');
      this.selectedVendorSignal.set(null);
    }
  }

  // CRUD operations
  async createVendor(vendor: CreateVendorDto): Promise<VendorDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const newVendor = await firstValueFrom(this.httpRepository.post<VendorDto>('/vendors', vendor));
      if (newVendor) {
        // Add to current list
        this.vendorsSignal.update(vendors => [...vendors, newVendor]);
        return newVendor;
      }
      throw new Error('Failed to create vendor');
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
      if (updatedVendor) {
        // Update in current list
        this.vendorsSignal.update(vendors => 
          vendors.map(v => v.businessEntityId === id ? updatedVendor : v)
        );
        
        // Update selected vendor if it's the one being edited
        if (this.selectedVendorId() === id) {
          this.selectedVendorSignal.set(updatedVendor);
        }
        
        return updatedVendor;
      }
      throw new Error('Failed to update vendor');
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
      
      // Remove from current list
      this.vendorsSignal.update(vendors => 
        vendors.filter(v => v.businessEntityId !== id)
      );
      
      // Clear selection if it's the deleted vendor
      if (this.selectedVendorId() === id) {
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
    this.loadVendors(this.searchQuerySignal(), this.filterType());
  }

  clearSearch(): void {
    this.searchQuerySignal.set('');
  }

  clearError(): void {
    this.errorSignal.set(null);
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

  // Computed signals for filtered data
  public filteredVendors = computed(() => {
    const vendors = this.vendors();
    const query = this.searchQuerySignal();
    
    if (!query) return vendors;
    
    return vendors.filter((vendor: VendorDto) => 
      vendor.name?.toLowerCase().includes(query.toLowerCase()) ||
      vendor.accountNumber?.toLowerCase().includes(query.toLowerCase())
    );
  });
} 