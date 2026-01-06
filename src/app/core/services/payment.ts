import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBase } from '../http-base';

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  invoiceId: string;
  serviceRequestId: string;
  customerId: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
}

export interface RazorpayVerifyRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  invoiceId: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService extends HttpBase {

  createRazorpayOrder(invoiceId: string): Observable<RazorpayOrderResponse> {
    return this.post<RazorpayOrderResponse>(`/api/payments/razorpay/order/${invoiceId}`, {});
  }

  verifyRazorpayPayment(payload: RazorpayVerifyRequest): Observable<string> {
    return this.postText(`/api/payments/razorpay/verify`, payload);
  }
}
