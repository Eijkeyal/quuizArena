# QuizArena FullStack 

QuizArena is a full-stack real-time multiplayer quiz application where users can participate in quizzes, answer questions, compete with other players, and view leaderboard results.

The project consists of a **Node.js/Express backend** and a **React + Vite frontend**.

## Project Structure

```text
QuizArena FullStack/
│
├── quiz backend/        # Backend API and Socket.IO server
│
├── quiz frontend/       # React frontend application
│
└── README.md
```

## Features

* User authentication and authorization
* Admin and user functionality
* Create and manage quizzes
* Add and manage quiz questions
* Participate in quizzes
* Submit answers
* Quiz results and score tracking
* Real-time quiz functionality
* Real-time messaging and quiz chat
* Conversation and message management
* Live leaderboard
* Socket.IO integration
* Quiz participant tracking
* Quiz timer functionality

## Technologies Used

### Backend

* Node.js
* Express.js
* MongoDB
* Socket.IO
* JWT Authentication

### Frontend

* React
* Vite
* Socket.IO Client
* CSS

## Installation

### Clone the repository

```bash
git clone https://github.com/Eijkeyal/quuizArena.git
cd quuizArena
```

## Backend Setup

```bash
cd "quiz backend"
npm install
```

Create a `.env` file and add the required environment variables.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
npm run dev
```

Or:

```bash
node server.js
```

## Frontend Setup

Open another terminal:

```bash
cd "quiz frontend"
npm install
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

## 📡 Real-Time Features

QuizArena uses Socket.IO to provide real-time functionality such as:

* Live quiz updates
* Real-time messaging
* Quiz chat
* Live leaderboard updates
* Quiz participation updates

## User Roles

### User

Users can:

* Register and log in
* Participate in quizzes
* Answer quiz questions
* View quiz results
* View leaderboards
* Use messaging and quiz chat features

### Admin

Admins can:

* Create quizzes
* Manage quizzes
* Add and manage questions
* Manage users
* Monitor quiz participants

## Future Improvements

* Quiz categories
* Quiz scheduling
* Improved analytics dashboard
* User profiles
* Notifications
* More advanced leaderboard features
* Deployment using Docker and cloud services

