import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';
import { InvoiceService, Invoice } from '../../../core/services/invoice';
import { PaymentService, RazorpayOrderResponse } from '../../../core/services/payment';
import { UserService } from '../../../core/services/user-service';
import { InventoryService } from '../../../core/services/inventory';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-customer-request-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './customer-request-detail.html',
    styleUrl: './customer-request-detail.css'
})
export class CustomerRequestDetailComponent implements OnInit {
    request: ServiceRequest | null = null;
    vehicle: Vehicle | null = null;
    invoice: Invoice | null = null;
    technicianName: string = 'Pending Assignment';
    managerName: string = 'Pending';

    isLoading = true;
    showInvoiceModal = false;
    isPaying = false;
    private razorpayLoaded = false;
    private razorpayLoader?: Promise<void>;

    statusSteps = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];

    // Data for Parts Pricing
    partPrices: Map<string, number> = new Map();

    // Dialog State
    dialogVisible = false;
    dialogTitle = '';
    dialogMessage = '';
    dialogType: 'info' | 'confirm' | 'error' = 'info';

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly requestService: ServiceRequestService,
        private readonly vehicleService: VehicleService,
        private readonly invoiceService: InvoiceService,
        private readonly paymentService: PaymentService,
        private readonly userService: UserService,
        private readonly inventoryService: InventoryService, // Injected
        private readonly cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadData(id);
        }
    }

    loadData(id: string): void {
        this.isLoading = true;

        // First fetch request to get IDs
        this.requestService.getRequestById(id).subscribe({
            next: (req) => {
                this.request = req;
                this.loadDependentData(req);
            },
            error: (err) => {
                console.error('Error loading request', err);
                this.isLoading = false;
            }
        });
    }

    loadDependentData(req: ServiceRequest): void {
        const observables: any = {};

        if (req.vehicleId) {
            observables.vehicle = this.vehicleService.getVehiclesByCustomerId(req.customerId);
        }

        // Tech Name is already in req.technicianName (denormalized) usually
        // We do NOT fetch all users as it is forbidden for customers.

        if (req.status === 'CLOSED' || req.status === 'COMPLETED') {
            observables.invoices = this.invoiceService.getCustomerInvoices(req.customerId);
        }

        // Fetch Part Prices if usedParts exist
        // Note: Customers might not have permission to list ALL parts.
        // We catch the error so it doesn't break the whole page loading.
        if (req.usedParts && req.usedParts.length > 0) {
            observables.parts = this.inventoryService.getAllParts().pipe(
                catchError(err => {
                    console.warn('Could not load parts catalog (likely permission issue). Prices might be missing.', err);
                    return of([]); // Return empty array on error
                })
            );
        }

        // Set Tech Name immediately if available
        if (req.technicianName) {
            this.technicianName = req.technicianName;
        } else if (req.technicianId) {
            this.technicianName = 'Assigned Technician';
        }

        // If nothing to fetch, stop loading
        if (Object.keys(observables).length === 0) {
            this.isLoading = false;
            this.cdr.detectChanges(); // Force Check
            return;
        }

        forkJoin(observables).subscribe({
            next: (res: any) => {
                if (res.vehicle) {
                    this.vehicle = res.vehicle.find((v: Vehicle) => v.id === req.vehicleId) || null;
                }

                if (res.invoices) {
                    console.log('Fetching Invoices for Customer:', req.customerId);
                    console.log('Current Request ID:', req.id);
                    console.log('All Customer Invoices:', res.invoices);

                    this.invoice = res.invoices.find((inv: Invoice) => {
                        // Loose comparison just in case type differs (though both should be string)
                        return inv.serviceRequestId == req.id;
                    }) || null;

                    console.log('Found Invoice:', this.invoice);
                }

                if (res.parts) {
                    // Create a Map of PartID -> Price
                    (res.parts as any[]).forEach(p => {
                        if (p.id) this.partPrices.set(p.id, p.price);
                        // Also map by name if needed as fallback, but ID is safer
                        // Assuming usedParts has partId. If not, we match by name.
                    });

                    // Fallback matching if usedParts lacks IDs (based on user previous issues)
                    if (req.usedParts) {
                        req.usedParts.forEach(up => {
                            if (!up.unitPrice && up.partId && this.partPrices.has(up.partId)) {
                                up.unitPrice = this.partPrices.get(up.partId);
                            }
                            // Try matching by Name if ID failed
                            if (!up.unitPrice && up.partName) {
                                const p = (res.parts as any[]).find(x => x.name === up.partName);
                                if (p) up.unitPrice = p.price;
                            }
                        });
                    }
                }

                this.isLoading = false;
                this.cdr.detectChanges(); // Force Check
            },
            error: (err) => {
                console.warn('Error loading dependent data', err);
                this.isLoading = false;
                this.cdr.detectChanges(); // Force Check
            }
        });
    }

    get currentStepIndex(): number {
        if (!this.request) return 0;
        // Map status to index
        const status = this.request.status;
        if (status === 'BOOKED') return 0;
        return this.statusSteps.indexOf(status);
    }

    isStepCompleted(step: string): boolean {
        return this.statusSteps.indexOf(step) <= this.currentStepIndex;
    }

    openInvoice(): void {
        this.showInvoiceModal = true;
    }

    closeInvoice(): void {
        this.showInvoiceModal = false;
    }

    payNow(): void {
        if (!this.invoice) return;
        this.isPaying = true;
        this.paymentService.createRazorpayOrder(this.invoice.id).subscribe({
            next: (order) => this.openRazorpay(order),
            error: (err) => {
                console.error('Failed to create order', err);
                this.showError('Payment Error', 'Unable to start payment. Please try again.');
                this.isPaying = false;
                this.cdr.detectChanges();
            }
        });
    }

    private openRazorpay(order: RazorpayOrderResponse): void {
        this.ensureRazorpayLoaded()
            .then(() => {
                const options: any = {
                    key: order.key,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'AutoServe',
                    description: order.description || `Invoice ${order.invoiceId}`,
                    order_id: order.orderId,
                    prefill: {
                        name: order.customerName || 'Customer',
                        email: order.customerEmail || undefined,
                        contact: order.customerContact || undefined
                    },
                    notes: {
                        invoiceId: order.invoiceId,
                        serviceRequestId: order.serviceRequestId
                    },
                    handler: (resp: any) => this.handlePaymentSuccess(resp, order.invoiceId),
                    modal: {
                        ondismiss: () => {
                            this.isPaying = false;
                            this.cdr.detectChanges();
                        }
                    }
                };

                const rzp = new (globalThis as any).Razorpay(options);
                rzp.on('payment.failed', () => {
                    this.isPaying = false;
                    this.cdr.detectChanges();
                });
                rzp.open();
            })
            .catch(err => {
                console.error('Failed to load Razorpay', err);
                this.showError('Payment System', 'Payment gateway not available right now.');
                this.isPaying = false;
                this.cdr.detectChanges();
            });
    }

    private handlePaymentSuccess(resp: any, invoiceId: string): void {
        const payload = {
            orderId: resp.razorpay_order_id,
            paymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
            invoiceId
        };

        this.paymentService.verifyRazorpayPayment(payload).subscribe({
            next: () => {
                if (this.invoice) {
                    this.invoice.status = 'PAID';
                    this.invoice.razorpayPaymentId = resp.razorpay_payment_id;
                }
                this.isPaying = false;
                this.cdr.detectChanges();
                this.showInfo('Payment Successful!', 'Thank you. Your payment has been verified.');
            },
            error: (err) => {
                console.error('Verification failed', err);
                this.showError('Verification Failed', 'Payment could not be verified. Please contact support.');
                this.isPaying = false;
                this.cdr.detectChanges();
            }
        });
    }

    private ensureRazorpayLoaded(): Promise<void> {
        if (this.razorpayLoaded) return Promise.resolve();
        if (this.razorpayLoader) return this.razorpayLoader;

        this.razorpayLoader = new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (existing) {
                if ((globalThis as any).Razorpay) {
                    this.razorpayLoaded = true;
                    resolve();
                    return;
                }
                existing.addEventListener('load', () => {
                    this.razorpayLoaded = true;
                    resolve();
                });
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                this.razorpayLoaded = true;
                resolve();
            };
            script.onerror = (err) => {
                if (err instanceof Error) return reject(err);
                try {
                    reject(new Error(JSON.stringify(err)));
                } catch (e) {
                    reject(new Error('Failed to load Razorpay checkout script'));
                }
            };
            document.body.appendChild(script);
        });
        return this.razorpayLoader;
    }

    getPartsTotal(): number {
        if (!this.request || !this.request.usedParts) return 0;
        return this.request.usedParts.reduce((acc, part) => {
            const price = part.unitPrice || 0;
            const qty = part.quantity || 0;
            return acc + (price * qty);
        }, 0);
    }

    // Helper Methods for Dialog
    showInfo(title: string, message: string): void {
        this.dialogTitle = title;
        this.dialogMessage = message;
        this.dialogType = 'info';
        this.dialogVisible = true;
    }

    showError(title: string, message: string): void {
        this.dialogTitle = title;
        this.dialogMessage = message;
        this.dialogType = 'error';
        this.dialogVisible = true;
    }

    closeDialog(): void {
        this.dialogVisible = false;
    }
}
