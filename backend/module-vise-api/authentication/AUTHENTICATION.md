# AlumiBridge Authentication & Registration Architecture

This document defines the exact login, registration, email verification, and role logic for the AlumiBridge platform.

## 1. Platform Roles
The platform defines exactly four roles. The backend acts as the single source of truth for authorization.

| Role | Who is it? | Primary Verification Method |
|---|---|---|
| **STUDENT** | Current Nirma University student | **Domain Email Verification** (Must own `@nirmauni.ac.in`) |
| **ALUMNI** | Nirma University graduate | **Database Match** (`UniversityIdentity`) + Personal Email OTP |
| **PLACEMENT_CELL**| Authorized Placement Staff | **Manual Admin Approval** |
| **ADMIN** | Platform Administrator | **System / Superuser** |

---

## 2. The Verification Data Models

### A. Master Identity Source: `UniversityIdentity` (Alumni Only)
The `UniversityIdentity` table is the official university dataset. This table **only stores Alumni data** (past graduates). 
It is strictly used to verify Alumni who no longer have access to their active university emails.

*Fields used for matching Alumni:*
* `admission_year`
* `program_code` (e.g., BCE, BEC, BME, etc.)
* `roll_number`
* `date_of_birth`

### B. OTP Storage: `OTPVerification`
To handle the 6-digit email verification securely, we use an `OTPVerification` database table. 
* **email**: The email address the OTP was sent to.
* **otp_code**: The securely generated 6-digit number.
* **created_at**: Timestamp used to expire the OTP after 10 minutes.

**Database Cleanup Rule:** 
To ensure this table does not get bloated with unused or old codes, the OTP record is **strictly deleted** from the database the moment it is successfully verified, or when a user requests a new code.

---

## 3. The 4-API Authentication Design
We use a streamlined **4-API architecture**. All APIs are public `POST` requests.

### API 1: Student Registration Request (`POST /api/auth/student/register/`)
* **Input:** Student submits University Email (`@nirmauni.ac.in`) and Password.
* **Action:** 
  1. The backend validates the Nirma domain format.
  2. Creates a `User` (role=`STUDENT`, `is_verified=False`).
  3. Generates a 6-digit code, saves it in `OTPVerification`, and sends it to the email.

### API 2: Alumni Registration Request (`POST /api/auth/alumni/register/`)
* **Input:** Alumni submits Personal Email, Password, and Identity Details (Year, Program, Roll No, DOB).
* **Action:**
  1. The backend checks `UniversityIdentity`. An exact match must be found.
  2. Creates a `User` (role=`ALUMNI`, `is_verified=False`).
  3. Generates a 6-digit code, saves it in `OTPVerification`, and sends it to the personal email.

### API 3: Universal OTP Verification (`POST /api/auth/verify-otp/`)
* **Input:** Email and 6-digit OTP.
* **Action:**
  1. The backend checks the `OTPVerification` table for a match that is less than 10 minutes old.
  2. If correct, the `User.is_verified` flag is set to `True`.
  3. The backend checks the `User.role`.
     * If `STUDENT`: Automatically generates their empty `StudentProfile`.
     * If `ALUMNI`: Automatically generates their empty `AlumniProfile`.
  4. The OTP record is deleted or marked as used.

### API 4: Login (`POST /api/auth/login/`)
* **Input:** Email and Password.
* **Action:**
  1. Authenticates against the `User` table.
  2. Fails if `is_verified` is False.
  3. Returns standard DRF JWT tokens (`access_token` and `refresh_token`).

---

## 4. Security Principles
* **Frontend cannot force roles:** Passing `{"role": "ALUMNI"}` in a JSON payload during Student registration will be ignored or rejected. The backend explicitly derives the role based on which registration endpoint was called.
* **Separation of Data:** `UniversityIdentity` never contains user passwords, JWTs, or app profiles.
* **Unverified Pruning:** Users who register but never complete API 3 (Verify OTP) remain as `is_verified=False`. Their unverified accounts can be routinely pruned via a background script if desired.
