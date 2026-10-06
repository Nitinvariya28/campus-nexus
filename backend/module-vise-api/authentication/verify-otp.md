# API Design: OTP Verification

**Path:** `/api/auth/verify-otp/`  
**Method:** `POST`  
**Access:** Public (No JWT required)

## 1. Request Body (Inputs)
```json
{
    "email": "24bce006@nirmauni.ac.in",
    "otp_code": "280440"
}
```

## 2. Validation & Serializer (`OTPVerificationSerializer`)
* **Data Types:** Ensures email is a valid format and `otp_code` is exactly a 6-character string.

## 3. Database Queries / ORM Actions
1. `OTPVerification.objects.filter(email=email, otp_code=otp_code).first()`
2. `User.objects.filter(email=email).first()`
3. `StudentProfile.objects.get_or_create(user=user)` (if STUDENT)
4. `AlumniProfile.objects.get_or_create(user=user)` (if ALUMNI)
5. `otp_record.delete()`

## 4. Business Logic (Service Layer)
1. **Fetch OTP:** Find the exact record matching the email and code in the database. Returns `400 Bad Request` if invalid.
2. **Expiration Check:** Adds 10 minutes to the `created_at` timestamp of the OTP. If the current time is greater than the expiration time, the OTP is deleted and a `400 Bad Request` ("Expired") is returned.
3. **Verify User:** If the OTP is valid, fetch the `User` object and set `is_verified = True`. Save the user.
4. **Auto-Generate Profile:** Based on the `user.role`, the system will automatically instantiate an empty `StudentProfile` or `AlumniProfile`.
   * **Future Data Consistency Rule:** When the student later completes their profile (or directly during this step), we must extract their `batch` and `department` directly from their email (`24` = 2024 Batch, `bce` = Computer Engineering) to guarantee they cannot select a fake department!
5. **Database Cleanup:** The OTP record is securely hard-deleted from the database.
6. **Response:** Return `200 OK` with a success message directing them to the login screen.
