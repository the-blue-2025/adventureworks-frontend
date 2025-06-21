import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { PersonDto, CreatePersonDto, UpdatePersonDto } from '../models/person.dto';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private httpRepository = inject(HttpRepository);

  // Signals for reactive parameters
  private searchQuerySignal = signal<string>('');
  private selectedPersonId = signal<number | null>(null);
  private personType = signal<string>('');

  // State signals
  private personsSignal = signal<PersonDto[]>([]);
  private selectedPersonSignal = signal<PersonDto | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Computed signals for easy access
  public persons = computed(() => this.personsSignal());
  public selectedPerson = computed(() => this.selectedPersonSignal());
  public isLoading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public hasError = computed(() => !!this.error());
  public isEmpty = computed(() => this.persons().length === 0);
  public searchQuery = computed(() => this.searchQuerySignal());

  constructor() {
    // Auto-load persons only once on initialization
    effect(() => {
      // Only load persons once, not on every type change
      if (!this.personsSignal().length) {
        this.loadPersons();
      }
    });

    // Auto-load selected person when ID changes
    effect(() => {
      const id = this.selectedPersonId();
      if (id) {
        this.loadPersonById(id);
      } else {
        this.selectedPersonSignal.set(null);
      }
    });

    // Initial load of persons
    this.loadPersons();
  }

  // Methods to update reactive parameters
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
    // Don't trigger API call for search - use client-side filtering only
  }

  setPersonType(type: string): void {
    this.personType.set(type);
    // Don't trigger API call for person type - use client-side filtering only
  }

  selectPerson(id: number | null): void {
    this.selectedPersonId.set(id);
  }

  // Data loading methods
  private async loadPersons(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const endpoint = '/persons';
      const response = await firstValueFrom(this.httpRepository.get<any>(endpoint));
      
      // Handle different response structures
      let persons: PersonDto[] = [];
      if (Array.isArray(response)) {
        persons = response;
      } else if (response && Array.isArray(response.value)) {
        persons = response.value;
      } else if (response && response.value) {
        persons = [response.value];
      }
      
      this.personsSignal.set(persons || []);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load persons');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private async loadPersonById(id: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.httpRepository.get<any>(`/persons/${id}`));
      
      // Handle different response structures
      let person: PersonDto | null = null;
      if (response && response.businessEntityId) {
        person = response;
      } else if (response && response.value && response.value.businessEntityId) {
        person = response.value;
      }
      
      this.selectedPersonSignal.set(person || null);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load person');
      this.selectedPersonSignal.set(null);
    }
  }

  // CRUD operations
  async createPerson(person: CreatePersonDto): Promise<PersonDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const newPerson = await firstValueFrom(this.httpRepository.post<PersonDto>('/persons', person));
      if (newPerson) {
        // Add to current list
        this.personsSignal.update(persons => [...persons, newPerson]);
        return newPerson;
      }
      throw new Error('Failed to create person');
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to create person');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updatePerson(id: number, person: UpdatePersonDto): Promise<PersonDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const updatedPerson = await firstValueFrom(this.httpRepository.put<PersonDto>(`/persons/${id}`, person));
      if (updatedPerson) {
        // Update in current list
        this.personsSignal.update(persons => 
          persons.map(p => p.businessEntityId === id ? updatedPerson : p)
        );
        
        // Update selected person if it's the one being edited
        if (this.selectedPersonId() === id) {
          this.selectedPersonSignal.set(updatedPerson);
        }
        
        return updatedPerson;
      }
      throw new Error('Failed to update person');
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to update person');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deletePerson(id: number): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(this.httpRepository.delete<void>(`/persons/${id}`));
      
      // Remove from current list
      this.personsSignal.update(persons => 
        persons.filter(p => p.businessEntityId !== id)
      );
      
      // Clear selection if it's the deleted person
      if (this.selectedPersonId() === id) {
        this.selectPerson(null);
      }
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to delete person');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Utility methods
  reload(): void {
    this.loadPersons();
  }

  clearSearch(): void {
    this.searchQuerySignal.set('');
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  // Computed signals for filtered data
  public filteredPersons = computed(() => {
    const persons = this.persons();
    const query = this.searchQuerySignal();
    const type = this.personType();
    
    let filtered = persons;
    
    // Filter by search query
    if (query) {
      filtered = filtered.filter((person: PersonDto) => 
        person.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        person.lastName?.toLowerCase().includes(query.toLowerCase()) ||
        person.emailPromotion?.toString().includes(query)
      );
    }
    
    // Filter by person type
    if (type) {
      filtered = filtered.filter((person: PersonDto) => 
        person.personType === type
      );
    }
    
    return filtered;
  });
} 