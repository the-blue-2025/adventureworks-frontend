import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, retry, timeout } from 'rxjs';

export interface HttpOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
  timeout?: number;
  retryCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HttpRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/v1'; // Adjust port as needed
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly defaultRetryCount = 3;

  get<T>(endpoint: string, options: HttpOptions = {}): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making GET request to:', url, 'with options:', options);
    
    return this.http.get<T>(url, {
      headers: options.headers,
      params: options.params
    }).pipe(
      timeout(options.timeout || this.defaultTimeout),
      retry(options.retryCount || this.defaultRetryCount),
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any, options: HttpOptions = {}): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.post<T>(url, data, {
      headers: options.headers
    }).pipe(
      timeout(options.timeout || this.defaultTimeout),
      retry(options.retryCount || this.defaultRetryCount),
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any, options: HttpOptions = {}): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.put<T>(url, data, {
      headers: options.headers
    }).pipe(
      timeout(options.timeout || this.defaultTimeout),
      retry(options.retryCount || this.defaultRetryCount),
      catchError(this.handleError)
    );
  }

  patch<T>(endpoint: string, data: any, options: HttpOptions = {}): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.patch<T>(url, data, {
      headers: options.headers
    }).pipe(
      timeout(options.timeout || this.defaultTimeout),
      retry(options.retryCount || this.defaultRetryCount),
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string, options: HttpOptions = {}): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.delete<T>(url, {
      headers: options.headers,
      params: options.params
    }).pipe(
      timeout(options.timeout || this.defaultTimeout),
      retry(options.retryCount || this.defaultRetryCount),
      catchError(this.handleError)
    );
  }

  // Helper method to create HttpParams from object
  createParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    
    return httpParams;
  }

  // Helper method to create headers
  createHeaders(headers: Record<string, string>): HttpHeaders {
    let httpHeaders = new HttpHeaders();
    
    Object.keys(headers).forEach(key => {
      httpHeaders = httpHeaders.set(key, headers[key]);
    });
    
    return httpHeaders;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request: The request was invalid';
          break;
        case 401:
          errorMessage = 'Unauthorized: Authentication is required';
          break;
        case 403:
          errorMessage = 'Forbidden: Access is denied';
          break;
        case 404:
          errorMessage = 'Not Found: The requested resource was not found';
          break;
        case 409:
          errorMessage = 'Conflict: The request conflicts with the current state';
          break;
        case 422:
          errorMessage = 'Unprocessable Entity: The request was well-formed but contains invalid data';
          break;
        case 500:
          errorMessage = 'Internal Server Error: Something went wrong on the server';
          break;
        case 502:
          errorMessage = 'Bad Gateway: The server received an invalid response';
          break;
        case 503:
          errorMessage = 'Service Unavailable: The server is temporarily unavailable';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }

    console.error('HTTP Error Details:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: errorMessage,
      error: error.error,
      headers: error.headers,
      name: error.name
    });

    return throwError(() => new Error(errorMessage));
  }
} 