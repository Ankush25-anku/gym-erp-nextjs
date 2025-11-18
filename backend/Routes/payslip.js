// routes/payslip.js
const express = require("express");
const router = express.Router();
const verifyClerkToken = require("../middleware/verifyClerkToken");
const StaffSalaryAssignment = require("../models/StaffSalaryAssignment");
const StaffMonthlySalary = require("../models/StaffMonthlySalary"); // ⭐ ADDED
const puppeteer = require("puppeteer");

router.get(
  "/payslip/:email/:year/:month",
  verifyClerkToken,
  async (req, res) => {
    console.log("→ /payslip called", req.params);

    try {
      const { email, year, month } = req.params;
      const staffEmail = email.toLowerCase();

      // ------------------------------
      // 1) LOAD SALARY ASSIGNMENT
      // ------------------------------
      const salary = await StaffSalaryAssignment.findOne({
        staffEmail,
      }).lean();

      if (!salary) {
        return res.status(404).json({ message: "Salary not found" });
      }

      // ------------------------------
      // 2) LOAD MONTHLY SUMMARY (MAIN SOURCE)
      // ------------------------------
      const monthly = await StaffMonthlySalary.findOne({
        staffEmail,
        year: Number(year),
        month: Number(month),
      }).lean();

      // ------------------------------
      // 3) EXTRACT VALUES FROM SUMMARY
      // ------------------------------
      let absent = 0;
      let present = 0;
      let leave = 0;
      let halfDay = 0;
      let casualLeave = 0;
      let sickLeave = 0;
      let grossSalary = Number(salary.totalAmount || 0);
      let deducted = "0.00";
      let netSalary = grossSalary.toFixed(2);

      if (monthly) {
        absent = monthly.absent || 0;
        present = monthly.present || 0;
        leave = monthly.leave || 0;
        halfDay = monthly.halfDay || 0;
        casualLeave = monthly.casualLeave || 0;
        sickLeave = monthly.sickLeave || 0;

        grossSalary = monthly.grossSalary || grossSalary;
        deducted = Number(monthly.deducted || 0).toFixed(2);
        netSalary = Number(monthly.netSalary || grossSalary).toFixed(2);

        console.log("✓ Monthly summary found. Using stored values.");
      } else {
        console.log("⚠ No monthly summary → fallback to basic calculation");

        // fallback logic
        const perDay = grossSalary / 30;
        deducted = (perDay * absent).toFixed(2);
        netSalary = (grossSalary - Number(deducted)).toFixed(2);
      }

      // ------------------------------
      // 4) GENERATE HTML
      // ------------------------------
      const html = `
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: Arial; padding: 40px; color: #111 }
          .right { text-align:right; }
          .top { display:flex; justify-content:space-between; margin-top:18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #e6e6e6; padding: 12px; font-size: 13px; }
          th { background: #f5f5f5; }
          .totals { width: 320px; float:right; margin-top: 20px; font-size: 14px; }
          .row { display:flex; justify-content:space-between; padding: 4px 0; }
        </style>
      </head>

      <body>

       <div style="text-align:center; margin-bottom:20px;">
  <div style="font-size:28px; font-weight:700;">Payslip</div>
  <div style="font-size:14px; margin-top:4px;">TXN-0001</div>
  <div style="font-size:14px; margin-top:4px;">
    ${new Date(year, month - 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    })}
  </div>
</div>


        <div class="top">
          <div>
            <strong>Invoice From</strong><br/>
            Your Gym Name Pvt Ltd<br/>
            Address: 123 Fitness Street, MG Road<br/>
            Bengaluru, Karnataka - 560001<br/>
            Bank: HDFC Bank<br/>
            A/C: 987654321012<br/>
            IFSC: HDFC0009876<br/>
            Branch: MG Road, Bengaluru
          </div>

          <div>
            <strong>Invoice To</strong><br/>
            ${salary.fullName}<br/>
            ${salary.role}
          </div>
        </div>

        <h3>Payslip Details</h3>

        <table>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th class="right">Amount</th>
          </tr>

          ${salary.salaryDetails
            .map(
              (it, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${it.salaryCategory}</td>
                  <td class="right">₹${Number(it.amount).toLocaleString()}</td>
                </tr>`
            )
            .join("")}
        </table>

        <div class="totals">
          <div class="row"><div>Present</div><div class="right">${present}</div></div>
          <div class="row"><div>Absent</div><div class="right">${absent}</div></div>
          <div class="row"><div>Leave</div><div class="right">${leave}</div></div>
          <div class="row"><div>Half Day</div><div class="right">${halfDay}</div></div>
          <div class="row"><div>Casual Leave</div><div class="right">${casualLeave}</div></div>
          <div class="row"><div>Sick Leave</div><div class="right">${sickLeave}</div></div>

          <hr/>

          <div class="row"><div>Gross Salary</div><div class="right">₹${grossSalary.toLocaleString()}</div></div>
          <div class="row"><div>Deducted</div><div class="right">₹${deducted}</div></div>
          <div class="row"><div>Net Salary</div><div class="right"><strong>₹${Number(
            netSalary
          ).toLocaleString()}</strong></div></div>
        </div>

      </body>
      </html>
    `;

      // ------------------------------
      // 5) GENERATE PDF
      // ------------------------------
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      await browser.close();

      // ------------------------------
      // 6) SEND RESPONSE
      // ------------------------------
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="Payslip_${salary.fullName}.pdf"`
      );

      res.write(pdfBuffer);
      return res.end();
    } catch (err) {
      console.error("Payslip Error:", err);
      return res
        .status(500)
        .json({ error: "Error generating PDF", detail: String(err) });
    }
  }
);

module.exports = router;
