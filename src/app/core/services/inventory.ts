import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpBase } from '../http-base';

export interface InventoryPart {
  id?: string;
  name: string;
  price: number;
  stock: number;
  reorderLevel: number;
  lowStock?: boolean;
  category?: string;
  unitType?: string;
  supplier?: string;
  description?: string;
  stockStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService extends HttpBase {

  constructor(http: HttpClient) {
    super(http);
  }

  getAllParts(): Observable<InventoryPart[]> {
    return this.get<InventoryPart[]>('/api/parts');
  }

  getLowStockAlerts(): Observable<InventoryPart[]> {
    return this.get<InventoryPart[]>('/api/parts/alerts/low-stock');
  }

  updatePart(id: string, part: any): Observable<any> {
    return this.put(`/api/parts/${id}`, part);
  }

  requestRestock(payload: any): Observable<any> {
    return this.postText('/api/parts/restock', payload);
  }

  getPendingRestocks(): Observable<any[]> {
    return this.get<any[]>('/api/parts/restock');
  }

  approveRestock(id: string): Observable<any> {
    return this.putText(`/api/parts/restock/${id}/approve`, {});
  }

  approvePartsRequest(requestId: string): Observable<any> {
    return this.putText(`/api/parts/requests/${requestId}/approve`, {});
  }

  createPart(part: InventoryPart): Observable<InventoryPart> {
    return this.post<InventoryPart>('/api/parts', part);
  }
}
