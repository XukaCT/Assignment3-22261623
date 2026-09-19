## 1. AI Capsule - Cloud-Deployed AI Prompt Manager

- **Deployed URL:** https://ai-capsule-b7pf.onrender.com
- **Cloud Platform:** Render (Free Web Service)
- **Coordinator:** Dr Shuo Ding | CSE3CWA / CSE5006

---

## 2. Local Setup & Installation

Clone the repository and install all dependencies:

```bash
# Install backend and client dependencies
npm run install:all

# Build frontend production bundle
npm run build

# Start local server
npm start
```

## 3. Architecture & API Routes

The client is built with React and Vite. In production, Express serves the built single-page application from `client/dist` from the same origin (`/`), eliminating cross-origin cookie restrictions. All data requests use native `fetch` with `credentials: 'include'` to pass HttpOnly session cookies.

## 4. Mandatory API Routes:

+ `GET /` — Public landing page explaining AI Capsule.   
+ `GET /login` — Public route redirecting to GitHub OAuth consent.   
+ `GET /auth/github/callback` — OAuth callback that exchanges the code, fetches user ID, and issues the application JWT.  
+ `GET /dashboard` — Protected client dashboard displaying authenticated user's records.   
+ `GET /api/health` — Public endpoint returning `{"status": "ok"}`.   
+ `GET /api/capsules` — Protected: Retrieves only the authenticated user's records.   
+ `POST /api/capsules` — Protected: Creates a new prompt record assigned to the verified user.   
+ `PUT /api/capsules/:id` — Protected: Updates a record owned by the verified user.   
+ `DELETE /api/capsules/:id` — Protected: Deletes a record owned by the verified user.   
+ `POST /api/logout` — Clears the JWT cookie

## 5. Authentication & JWT Session Management:

+ OAuth Provider: The application uses GitHub OAuth for user authentication. The client initiates the flow by navigating to the `/login` route, which redirects the user to the GitHub authorization screen.
+ JWT Issuance: Once the user authorizes the app, GitHub redirects back to the `/auth/github/callback` route with an authorization code. The Express backend exchanges this code for a GitHub access token, retrieves the user's GitHub ID, and signs a custom application JWT using the `jsonwebtoken` package and a private `JWT_SECRET` environment variable.
+ Storage: The Express server sends the signed application JWT back to the client inside a `Secure`, `HttpOnly` cookie named `token` (configured with a 2-hour expiration and `SameSite=lax`). This keeps the token safe from client-side JavaScript access.
+ Verification: Protected API routes (like `/api/capsules`) are guarded by an `authenticateToken` middleware function. This middleware reads the `token` from the incoming request cookies and validates its signature using the `JWT_SECRET`. If valid, it extracts the `user_id` to ensure users can only access their own records; if missing or invalid, it blocks the request and returns a `401 Unauthorized` status.

## 6. Environment Variables:

+ NODE_ENV (set to production)
+ NODE_VERSION (set to 20 to guarantee binary compatibility)
+ PORT (assigned dynamically by Render)
+ JWT_SECRET (used for signing and verifying application tokens)
+ GITHUB_CLIENT_ID (from GitHub Developer Settings)
+ GITHUB_CLIENT_SECRET (from GitHub Developer Settings)
+ BASE_URL (public Render HTTPS URL)
+ CLIENT_URL (public Render HTTPS URL)

## 7. Database Creation & Initialization:

I) Database Creation & Initialization:

The database is initialized using the `sqlite3` package in `backend/db.js`. When the Express server starts, it connects to a local file named database.sqlite and executes a `CREATE TABLE IF NOT EXISTS capsules` SQL query. This automatically generates the required table and schema structure if it does not already exist.

II) User Ownership Storage:

User ownership is enforced through a mandatory `user_id TEXT NOT NULL` column within the `capsules` table. When a user creates a new record, the backend extracts their unique GitHub user ID directly from the verified session JWT (not from the frontend) and saves it into this column. Every subsequent READ, UPDATE, and DELETE operation explicitly includes a `WHERE user_id = ?` clause in the SQL query to ensure users can only view and modify their own records.

 III) Deployed Storage Persistence:

The deployed storage on Render's free web service tier is ephemeral (temporary). Because SQLite saves data to a local file (`database.sqlite`) on the container's disk, any prompt records added by a user will be permanently lost whenever the Render container goes to sleep, restarts, or is redeployed.

## 8.  two cURL commands and the results
### Test 1 — No Authentication
```bash
curl.exe -i https://ai-capsule-b7pf.onrender.com/api/capsules
```
=> result: 
```bash
HTTP/1.1 401 Unauthorized
Date: Sat, 19 Sep 2026 06:18:57 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
access-control-allow-credentials: true
access-control-allow-origin: https://ai-capsule-b7pf.onrender.com
cf-cache-status: DYNAMIC
etag: W/"2d-OKFaJYZLk9Vw7Mn+6fXtn/5t+Ak"
rndr-id: 645268cc-a4b0-42a9
Server: cloudflare
vary: Origin
vary: Accept-Encoding
x-powered-by: Express
x-render-origin-server: Render
CF-RAY: a3d679db4ccc29a4-MEL
alt-svc: h3=":443"; ma=86400

{"error":"Access denied. No token provided."}
```
### Test 2 — Fake / Invalid JWT
``` bash
curl.exe -i -H "Cookie: token=fake-token-123" https://ai-capsule-b7pf.onrender.com/api/capsules
```
=> result:
```bash
HTTP/1.1 401 Unauthorized
Date: Sat, 19 Sep 2026 06:20:34 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
access-control-allow-credentials: true
access-control-allow-origin: https://ai-capsule-b7pf.onrender.com
cf-cache-status: DYNAMIC
etag: W/"1a-n7HGJaeNMyNPmeZ5FARY1k3xJx4"
rndr-id: f34ff0d5-6e19-4ef0
Server: cloudflare
vary: Origin
vary: Accept-Encoding
x-powered-by: Express
x-render-origin-server: Render
CF-RAY: a3d67c3d1e5c10cf-MEL
alt-svc: h3=":443"; ma=86400

{"error":"Invalid token."}
```
## 9.  Limitation of the submitted application.

Because the application uses an SQLite database (database.sqlite) stored locally on the server, it is restricted by Render's ephemeral filesystem on the free tier. Whenever the Render instance spins down due to inactivity or undergoes a redeployment, the local filesystem is wiped and reset. As a result, any AI prompt records created and saved by the user during a session will be permanently lost when the server restarts.

## AI-Assisted Development

* **AI Tools Used:** Gemini.
* **Problem Found and Corrected:** The AI generated standard boilerplate code for the Express SPA fallback route using the wildcard syntax `app.get('*', ...)` to serve the React frontend. Because this project uses a modern version of Express (5.x), its updated routing engine no longer supports bare string wildcards, which caused the server to crash on Render with a `PathError: Missing parameter name at index 1: *` error. I corrected this by replacing the wildcard route with a custom middleware function (`app.use((req, res, next) => { ... })`) that manually checks if the request path starts with `/api` or `/auth` before serving `index.html`.
* **Verification of OAuth, JWT, and Protected APIs:** I verified the OAuth flow by logging in via GitHub and checking the browser's application tab to ensure the `token` cookie was successfully set as `HttpOnly` and `Secure`. I verified the protected API behavior by running the two mandatory `curl.exe` tests in the terminal against my live Render URL; both the unauthenticated request and the forged JWT request successfully returned a `401 Unauthorized` response, proving the server strictly verifies the token signature.
* **Verification of CRUD and User Data Ownership:** I verified CRUD behavior by creating, viewing, editing, and deleting prompt records in the deployed dashboard and confirming the UI updated correctly. I verified user data ownership by reviewing the SQL queries in `backend/server.js` to ensure every `SELECT`, `UPDATE`, and `DELETE` operation includes a `WHERE user_id = ?` clause derived directly from the verified JWT payload, meaning a user can never access or modify another user's records.
* **Implementation/Deployment Decision:** I decided to serve the compiled Vite React frontend directly through the Express backend as static files (`app.use(express.static(...))`) and deploy them together as a single Web Service on Render. I chose this approach because it ensures the frontend and backend share the exact same origin, which completely eliminates complex CORS configuration and avoids third-party cross-site cookie blocking issues on modern browsers.
