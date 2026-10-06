# API Design: Student Registration

**Path:** `/api/auth/student/register/`  
**Method:** `POST`  
**Access:** Public (No JWT required)

## 1. Request Body (Inputs)
```json
{
    "email": "24bce001@nirmauni.ac.in",
    "password": "securepassword123",
    "first_name": "Rahul",
    "last_name": "Patel"
}
```

## 2. Validation & Serializer (`StudentRegistrationSerializer`)
* **Email Uniqueness:** Fails if the email is already in the `User` table.
* **Email Pattern Regex:** `^\d{2}(bce|bec|bme|bam|bch|bee|bcv)\d{3}@nirmauni\.ac\.in$`
  * *Custom Error Message:* `"Invalid format. Roll number must be exactly 3 digits (e.g., use '001' instead of '1'). Example: 24bce001@nirmauni.ac.in"`
* **Password Validation:** Uses Django's built-in strength validators.

## 3. Database Queries / ORM Actions
1. `User.objects.filter(email=email).exists()` (Checking for uniqueness).
2. `User.objects.create_user(email=..., password=..., first_name=..., last_name=..., role='STUDENT', is_verified=False)`
3. `OTPVerification.objects.update_or_create(email=..., defaults={'otp_code': otp_code})`

## 4. Business Logic (Service Layer)
1. **Format Input:** Lowercase the email before saving to prevent case-sensitivity issues.
2. **User Creation:** Create the `User` in the database immediately, but set `is_verified=False`. Do **not** generate the `StudentProfile` yet.
3. **Generate OTP:** Create a random 6-digit numeric string (e.g., `"193845"`).
4. **Store OTP:** Save this string securely to the `OTPVerification` model alongside the email.
5. **Send Email:** 
   * Use Django's `send_mail()` utility.
   * Send from `alumnibridgeproject@gmail.com` (using SMTP App Password).
   * Send to the student's email.
   * Format: HTML or Text containing the 6-digit code.
6. **Response:** Return `201 Created` with `{"message": "OTP sent to your university email. Please verify."}`

## 5. Email Configuration Requirements (SMTP)
To ensure the `send_mail()` function successfully sends actual emails, the following setup is strictly required in the backend:
* **Django Backend (`settings.py`):**
  * `EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'`
  * `EMAIL_HOST = 'smtp.gmail.com'`
  * `EMAIL_PORT = 587`
  * `EMAIL_USE_TLS = True`
* **Environment Variables (`.env`):**
  * `EMAIL_HOST_USER='alumnibridgeproject@gmail.com'`
  * `EMAIL_HOST_PASSWORD='<16-character-app-password>'` *(Must be a Google App Password, not a standard account password).*
