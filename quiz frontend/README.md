# Quiz Arena — React frontend

Frontend only. Talks to a backend you build via REST (`src/api.js`) and a
WebSocket (`src/socket.js`). Nothing here stores real data — swap the base
URLs in `.env` and it's live.

## Run it

```
npm install
cp .env.example .env   # point at your backend
npm run dev
```

## File map (kept minimal, one job per file)

```
src/
  api.js                  every REST call, in one place — this IS the API contract
  socket.js                WebSocket connection + quiz room subscription
  context/AuthContext.jsx  JWT session (localStorage) + login/register/logout
  components/
    ProtectedRoute.jsx     route guard (auth + role)
    Navbar.jsx              top bar
    Leaderboard.jsx          shared scoreboard (live + final)
  pages/
    Auth.jsx                login / register (tab toggle, one file)
    Home.jsx                 role-based redirect
    AdminDashboard.jsx        list + create quizzes
    AdminQuizManage.jsx       add questions -> READY -> start -> host LIVE view
    UserDashboard.jsx         browse + join quizzes
    UserQuizPlay.jsx          waiting room -> answer live -> final results
  App.jsx                   routes
```

## Backend contract

### REST (`VITE_API_URL`, default `http://localhost:4000/api`)

| Method | Path                          | Who   | Body                                          | Notes |
|--------|-------------------------------|-------|------------------------------------------------|-------|
| POST   | /auth/register                | any   | `{username,password,role}`                    | role: `ADMIN` or `USER` |
| POST   | /auth/login                   | any   | `{username,password}`                          | both return `{token, user}` |
| GET    | /quizzes                      | auth  | -                                               | list all |
| GET    | /quizzes/:id                  | auth  | -                                               | one quiz |
| POST   | /quizzes                      | admin | `{title}`                                       | creates DRAFT |
| POST   | /quizzes/:id/questions        | admin | `{text,options[4],correctIndex,points,duration}`| |
| PATCH  | /quizzes/:id/status           | admin | `{status:"READY"}`                              | |
| POST   | /quizzes/:id/start            | admin | -                                                | -> LIVE, starts Q1 timer |
| POST   | /quizzes/:id/next             | admin | -                                                | advance Q, or -> COMPLETED if last |
| POST   | /quizzes/:id/join             | user  | -                                                | adds caller to participants |
| POST   | /quizzes/:id/answer           | user  | `{optionIndex}`                                  | -> `{correct, earned, quiz}` |

**Quiz shape** returned everywhere:
```js
{
  id, title, status: "DRAFT"|"READY"|"LIVE"|"COMPLETED",
  questions: [{ id, text, options: string[4], points, duration }], // hide correctIndex from players
  currentQuestionIndex, questionEndsAt, // epoch ms, server-owned
  participants: string[],
  scores: { [username]: number },
  answeredThisQuestion: { [username]: { optionIndex, correct, earned, correctIndex } }
}
```

### WebSocket (`VITE_SOCKET_URL`, default `http://localhost:4000`)

- Client connects with `{ auth: { token } }`, emits `quiz:watch {quizId}` to join a room.
- Server should emit `quiz:update` (full Quiz object) to room `quiz:<id>` on: join, answer/score change, question advance, completion.
- **The server owns the countdown.** When `questionEndsAt` passes, the server should auto-advance the question (same as `/next`) and broadcast the update -- don't rely on clients to expire the timer.
