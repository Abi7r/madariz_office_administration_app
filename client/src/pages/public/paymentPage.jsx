import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import api from "../../services/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function PaymentPage() {
  const { billingId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    loadBillingInfo();

    // If returning from Stripe, check payment status
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [billingId, sessionId]);

  const loadBillingInfo = async () => {
    try {
      const response = await api.get(`/payments/public/${billingId}`);
      setBilling(response.data);
      setLoading(false);
    } catch (err) {
      setError("Invoice not found");
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await api.get(`/payments/verify/${sessionId}`);
      setPaymentStatus(response.data.status);
    } catch (err) {
      console.error("Error verifying payment:", err);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create checkout session
      const response = await api.post("/payments/stripe/checkout", {
        billingId: billingId,
      });

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({
        sessionId: response.data.sessionId,
      });
    } catch (err) {
      alert("Failed to initiate payment");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Invoice Not Found
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Thank you for your payment of ₹
            {billing.outstandingAmount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">
            Invoice: {billing.invoiceNumber}
          </p>
        </div>
      </div>
    );
  }

  if (billing.isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Already Paid
          </h2>
          <p className="text-gray-600">
            This invoice has already been paid in full.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Invoice: {billing.invoiceNumber}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Invoice Payment
          </h1>
          <p className="text-gray-600">Secure payment powered by Stripe</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="text-lg font-semibold text-gray-800">
                {billing.invoiceNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Amount Due</p>
              <p className="text-3xl font-bold text-purple-600">
                ₹{billing.outstandingAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Client:</span>
              <span className="font-medium">{billing.client}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{billing.task}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hours:</span>
              <span className="font-medium">
                {billing.hours}h @ ₹{billing.ratePerHour}/hr
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice Date:</span>
              <span className="font-medium">
                {new Date(billing.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition shadow-lg"
        >
          {loading ? "Processing..." : "💳 Pay with Card"}
        </button>
        <div className="mt-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧪</span>
            <p className="text-sm font-bold text-yellow-900">
              TEST MODE - Use Test Cards
            </p>
          </div>
          <div className="space-y-2 text-xs text-yellow-800">
            <div className="bg-white rounded p-2 font-mono">
              <div className="flex justify-between items-center">
                <span>4242 4242 4242 4242</span>
                <span className="text-green-600 font-sans font-semibold">
                  ✓ Success
                </span>
              </div>
            </div>
            <div className="bg-white rounded p-2 font-mono">
              <div className="flex justify-between items-center">
                <span>4000 0000 0000 0002</span>
                <span className="text-red-600 font-sans font-semibold">
                  ✗ Declined
                </span>
              </div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-gray-700">
                <strong>Expiry:</strong> Any future date (e.g., 12/34)
                <br />
                <strong>CVC:</strong> Any 3 digits (e.g., 123)
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
