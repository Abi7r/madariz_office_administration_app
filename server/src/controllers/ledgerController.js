const LedgerEntry = require("../models/ledgerEntry");
const Client = require("../models/client");

// Get Client Ledger/Statement
exports.getClientLedger = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Build filter
    const filter = { client: clientId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Get ledger entries
    const entries = await LedgerEntry.find(filter)
      .populate("reference")
      .sort({ date: 1 });

    // Calculate totals
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const currentBalance =
      entries.length > 0 ? entries[entries.length - 1].balance : 0;

    res.json({
      client,
      entries,
      summary: {
        totalDebit: totalDebit.toFixed(2),
        totalCredit: totalCredit.toFixed(2),
        currentBalance: currentBalance.toFixed(2),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Clients with Outstanding Balance
exports.getAllOutstanding = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true });

    const outstandingData = await Promise.all(
      clients.map(async (client) => {
        const lastEntry = await LedgerEntry.findOne({
          client: client._id,
        }).sort({ date: -1 });

        return {
          client,
          balance: lastEntry ? lastEntry.balance : 0,
        };
      }),
    );

    // Filter only clients with outstanding balance
    const withOutstanding = outstandingData.filter((item) => item.balance > 0);

    const totalOutstanding = withOutstanding.reduce(
      (sum, item) => sum + item.balance,
      0,
    );

    res.json({
      clients: withOutstanding,
      totalOutstanding: totalOutstanding.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
