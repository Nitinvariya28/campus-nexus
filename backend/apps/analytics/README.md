# AlumiBridge Backend — Analytics Engine & Data Seeding Documentation

> **App Directory:** `backend/apps/analytics/`  
> **API Base Route:** `/api/analytics/`  
> **Primary Gateway Endpoint:** `GET /api/analytics/dashboard/?view=<view_name>`  
> **Supported Views:** `common` (Overview), `student` (Student Hub), `alumni` (Alumni Network), `placement_cell` (Placement Cell)  
> **Authentication Requirement:** `IsAuthenticated` (Bearer JWT Token)

---

## 1. Architectural Strategy & Design

The Analytics module aggregates institutional data across students, alumni, departments, recruiters, and placement drives to power real-time dashboards for university administrators, placement officers, students, and alumni.

### Key Architectural Guidelines:
1. **Unified Gateway Architecture:**
   - Single gateway endpoint: `GET /api/analytics/dashboard/`
   - Accepts URL query parameter `view` (`common`, `student`, `alumni`, `placement_cell`).
   - Accepts contextual filter parameters (e.g. `year`, `department`, `batch`, `offer_type`, `company_tier`).
2. **Pure Read-Only (`GET`) Endpoints:**
   - All analytics endpoints are idempotent `GET` requests with zero side-effects.
   - Filter criteria are passed via URL query strings for effortless caching and bookmarking.
3. **Decoupled Business Logic:**
   - Database queries and calculations reside entirely in `services/dashboard_services.py`.
   - Views in `views/dashboard_views.py` handle parameter extraction, validation, and HTTP dispatch.
4. **Universal Authenticated Access:**
   - Dashboards are 100% accessible to all valid authenticated users (`IsAuthenticated`).
   - Sensitive student personally identifiable information (PII) like phone numbers and personal emails are scrubbed in favor of masked student IDs (`STU-0045`).

---

## 2. Directory Layout

```
backend/apps/analytics/
│
├── management/
│   └── commands/
│       └── seed_realistic_analytics.py    # Enterprise data seeding command
│
├── serializers/
│   ├── dashboard_serializers.py           # Universal dashboard response schemas
│   └── ...
│
├── services/
│   └── dashboard_services.py              # Pure ORM aggregation & metric calculation engine
│
├── views/
│   ├── dashboard_views.py                 # Unified gateway view dispatcher
│   └── ...
│
├── urls.py                                # Route bindings (/api/analytics/dashboard/)
└── models.py                              # Purely service/query-driven (no independent state models)
```

---

## 3. Realistic Analytics Data Seeding Command

To ensure dashboards display statistically sound, realistic distributions (rather than random gibberish or empty states), the project includes an automated management command:

```bash
# Run data seeding using the project virtual environment
python manage.py seed_realistic_analytics
```

### Command Highlights & Behavior:

1. **User Account Safety (Zero Data Loss):**
   - Preserves all existing user accounts, passwords, and tokens.
   - Updates existing profiles and seamlessly augments cohorts where needed.

2. **Department Code Canonicalization:**
   - Automatically standardizes legacy department codes across all database records:
     - `BCE` $\rightarrow$ `CSE` (Computer Science & Engineering)
     - `BEC` $\rightarrow$ `ECE` (Electronics & Communication Engineering)
     - `BME` $\rightarrow$ `ME` (Mechanical Engineering)
     - `BEE` $\rightarrow$ `EE` (Electrical Engineering)
     - `BCV` $\rightarrow$ `CE` (Civil Engineering)
     - Also canonicalizes `IT` and `AIDS` (Artificial Intelligence & Data Science).

3. **Accurate Cohort Volumes (100 Records Per Batch):**
   - **Active Students:** Seeded to exactly 100 students per batch for:
     - `Batch 2021-2025`
     - `Batch 2022-2026`
     - Generates authentic CGPA distributions (Gaussian spread centered around 7.8), realistic active backlogs (0 to 2), and associated ATS resumes and skill matrices.
   - **Alumni Batches:** Seeded to exactly 100 alumni per batch across 5 graduation cohorts:
     - `Batch 2016-2020`
     - `Batch 2017-2021`
     - `Batch 2018-2022`
     - `Batch 2019-2023`
     - `Batch 2020-2024`
     - Realistic career seniority progression (Entry-Level $\rightarrow$ Mid-Level $\rightarrow$ Senior $\rightarrow$ Lead), salary growths, and authentic global geographic distribution (Bengaluru, Hyderabad, Pune, London, San Francisco).

4. **Realistic Placement Records (100 Placements per Year):**
   - ~100 placement records per calendar cycle across 2020 through 2025.
   - Associated with 16 tier-rated enterprise companies:
     - **Super Dream (> ₹12 LPA):** Google, Microsoft, Amazon, Atlassian, Adobe.
     - **Unicorn Startups:** Razorpay, Zerodha, Flipkart.
     - **Dream (₹8 - 12 LPA):** Oracle, Cisco, Deloitte.
     - **Mass / Regular:** Tata Consultancy Services (TCS), Infosys, Wipro.
     - **Core Engineering:** Larsen & Toubro (L&T), Siemens.

---

## 4. API Endpoints Reference

| Endpoint | Method | Params | Description |
| :--- | :---: | :--- | :--- |
| `/api/analytics/dashboard/` | `GET` | `view=common` | Master institutional pulse, census, and overview trends. |
| `/api/analytics/dashboard/` | `GET` | `view=student` | Student cohort readiness, skill gaps, and academic performance. |
| `/api/analytics/dashboard/` | `GET` | `view=alumni` | Alumni global footprint, career domains, and giving-back network. |
| `/api/analytics/dashboard/` | `GET` | `view=placement_cell` | Placement outcomes, recruiter loyalty cohorts, and CTC histograms. |
