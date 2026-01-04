import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpBase } from '../http-base';

export interface InventoryPart {
  id?: string;
  name: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  lowStock?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService extends HttpBase {

  constructor(http: HttpClient) {
    super(http);
  }

  // Admin: View all parts (for reports/monitoring)
  getAllParts(): Observable<InventoryPart[]> {
    return this.get<InventoryPart[]>('/api/parts');
  }

  getLowStockAlerts(): Observable<InventoryPart[]> {
    return this.get<InventoryPart[]>('/api/parts/alerts/low-stock');
  }

  updatePart(id: string, part: any): Observable<any> {
    return this.put(`/api/parts/${id}`, part);
  }
}
