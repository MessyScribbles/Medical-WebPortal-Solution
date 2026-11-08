# MediPortal

A telemedicine web platform that connects doctors and patients, with role-based portals, real-time chat, video consultations, appointment scheduling and digital medical records.

Built with React and Firebase as a COOP project, to practice real-time data, role-based authentication and WebRTC calling.

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?logo=webrtc&logoColor=white)

## Screenshots

<!-- Replace with real images, for example: -->
<!-- ![Doctor dashboard](screenshots/doctor-dashboard.png) -->

## Features

- **Role-based access:** separate portals for administrators, doctors and patients
- **Real-time chat:** instant messaging between a doctor and their patients
- **Video consultations:** video and voice calls over WebRTC
- **Appointments:** patients request appointments and doctors manage them
- **Medical records:** digital case files and patient history
- **Admin dashboard:** verify doctors and manage users

## Tech stack

| Layer | Technology |
| :--- | :--- |
| Frontend | React, react-slick (carousel) |
| Authentication | Firebase Authentication (email and password) |
| Database | Cloud Firestore |
| Backend logic | Firebase Cloud Functions |
| Calls | WebRTC |

## How it works

The workflow imitates a real clinic:

1. **Doctor registration.** A doctor signs up through the registration page. The account starts as `pending`.
2. **Verification.** An administrator reviews the application (license and hospital information) and approves the account.
3. **Patient onboarding.** Once approved, the doctor logs in and registers their patients. This generates the patients' login credentials.
4. **Consultation.** Patients log in with those credentials. They can view their medical file, request appointments, chat with their doctor and answer video calls started by the doctor.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) (a current LTS version is recommended)
- npm
- A Google account for Firebase

### Install

```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

If the carousel does not load, install it explicitly:

```bash
npm install react-slick slick-carousel
```

### Firebase setup

The app depends on Firebase for authentication and data, so you need your own project.

1. Create a project in the [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication** with the **Email/Password** provider.
3. Enable **Firestore Database**.
4. Register a web app in the project settings and copy its configuration keys.
5. Open `src/firebase.js` and replace the placeholder values with your keys.

> **Billing:** this project uses Cloud Functions, which requires the **Blaze (pay-as-you-go)** plan. You are not charged while you stay inside the free tier, but a billing account must be attached before you can deploy functions.

### Firestore rules (development only)

For local testing, paste these rules into **Firestore Database → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> **Warning:** these rules let anyone read and write the whole database, including medical data. Use them only on a throwaway project with fake data. Never deploy the app with these rules or with real patient information. Before any real use, replace them with rules that check `request.auth` and the user's role.

### Run

```bash
npm start
```

The app opens at `http://localhost:3000`.

## Create the first administrator

There is no public sign-up for administrators. Promote an account manually:

1. Start the app and register an account from the login page.
2. In the Firebase Console, open **Firestore Database → `users` collection**.
3. Find the document for that account.
4. Change its `role` field to `admin`.
5. Log in again. The admin dashboard is now available.

## Project status and limitations

- Course project, not intended for production or real medical use
- Firestore rules are open for development (see the warning above)
- Firebase keys are stored in `src/firebase.js`. For a public repository, move them to environment variables.

## Author

Mohamed El Hamzaoui

- GitHub: [@MessyScribbles](https://github.com/MessyScribbles)
