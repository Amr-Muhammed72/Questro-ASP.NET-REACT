# Frontend API Integration (External Login)

This guide documents the Google external login flow and the profile-completion step.

## Base URL

- Local: `http://localhost:5222`

## Route Map

- `POST /api/Auth/external-login/google`
- `POST /api/Auth/complete-profile`

## Flow Summary

1. Frontend signs the user in with Google and receives a Google ID token.
2. Frontend calls `POST /api/Auth/external-login/google` with `idToken`.
3. Backend validates the Google ID token against the configured Google client ID.
4. Backend finds the user by Google login, links the login to an existing user with the same email, or creates a new user.
5. Backend returns an app access token in the response body and sets the refresh token in an `HttpOnly` cookie.
6. If `isProfileCompleted` is `true`, the user can enter the app.
7. If `isProfileCompleted` is `false`, frontend must show a profile-completion screen.
8. Frontend calls `POST /api/Auth/complete-profile` with bearer auth and sends `userName`, `gender`, and `birthDate`.
9. Backend marks the profile complete and returns a fresh app access token with the updated username claim.

Important behavior:

- Current backend contract expects a Google `idToken`, not an OAuth authorization `code`.
- Do not send the Google access token to the backend.
- Google-created users can be returned with `isProfileCompleted: false`.
- `complete-profile` requires `Authorization: Bearer <accessToken>`.
- Both endpoints set or rotate the `refreshToken` cookie, so call them with credentials enabled.

## Token Handling

### Access Token

- Returned in the JSON body from `POST /api/Auth/external-login/google`.
- Returned again from `POST /api/Auth/complete-profile`.
- Store it in memory or your preferred app auth store.
- Send it as `Authorization: Bearer <token>` on protected APIs.
- Replace the old access token with the one returned by `complete-profile`.

### Refresh Token

- Stored only in cookie `refreshToken`.
- Cookie flags:
  - `HttpOnly = true`
  - `Secure = true`
  - `SameSite = Lax`
- Frontend JavaScript cannot read this cookie.
- Frontend must send requests with credentials enabled.

Fetch credential example:

```javascript
credentials: "include"
```

Axios credential example:

```javascript
withCredentials: true
```

## Endpoint 1: Google External Login

- Method: `POST`
- URL: `/api/Auth/external-login/google`
- Auth: No

Request body:

```json
{
  "idToken": "google-id-token-from-google-sign-in"
}
```

Frontend source of `idToken`:

- Use the Google sign-in flow on the frontend.
- Send the Google ID token returned by Google as `idToken`.
- Do not send a Google access token.
- Do not send an OAuth authorization code.

Success response:

- Status: `200 OK`
- Also sets `refreshToken` cookie

```json
{
  "isProfileCompleted": false,
  "userId": 15,
  "userName": "mohamed",
  "firstName": "Mohamed",
  "lastName": "Ali",
  "email": "mohamed@example.com",
  "accessToken": "jwt-access-token",
  "accessTokenExpiresOnUtc": "2026-04-27T15:30:00Z"
}
```

Backend behavior:

- Validates the Google ID token audience against `Authentication:Google:ClientId`.
- Uses the Google account subject as the external login key.
- If the Google login is already linked, logs in that user.
- If no Google login exists but a user with the same email exists, links Google to that existing user.
- If no user exists, creates a new account from Google email/name data.
- New Google-created accounts may have `isProfileCompleted: false`.

Common errors:

- `400` `User.ExternalLoginEmailNotFound` - Google token did not contain a verified usable email.
- `500` `User.ExternalLoginFailed` - token validation failed or Google client ID is not configured.
- `500` `User.RegistrationFailed` - user creation failed.

Frontend example:

```javascript
const response = await fetch("http://localhost:5222/api/Auth/external-login/google", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ idToken })
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.en ?? "Google login failed");
}

storeAccessToken(data.accessToken);

if (!data.isProfileCompleted) {
  navigate("/complete-profile");
} else {
  navigate("/app");
}
```

## Endpoint 2: Complete External Profile

- Method: `POST`
- URL: `/api/Auth/complete-profile`
- Auth: Required (`Authorization: Bearer <accessToken>`)
- Used for: completing missing profile data after external login

Request body:

```json
{
  "userName": "mohamed123",
  "gender": "Male",
  "birthDate": "2000-05-10T00:00:00"
}
```

Validation rules:

- `userName`: required, max `50`, must not already exist for another user
- `gender`: required, max `20`
- `birthDate`: required, must be before today

Success response:

- Status: `200 OK`
- Also sets a new `refreshToken` cookie
- Returns a new access token with the updated username claim

```json
{
  "isProfileCompleted": true,
  "userId": 15,
  "userName": "mohamed123",
  "firstName": "Mohamed",
  "lastName": "Ali",
  "email": "mohamed@example.com",
  "accessToken": "new-jwt-access-token",
  "accessTokenExpiresOnUtc": "2026-04-27T15:30:00Z"
}
```

Common errors:

- `400` `User.InvalidRegistrationData`
- `401` unauthorized if bearer token is missing or invalid
- `404` `User.NotFound`
- `409` `User.UserNameAlreadyExists`
- `500` `User.RegistrationFailed`

Frontend example:

```javascript
const response = await fetch("http://localhost:5222/api/Auth/complete-profile", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  },
  credentials: "include",
  body: JSON.stringify({
    userName,
    gender,
    birthDate
  })
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.en ?? "Failed to complete profile");
}

storeAccessToken(data.accessToken);
navigate("/app");
```

## Recommended Frontend Flow

1. Get `idToken` from Google sign-in.
2. Call `POST /api/Auth/external-login/google`.
3. Store returned `accessToken`.
4. If `isProfileCompleted` is `true`, enter the app.
5. If `isProfileCompleted` is `false`, show a screen for `userName`, `gender`, and `birthDate`.
6. Call `POST /api/Auth/complete-profile` using the returned access token.
7. Store the new access token from `complete-profile`.
8. Enter the app.

## Quick Checklist

1. Send Google ID token as `idToken`.
2. Do not send Google access token or authorization code.
3. Always use `credentials: "include"` or `withCredentials: true`.
4. Read `isProfileCompleted` after Google login.
5. If profile is incomplete, call `complete-profile` before finishing onboarding.
6. Replace the old app access token after `complete-profile`.
7. Normalize errors using `code`, `en`, and optional `details`.
