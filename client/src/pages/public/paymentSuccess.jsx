import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../services/api";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const billingId = searchParams.get("billing_id");

  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const response = await api.get(`/payments/verify/${sessionId}`);
      if (response.data.status === "paid") {
        setVerified(true);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {verified ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your payment. Your invoice has been marked as paid.
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-700">
                A confirmation email has been sent to your registered email
                address.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Payment Processing
            </h2>
            <p className="text-gray-600">
              Your payment is being processed. You will receive a confirmation
              email shortly.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
