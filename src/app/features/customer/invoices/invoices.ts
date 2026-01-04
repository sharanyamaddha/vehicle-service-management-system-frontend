import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService, Invoice } from '../../../core/services/invoice';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class Invoices implements OnInit {
  invoices: Invoice[] = [];
  isLoading: boolean = false;
  customerId: string = '';

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.customerId = sessionStorage.getItem('userId') || '';
    if (this.customerId) {
      this.loadInvoices();
    }
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getCustomerInvoices(this.customerId).subscribe({
      next: (data) => {
        this.invoices = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isPaid(status: string): boolean {
    return status === 'PAID';
  }

  isUnpaid(status: string): boolean {
    return status === 'PENDING';
  }

  viewInvoice(invoiceId: string): void {
    // Navigate to invoice detail page
    window.open(`/customer/invoices/${invoiceId}`, '_blank');
  }

  getTotalAmount(): number {
    return this.invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  }

  getTotalUnpaid(): number {
    return this.invoices
      .filter(inv => inv.status === 'PENDING')
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }
}
