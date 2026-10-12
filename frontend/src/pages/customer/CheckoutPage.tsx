import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import {
  MapPin,
  CheckCircle2,
  CreditCard,
  Banknote,
  Plus,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  Check,
  RefreshCw,
  Smartphone,
  QrCode,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { paymentService } from '../../services/payment.service';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Address, ApiResponse, PaymentProvider } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { openRazorpayModal, RazorpaySuccessResponse } from '../../utils/razorpay';

export type CheckoutPaymentMethod = 'UPI' | 'CARDS' | 'CASH_ON_DELIVERY';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { success, error } = useToast();

  // Step state: 1 = Shipping Address, 2 = Payment Method & Review
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('UPI');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatusText, setSubmissionStatusText] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  // COD confirmation modal state
  const [isCodConfirmModalOpen, setIsCodConfirmModalOpen] = useState(false);

  // New address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');

  // Fetch saved addresses
  const { data: addresses = [], refetch: refetchAddresses } = useQuery<Address[]>({
    queryKey: ['saved-addresses'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Address[]>>('/users/me/addresses');
      return res.data.data;
    },
  });

  React.useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const deliveryFee = 30;
  const grandTotal = subtotal + deliveryFee;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<ApiResponse<Address>>('/users/me/addresses', {
        name: newName,
        phone: newPhone,
        addressLine: newAddressLine,
        city: newCity,
        state: newState,
        pincode: newPincode,
        isDefault: addresses.length === 0,
      });
      await refetchAddresses();
      setSelectedAddressId(res.data.data.id);
      setIsAddressModalOpen(false);
      success('Delivery address saved!');
      setNewName('');
      setNewPhone('');
      setNewAddressLine('');
      setNewCity('');
      setNewState('');
      setNewPincode('');
    } catch (err: any) {
      error(err.message || 'Failed to save address');
    }
  };

  /**
   * Proceed from Step 1 (Address) to Step 2 (Payment Selection)
   */
  const handleProceedToPayment = () => {
    if (!selectedAddressId) {
      error('Please select or add a delivery address to continue.');
      return;
    }
    if (items.length === 0) {
      error('Your cart is empty.');
      navigate('/cart');
      return;
    }
    setCheckoutError(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Step 2 Handler: Pay Online via Razorpay
   */
  const handleRazorpayPayment = async (preferredInstrument: 'upi' | 'card' = 'upi') => {
    if (!selectedAddressId) {
      error('Delivery address is missing.');
      setCurrentStep(1);
      return;
    }

    setCheckoutError(null);
    setIsSubmitting(true);
    setSubmissionStatusText(
      preferredInstrument === 'upi'
        ? 'Connecting to UPI (Google Pay, PhonePe, Paytm, QR)...'
        : 'Connecting to Secure Card & NetBanking Gateway...'
    );

    try {
      // 1. Backend creates Razorpay order first
      const rzpOrderData = await paymentService.createRazorpayOrder(
        selectedAddressId,
        orderNotes.trim() || undefined
      );

      setSubmissionStatusText(
        preferredInstrument === 'upi'
          ? 'Complete payment in your UPI app or scan the QR code...'
          : 'Awaiting card / netbanking completion...'
      );

      // 2. Open Razorpay standard checkout popup with preferred method
      await openRazorpayModal({
        keyId: rzpOrderData.keyId,
        orderId: rzpOrderData.razorpayOrderId,
        amountInPaise: rzpOrderData.amountInPaise,
        currency: rzpOrderData.currency,
        name: 'FarmLink Marketplace',
        description:
          preferredInstrument === 'upi'
            ? `UPI Instant Order (${items.length} farm items)`
            : `Cards & NetBanking Order (${items.length} farm items)`,
        preferredMethod: preferredInstrument,
        prefill: {
          name: selectedAddress?.name || user?.name || 'FarmLink Customer',
          email: user?.email || undefined,
          contact: selectedAddress?.phone || user?.phone || undefined,
        },
        onSuccess: async (response: RazorpaySuccessResponse) => {
          try {
            setSubmissionStatusText('Verifying payment signature with bank...');
            // 3. Server-side HMAC SHA256 signature verification & DB Order creation
            const verifiedOrder = await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              addressId: selectedAddressId,
              notes: orderNotes.trim() || undefined,
              paymentMethod: preferredInstrument === 'upi' ? 'RAZORPAY_UPI' : 'RAZORPAY_CARDS',
            });

            // Trigger celebration confetti
            try {
              confetti({
                particleCount: 90,
                spread: 75,
                origin: { y: 0.6 },
                colors: ['#2E7D32', '#4CAF50', '#81C784', '#FFD54F'],
              });
            } catch {
              // ignore
            }

            await clearCart();
            setConfirmedOrderId(verifiedOrder.id);
            success('Payment verified successfully! Your order has been placed.');
          } catch (verifyErr: any) {
            const msg = verifyErr.message || 'Payment verification failed. Please contact support.';
            setCheckoutError(msg);
            error(msg);
          } finally {
            setIsSubmitting(false);
            setSubmissionStatusText('');
          }
        },
        onDismiss: () => {
          setIsSubmitting(false);
          setSubmissionStatusText('');
          setCheckoutError(
            'Payment was cancelled or closed. No order was placed, and your cart items remain safe.'
          );
        },
        onError: (err: any) => {
          setIsSubmitting(false);
          setSubmissionStatusText('');
          const msg = err?.description || 'Payment failed. Please try again or choose another payment method.';
          setCheckoutError(msg);
          error(msg);
        },
      });
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmissionStatusText('');
      const msg = err.message || 'Could not initiate payment. Please try again.';
      setCheckoutError(msg);
      error(msg);
    }
  };

  /**
   * Step 2 Handler: Cash on Delivery (COD)
   */
  const handleConfirmCodOrder = async () => {
    setIsCodConfirmModalOpen(false);
    setIsSubmitting(true);
    setSubmissionStatusText('Confirming your Cash on Delivery order...');
    setCheckoutError(null);

    try {
      const order = await paymentService.createCodOrder({
        addressId: selectedAddressId,
        notes: orderNotes.trim() || undefined,
      });

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2E7D32', '#4CAF50', '#81C784', '#FFFFFF'],
        });
      } catch {
        // ignore
      }

      await clearCart();
      setConfirmedOrderId(order.id);
      success('Order placed successfully via Cash on Delivery!');
    } catch (err: any) {
      const msg = err.message || 'Failed to place order. Please try again.';
      setCheckoutError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
      setSubmissionStatusText('');
    }
  };

  // Order Confirmed Screen
  if (confirmedOrderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-primary-100 text-primary flex items-center justify-center text-4xl mx-auto shadow-subtle animate-in zoom-in">
          🎉
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Order Confirmed
          </span>
          <h1 className="text-3xl font-extrabold text-darkText tracking-tight">
            Thank You for Sourcing Direct!
          </h1>
          <p className="text-sm text-grayText max-w-md mx-auto">
            Your fresh harvest order has been received. Our partner farmers have been notified and are
            preparing your produce.
          </p>
        </div>

        <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 text-xs text-primary-800">
          Order ID:{' '}
          <span className="font-mono font-bold text-darkText">{confirmedOrderId}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to={`/orders/${confirmedOrderId}`} className="w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Track Order Live
            </Button>
          </Link>
          <Link to="/products" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full">
              Explore More Produce
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-darkText tracking-tight">
          Checkout & Delivery
        </h1>
        <p className="text-xs sm:text-sm text-grayText mt-1">
          Complete your farm-direct purchase securely in two easy steps.
        </p>
      </div>

      {/* Two-Step Progress Indicator */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
            currentStep === 1
              ? 'border-primary bg-primary-50/60 ring-2 ring-primary/20 text-primary-900 font-bold'
              : 'border-gray-200 bg-white text-gray-500'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              selectedAddressId
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {selectedAddressId ? <Check className="w-3.5 h-3.5" /> : '1'}
          </div>
          <div className="text-xs">
            <p className="font-semibold leading-tight">1. Delivery Address</p>
            <p className="text-[10px] text-gray-400 font-normal">
              {selectedAddress ? selectedAddress.city : 'Choose shipping'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedAddressId) setCurrentStep(2);
          }}
          disabled={!selectedAddressId}
          className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
            currentStep === 2
              ? 'border-primary bg-primary-50/60 ring-2 ring-primary/20 text-primary-900 font-bold'
              : 'border-gray-200 bg-white text-gray-400 disabled:opacity-60'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              currentStep === 2
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            2
          </div>
          <div className="text-xs">
            <p className="font-semibold leading-tight">2. Payment Method</p>
            <p className="text-[10px] text-gray-400 font-normal">
              {paymentMethod === 'UPI'
                ? 'UPI / QR Code'
                : paymentMethod === 'CARDS'
                ? 'Cards & NetBanking'
                : 'Cash on Delivery'}
            </p>
          </div>
        </button>
      </div>

      {/* Global Error Banner */}
      {checkoutError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start justify-between gap-3 text-xs text-red-800">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Order Placement Issue</p>
              <p className="mt-0.5 text-red-700">{checkoutError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutError(null)}
            className="text-xs font-bold text-red-800 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Side: Step 1 OR Step 2 */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Address Selection */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-darkText text-base">Select Delivery Address</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsAddressModalOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Address
                  </Button>
                </div>

                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-primary bg-primary-50/50 shadow-xs ring-2 ring-primary/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-darkText text-sm">{addr.name}</span>
                          {selectedAddressId === addr.id && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-grayText leading-relaxed">
                          {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium mt-1">📞 {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                    <p className="text-xs text-grayText mb-3">No saved addresses found.</p>
                    <Button size="sm" variant="primary" onClick={() => setIsAddressModalOpen(true)}>
                      Add Delivery Address
                    </Button>
                  </div>
                )}
              </div>

              {/* Delivery Instructions */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-2">
                <h3 className="font-bold text-darkText text-sm">Delivery Instructions (Optional)</h3>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Leave with gate security, ring bell twice, or call upon arrival..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white"
                />
              </div>

              <div className="pt-2">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full"
                  onClick={handleProceedToPayment}
                  disabled={!selectedAddressId}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Payment Method
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Method Selection Screen */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Delivery Address Summary with Change Link */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-subtle flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-darkText">Delivering to:</span>
                      <span className="text-xs font-bold text-primary">{selectedAddress?.name}</span>
                    </div>
                    <p className="text-xs text-grayText mt-0.5">
                      {selectedAddress?.addressLine}, {selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.pincode}
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium">Phone: {selectedAddress?.phone}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-primary hover:underline shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Payment Method Selection Card */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-4">
                <div>
                  <h3 className="font-bold text-darkText text-base">Select Payment Method</h3>
                  <p className="text-xs text-grayText mt-0.5">
                    Choose how you would like to complete your order.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Option 1: UPI / QR Code (Google Pay, PhonePe, Paytm, BHIM) */}
                  <label
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${
                        paymentMethod === 'UPI'
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'UPI' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-darkText text-sm sm:text-base flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                          Pay via UPI / QR Code
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                          Instant & Zero Fee
                        </span>
                      </div>
                      <p className="text-xs text-grayText mt-1">
                        Pay instantly with any UPI app on your phone or scan the live QR code.
                      </p>

                      {/* Brand Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-gray-200 text-gray-700 shadow-xs">
                          Google Pay
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-gray-200 text-gray-700 shadow-xs">
                          PhonePe
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-gray-200 text-gray-700 shadow-xs">
                          Paytm
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-gray-200 text-gray-700 shadow-xs">
                          BHIM UPI
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-xs">
                          <QrCode className="w-3 h-3 mr-1 text-emerald-600" /> Scan & Pay
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium mt-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Instant bank verification • No OTP or card details needed</span>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Cards & NetBanking */}
                  <label
                    onClick={() => setPaymentMethod('CARDS')}
                    className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'CARDS'
                        ? 'border-primary bg-primary-50/50 ring-2 ring-primary/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${
                        paymentMethod === 'CARDS'
                          ? 'border-primary bg-primary'
                          : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'CARDS' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-darkText text-sm sm:text-base flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" />
                          Cards & NetBanking
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          All Banks
                        </span>
                      </div>
                      <p className="text-xs text-grayText mt-1">
                        Visa, MasterCard, RuPay, Maestro & NetBanking across 50+ major banks.
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mt-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span>Secure 256-bit bank-grade encrypted gateway via Razorpay</span>
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Cash on Delivery (COD) */}
                  <label
                    onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'CASH_ON_DELIVERY'
                        ? 'border-primary bg-primary-50/50 ring-2 ring-primary/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${
                        paymentMethod === 'CASH_ON_DELIVERY'
                          ? 'border-primary bg-primary'
                          : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'CASH_ON_DELIVERY' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-darkText text-sm sm:text-base flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-primary" />
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          Pay at Doorstep
                        </span>
                      </div>
                      <p className="text-xs text-grayText mt-1">
                        Inspect produce freshness when delivered and pay the delivery executive in cash or UPI.
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-amber-700 font-medium mt-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Order status will remain PENDING until delivery verification</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Trigger Buttons based on selection */}
              <div className="pt-2 flex items-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isSubmitting}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>

                {paymentMethod === 'UPI' && (
                  <Button
                    size="lg"
                    variant="primary"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20"
                    onClick={() => handleRazorpayPayment('upi')}
                    isLoading={isSubmitting}
                    leftIcon={<Smartphone className="w-4 h-4" />}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isSubmitting ? submissionStatusText || 'Connecting to UPI...' : `Pay ₹${grandTotal} via UPI / QR`}
                  </Button>
                )}

                {paymentMethod === 'CARDS' && (
                  <Button
                    size="lg"
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleRazorpayPayment('card')}
                    isLoading={isSubmitting}
                    leftIcon={<CreditCard className="w-4 h-4" />}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isSubmitting ? submissionStatusText || 'Connecting to Gateway...' : `Proceed to Pay ₹${grandTotal} (Cards)`}
                  </Button>
                )}

                {paymentMethod === 'CASH_ON_DELIVERY' && (
                  <Button
                    size="lg"
                    variant="primary"
                    className="flex-1"
                    onClick={() => setIsCodConfirmModalOpen(true)}
                    isLoading={isSubmitting}
                    leftIcon={<Banknote className="w-4 h-4" />}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isSubmitting ? submissionStatusText || 'Placing COD Order...' : `Confirm COD Order (₹${grandTotal})`}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Produce Summary & Price Breakdown (Visible on Both Steps) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 shadow-subtle space-y-6 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-darkText text-base">
              Order Summary ({items.length} items)
            </h3>
            <Link to="/cart" className="text-xs font-semibold text-primary hover:underline">
              Edit Cart
            </Link>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-darkText truncate">{item.product?.name}</p>
                  <p className="text-grayText">
                    {item.quantity} × ₹{item.product?.price} / {item.product?.unit?.toLowerCase() || 'kg'}
                  </p>
                </div>
                <span className="font-bold text-darkText">
                  ₹{(item.product?.price || 0) * item.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="pt-4 border-t border-gray-100 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between text-grayText">
              <span>Produce Subtotal</span>
              <span className="font-semibold text-darkText">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-grayText">
              <span>Direct Farm Logistics Fee</span>
              <span className="font-semibold text-darkText">₹{deliveryFee}</span>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-bold text-darkText">
              <span>Total Payable</span>
              <span className="text-primary-800 text-lg">₹{grandTotal}</span>
            </div>
          </div>

          {/* Selected Method Display */}
          <div className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-grayText">Payment Mode:</span>
              <span className="font-bold text-darkText">
                {paymentMethod === 'UPI'
                  ? 'Instant UPI / QR Code'
                  : paymentMethod === 'CARDS'
                  ? 'Cards & NetBanking'
                  : 'Cash on Delivery (COD)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-grayText">Harvest Direct:</span>
              <span className="font-semibold text-primary">100% Verified Farmers</span>
            </div>
          </div>

          <div className="p-3 bg-primary-50/70 rounded-xl flex items-center gap-2 text-[11px] text-primary-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Farm-fresh quality guarantee with immediate refund or replacement.</span>
          </div>
        </div>
      </div>

      {/* COD Confirmation Modal */}
      <Modal
        isOpen={isCodConfirmModalOpen}
        onClose={() => setIsCodConfirmModalOpen(false)}
        title="Confirm Cash on Delivery Order"
        maxWidth="md"
      >
        <div className="space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
              <Banknote className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-darkText">
              Are you sure you want Cash on Delivery?
            </h3>
            <p className="text-xs text-grayText leading-relaxed">
              You will be paying <strong className="text-darkText font-bold">₹{grandTotal}</strong> in cash or UPI
              to the delivery agent when your produce arrives at your doorstep.
            </p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-2xl text-xs space-y-2 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-grayText">Delivery Address:</span>
              <span className="font-bold text-darkText text-right line-clamp-1">
                {selectedAddress?.addressLine}, {selectedAddress?.city}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-grayText">Contact Phone:</span>
              <span className="font-bold text-darkText">{selectedAddress?.phone}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="font-bold text-darkText">Amount Due:</span>
              <span className="font-extrabold text-primary text-sm">₹{grandTotal}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsCodConfirmModalOpen(false)}
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConfirmCodOrder}
              isLoading={isSubmitting}
            >
              Yes, Place COD Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add Delivery Address"
      >
        <form onSubmit={handleAddNewAddress} className="space-y-4">
          <Input
            label="Recipient Name"
            placeholder="Sai Gupta"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            placeholder="9876543210"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            required
          />
          <Input
            label="Address (House / Flat / Street)"
            placeholder="Flat 402, Green Meadows"
            value={newAddressLine}
            onChange={(e) => setNewAddressLine(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="Guntur"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              required
            />
            <Input
              label="State"
              placeholder="Andhra Pradesh"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              required
            />
          </div>
          <Input
            label="Pincode"
            placeholder="522001"
            value={newPincode}
            onChange={(e) => setNewPincode(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" className="w-full">
            Save Address
          </Button>
        </form>
      </Modal>
    </div>
  );
};
