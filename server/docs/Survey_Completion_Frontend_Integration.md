# Survey Completion Status API

Frontend integration guide for checking user survey completion status.

---

## Overview

The **Survey Completion Status endpoint** allows frontend to determine if a user has completed their preferences survey by checking if they have selected at least one favorite game or movie genre.

**Base URL:** `/api/users`  
**Endpoint:** `GET /survey/completion-status`  
**Authentication:** Required (Bearer Token)  
**Content-Type:** `application/json`

---

## Endpoint Details

### Request

```http
GET /api/users/survey/completion-status
Authorization: Bearer {access_token}
```

**Query Parameters:** None  
**Request Body:** None (automatic from logged-in user)

### Response

**Status Code:** `200 OK`

```json
{
  "isCompleted": true,
  "gameGenresFav": [
    "Action",
    "RPG",
    "Strategy"
  ],
  "movieGenresFav": [
    "Action",
    "Drama"
  ],
  "message": "Survey completed. User has selected genre preferences."
}
```

**Response Structure:**

| Field | Type | Description |
|-------|------|-------------|
| `isCompleted` | boolean | `true` if survey is complete, `false` otherwise |
| `gameGenresFav` | string[] | User's favorite game genres (empty array if none) |
| `movieGenresFav` | string[] | User's favorite movie genres (empty array if none) |
| `message` | string | Status message describing completion state |

---

## Survey Completion Logic

A user's survey is considered **COMPLETED** if they have selected at least ONE genre in either:
- **Game Genres** (`gameGenresFav`), OR
- **Movie Genres** (`movieGenresFav`)

A user's survey is considered **NOT COMPLETED** if BOTH arrays are empty/null.

---

## Use Cases

### 1. Check Survey Status on App Load

```javascript
async function checkSurveyCompletion(accessToken) {
  const response = await fetch('/api/users/survey/completion-status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  return await response.json();
}

// Usage
try {
  const status = await checkSurveyCompletion(token);
  
  if (!status.isCompleted) {
    // Redirect to survey page
    window.location.href = '/survey';
  } else {
    // Show personalized recommendations
    console.log('User has completed survey:', status);
    loadRecommendations(status.gameGenresFav, status.movieGenresFav);
  }
} catch (error) {
  console.error('Failed to check survey status:', error);
}
```

### 2. Show Survey Progress

```javascript
function displaySurveyStatus(status) {
  const totalGenresSelected = 
    (status.gameGenresFav?.length || 0) + 
    (status.movieGenresFav?.length || 0);

  if (status.isCompleted) {
    showNotification('✓ Survey Complete!', `You've selected ${totalGenresSelected} genres.`);
  } else {
    showNotification('⚠️ Survey Incomplete', 'Please select at least one game or movie genre.');
  }
}
```

### 3. Conditional UI Rendering

```javascript
function renderUserDashboard(status) {
  return `
    <div class="dashboard">
      ${!status.isCompleted ? `
        <div class="survey-banner">
          <h3>Complete Your Preferences Survey</h3>
          <p>Select your favorite genres to get personalized recommendations</p>
          <a href="/survey" class="btn btn-primary">Go to Survey</a>
        </div>
      ` : `
        <div class="survey-complete">
          <h3>Your Preferences</h3>
          <div class="genres">
            ${status.gameGenresFav?.length ? `
              <div class="genre-group">
                <h4>Game Genres</h4>
                <div class="tags">
                  ${status.gameGenresFav.map(g => `<span class="tag">${g}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            ${status.movieGenresFav?.length ? `
              <div class="genre-group">
                <h4>Movie Genres</h4>
                <div class="tags">
                  ${status.movieGenresFav.map(g => `<span class="tag">${g}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `}
    </div>
  `;
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "status": 401,
  "message": "Unauthorized - Invalid or missing access token"
}
```

**Cause:** No valid JWT token in Authorization header

**Solution:** Request user to login again

### 404 Not Found

```json
{
  "status": 404,
  "code": "User.NotFound",
  "message": "User not found"
}
```

**Cause:** User ID from token doesn't exist in database

**Solution:** Contact support or re-authenticate

### 500 Internal Server Error

```json
{
  "status": 500,
  "message": "An error occurred while processing your request"
}
```

**Cause:** Server-side error

**Solution:** Retry after a moment, contact support if persists

---

## Example Workflows

### Workflow 1: First-Time User Setup

```
1. User logs in → App calls GET /survey/completion-status
2. Response: isCompleted = false
3. App redirects to /survey page
4. User selects game genres and movie genres
5. User submits survey → POST /survey (existing endpoint)
6. Next app load → isCompleted = true
7. App shows recommendations instead of survey
```

### Workflow 2: Update Preferences

```
1. User navigates to Settings/Preferences
2. App fetches current status via GET /survey/completion-status
3. Display current selections: gameGenresFav, movieGenresFav
4. User updates genres
5. User saves → POST /survey (with new genres)
6. App refreshes status
```

---

## Integration Example (React)

```jsx
import { useEffect, useState } from 'react';

export function SurveyCheck() {
  const [surveyStatus, setSurveyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSurvey = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/users/survey/completion-status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setSurveyStatus(data);

        // Redirect if survey not completed
        if (!data.isCompleted) {
          window.location.href = '/survey';
        }
      } catch (err) {
        setError(err.message);
        console.error('Survey check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSurvey();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Your Preferences</h2>
      <div>
        <h3>Game Genres ({surveyStatus.gameGenresFav.length})</h3>
        <ul>
          {surveyStatus.gameGenresFav.map(genre => (
            <li key={genre}>{genre}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Movie Genres ({surveyStatus.movieGenresFav.length})</h3>
        <ul>
          {surveyStatus.movieGenresFav.map(genre => (
            <li key={genre}>{genre}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## Integration Example (Angular)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface SurveyCompletionStatus {
  isCompleted: boolean;
  gameGenresFav: string[];
  movieGenresFav: string[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  constructor(private http: HttpClient) { }

  getSurveyCompletionStatus(): Observable<SurveyCompletionStatus> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<SurveyCompletionStatus>(
      '/api/users/survey/completion-status',
      { headers }
    );
  }
}

// Usage in component
export class DashboardComponent implements OnInit {
  surveyStatus: SurveyCompletionStatus;

  constructor(private surveyService: SurveyService, private router: Router) {}

  ngOnInit() {
    this.surveyService.getSurveyCompletionStatus().subscribe({
      next: (status) => {
        this.surveyStatus = status;
        if (!status.isCompleted) {
          this.router.navigate(['/survey']);
        }
      },
      error: (err) => console.error('Failed to fetch survey status:', err)
    });
  }
}
```

---

## Best Practices

### ✅ DO:
- Call this endpoint on app initialization to gate features
- Cache the result and refresh on survey updates
- Show user-friendly messages based on `isCompleted` flag
- Handle 401 errors by redirecting to login
- Use the genre arrays to personalize recommendations

### ❌ DON'T:
- Call this endpoint repeatedly without caching
- Assume survey is complete without checking `isCompleted`
- Display both empty genre arrays to users without context
- Ignore authentication errors
- Make backend calls that depend on survey completion without checking first

---

## Related Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/survey` | `POST` | Submit survey responses (genres, preferences) |
| `/api/users/profile` | `GET` | Get full user profile |
| `/api/users/profile` | `PUT` | Update user profile |
| `/api/games/recommended/me` | `GET` | Get personalized game recommendations |
| `/api/movies/recommended/me` | `GET` | Get personalized movie recommendations |

---

## Troubleshooting

### Issue: Always getting `isCompleted = false`

**Check:**
1. User submitted survey at `/api/users/survey` endpoint
2. No network errors during POST
3. User has at least 1 genre in game OR movie preferences

### Issue: 401 Unauthorized errors

**Check:**
1. Access token is valid and not expired
2. Token is correctly included in Authorization header
3. User is properly authenticated

### Issue: Genres not updating after survey submission

**Check:**
1. Survey submission returned success (200)
2. Call `/survey/completion-status` again to refresh
3. Check browser cache/local storage if storing status

---

## Questions?

For issues or questions regarding this API:
1. Check the related endpoints documentation
2. Review error responses section
3. Contact backend team for additional support
