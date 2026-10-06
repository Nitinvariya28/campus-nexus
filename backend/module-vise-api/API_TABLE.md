# AlumiBridge API Table (Authentication & Registration)

This document provides a clear, high-level structural overview of the authentication and registration APIs.

## Authentication Endpoints

| API Endpoint | Method | Access Level | Description & Storage Logic |
| :--- | :--- | :--- | :--- |
| **`/api/auth/student/register/`** | `POST` | Public | <ul><li>Validates `@nirmauni.ac.in` domain.</li><li>Creates unverified `User` (`STUDENT`).</li><li>Saves 6-digit code in `OTPVerification`.</li></ul> |
| **`/api/auth/alumni/register/`** | `POST` | Public | <ul><li>Matches data against `UniversityIdentity`.</li><li>Creates unverified `User` (`ALUMNI`).</li><li>Saves code in `OTPVerification`.</li></ul> |
| **`/api/auth/verify-otp/`** | `POST` | Public | <ul><li>Accepts email & OTP.</li><li>Deletes OTP record on success.</li><li>Marks `User` verified.</li><li>Generates empty `Profile`.</li></ul> |
| **`/api/auth/login/`** | `POST` | Public | <ul><li>Accepts email & password.</li><li>Checks if user is verified.</li><li>Returns JWT tokens.</li></ul> |
| **`/api/auth/logout/`** | `POST` | Authenticated | <ul><li>Accepts `refresh_token` to blacklist.</li><li>Requires `Bearer Token` in header.</li></ul> |

## Quick Clarifications
* **Public APIs:** Anyone on the internet can call the 4 main registration and login APIs. No JWT or Bearer token is required.
* **Authenticated APIs:** Any API outside of the registration flow (such as `logout`, editing a profile, or posting to the community) will strictly require the `Authorization: Bearer <access_token>` header. Only verified, logged-in users can access them.
* **OTP Storage Cleanup:** The `OTPVerification` table is strictly used for short-term storage. The API is programmed to instantly delete the record once `/verify-otp/` runs successfully, keeping the database clean.
