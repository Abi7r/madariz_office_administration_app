const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateReceipt(payment, billing, client) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `receipt-${payment._id}.pdf`;
      const filePath = path.join(__dirname, "../../temp", fileName);

      // Ensure temp directory exists
      const tempDir = path.join(__dirname, "../../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text("PAYMENT RECEIPT", { align: "center" }).moveDown();

      // Company Info
      doc
        .fontSize(10)
        .text("Madariz", { align: "right" })
        .text("123 Business Street", { align: "right" })
        .text("City, State 12345", { align: "right" })
        .text("contact@madariz.com", { align: "right" })
        .moveDown(2);

      // Receipt Details Box
      doc.rect(50, doc.y, 500, 150).stroke();

      const boxStartY = doc.y + 15;

      doc
        .fontSize(12)
        .text(`Receipt No: ${payment._id}`, 70, boxStartY)
        .text(
          `Date: ${new Date(payment.date).toLocaleDateString()}`,
          70,
          boxStartY + 20,
        )
        .text(`Payment Mode: ${payment.mode}`, 70, boxStartY + 40)
        .text(
          `Transaction ID: ${payment.transactionId || payment.reference || "N/A"}`,
          70,
          boxStartY + 60,
        )
        .text(`Status: ${payment.status}`, 70, boxStartY + 80);

      doc.moveDown(8);

      // Client Details
      doc.fontSize(14).text("BILLED TO:", { underline: true }).moveDown(0.5);

      doc
        .fontSize(11)
        .text(client.name)
        .text(client.email || "")
        .text(client.phone || "")
        .text(client.address || "")
        .moveDown(2);

      // Payment Details Table
      doc
        .fontSize(14)
        .text("PAYMENT DETAILS:", { underline: true })
        .moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Description", 50, tableTop, { width: 300 })
        .text("Amount", 400, tableTop, { width: 100, align: "right" });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(500, tableTop + 15)
        .stroke();

      // Table content
      const itemY = tableTop + 25;
      doc
        .font("Helvetica")
        .text(
          billing
            ? `Invoice ${billing.invoiceNumber} - ${billing.task?.title || "Services"}`
            : "General Payment",
          50,
          itemY,
          { width: 300 },
        )
        .text(`₹${payment.amount.toFixed(2)}`, 400, itemY, {
          width: 100,
          align: "right",
        });

      doc.moveDown(3);

      // Total
      const totalY = doc.y;
      doc.moveTo(350, totalY).lineTo(500, totalY).stroke();

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("TOTAL PAID:", 350, totalY + 10)
        .text(`₹${payment.amount.toFixed(2)}`, 400, totalY + 10, {
          width: 100,
          align: "right",
        });

      doc.moveDown(4);

      // Footer
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Thank you for your payment!", { align: "center" })
        .moveDown(0.5)
        .fontSize(8)
        .text(
          "This is a computer-generated receipt and does not require a signature.",
          {
            align: "center",
            color: "gray",
          },
        );

      // Finalize PDF
      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateReceipt };
