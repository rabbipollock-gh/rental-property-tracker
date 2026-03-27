# Phase 10: Advanced Reporting & Tenant UX

Based on your feedback, we're expanding the Multi-Property architecture to fully support granular reporting and smoother data-entry workflows.

## 1. Advanced Portfolio Reporting (`Reports.tsx`)
Currently, the "Generate Report" tab aggregates the entire application's data. We will integrate the **Property Picker** into the Reports page. 
* By default, it will show "Entire Portfolio". 
* When a specific building is selected, the Profit/Loss statement, Income Breakdown, and Expense tables will instantly filter to only include data originating from `MonthRecord` ledgers and `Global Expenses` tied to that specific building.
* PDF Generation will dynamically update its header to display the filtered Building Name instead of a generic title.

## 2. Dynamic Co-Tenant Management
Instead of just static text fields, the Tenant profiles inside `TenantsTab` will feature an **"Add Co-Tenant"** button. This will dynamically spawn additional linked contact fields (Name, Email, Phone), allowing a single primary Lease to hold multiple legally responsible parties, ensuring automated emails and SMS broadcasts reach all adult occupants.

## 3. Inline Tenant Creation for Leases
Currently, establishing a Lease requires switching to the Tenants tab to create the profile first. We will add a **"Create New Tenant"** button directly inside the "New Lease" modal. This will open a sub-form allowing you to define the Tenant and instantly bind them to the Lease without losing your place.

## 4. Individual Dashboard Stats
*(Note on feedback: The Dashboard **already** supports individual property stats! We added a "Property Dropdown" in the top right during Phase 8. When you select a specific building, all the massive Stat Boxes — Total Outstanding, Total Collected, Cash Flow, and the Chart — dynamically recalculate for just that building. Let me know if you'd like it made more visually prominent!)*

---

### Verification Plan
1. **Automated Validation:** Test the `Reports.tsx` reducer functions to ensure that changing the property dropdown accurately excludes out-of-bounds expenses and leases.
2. **UX Testing:** Verify the "Create New Tenant" sub-form successfully creates a global Tenant record and immediately selects them in the Lease dropdown.

---

# Phase 11: Data Management & Testing Tools

To keep the primary Dashboards clean and provide a better testing environment:

## 1. Per-Property CSV Import
We will remove the "Import CSV" button from the main Dashboard view and relocate it inside the **Properties Tab** as a per-property command. This allows you to securely upload ledgers mapped precisely to specific real estate instances without cross-contamination. 
We will also provide a **"Download CSV Template"** button right next to the uploader so you know exactly how to structure your payload.

## 2. Global Reset Sandbox
For testing workflows, we will add a **"Hard Reset"** button within the same **Settings > Data Management** view. Clicking this (after confirming a warning prompt) will:
* Completely clear all Local Storage data.
* Wipe the `app_data` state in Supabase back to the empty default schema.
* Instantly refresh the application to a pristine, untouched state so you can re-test workflows safely.

---

# Strategic Goal: The Zero-Cost Architecture Pipeline

*As your technical consultant, one of the most important aspects of scaling a SaaS is managing overhead. The entire blueprint below is strictly tailored to a **"Free-Tier First"** architecture. You will incur **$0 in monthly fixed costs** during the initial build phase, and we will only employ pay-as-you-go APIs when your revenue justifies it.*

- **Database & Auth (Supabase):** Free for up to 50,000 monthly active users.
- **Hosting (Vercel):** 100% Free deployment.
- **Emails (Resend API):** Free for the first 3,000 emails per month.
- **E-Signatures (Internal vs DocuSign):** DocuSign's API is incredibly expensive (up to $2 per lease). Instead, we will build a *Free Internal E-Signature* utilizing open-source PDF rendering (`pdf-lib`), capturing the tenant's digital signature directly in your app.
- **Background Checks (TransUnion):** Automated API integration where the *Applicant* pays the $40 fee directly, costing you $0.
- **Bank Sync (Plaid):** Plaid charges per linked account. As a free alternative, we will prioritize building an intelligent "Bank CSV Uploader" where AI instantly maps your downloaded bank statement without API fees.  

---

# Phase 12: Tenant Portal Integration (Planning)

To transform the platform into a two-sided marketplace, we will build a secure, invite-only **Tenant Portal** that reads from and writes to your core management backend.

## 1. Authentication & Mobile-First UX
- **Mobile PWA Design:** The Tenant Portal will be built as a Progressive Web App (PWA) with a native-feeling "Bottom Tab Navigator" (Home | Chat | Repairs | Pay) specifically optimized for iPhones and Androids.
- **Magic Link Invitations:** The property manager can trigger an "Invite to Portal" email from the `Tenants` tab.
- **Secure Authentication:** Tenants will log in using Supabase Auth (Email/Password or Magic Links) tied strictly to their registered email. 
- **Row Level Security (RLS):** Strict database policies will ensure a logged-in tenant can *only* query Ledgers, Leases, and Documents where their `tenantId` is explicitly linked.

## 2. Dashboard & Financial Ledgers
- **Account Summary:** A top-level component showing "Current Balance Due", "Next Rent Due Date", and "Active Lease Term".
- **Financial History:** A read-only view of their individual property ledger showing posted Rent, Payments they've made, Late Fees, and any Adjustments.
- **Online Payments (Optional Expansion):** Integration with a payment processor (like Stripe) allowing tenants to initiate ACH/Credit Card payments directly into the property manager's account, automatically creating a `Payment` record in the backend.

## 3. Communication & Maintenance Hub
- **Direct Messaging System:** A chat or thread interface allowing tenants to send inquiries to the property manager. New messages will trigger an automatic email notification to the manager.
- **Maintenance Ticketing:** A form where tenants can submit repair requests. They can select an issue category (Plumbing, Electrical, General), provide a description, and **upload photos** (stored in Supabase Storage).
- **"Pizza-Tracker" Statuses:** Instead of boring text, the portal will display their maintenance requests with a visual, stepped progress timeline (Submitted ➔ Approved ➔ Parts Ordered ➔ Vendor Scheduled ➔ Completed) to reduce tenant follow-up anxiety.

## 4. Document Vault
- **Shared Documents:** Tenants will have read-only access to a filtered view of the `Documents` table. Handled via Supabase RLS, they will only see files specifically tagged with their `tenantId` or `propertyId` (e.g., Lease Agreements, Move-In Checklists, Welcome Packets).
- **Automated Statements:** Since the portal is synced to the database, statements and ledgers can be viewed directly online without the landlord needing to manually email PDFs each month.

---

# Phase 13: SMS & Omnichannel Communications (Planning)

Email is great, but texts get read instantly. We will integrate **Twilio API** to handle two-way SMS communication directly from the app. *(Note: Twilio is pay-as-you-go and costs approximately $0.007 per text. If keeping costs at strict zero is preferred, we will instead build free native Push Notifications directly into the Tenant PWA).*
- **Automated Text Alerts:** When Phase 15 (Late Fees) triggers, the system doesn't just email a notice—it fires off an SMS: *"Hi [Name], your rent for [Property] is past due. A late fee has been applied."*
- **Mass Broadcasting:** Need to tell an entire building that the water is being shut off for 2 hours? Select the `Property`, type one message, and click "Broadcast." The system texts every Active Tenant in that building simultaneously.
- **Two-Way SMS Inbox:** When a tenant replies to those automated texts via SMS, the Twilio webhook routes their reply straight back into the `Tenant Portal` messaging thread on your Dashboard, keeping all maintenance strings and rent negotiations legally documented in one single system.

---

# Phase 14: Multi-Tenant SaaS Scaling (Planning)

To turn this application into a true web product where **multiple independent property managers** can sign up and use the platform without seeing each other's data, we need a SaaS architecture.

While running separate Docker containers for every single customer is one approach (Single-Tenant), it is exceptionally expensive and difficult to maintain. Because we are using **Supabase (PostgreSQL)**, we can achieve military-grade data isolation within a single database using **Row Level Security (RLS)**.

## 1. The RLS Isolation Strategy
- Instead of separate containers, every single table in our database (`Properties`, `Tenants`, `Leases`, `Ledgers`, `Documents`) will get a new column: `owner_id`.
- **Row Level Security Policies** operate at the lowest possible database level. We will write a rule that says: `Only allow read/write if auth.uid() == owner_id`.
- If "Landlord A" queries the `Properties` table, Postgres physically intercepts the query and *only* returns rows where `owner_id` matches Landlord A's secure authentication token. It is impossible for them to accidentally query Landlord B's data, even if they bypassed the frontend React code.

## 2. User Roles & Conversational Registration
We will need to distinguish between multiple types of logins:
- **Managers / Owners:** Users who register proactively. Instead of dumping them into an empty app, we will build a **Conversational Onboarding Wizard**. A beautifully animated modal guides them to "Create your first Building," "Add your first Unit," and "Invite your first Tenant," celebrating each milestone.
- **Tenants:** Users who are *invited* by a Manager. A tenant's login restricts them to viewing data where `tenantId` matches their profile, acting as a secondary constrained view into the Manager's data.

## 3. Deployment & Cloud Hosting
- **Frontend Container:** The React app is compiled into static HTML/JS and hosted on a global CDN (like Vercel). All owners load the exact same website.
- **Backend Container:** Supabase handles the database scaling automatically. As thousands of landlords sign up, Supabase manages the connection pooling and database read/write speeds, isolating everyone gracefully via the RLS policies defined in step 1.

## 4. White-Labeled Custom Domains
To make the platform truly professional, landlords will not be forced to use generic Gmail App Passwords. We will integrate a DNS verification flow allowing them to connect their **Custom Domains** (e.g., `rent@smithproperties.com`). All automated PDF statements, late fee warnings, and Magic Link portal invites will be cryptographically signed (DKIM/SPF) and sent directly from their branded domain via the Resend API.

---

# Phase 15: Bank Synchronization & Enterprise Security (Planning)

If you intend to bring on hundreds of landlords or manage thousands of units, manual data entry (and even CSV imports) won't be enough. The final evolution of the product requires live banking integration and enterprise-grade security.

## 1. Automated Bank Synchronization 
To completely automate the general ledger, we will use a hybrid approach to save on Plaid API fees: 
- **The Free Path (AI CSV Mapping):** Landlords securely upload the raw CSV export from their bank. The system uses an LLM to read the incoming bank data (e.g., "Home Depot", "Zelle from John") and **automatically categorize** it as an Expense (Maintenance) or Income (Rent). 
- **The Premium Path (Plaid Integration):** Once scale justifies the API cost, we will activate the absolute live Plaid widget, where Webhooks automatically push those same matches into the Approval Queue instantly.
- **Approval Queue:** All AI suggestions go to a "Review" tab. The landlord can instantly approve correct categorizations, or manually override/edit the ones the AI got wrong before they are finalized in the ledger.

## 2. Enterprise Security & Data Recovery
To handle real financial data and legally binding leases at scale, we must guarantee security and data safety:
- **Soft-Deletion & Data Restoration:** Instead of permanently deleting records from the database, the system will use a `deleted_at` timestamp. This provides the Platform Admin (and the Landlords) a "Recycle Bin" where accidentally deleted properties, leases, or ledgers can be instantly restored in one click. 
- **Point-in-Time Recovery (PITR):** The core Supabase database will be backed up daily, allowing global restoration in the event of catastrophic failure.
- **Multi-Factor Authentication (MFA):** Supabase Auth has built-in support for Two-Factor Auth (Authenticator Apps). We will enforce this for all Landlord/Owner accounts to protect their financial data from credential stuffing.
- **Role-Based Access Control (RBAC):** As portfolios grow, a Landlord might want to invite their Accountant or a Junior Property Manager to their workspace. We will build a new `Roles` table (`admin`, `manager`, `read_only`) ensuring an accountant can generate reports but cannot delete a property or alter a lease.
- **Encrypted-at-Rest:** All sensitive PII (like Tenant SSNs, Bank Account Routing Numbers if stored) must be encrypted using Supabase Vault before being saved to the Postgres tables, ensuring that even a database administrator cannot read them in plain text.
- **Audit Logging:** Every critical action (Deleting a Lease, Logging a zero-dollar rent payment, Wiping a Ledger) will write an immutable record to an `Audit_Logs` table, creating a paper trail of exactly *who* did *what* and *when*.

---

# Phase 16: Automated Enforcement & Late Fees (Planning)

If you have 50 leases, manually checking who paid on the 5th of the month is exhausting.
- **Cron Job Late Fees:** A nightly Supabase Edge Function runs at midnight. It checks every active lease. If `current_date > grace_period_end` and the tenant's `balance > 0`, it instantly injects a `Late Fee` record into their ledger and emails them a standardized notice.
- **Legal Notice Generation:** If rent remains unpaid by the 10th, the system can automatically generate a state-compliant "Notice to Cure or Quit" PDF populated with the exact deficit and their signature lines, saving you from drafting legal docs.

---

# Phase 17: Vendor & Maintenance Automation (Planning)

When dealing with high-volume properties, managing the repair lifecycle is just as important as the financials.
- **Vendor Directory:** A CRM database specifically for your Plumbers, Electricians, and HOA contacts, mapped to the properties they service.
- **Automated Work Orders:** When a tenant submits a repair request with a photo in the Tenant Portal, you can click "Dispatch." The system automatically emails the linked Vendor a formatted PDF Work Order detailing the entry instructions, unit, and the tenant's photos.
- **AI Invoice OCR:** When the vendor emails you the final invoice, you forward it to a custom application email address. An AI edge function reads the PDF, extracts the total, and automatically drafts an `Expense` record in that specific property's ledger for you to just click "Approve."

---

# Phase 18: Tax Filings & Investor Portals (Planning)

For syndicators and maximum tax efficiency.
- **IRS Schedule E Mapping:** We will map your entire Expense Category list (Maintenance, Property Management, Utilities) directly to the standard IRS **Schedule E Tax Form**. At the end of the year, you click one button to generate the exact spreadsheet your CPA needs.
- **Investor Dashboards:** If you manage properties for *other* people, they require transparency. Similar to the Tenant Portal, we will build an **Investor Portal**. Investors log in to see read-only, high-level analytics (Cash-on-Cash Return, Net Operating Income, and CapEx) for the specific buildings they own shares in, completely shielding them from tenant drama and edit-rights.

---

# Phase 19: The "Pre-Move-In" Leasing Funnel (Consultant Audit Addition)

*As an outside consultant auditing the architecture, the system is flawless at "Post-Move-In" management. However, there is a missing top-of-funnel workflow. To be a complete suite, landlords need tools to acquire tenants.*

- **Public Application Pages:** Generates a secure, public URL for available units (e.g., `proptrack.com/apply/123-main-st`). Prospective tenants land here to fill out their application and pay a standard $40 application fee directly via Stripe.
- **Automated Background Checks:** Direct API integration with TransUnion SmartMove. As soon as the prospect hits "Submit," the landlord instantly receives their credit score, criminal background, and eviction history inside the app. *(Zero cost to landlord: TransUnion charges the applicant's credit card directly).*
- **Internal Zero-Cost E-Signatures:** Instead of paying high API fees for DocuSign, once a tenant is approved, our system takes the standard Lease terms, merges them into an internal PDF template, and securely routes it to the prospect's Portal for a legally binding E-Signature. Once signed, the system *automatically* creates the Active Lease contract in the backend.
