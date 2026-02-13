import { useState, useEffect } from "react";
import {
  getPayments,
  createManualPayment,
  getBillings,
  getClients,
} from "../../services/api";
import StripePayment from "../../components/StripePayment";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [billings, setBillings] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    clientId: "",
    billingId: "",
    amount: "",
    mode: "BANK",
    reference: "",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        clientId: formData.clientId,
        amount: parseFloat(formData.amount),
        mode: formData.mode,
        reference: formData.reference,
      };
      if (formData.billingId) {
        data.billingId = formData.billingId;
      }
      await createManualPayment(data);
      setShowForm(false);
      setFormData({
        clientId: "",
        billingId: "",
        amount: "",
        mode: "BANK",
        reference: "",
      });
      loadData();
      alert("Payment recorded successfully!");
    } catch (error) {
      alert("Failed to record payment");
    }
  };

  const handleStripePaymentSuccess = () => {
    setShowStripePayment(false);
    setSelectedBilling(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          + Record Manual Payment
        </button>
      </div>

      {/* Outstanding Invoices for Online Payment */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600">
          <h2 className="text-xl font-semibold text-white">
            💳 Online Payment - Outstanding Invoices
          </h2>
        </div>
        <div className="p-6">
          {billings.filter((b) => !b.isPaid && b.outstandingAmount > 0)
            .length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No outstanding invoices for online payment
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {billings
                .filter((b) => !b.isPaid && b.outstandingAmount > 0)
                .map((billing) => (
                  <div
                    key={billing._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {billing.invoiceNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          {billing.client?.name}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        ₹{billing.outstandingAmount.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBilling(billing);
                        setShowStripePayment(true);
                      }}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-medium"
                    >
                      Pay Online with Stripe →
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Payment History
          </h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(payment.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {payment.client?.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {payment.billing?.invoiceNumber || "-"}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  ₹{payment.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      payment.mode === "ONLINE"
                        ? "bg-purple-100 text-purple-800"
                        : payment.mode === "BANK"
                          ? "bg-blue-100 text-blue-800"
                          : payment.mode === "UPI"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {payment.mode}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {payment.transactionId ? (
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {payment.transactionId.substring(0, 20)}...
                    </code>
                  ) : (
                    payment.reference || "-"
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      payment.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No payments recorded yet.
          </div>
        )}
      </div>

      {/* Manual Payment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">
              Record Manual Payment
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  Invoice (optional)
                </label>
                <select
                  value={formData.billingId}
                  onChange={(e) =>
                    setFormData({ ...formData, billingId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Invoice (or leave empty)</option>
                  {billings
                    .filter((b) => !b.isPaid)
                    .map((billing) => (
                      <option key={billing._id} value={billing._id}>
                        {billing.invoiceNumber} - ₹
                        {billing.outstandingAmount.toFixed(2)} pending
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., TXN123456"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stripe Payment Modal */}
      {showStripePayment && selectedBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-semibold mb-6">
              Online Payment via Stripe
            </h2>
            <StripePayment
              billing={selectedBilling}
              onSuccess={handleStripePaymentSuccess}
              onCancel={() => {
                setShowStripePayment(false);
                setSelectedBilling(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
