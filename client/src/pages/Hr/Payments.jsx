import { useState, useEffect } from "react";
import {
  getPayments,
  createManualPayment,
  getBillings,
  getClients,
} from "../../services/api";
import api from "../../services/api";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [billings, setBillings] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    clientId: "",
    billingId: "",
    amount: "",
    mode: "BANK",
    reference: "",
  });
  const [paymentLinks, setPaymentLinks] = useState({}); // Store generated links

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsRes, billingsRes, clientsRes] = await Promise.all([
        getPayments(),
        getBillings(),
        getClients(),
      ]);
      setPayments(paymentsRes.data);
      setBillings(billingsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Generate shareable payment link
  const handleGenerateLink = async (billing) => {
    try {
      const response = await api.post("/payments/stripe/checkout", {
        billingId: billing._id,
      });

      const paymentUrl = response.data.url;

      // Store the link
      setPaymentLinks((prev) => ({
        ...prev,
        [billing._id]: paymentUrl,
      }));

      // Copy to clipboard
      navigator.clipboard.writeText(paymentUrl);
      alert(
        "✅ Payment link copied to clipboard!\n\nShare this link with the client via email, WhatsApp, or SMS.",
      );
    } catch (error) {
      console.error("Error generating link:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to generate payment link";
      alert(`❌ ${errorMsg}`);
    }
  };

  const handleCopyLink = (billingId) => {
    const link = paymentLinks[billingId];
    navigator.clipboard.writeText(link);
    alert("✅ Link copied to clipboard!");
  };

  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientId || !formData.amount || !formData.mode) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createManualPayment({
        clientId: formData.clientId,
        billingId: formData.billingId || undefined,
        amount: parseFloat(formData.amount),
        mode: formData.mode,
        reference: formData.reference || undefined,
      });

      setShowForm(false);
      setFormData({
        clientId: "",
        billingId: "",
        amount: "",
        mode: "BANK",
        reference: "",
      });
      loadData();
      alert("✅ Manual payment recorded successfully!");
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("❌ Failed to record payment");
    }
  };

  const getPaymentModeColor = (mode) => {
    const colors = {
      ONLINE: "bg-blue-100 text-blue-800",
      CASH: "bg-green-100 text-green-800",
      BANK: "bg-purple-100 text-purple-800",
      UPI: "bg-orange-100 text-orange-800",
    };
    return colors[mode] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    return status === "COMPLETED"
      ? "bg-green-100 text-green-800"
      : status === "PENDING"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";
  };
  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Receipt download error:", error);
      alert("Failed to download receipt");
    }
  };

  // Filter out billings with no client
  const validOutstandingBillings = billings.filter(
    (b) => !b.isPaid && b.outstandingAmount > 0 && b.client,
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Total Received
              </p>
              <p className="text-3xl font-bold mt-1">
                ₹{payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-blue-100 text-xs mt-2">
            {payments.length} transactions
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Outstanding</p>
              <p className="text-3xl font-bold mt-1">
                ₹
                {billings
                  .filter((b) => !b.isPaid)
                  .reduce((sum, b) => sum + b.outstandingAmount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-purple-100 text-xs mt-2">
            {validOutstandingBillings.length} unpaid invoices
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Online Payments
              </p>
              <p className="text-3xl font-bold mt-1">
                {payments.filter((p) => p.mode === "ONLINE").length}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>
          <p className="text-green-100 text-xs mt-2">via Stripe</p>
        </div>
      </div>

      {/* Outstanding Invoices - Generate Payment Links */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600">
          <h2 className="text-xl font-semibold text-white">
            💳 Outstanding Invoices - Generate Payment Links
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            Generate shareable payment links to send to clients
          </p>
        </div>
        <div className="p-6">
          {validOutstandingBillings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-600 font-medium">
                All invoices are paid!
              </p>
              <p className="text-gray-500 text-sm mt-2">
                No outstanding payments at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {validOutstandingBillings.map((billing) => (
                <div
                  key={billing._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">
                        {billing.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {billing.client?.name} - {billing.task?.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {billing.client?.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {billing.hours}h @ ₹{billing.ratePerHour}/hr
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-600">
                        ₹{billing.outstandingAmount.toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(billing.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment link section */}
                  {paymentLinks[billing._id] && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-xs text-green-700 font-medium">
                          Payment Link Generated - Send to Client:
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={paymentLinks[billing._id]}
                          readOnly
                          className="flex-1 text-xs px-2 py-1 bg-white border border-green-300 rounded font-mono"
                        />
                        <button
                          onClick={() => handleCopyLink(billing._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        💡 Share this link with the client via email, WhatsApp,
                        or SMS
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateLink(billing)}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-medium transition"
                    >
                      🔗 Generate Payment Link
                    </button>
                    <button
                      onClick={() => {
                        setFormData({
                          clientId: billing.client._id,
                          billingId: billing._id,
                          amount: billing.outstandingAmount.toString(),
                          mode: "BANK",
                          reference: "",
                        });
                        setShowForm(true);
                      }}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium transition"
                    >
                      💵 Record Manual Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            📜 Payment History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No payments recorded yet
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.client?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payment.billing?.invoiceNumber || "Direct Payment"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₹{payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentModeColor(
                          payment.mode,
                        )}`}
                      >
                        {payment.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          payment.status,
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                      {payment.transactionId || payment.reference || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDownloadReceipt(payment._id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Download Receipt"
                      >
                        📄 Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Record Manual Payment
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    clientId: "",
                    billingId: "",
                    amount: "",
                    mode: "BANK",
                    reference: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleManualPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) =>
                    setFormData({ ...formData, clientId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice (Optional)
                </label>
                <select
                  value={formData.billingId}
                  onChange={(e) =>
                    setFormData({ ...formData, billingId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None (General Payment)</option>
                  {billings
                    .filter(
                      (b) => !b.isPaid && b.client?._id === formData.clientId,
                    )
                    .map((billing) => (
                      <option key={billing._id} value={billing._id}>
                        {billing.invoiceNumber} - ₹
                        {billing.outstandingAmount.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  required
                  value={formData.mode}
                  onChange={(e) =>
                    setFormData({ ...formData, mode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., TXN123456"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      clientId: "",
                      billingId: "",
                      amount: "",
                      mode: "BANK",
                      reference: "",
                    });
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
