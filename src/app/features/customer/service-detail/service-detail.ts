import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';
import { InvoiceService, Invoice } from '../../../core/services/invoice';

@Component({
    selector: 'app-service-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="detail-container">
      <div class="header">
        <button class="back-btn" routerLink="/customer/requests">← Back to Requests</button>
        <h1>Request Details</h1>
      </div>

      <div *ngIf="request" class="detail-card">
        <div class="section-header">
          <h2>Service Info</h2>
           <span [class]="'status-badge ' + getStatusClass(request.status)">
             {{ getStatusLabel(request.status) }}
           </span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>Request ID</label>
            <span>{{ request.id }}</span>
          </div>
          <div class="info-item">
             <label>Date Created</label>
             <span>{{ request.createdAt | date:'medium' }}</span>
          </div>
          <div class="info-item">
            <label>Priority</label>
            <span>{{ request.priority }}</span>
          </div>
          <div class="info-item">
            <label>Issue Description</label>
            <span>{{ request.issue }}</span>
          </div>
        </div>

        <div class="section-header mt-6">
          <h2>Vehicle Details</h2>
        </div>
        <div class="info-grid" *ngIf="vehicle">
          <div class="info-item">
            <label>Vehicle</label>
            <span>{{ vehicle.make }} {{ vehicle.model }}</span>
          </div>
          <div class="info-item">
            <label>Registration</label>
            <span>{{ vehicle.registrationNumber }}</span>
          </div>
          <div class="info-item">
             <label>Type</label>
             <span>{{ vehicle.type }}</span>
          </div>
        </div>

        <!-- Invoice Section -->
         <div class="invoice-section" *ngIf="request.status === 'COMPLETED' || request.status === 'CLOSED'">
            <div class="section-header mt-6">
               <h2>Invoice Details</h2>
            </div>
            
            <div *ngIf="invoice; else noInvoice" class="invoice-box">
               <div class="invoice-row">
                  <span>Amount Due:</span>
                  <span class="amount">{{ invoice.total | currency:'INR' }}</span>
               </div>
               <div class="invoice-row">
                  <span>Status:</span>
                  <span [class]="'invoice-status ' + (invoice.status === 'PAID' ? 'paid' : 'unpaid')">
                     {{ invoice.status }}
                  </span>
               </div>

               <div class="invoice-actions">
                  <button *ngIf="invoice.status !== 'PAID'" class="btn-pay" (click)="payInvoice()">
                     Pay Now
                  </button>
                  <button *ngIf="invoice.status === 'PAID'" class="btn-view" (click)="viewInvoice()">
                     View Invoice
                  </button>
               </div>
            </div>
            <ng-template #noInvoice>
               <div class="no-invoice">
                  <p>Invoice generation in progress...</p>
               </div>
            </ng-template>
         </div>

      </div>
    </div>
  `,
    styles: [`
    .detail-container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
    .back-btn { background: none; border: none; font-size: 14px; color: #6b7280; cursor: pointer; }
    .back-btn:hover { text-decoration: underline; color: #111827; }
    h1 { margin: 0; font-size: 24px; font-weight: 700; color: #111827; }
    
    .detail-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 32px; }
    
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px; }
    .mt-6 { margin-top: 24px; }
    h2 { font-size: 18px; font-weight: 600; color: #374151; margin: 0; }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-item label { font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600; }
    .info-item span { font-size: 15px; color: #111827; font-weight: 500; }

    .status-badge { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .status-requested { background: #f3f4f6; color: #6b7280; }
    .status-assigned { background: #eff6ff; color: #2563eb; }
    .status-in-progress { background: #fff7ed; color: #f97316; }
    .status-completed { background: #fefce8; color: #eab308; }
    .status-closed { background: #ecfdf5; color: #059669; }

    .invoice-box { background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .invoice-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
    .amount { font-size: 20px; font-weight: 700; color: #111827; }
    .invoice-status { font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .invoice-status.paid { background: #ecfdf5; color: #059669; }
    .invoice-status.unpaid { background: #fef2f2; color: #dc2626; }

    .invoice-actions { margin-top: 20px; display: flex; gap: 12px; }
    button.btn-pay, button.btn-view { flex: 1; padding: 10px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; }
    .btn-pay { background: #4f46e5; color: white; }
    .btn-pay:hover { background: #4338ca; }
    .btn-view { background: white; border: 1px solid #d1d5db; color: #374151; }
    .btn-view:hover { background: #f3f4f6; }
    
    .no-invoice { padding: 24px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 8px; }
  `]
})
export class ServiceDetailComponent implements OnInit {
    request: ServiceRequest | null = null;
    vehicle: Vehicle | null = null;
    invoice: Invoice | null = null;
    requestId: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private serviceRequestService: ServiceRequestService,
        private vehicleService: VehicleService,
        private invoiceService: InvoiceService
    ) { }

    ngOnInit() {
        this.requestId = this.route.snapshot.paramMap.get('id');
        if (this.requestId) {
            this.loadDetails(this.requestId);
        }
    }

    loadDetails(id: string) {
        this.serviceRequestService.getRequestById(id).subscribe(req => {
            this.request = req;
            if (req.vehicleId) {
                this.vehicleService.getVehiclesByCustomerId(req.customerId).subscribe(vehicles => {
                    this.vehicle = vehicles.find((v: Vehicle) => v.id === req.vehicleId) || null;
                });
            }

            this.invoiceService.getCustomerInvoices(req.customerId).subscribe(invoices => {
                // Find invoice matching this request
                // Check if invoice has serviceRequestId or try to match otherwise
                // The interface has serviceRequestId.
                this.invoice = invoices.find((inv: Invoice) => inv.serviceRequestId === req.id) || null;
            });
        });
    }

    getStatusClass(status: string): string {
        const map: any = {
            'BOOKED': 'status-requested',
            'REQUESTED': 'status-requested',
            'ASSIGNED': 'status-assigned',
            'IN_PROGRESS': 'status-in-progress',
            'COMPLETED': 'status-completed',
            'CLOSED': 'status-closed'
        };
        return map[status] || '';
    }

    getStatusLabel(status: string): string {
        if (status === 'BOOKED' || status === 'REQUESTED') return 'Requested';
        return status.replace('_', ' ');
    }

    payInvoice() {
        // Redirect to invoices
        this.router.navigate(['/customer/invoices']);
    }

    viewInvoice() {
        this.router.navigate(['/customer/invoices']);
    }
}
