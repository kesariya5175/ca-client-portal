// Master list of CA services for small Indian CA firms
// Grouped by category, each with a standard document checklist

export const CA_SERVICES = [
  {
    category: 'Income Tax',
    services: [
      {
        name: 'ITR Filing - Individual (Salary)',
        documents: [
          'Form 16 (from Employer)',
          'Bank Statements (Apr–Mar, all accounts)',
          'PAN Card & Aadhaar Card',
          'Form 26AS / AIS / TIS',
          'Investment Proofs (80C: LIC, PPF, ELSS, etc.)',
          'Home Loan Interest Certificate (if applicable)',
          'Rent Receipts / Rental Agreement (for HRA)',
          'Health Insurance Premium Receipt (80D)',
          'NPS Contribution Statement (80CCD)',
          'Other Income Proofs (FD Interest, Dividend, etc.)',
          'Previous Year ITR Copy',
        ],
      },
      {
        name: 'ITR Filing - Individual (Business / Profession)',
        documents: [
          'PAN Card & Aadhaar Card',
          'Bank Statements (all accounts, Apr–Mar)',
          'Sales / Revenue Register',
          'Purchase & Expense Bills',
          'GST Returns (if registered)',
          'Fixed Asset Details',
          'Outstanding Debtors & Creditors List',
          'P&L Statement (if maintained)',
          'Balance Sheet (if maintained)',
          'Loan Details with Interest Certificate',
          'Investment Proofs (for deductions)',
          'Previous Year ITR Copy',
        ],
      },
      {
        name: 'ITR Filing - Company / Firm / LLP',
        documents: [
          'Audited Financial Statements (P&L + Balance Sheet)',
          'Tax Audit Report (Form 3CB / 3CD) if applicable',
          'Bank Statements (all accounts)',
          'GST Returns (annual reconciliation)',
          'TDS Certificates (Form 16A)',
          'Director / Partner PAN & Aadhaar',
          'Fixed Asset Register',
          'Share Capital Details (for companies)',
          'Minutes of AGM / Board Meeting',
          'Previous Year ITR Copy',
        ],
      },
      {
        name: 'ITR Filing - HUF',
        documents: [
          'PAN Card of HUF & Karta',
          'Aadhaar of Karta',
          'Bank Statements (HUF account, Apr–Mar)',
          'Income Proof (Rent, Business, Investments)',
          'Investment Proofs (80C, 80D)',
          'Form 26AS of HUF',
          'Previous Year ITR Copy',
        ],
      },
      {
        name: 'Tax Audit (Sec 44AB)',
        documents: [
          'Financial Statements (P&L + Balance Sheet)',
          'Bank Statements (all accounts)',
          'GST Returns (all months)',
          'TDS Returns & Certificates',
          'Fixed Asset Register',
          'Loans & Advances Details',
          'Closing Stock Valuation',
          'Debtors & Creditors List',
          'Cash Book',
          'Form 3CA / 3CB / 3CD Working Data',
        ],
      },
      {
        name: 'Capital Gains Computation',
        documents: [
          'Purchase Deed / Cost of Acquisition',
          'Sale Deed / Sale Consideration',
          'Improvement Cost Details',
          'Brokerage / Transfer Expense Bills',
          'Indexed Cost Calculation (if LTCG)',
          '54 / 54F Exemption Proof (if reinvesting)',
          'Demat Account Statement (for shares/MF)',
          'PAN Card',
        ],
      },
      {
        name: 'Income Tax Notice Reply',
        documents: [
          'Copy of Notice Received',
          'Relevant ITR & Acknowledgement',
          'Form 26AS / AIS of Relevant Year',
          'Supporting Documents as per Notice',
          'Previous Correspondence (if any)',
          'Bank Statements (relevant period)',
        ],
      },
      {
        name: '15CA / 15CB Certificate',
        documents: [
          'Invoice / Agreement for Foreign Payment',
          'PAN & TAN of Remitter',
          'FEMA Purpose Code',
          'Bank SWIFT Details',
          'CA Certificate (Form 15CB) — for applicable cases',
          'Tax Residency Certificate of Recipient (if DTAA benefit)',
        ],
      },
    ],
  },
  {
    category: 'TDS Compliance',
    services: [
      {
        name: 'TDS Return - 24Q (Salary)',
        documents: [
          'Salary Register / Salary Slips',
          'TDS Challan Details (BSR Code, Date, Amount, Serial No.)',
          'PAN of All Employees',
          'Investment Declarations / Proofs (Form 12BB)',
          'Previous Quarter Acknowledgement',
          'Quarterly Payroll Summary',
        ],
      },
      {
        name: 'TDS Return - 26Q (Non-Salary)',
        documents: [
          'TDS Challan Details (BSR Code, Date, Amount, Serial No.)',
          'PAN of All Deductees',
          'Nature of Payment (Section-wise breakup)',
          'Amount Paid & TDS Deducted Details',
          'Previous Quarter TDS Return Acknowledgement',
        ],
      },
      {
        name: 'TDS Return - 27Q (NRI Payments)',
        documents: [
          'TDS Challan Details',
          'PAN of NRI Deductee (if obtained)',
          'Payment Details (Amount, Currency, Country)',
          'DTAA Benefit Details (if applicable)',
          'Form 15CA / 15CB (if applicable)',
        ],
      },
      {
        name: 'Form 16 / 16A Generation',
        documents: [
          'Processed TDS Returns (24Q / 26Q)',
          'TRACES Login Credentials',
          'List of Employees / Deductees requiring Form 16 / 16A',
          'Challan Status Confirmation',
        ],
      },
      {
        name: 'Lower TDS Certificate (Sec 197)',
        documents: [
          'PAN Card',
          'Previous 3 Years ITR',
          'Previous 3 Years Financial Statements',
          'Estimated Current Year Income & Tax',
          'Form 13 Application Details',
          'Justification for Lower Deduction',
        ],
      },
    ],
  },
  {
    category: 'GST',
    services: [
      {
        name: 'GST Registration',
        documents: [
          'PAN Card of Business / Proprietor',
          'Aadhaar Card of Proprietor / Authorised Signatory',
          'Passport Photo of Proprietor / Director',
          'Proof of Business Address (Electricity Bill / Rent Agreement)',
          'NOC from Owner (if rented)',
          'Bank Account Details (Cancelled Cheque / Statement)',
          'Business Registration Proof (if applicable)',
          'Digital Signature Certificate (for companies)',
        ],
      },
      {
        name: 'GST Monthly Return (GSTR-1 + GSTR-3B)',
        documents: [
          'Sales Register (HSN / SAC wise)',
          'Purchase Register with GSTIN of Suppliers',
          'B2B Invoice Details',
          'B2C Invoice Summary',
          'Credit Notes / Debit Notes',
          'E-way Bill Details (if applicable)',
          'GSTR-2B (ITC Available)',
          'Tax Payment Challan (previous month if unpaid)',
          'RCM Liability Details',
        ],
      },
      {
        name: 'GST Quarterly Return (QRMP Scheme)',
        documents: [
          'Quarterly Sales Register',
          'Quarterly Purchase Register',
          'GSTR-2B for the Quarter',
          'IFF (Invoice Furnishing Facility) Details — M1 & M2',
          'Tax Payment Challans (PMT-06)',
          'RCM Liability Details',
        ],
      },
      {
        name: 'GST Annual Return (GSTR-9)',
        documents: [
          'All Monthly / Quarterly Returns Filed (GSTR-1, 3B)',
          'Annual Sales Register',
          'Annual Purchase Register',
          'ITC Ledger Summary',
          'Tax Payment Summary',
          'HSN Summary of Outward Supplies',
          'Previous Year GSTR-9 (for comparison)',
          'Audited Financial Statements',
        ],
      },
      {
        name: 'GST Audit (GSTR-9C)',
        documents: [
          'Audited Financial Statements',
          'Annual GSTR-9 Filed',
          'GST Reconciliation Statement',
          'CA Certificate (Form GSTR-9C)',
          'All GST Returns for the Year',
          'ITC Reversal Details',
        ],
      },
      {
        name: 'GST Notice Reply',
        documents: [
          'Copy of GST Notice',
          'Relevant GST Returns',
          'Supporting Documents as per Notice',
          'Tax Payment Details (if demand)',
          'Previous GST Correspondence',
        ],
      },
      {
        name: 'GST Cancellation / Amendment',
        documents: [
          'GST Registration Certificate',
          'Reason for Cancellation / Amendment',
          'Final GST Return (GSTR-10) Details',
          'Stock on Date of Cancellation',
          'Outstanding Liability Details',
        ],
      },
    ],
  },
  {
    category: 'Company / ROC Compliance',
    services: [
      {
        name: 'Company Registration (Pvt Ltd)',
        documents: [
          'PAN Card of All Proposed Directors',
          'Aadhaar Card of All Proposed Directors',
          'Passport Photos of Directors',
          'Address Proof of Directors (Bank Statement / Electricity Bill)',
          'Proof of Registered Office (Electricity Bill)',
          'NOC from Property Owner',
          'Draft Memorandum of Association (MoA)',
          'Draft Articles of Association (AoA)',
          'Email IDs & Mobile Numbers of Directors',
          'DSC (Digital Signature Certificate) of Directors',
          'No. of Shares & Share Capital Proposed',
        ],
      },
      {
        name: 'LLP Registration',
        documents: [
          'PAN Card of All Designated Partners',
          'Aadhaar of All Designated Partners',
          'Passport Photos',
          'Address Proof of Partners',
          'Proof of Registered Office',
          'NOC from Property Owner',
          'LLP Agreement Draft',
          'DSC of Designated Partners',
          'Contribution Amount by Each Partner',
        ],
      },
      {
        name: 'Partnership Firm Registration',
        documents: [
          'PAN Card of All Partners',
          'Aadhaar of All Partners',
          'Partnership Deed (Draft)',
          'Proof of Business Address',
          'Passport Photos of Partners',
          'Capital Contribution by Each Partner',
        ],
      },
      {
        name: 'ROC Annual Filing (AOC-4 + MGT-7)',
        documents: [
          'Audited Financial Statements (P&L + Balance Sheet)',
          'Board Meeting Minutes (all 4 meetings)',
          'AGM Notice & Minutes',
          'Director\'s Report',
          'Auditor\'s Report',
          'Shareholders List',
          'Director List (changes if any)',
          'Company PAN & CIN',
          'Annual Return Working (MGT-7)',
          'Previous Year Filed Returns',
        ],
      },
      {
        name: 'Director DIN / DSC / KYC',
        documents: [
          'PAN Card of Director',
          'Aadhaar Card of Director',
          'Passport Photo',
          'Email ID & Mobile Number',
          'Address Proof',
          'Bank Statement (for KYC verification)',
        ],
      },
      {
        name: 'Company Name Change / Registered Office Change',
        documents: [
          'Board Resolution for the Change',
          'Shareholders Resolution (if required)',
          'Form INC-24 (Name Change) / INC-22 / INC-22A',
          'New Address Proof (for office change)',
          'NOC from New Property Owner',
          'Updated MOA/AOA (for name change)',
        ],
      },
    ],
  },
  {
    category: 'Registrations',
    services: [
      {
        name: 'MSME / Udyam Registration',
        documents: [
          'Aadhaar Card of Proprietor / Director',
          'PAN Card',
          'Bank Account Details',
          'Business Address Proof',
          'NIC Code (Business Activity)',
          'Investment in Plant & Machinery / Turnover Details',
        ],
      },
      {
        name: 'Shop & Establishment Registration',
        documents: [
          'PAN Card of Owner',
          'Aadhaar Card of Owner',
          'Passport Photo',
          'Business Address Proof',
          'Nature of Business',
          'Number of Employees',
        ],
      },
      {
        name: 'Import Export Code (IEC)',
        documents: [
          'PAN Card',
          'Aadhaar / Passport of Proprietor / Director',
          'Bank Certificate / Cancelled Cheque',
          'Business Address Proof',
          'Digital Photo',
        ],
      },
      {
        name: 'FSSAI Registration / License',
        documents: [
          'PAN Card',
          'Aadhaar Card',
          'Passport Photo',
          'Business Address Proof',
          'Type of Food Business Description',
          'List of Food Products',
          'Blueprint / Layout of Premises (for State/Central License)',
          'NOC from Local Body',
        ],
      },
      {
        name: 'Professional Tax Registration',
        documents: [
          'PAN Card of Firm / Company',
          'Certificate of Incorporation / GST Certificate',
          'Address Proof of Business',
          'List of Employees with Salaries',
          'Bank Account Details',
        ],
      },
      {
        name: 'PF / ESI Registration',
        documents: [
          'PAN Card of Establishment',
          'Business Registration Certificate',
          'Address Proof',
          'List of Employees with Date of Joining',
          'Salary Details',
          'Bank Account Details',
          'Digital Signature of Authorised Signatory',
        ],
      },
    ],
  },
  {
    category: 'Accounting & Audit',
    services: [
      {
        name: 'Bookkeeping (Monthly)',
        documents: [
          'Bank Statements (all accounts)',
          'Sales Bills / Invoices',
          'Purchase Bills & Vouchers',
          'Cash Receipts & Payment Vouchers',
          'Bank Reconciliation (previous month)',
          'Payroll Summary (if applicable)',
          'GST Input / Output Summary',
        ],
      },
      {
        name: 'Bookkeeping (Quarterly)',
        documents: [
          'Bank Statements (all 3 months)',
          'Sales Invoices (Quarter)',
          'Purchase Bills (Quarter)',
          'Cash Vouchers (Quarter)',
          'Payroll Summary (Quarter)',
          'GST Returns Filed',
          'Previous Quarter Closing Balances',
        ],
      },
      {
        name: 'Payroll Processing',
        documents: [
          'Attendance Register / Leave Record',
          'Salary Structure of Employees',
          'Bank Account Details of Employees',
          'PAN & Aadhaar of New Employees',
          'Investment Declarations (Form 12BB) for TDS',
          'Previous Month Salary Statement',
          'PF / ESI Contribution Rates',
        ],
      },
      {
        name: 'Statutory Audit',
        documents: [
          'Financial Statements (Draft P&L + Balance Sheet)',
          'Books of Accounts / Ledgers',
          'Bank Statements & Reconciliation',
          'Fixed Asset Register',
          'Stock Register & Valuation Report',
          'Debtors & Creditors Confirmation',
          'GST & TDS Returns',
          'Loan Agreements & Sanction Letters',
          'Directors\' Report Draft',
          'Board Meeting Minutes',
        ],
      },
      {
        name: 'Internal Audit',
        documents: [
          'Internal Policies & Procedures',
          'Expense Vouchers & Approvals',
          'Bank Reconciliation Statements',
          'Purchase Orders & GRN',
          'Sales Orders & Delivery Notes',
          'Payroll Records',
          'Fixed Asset Physical Verification Report',
          'Previous Audit Report (if any)',
        ],
      },
      {
        name: 'Stock Audit',
        documents: [
          'Stock Register',
          'Physical Stock Count Sheet',
          'Purchase Register & GRN',
          'Sales Register & Delivery Notes',
          'Slow-Moving / Non-Moving Stock List',
          'Warehouse / Storage Layout',
          'Valuation Method Details (FIFO / LIFO / Avg)',
        ],
      },
      {
        name: 'CMA Data / Project Report',
        documents: [
          'Last 3 Years Audited Financial Statements',
          'Current Year P&L Projections',
          'Projected Balance Sheet (3-5 years)',
          'Business Plan / Project Details',
          'Market Research / Industry Data',
          'Promoter Background & Experience',
          'Loan Requirement & End-Use Details',
          'Collateral / Security Details',
          'Bank Statements (last 12 months)',
        ],
      },
      {
        name: 'Net Worth Certificate',
        documents: [
          'PAN Card',
          'Bank Statements (last 6-12 months)',
          'Fixed Deposit / Investment Statements',
          'Property Documents (if applicable)',
          'Vehicle Registration Certificate (if applicable)',
          'Loan Outstanding Details',
          'Latest ITR Copy',
        ],
      },
    ],
  },
]

// ── Helper utilities ────────────────────────────────────────────

/** Returns a flat list of all service names */
export function getAllServiceNames() {
  return CA_SERVICES.flatMap(cat => cat.services.map(s => s.name))
}

/** Returns standard documents for a given service name */
export function getServiceDocuments(serviceName) {
  for (const cat of CA_SERVICES) {
    const svc = cat.services.find(s => s.name === serviceName)
    if (svc) return svc.documents
  }
  return []
}

/** Returns the category for a given service name */
export function getServiceCategory(serviceName) {
  for (const cat of CA_SERVICES) {
    const svc = cat.services.find(s => s.name === serviceName)
    if (svc) return cat.category
  }
  return 'Other'
}

/** Returns financial year options (current + last 3) */
export function getFinancialYears() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentYear = now.getFullYear()
  // FY starts April (month 4). If before April, current FY is previous year
  const fyStart = currentMonth >= 4 ? currentYear : currentYear - 1
  return [
    `FY ${fyStart}-${String(fyStart + 1).slice(2)}`,
    `FY ${fyStart - 1}-${String(fyStart).slice(2)}`,
    `FY ${fyStart - 2}-${String(fyStart - 1).slice(2)}`,
    `FY ${fyStart - 3}-${String(fyStart - 2).slice(2)}`,
  ]
}
