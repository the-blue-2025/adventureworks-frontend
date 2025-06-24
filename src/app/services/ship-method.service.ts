import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { ShipMethodDto, CreateShipMethodDto, UpdateShipMethodDto } from '../models/ship-method.dto';

interface ShipMethodsRequest {
  searchQuery: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShipMethodService {
  private httpRepository = inject(HttpRepository);
  private readonly endpoint = '/ship-methods';

  // Signals for reactive parameters
  private searchQuerySignal = signal<string>('');
  private selectedShipMethodId = signal<number | null>(null);

  // State signals
  private shipMethodsSignal = signal<ShipMethodDto[]>([]);
  private selectedShipMethodSignal = signal<ShipMethodDto | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Computed signals for easy access
  public shipMethods = computed(() => this.shipMethodsSignal());
  public selectedShipMethod = computed(() => this.selectedShipMethodSignal());
  public isLoading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public hasError = computed(() => !!this.error());
  public isEmpty = computed(() => this.shipMethods().length === 0);
  public searchQuery = computed(() => this.searchQuerySignal());

  constructor() {
    // Auto-load ship methods when search query changes
    effect(() => {
      const query = this.searchQuerySignal();
      this.loadShipMethods(query);
    });

    // Auto-load selected ship method when ID changes
    effect(() => {
      const id = this.selectedShipMethodId();
      if (id) {
        this.loadShipMethodById(id);
      } else {
        this.selectedShipMethodSignal.set(null);
      }
    });
  }

  // Methods to update reactive parameters
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }

  selectShipMethod(id: number | null): void {
    this.selectedShipMethodId.set(id);
  }

  // Data loading methods
  private async loadShipMethods(searchQuery?: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const endpoint = searchQuery 
        ? `${this.endpoint}/search?q=${searchQuery}`
        : this.endpoint;
      const methods = await firstValueFrom(this.httpRepository.get<ShipMethodDto[]>(endpoint));
      this.shipMethodsSignal.set(methods || []);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load ship methods');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private async loadShipMethodById(id: number): Promise<void> {
    try {
      const method = await firstValueFrom(this.httpRepository.get<ShipMethodDto>(`${this.endpoint}/${id}`));
      this.selectedShipMethodSignal.set(method || null);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load ship method');
      this.selectedShipMethodSignal.set(null);
    }
  }

  // CRUD operations
  async createShipMethod(method: CreateShipMethodDto): Promise<ShipMethodDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const newMethod = await firstValueFrom(this.httpRepository.post<ShipMethodDto>(this.endpoint, method));
      if (newMethod) {
        return newMethod;
      }
      throw new Error('Failed to create ship method');
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to create ship method');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateShipMethod(id: number, method: UpdateShipMethodDto): Promise<ShipMethodDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const updatedMethod = await firstValueFrom(this.httpRepository.put<ShipMethodDto>(`${this.endpoint}/${id}`, method));
      if (updatedMethod) {
        return updatedMethod;
      }
      throw new Error('Failed to update ship method');
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to update ship method');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deleteShipMethod(id: number): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(this.httpRepository.delete<void>(`${this.endpoint}/${id}`));
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to delete ship method');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Utility methods
  reload(): void {
    this.loadShipMethods(this.searchQuerySignal());
  }

  clearSearch(): void {
    this.searchQuerySignal.set('');
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  // Computed signals for filtered data (if needed)
  public filteredShipMethods = computed(() => {
    const methods = this.shipMethods();
    const query = this.searchQuerySignal();
    
    if (!query) return methods;
    
    return methods.filter((method: ShipMethodDto) => 
      method.name.toLowerCase().includes(query.toLowerCase())
    );
  });
} 