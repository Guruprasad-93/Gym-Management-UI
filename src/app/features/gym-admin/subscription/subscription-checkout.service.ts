import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RazorpayService } from '../../../core/services/razorpay.service';
import { SaasSubscriptionService } from '../../../core/services/saas-subscription.service';
import { GymSubscription } from '../../../shared/models/saas.models';
import { checkoutActionLabel, CheckoutAction } from './plan-catalog.utils';

@Injectable({ providedIn: 'root' })
export class SubscriptionCheckoutService {
  private readonly saas = inject(SaasSubscriptionService);
  private readonly razorpay = inject(RazorpayService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  startCheckout(
    saasPlanId: number,
    pricingOptionId: number,
    action: CheckoutAction,
  ): Observable<GymSubscription> {
    return new Observable((observer) => {
      this.saas.createPaymentOrder(saasPlanId, { pricingOptionId }).subscribe({
        next: (res) => {
          if (!res.success || !res.data) {
            observer.error(new Error(res.message ?? 'Unable to start payment'));
            return;
          }

          const order = {
            paymentId: res.data.saasPaymentId,
            razorpayOrderId: res.data.razorpayOrderId,
            amount: res.data.amount,
            amountInPaise: Math.round(res.data.amount * 100),
            currency: res.data.currency,
            keyId: res.data.keyId,
            planName: res.data.planName,
            memberName: '',
            memberEmail: '',
            useMockCheckout: res.data.useMockCheckout,
            mockPaymentId: res.data.mockPaymentId,
            mockSignature: res.data.mockSignature,
          };

          this.razorpay
            .openCheckout(
              order,
              (payment) => {
                this.saas
                  .verifyPayment({
                    saasPaymentId: res.data!.saasPaymentId,
                    razorpayOrderId: payment.razorpay_order_id,
                    razorpayPaymentId: payment.razorpay_payment_id,
                    razorpaySignature: payment.razorpay_signature,
                  })
                  .subscribe({
                    next: (verify) => {
                      if (verify.success && verify.data) {
                        this.auth.refreshPermissions().subscribe({ error: () => undefined });
                        this.notify.success(`${checkoutActionLabel(action)} completed successfully`);
                        observer.next(verify.data);
                        observer.complete();
                      } else {
                        observer.error(new Error(verify.message ?? 'Payment verification failed'));
                      }
                    },
                    error: (err) => observer.error(err),
                  });
              },
              () => observer.error(new Error('Payment cancelled')),
            )
            .subscribe({ error: (err) => observer.error(err) });
        },
        error: (err) => observer.error(err),
      });
    });
  }
}
