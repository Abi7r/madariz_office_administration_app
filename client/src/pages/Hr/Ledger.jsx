import { useState, useEffect } from "react";
import {
  getClients,
  getClientLedger,
  getAllOutstanding,
} from "../../services/api";

export default function Ledger() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [outstandingData, setOutstandingData] = useState(null);
  const [view, setView] = useState("outstanding"); // 'outstanding' or 'statement'

  useEffect(() => {
    loadClients();
    loadOutstanding();
  }, []);

  const loadClients = async () => {
    try {
      const response = await getClients();
      setClients(response.data);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadOutstanding = async () => {
    try {
      const response = await getAllOutstanding();
      setOutstandingData(response.data);
    } catch (error) {
      console.error("Error loading outstanding:", error);
    }
  };

  const loadClientLedger = async (clientId) => {
    try {
      const response = await getClientLedger(clientId);
      setLedgerData(response.data);
      setSelectedClient(clientId);
      setView("statement");
    } catch (error) {
      console.error("Error loading ledger:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Ledger & Outstanding
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setView("outstanding");
              setSelectedClient(null);
            }}
            className={`px-4 py-2 rounded ${
              view === "outstanding"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Outstanding Summary
          </button>
          <button
            onClick={() => setView("statement")}
            className={`px-4 py-2 rounded ${
              view === "statement"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Client Statement
          </button>
        </div>
      </div>

      {/* Outstanding Summary View */}
      {view === "outstanding" && outstandingData && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Total Outstanding</h2>
            <div className="text-4xl font-bold">
              ₹{outstandingData.totalOutstanding}
            </div>
            <p className="text-purple-100 mt-2">
              Across {outstandingData.clients?.length} clients
            </p>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Outstanding Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {outstandingData.clients?.map((item) => (
                  <tr key={item.client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.client.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.client.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-lg font-semibold text-red-600">
                        ₹{item.balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => loadClientLedger(item.client._id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Statement →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {outstandingData.clients?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                🎉 No outstanding balances! All clients are settled.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Client Statement View */}
      {view === "statement" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Client
            </label>
            <select
              value={selectedClient || ""}
              onChange={(e) => loadClientLedger(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Choose a client...</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {ledgerData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600">Total Invoiced</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{ledgerData.summary.totalDebit}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{ledgerData.summary.totalCredit}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600">Current Balance</div>
                  <div
                    className={`text-2xl font-bold ${
                      parseFloat(ledgerData.summary.currentBalance) > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    ₹{ledgerData.summary.currentBalance}
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Statement for {ledgerData.client.name}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Debit (Invoice)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Credit (Payment)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ledgerData.entries.map((entry) => (
                        <tr key={entry._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {entry.description}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {entry.debit > 0 ? (
                              <span className="text-red-600 font-medium">
                                ₹{entry.debit.toFixed(2)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {entry.credit > 0 ? (
                              <span className="text-green-600 font-medium">
                                ₹{entry.credit.toFixed(2)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <span
                              className={`font-semibold ${
                                entry.balance > 0
                                  ? "text-red-600"
                                  : entry.balance < 0
                                    ? "text-green-600"
                                    : "text-gray-600"
                              }`}
                            >
                              ₹{entry.balance.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ledgerData.entries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No transactions for this client yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
