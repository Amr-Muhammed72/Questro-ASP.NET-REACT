# Frontend API Integration (Auth and OTP)

This guide documents the current authentication flow implemented in:

- `AuthController`
- `OTPController`
- `ForgotPasswordController`
- `AuthService`
- `OTPService`
- `ForgotPasswordService`
- `EmailService`
- `EmailTemplateService`

## Base URL

- Local: `http://localhost:5222`

## Route Map

- `POST /api/Auth/register`
- `POST /api/Auth/Verify`
- `POST /api/Auth/logIn`
- `POST /api/Auth/refresh-token`
- `POST /api/Auth/logOut`
- `POST /api/OTP/Resend-OTP`
- `POST /api/ForgotPassword/forgot-password`
- `POST /api/ForgotPassword/verify-reset-otp`
- `POST /api/ForgotPassword/reset-password`

## Auth Flow Summary

### Registration (with OTP)

1. Frontend calls `POST /api/Auth/register` with email and password.
2. Backend sends a 6-digit OTP to the user email.
3. **User is NOT stored in the database yet** – only OTP is generated and sent.
4. Frontend calls `POST /api/Auth/Verify` with `email`, `otp`, and additional registration details (`UserName`, `FirstName`, `LastName`, `Gender`, `BirthDate`, `Password`).
5. Backend verifies the OTP, then creates and stores the user in the database.
6. Backend returns an access token in the response body and sets the refresh token in an `HttpOnly` cookie.

Important behavior:

- `Register` does NOT store the user in the database or return tokens.
- `Register` only sends the OTP to the email address.
- `Verify` creates the user account, returns the access token, and creates the refresh token cookie.
- OTP expires after `3 minutes`.
- Resend OTP replaces any previous OTP immediately.

### Login (no OTP)

1. Frontend calls `POST /api/Auth/logIn` with email and password.
2. Backend returns an access token in the response body and sets the refresh token in an `HttpOnly` cookie immediately.

Important behavior:

- Login returns both access token and refresh token cookie directly.
- No OTP step required for login.

## Reset Password Flow Summary

The reset-password flow is also OTP-based, but it is separate from the login flow:

1. Frontend calls `POST /api/ForgotPassword/forgot-password` with the user email.
2. Backend sends a 6-digit reset OTP to the email.
3. Frontend calls `POST /api/ForgotPassword/verify-reset-otp` with `email` and `otp`.
4. Backend returns a temporary `resetToken`.
5. Frontend calls `POST /api/ForgotPassword/reset-password` with `resetToken`, `newPassword`, and `confirmPassword`.

Important behavior:

- Reset OTP expires after `3 minutes`.
- `verify-reset-otp` does not reset the password directly.
- `verify-reset-otp` returns a temporary `resetToken`.
- `resetToken` expires after `15 minutes`.
- The frontend must keep the returned `resetToken` until the final reset step is completed.

## Email Delivery

OTP emails are sent asynchronously in a background job through the email service.

- Subject on first send: `Your OTP Verification Code`
- Subject on resend: `Your New OTP Verification Code`
- Subject on reset password: `Reset Your Password`
- OTP email body is generated from `Templates/Email/OtpEmail.html`

Frontend implication:

- A successful register/logIn/resend response only means the backend queued OTP sending successfully.
- The frontend does not receive the OTP value.

## Token Storage

### Access token

- Returned in the JSON body from `POST /api/Auth/logIn` (direct login)
- Returned in the JSON body from `POST /api/Auth/Verify` (after registration OTP)
- Returned again from `POST /api/Auth/refresh-token`
- Frontend should store it in memory or your preferred app auth store
- Send it as `Authorization: Bearer <token>` on protected APIs

### Refresh token

- Stored only in cookie `refreshToken`
- Cookie flags:
  - `HttpOnly = true`
  - `Secure = true`
  - `SameSite = Lax`
- Frontend JavaScript cannot read this cookie
- Frontend must send requests with credentials enabled when calling refresh/logout

Example with `fetch`:

```javascript
await fetch("http://localhost:5222/api/Auth/refresh-token", {
  method: "POST",
  credentials: "include"
});
```

Example with `axios`:

```javascript
await axios.post("http://localhost:5222/api/Auth/refresh-token", {}, {
  withCredentials: true
});
```

## Endpoints

### 1) Register

- Method: `POST`
- URL: `/api/Auth/register`
- Auth: No

Request body:

```json
{
  "userName": "mohamed123",
  "firstName": "Mohamed",
  "lastName": "Ali",
  "email": "mohamed@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "gender": "Male",
  "birthDate": "2000-05-10T00:00:00"
}
```

Validation rules:

- `email`: required, valid email, max `256`
- `userName`: required, max `50`
- `firstName`: required, max `50`
- `lastName`: required, max `50`
- `email`: required, valid email, max `256`
- `password`: required, min `8`, max `128`
- `confirmPassword`: required, must equal `password`
- `gender`: optional, max `20`
- `birthDate`: must be before today

Success response:

- Status: `201 Created`

```json
{
  "message": "OTP sent to your email",
  "userId": 15,
  "userName": "mohamed123",
  "firstName": "Mohamed",
  "lastName": "Ali",
  "email": "mohamed@example.com"
}
```

Failure response shape:

```json
{
  "code": "User.InvalidRegistrationData",
  "en": "Invalid registration data.",
  "details": [
    "Password must be at least 8 characters."
  ]
}
```

Common errors:

- `400` `User.InvalidRegistrationData`
- `400` `User.PasswordsDoNotMatch`
- `409` `User.EmailAlreadyExists`
- `409` `User.UserNameAlreadyExists`
- `500` `User.RegistrationFailed`

Frontend notes:

- After success, navigate user to OTP verification screen.
- Use the returned `email` as the source of truth for the verify step.

### 2) Verify OTP and Complete Registration

- Method: `POST`
- URL: `/api/Auth/Verify`
- Auth: No
- Used for: **Registration only** (completes OTP-based registration)

Request body:

```json
{
  "otp": "123456",
  "userName": "mohamed123",
  "firstName": "Mohamed",
  "lastName": "Ali",
  "email": "mohamed@example.com",
  "password": "Password123!",
  "gender": "Male",
  "birthDate": "2000-05-10T00:00:00"
}
```

Validation rules:

- `otp`: required, 6 digits, must not be expired (3 minute window)
- `userName`: required, max `50`, must not already exist
- `firstName`: required, max `50`
- `lastName`: required, max `50`
- `email`: required, must match the email used in register request
- `userName`: required, max `50`, must not already exist
- `firstName`: required, max `50`
- `lastName`: required, max `50`
- `password`: required, min `8`, max `128`, must match the password used in register request
- `gender`: optional, max `20`
- `birthDate`: required, must be a valid date

Success response:

- Status: `200 OK`
- Also sets `refreshToken` cookie
- **User is created in the database on successful OTP verification**

```json
{
  "userId": 15,
  "userName": "mohamed123",
  "firstName": "Mohamed",
  "lastName": "Ali",
  "email": "mohamed@example.com",
  "accessToken": "jwt-access-token",
  "accessTokenExpiresOnUtc": "2026-04-27T15:30:00Z",

}
```

Failure response shape:

```json
{
  "code": "User.InvalidOtp",
  "en": "Invalid or expired OTP."
}
```

Common errors:

- `400` `User.InvalidOtp` – invalid or expired OTP
- `400` `User.InvalidOtpAttempts` – too many failed OTP attempts
- `404` user not found
- `409` `User.UserNameAlreadyExists`
- `500` `User.RegistrationFailed` – error while creating user or saving refresh token

Frontend notes:

- **This is the final step that creates the user account and completes registration after OTP verification.**
- **Frontend must send all registration details (not just OTP) to complete the registration.**
- Save `accessToken` from response body.
- Make sure the request allows cookies so the refresh token can be stored by the browser.
- The password must match what was sent in the initial register request.

### 3) Log In

- Method: `POST`
- URL: `/api/Auth/logIn`
- Auth: No

Request body:

```json
{
  "email": "mohamed@example.com",
  "password": "Password123!"
}
```

Important note:

- The field name is `email`, but backend accepts either email or username in this field.

Success response:

- Status: `200 OK`
- Also sets `refreshToken` cookie

```json
{
  "userId": 15,
  "userName": "mohamed123",
  "firstName": "Mohamed",
  "lastName": "Ali",
  "email": "mohamed@example.com",
  "accessToken": "jwt-access-token",
  "accessTokenExpiresOnUtc": "2026-04-27T15:30:00Z"
}
```

Common errors:

- `400` `User.InvalidLoginData`
- `401` `User.InvalidCredentials`
- `403` `User.LockedOut`
- `403` `User.LoginNotAllowed`

Frontend notes:

- Login returns tokens directly. No OTP step required.
- Save `accessToken` from response body.
- Make sure the request allows cookies so the refresh token can be stored by the browser.

### 4) Resend OTP

- Method: `POST`
- URL: `/api/OTP/Resend-OTP`
- Auth: No

Request body:

```json
{
  "email": "mohamed@example.com"
}
```

Success response:

```json
{
  "message": "OTP sent to your email"
}
```

Failure response:

```json
{
  "code": "User.NotFound",
  "en": "User not found.",
  "statusCode": 404,
  "description": "User not found."
}
```

Frontend notes:

- This endpoint generates and sends a new OTP to the email.
- Used during registration when user requests a new OTP before completing verification.
- Unlike other auth endpoints, the controller currently returns `400 Bad Request` for every failure, even when the embedded error says `404` or `429`.
- Frontend should read the error body `code`, not only the HTTP status code.
- New OTP replaces any previously generated OTP immediately.

### 5) Refresh Access Token

- Method: `POST`
- URL: `/api/Auth/refresh-token`
- Auth: Uses refresh token cookie

Request body:

- No body required

Success response:

```json
{
  "accessToken": "new-jwt-access-token",
  "accessTokenExpiresOnUtc": "2026-04-27T16:30:00Z"
}
```

Failure behavior:

- If cookie is missing, backend returns `401 Unauthorized` with no custom body
- If cookie exists but token is invalid/expired, backend returns:

```json
{
  "code": "User.InvalidRefreshToken",
  "en": "Invalid or expired refresh token."
}
```

Frontend notes:

- Call this when access token expires or on app bootstrap if your flow supports silent refresh.
- Always send `credentials: "include"` or `withCredentials: true`.
- Backend rotates refresh tokens on each successful refresh.

### 6) Log Out

- Method: `POST`
- URL: `/api/Auth/logOut`
- Auth: Uses refresh token cookie

Request body:

- No body required

Success response:

```json
{
  "message": "Logged out successfully"
}
```

Frontend notes:

- Backend revokes the refresh token in the database and deletes the cookie.
- Always send `credentials: "include"` or `withCredentials: true`.
- After success, clear the frontend access token and user session state.

### 7) Request Reset Password OTP

- Method: `POST`
- URL: `/api/ForgotPassword/forgot-password`
- Auth: No

Request body:

```json
{
  "email": "mohamed@example.com"
}
```

Success response:

```json
{
  "message": "OTP sent to your email."
}
```

Failure response:

```json
{
  "code": "ForgotPassword.UserNotFound",
  "en": "User not found.",
  "statusCode": 404,
  "description": "User not found."
}
```

Frontend notes:

- This starts the reset-password flow only.
- It does not log the user in.
- If the user requests again, the previous reset OTP is removed and replaced with a new one.

### 8) Verify Reset OTP

- Method: `POST`
- URL: `/api/ForgotPassword/verify-reset-otp`
- Auth: No

Request body:

```json
{
  "email": "mohamed@example.com",
  "otp": "123456"
}
```

Success response:

```json
{
  "resetToken": "d1c96efddf5e4fc1b9d4be58e978cc77"
}
```

Failure response:

```json
{
  "code": "ForgotPassword.InvalidOtp",
  "en": "Invalid or expired OTP.",
  "statusCode": 400,
  "description": "Invalid or expired OTP."
}
```

Frontend notes:

- Store `resetToken` temporarily in client state after success.
- This token is required for the final password reset step.
- `resetToken` is short-lived and expires after `15 minutes`.

### 9) Reset Password

- Method: `POST`
- URL: `/api/ForgotPassword/reset-password`
- Auth: No

Request body:

```json
{
  "resetToken": "d1c96efddf5e4fc1b9d4be58e978cc77",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

Success response:

```json
{
  "message": "Password reset successfully."
}
```

Failure response:

```json
{
  "code": "ForgotPassword.InvalidResetToken",
  "en": "Invalid or expired reset token.",
  "statusCode": 400,
  "description": "Invalid or expired reset token."
}
```

Common errors:

- `400` `ForgotPassword.PasswordMismatch`
- `400` `ForgotPassword.InvalidResetToken`
- `404` `ForgotPassword.UserNotFound`
- `500` `ForgotPassword.ResetFailed`

Frontend notes:

- This endpoint does not return auth tokens.
- After success, redirect the user back to the normal login screen.

## Error Handling Notes

Responses should serialize in `camelCase` with the current ASP.NET controller setup.

### Most AuthController failures

Usually return:

```json
{
  "code": "User.InvalidCredentials",
  "en": "Invalid email or password."
}
```

Register may also return validation details:

```json
{
  "code": "User.InvalidRegistrationData",
  "en": "Invalid registration data.",
  "details": [
    "First Name must not be empty."
  ]
}
```

### OTP resend failure shape

`/api/OTP/Resend-OTP` returns the raw error object:

```json
{
  "code": "User.OtpAlreadySent",
  "en": "OTP already sent. Try again later.",
  "statusCode": 429,
  "description": "OTP already sent. Try again later."
}
```

Recommended frontend normalization:

- Read `en` as the main display message
- Treat `details` as optional validation details
- Some forgot-password endpoints also return `statusCode` and `description` in the body

## Recommended Frontend Flow

### Register flow

1. Call `POST /api/Auth/register`
2. On success, open OTP screen
3. Call `POST /api/Auth/Verify`
4. Store `accessToken`
5. Keep credentials enabled so refresh cookie is preserved

### Login flow

1. Call `POST /api/Auth/logIn`
2. On success, store `accessToken` and log user in (no OTP required)
3. Keep credentials enabled so refresh cookie is preserved
4. Use `POST /api/Auth/refresh-token` when access token expires

### Reset password flow

1. Call `POST /api/ForgotPassword/forgot-password`
2. Open reset OTP screen
3. Call `POST /api/ForgotPassword/verify-reset-otp`
4. Store `resetToken` temporarily
5. Call `POST /api/ForgotPassword/reset-password`
6. Redirect user to normal login screen

## Quick Checklist

1. Do not expect tokens from `register`. Expect tokens directly from `logIn` and after `Verify` (registration).
2. `logIn` returns tokens directly (no OTP required).
3. `Verify` is only for completing registration after OTP verification.
4. OTP is `6 digits` and valid for `3 minutes` (registration only).
5. Enable browser credentials for all endpoints to preserve refresh token cookie.
6. Normalize on `code`, `en`, and optional `details`.
7. The login `email` field accepts either email or username.
8. Reset password is a 3-step flow: request OTP, verify OTP, then submit new password with `resetToken`.
