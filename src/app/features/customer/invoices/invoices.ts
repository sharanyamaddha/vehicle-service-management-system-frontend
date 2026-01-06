import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService, Invoice } from '../../../core/services/invoice';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { VehicleService } from '../../../core/services/vehicle';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class Invoices implements OnInit {
  historyRequests: ServiceRequest[] = [];
  invoices: Invoice[] = [];
  vehiclesMap: Map<string, string> = new Map();
  isLoading: boolean = false;
  userId: string = '';

  // Modal State
  showInvoiceModal: boolean = false;
  selectedInvoice: Invoice | null = null;
  selectedRequest: ServiceRequest | null = null;
  selectedVehicleName: string = '';

  constructor(
    private invoiceService: InvoiceService,
    private requestService: ServiceRequestService,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.userId = sessionStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.isLoading = true;
    forkJoin({
      requests: this.requestService.getCustomerRequests(this.userId),
      vehicles: this.vehicleService.getVehiclesByCustomerId(this.userId),
      invoices: this.invoiceService.getCustomerInvoices(this.userId)
    }).subscribe({
      next: ({ requests, vehicles, invoices }) => {
        // Map Vehicles
        (vehicles || []).forEach(v => {
          if (v.id) this.vehiclesMap.set(v.id, `${v.make} ${v.model} (${v.registrationNumber})`);
        });

        // Store Invoices for lookup
        this.invoices = Array.isArray(invoices) ? invoices : [];

        // Filter for CLOSED and PAID requests
        this.historyRequests = (requests || [])
          .filter(r => {
            const inv = this.invoices.find(i => i.serviceRequestId === r.id);
            return r.status === 'CLOSED' && inv && inv.status === 'PAID';
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getVehicleName(vehicleId: string): string {
    return this.vehiclesMap.get(vehicleId) || 'Unknown Vehicle';
  }

  // --- Modal Logic ---

  openInvoice(request: ServiceRequest): void {
    // Find invoice for this request
    const inv = this.invoices.find(i => i.serviceRequestId === request.id);
    if (inv) {
      this.selectedInvoice = inv;
      this.selectedRequest = request;
      this.selectedVehicleName = this.getVehicleName(request.vehicleId);
      this.showInvoiceModal = true;
    } else {
      alert('Invoice not found for this closed request.');
    }
  }

  closeInvoice(): void {
    this.showInvoiceModal = false;
    this.selectedInvoice = null;
  }

  payNow(): void {
    if (!this.selectedInvoice) return;

    const options: any = {
      key: (environment as any).razorpayKey,
      amount: this.selectedInvoice.total * 100,
      currency: 'INR',
      name: 'AutoServe',
      description: `Invoice #${this.selectedInvoice.id}`,
      image: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
      handler: (response: any) => {
        this.handlePaymentSuccess(response);
      },
      prefill: {
        name: this.selectedRequest?.customerName || 'Customer',
        email: 'customer@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#6f42c1'
      }
    };

    try {
      console.log('Using Razorpay Key:', (environment as any).razorpayKey);
      console.log('Window Razorpay Object:', (window as any).Razorpay);

      if (!(window as any).Razorpay) {
        alert('Razorpay SDK not loaded. Please refresh the page.');
        return;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Payment Failed:', response.error);
        alert('Payment Failed: ' + response.error.description);
      });
      rzp.open();
    } catch (e: any) {
      console.error('Razorpay Init Error:', e);
      alert('Unable to start payment. Error: ' + (e.message || e));
    }
  }

  handlePaymentSuccess(response: any): void {
    console.log('Payment Success:', response);

    if (this.selectedInvoice) {
      const verifyPayload = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        invoiceId: this.selectedInvoice.id
      };

      this.invoiceService.verifyRazorpayPayment(verifyPayload).subscribe({
        next: (res) => {
          console.log('Backend Verification Success:', res);
          alert('Payment Verified & Successful!');
          this.selectedInvoice!.status = 'PAID';
          this.closeInvoice();
          this.loadHistory();
        },
        error: (err) => {
          console.error('Payment Verification Failed', err);
          alert('Payment could not be verified. Please contact support.');
        }
      });
    }
  }
}
