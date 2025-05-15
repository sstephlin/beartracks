# BearTracks
###  *A Course Planning Tool for Brown University Computer Science Students*
BearTracks is a full-stack web application that helps Brown University students concentrating in either the A.B. or Sc.B. for Computer Science plan and track their courses across semesters, check course prerequisites, and visualize their concentration requirements.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributors](#contributors)

---

## Features

- Add, move, or remove courses across semesters with drag-and-drop
- Persistent storage of course plans by user ID
- Prerequisite validation and capstone selection
- Degree requirement breakdown (A.B. and Sc.B.)
- Manual course entry for non-CSCI courses
- Responsive UI with horizontal semester navigation

---

## Tech Stack

**Frontend:**

- React + TypeScript
- Tailwind CSS + Custom Styles
- Clerk (User Authentication)

**Backend:**

- Java with Spark HTTP Framework
- Firebase Firestore (for user data)

---

## Setup & Installation

### Prerequisites

- Node.js & npm
- Java 17+
- Firebase account + setup
- Clerk account for authentication (optional)

### Frontend

```bash
cd frontend
npm install
npm run start
```

### Backend
```bash
cd backend
mvn package
Run the Server.java file
```
---

## Usage

1. Log in or sign up.

2. Add semesters and drag courses into each term. Drag courses into the trash icon as needed.

3. Manually add non-CSCI courses as needed.

4. Mark a course as a capstone (only one allowed at a time).

5. Track your progress toward the degree.

---

## Project Structure

```bash
frontend/ # Frontend React app (TypeScript)
│ ├── cache_semesters/ # Scripts and data for course prerequisites
│ ├── public/ # Static files
│ ├── src/
│ │ ├── assets/ # Icons and images
│ │ ├── components/ # React components (Sidebar, Carousel, etc.)
│ │ ├── hooks/ # Custom React hooks
│ │ ├── styles/ # CSS modules for styling components
│ │ ├── utils/ # Utility functions (e.g., prereq checking)
│ │ ├── main.tsx # App entry point
│ │ ├── types.ts # Shared type definitions
│ ├── tests/ # Frontend Playwright tests
│ │ └── e2e/ # End-to-end tests
├── server/ # Java backend
│ ├── src/
│ │ ├── main/
│ │ │ └── java/edu/brown/cs/student/
│ │ │ ├── handlers/ # Spark route handlers
│ │ │ ├── parser/ # CSV + prereq tree parsing
│ │ │ ├── storage/ # Firebase/Firestore interfaces
│ │ │ ├── concentrationRequirements/ # AB/ScB requirement rules
│ │ │ └── Server.java # Main Spark entry point
│ │ ├── test/ # Java unit/integration tests
└── README.md
```

---

## Contributors
- Noah Lim
- Noreen Chen
- Stephanie Lin
- Sue An Park
