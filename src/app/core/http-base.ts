import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpBase {

  constructor(private http: HttpClient) { }

  private headers() {
    const token = sessionStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token && { Authorization: 'Bearer ' + token })
      })
    };
  }

  get<T>(url: string): Observable<T> {
    return this.http.get<T>(environment.apiUrl + url, this.headers());
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(environment.apiUrl + url, body, this.headers());
  }

  postText(url: string, body: any): Observable<string> {
    return this.http.post(environment.apiUrl + url, body, {
      ...this.headers(),
      responseType: 'text' as const
    });
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(environment.apiUrl + url, body, this.headers());
  }

  patch<T>(url: string, body?: any): Observable<T> {
    return this.http.patch<T>(environment.apiUrl + url, body || {}, this.headers());
  }

  patchText(url: string, body?: any): Observable<string> {
    return this.http.patch(environment.apiUrl + url, body || {}, {
      ...this.headers(),
      responseType: 'text' as const
    });
  }

  putText(url: string, body?: any): Observable<string> {
    return this.http.put(environment.apiUrl + url, body || {}, {
      ...this.headers(),
      responseType: 'text' as const
    });
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(environment.apiUrl + url, this.headers());
  }
}
