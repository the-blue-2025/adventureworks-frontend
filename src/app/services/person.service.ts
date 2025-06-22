import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { HttpRepository } from '../repositories/http-repository';
import { PersonDto, CreatePersonDto, UpdatePersonDto } from '../models/person.dto';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private httpRepository = inject(HttpRepository);

  // Reactive parameters using signals
  private searchQuerySignal = signal<string>('');
  private personTypeSignal = signal<string>('');
  private selectedPersonIdSignal = signal<number | null>(null);

  // State signals
  private personsSignal = signal<PersonDto[]>([]);
  private selectedPersonSignal = signal<PersonDto | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public computed signals for components
  public persons = computed(() => this.personsSignal());
  public selectedPerson = computed(() => this.selectedPersonSignal());
  public isLoading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public hasError = computed(() => !!this.error());
  public isEmpty = computed(() => this.persons().length === 0);

  // Filtered persons with reactive filtering
  public filteredPersons = computed(() => {
    const persons = this.persons();
    const searchQuery = this.searchQuerySignal();
    const personType = this.personTypeSignal();
    
    return persons.filter((person: PersonDto) => {
      const matchesSearch = !searchQuery || 
        person.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.emailPromotion?.toString().includes(searchQuery);
      
      const matchesType = !personType || person.personType === personType;
      
      return matchesSearch && matchesType;
    });
  });

  constructor() {
    // Auto-load selected person when ID changes
    effect(() => {
      const id = this.selectedPersonIdSignal();
      if (id) {
        this.loadPersonById(id);
      } else {
        this.selectedPersonSignal.set(null);
      }
    });

    // Initial load
    this.loadPersons();
  }

  // Methods to update reactive parameters
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }

  setPersonType(type: string): void {
    this.personTypeSignal.set(type);
  }

  selectPerson(id: number | null): void {
    this.selectedPersonIdSignal.set(id);
  }

  // Data loading methods
  private async loadPersons(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await this.httpRepository.get<any>('/persons').toPromise();
      
      // Handle different response structures
      let persons: PersonDto[] = [];
      if (Array.isArray(response)) {
        persons = response;
      } else if (response && typeof response === 'object' && 'value' in response && Array.isArray(response.value)) {
        persons = response.value;
      } else if (response && typeof response === 'object' && 'value' in response) {
        persons = [response.value];
      }
      
      this.personsSignal.set(persons || []);
    } catch (error) {
      console.error('Error loading persons:', error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to load persons');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private async loadPersonById(id: number): Promise<void> {
    try {
      const response = await this.httpRepository.get<any>(`/persons/${id}`).toPromise();
      
      // Handle different response structures
      let person: PersonDto | null = null;
      if (response && response.businessEntityId) {
        person = response;
      } else if (response && typeof response === 'object' && 'value' in response && response.value && response.value.businessEntityId) {
        person = response.value;
      }
      
      this.selectedPersonSignal.set(person || null);
    } catch (error) {
      console.error(`Error loading person ${id}:`, error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to load person');
      this.selectedPersonSignal.set(null);
    }
  }

  // CRUD operations
  async createPerson(person: CreatePersonDto): Promise<PersonDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const newPerson = await this.httpRepository.post<PersonDto>('/persons', person).toPromise();
      if (newPerson) {
        // Add to current list
        this.personsSignal.update(persons => [...persons, newPerson]);
        return newPerson;
      }
      throw new Error('Failed to create person');
    } catch (error) {
      console.error('Error creating person:', error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to create person');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updatePerson(id: number, person: UpdatePersonDto): Promise<PersonDto> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const updatedPerson = await this.httpRepository.put<PersonDto>(`/persons/${id}`, person).toPromise();
      if (updatedPerson) {
        // Update in current list
        this.personsSignal.update(persons => 
          persons.map(p => p.businessEntityId === id ? updatedPerson : p)
        );
        
        // Update selected person if it's the one being edited
        if (this.selectedPersonIdSignal() === id) {
          this.selectedPersonSignal.set(updatedPerson);
        }
        
        return updatedPerson;
      }
      throw new Error('Failed to update person');
    } catch (error) {
      console.error('Error updating person:', error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to update person');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deletePerson(id: number): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.httpRepository.delete<void>(`/persons/${id}`).toPromise();
      
      // Remove from current list
      this.personsSignal.update(persons => 
        persons.filter(p => p.businessEntityId !== id)
      );
      
      // Clear selection if it's the deleted person
      if (this.selectedPersonIdSignal() === id) {
        this.selectPerson(null);
      }
    } catch (error) {
      console.error('Error deleting person:', error);
      this.errorSignal.set(error instanceof Error ? error.message : 'Failed to delete person');
      throw error;
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
} 