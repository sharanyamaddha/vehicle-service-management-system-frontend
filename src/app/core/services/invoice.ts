import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpBase } from '../http-base';

export interface Invoice {
  id: string;
  serviceRequestId: string;
  customerId: string;
  total: number;
  status: 'PENDING' | 'PAID';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService extends HttpBase {

  constructor(http: HttpClient) {
    super(http);
  }

  getCustomerInvoices(customerId: string): Observable<Invoice[]> {
    return this.get<Invoice[]>(`/api/invoices/customer/${customerId}`);
  }

  getInvoiceById(id: string): Observable<Invoice> {
    return this.get<Invoice>(`/api/invoices/${id}`);
  }

  payInvoice(id: string): Observable<any> {
    return this.patch(`/api/invoices/${id}/pay`, {});
  }
}
