
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

MediPortal - Telemedicine Platform
This project was developed as part of my COOP Project class. The goal was to build a comprehensive medical portal that applies advanced web development concepts, including real-time database management, role-based authentication, and integrated video calling features using WebRTC.

It is a full-stack solution built with React and Firebase designed to bridge the gap between doctors and patients.

Key Features
Role-Based Access: Distinct portals for Administrators, Doctors, and Patients.

Real-Time Chat: Instant messaging between doctors and patients.

Video Consultations: Integrated video and voice calling functionality.

Appointment Management: Scheduling system for medical consultations.

Medical Records: Digital case files and history tracking.

Admin Dashboard: Complete oversight for verifying doctors and managing users.

Prerequisites
Before you begin, ensure you have the following installed:

Node.js (v14 or higher)

npm

Installation
Clone the repository to your local machine.

Open your terminal in the project folder and install the dependencies: npm install

If you encounter issues with the carousel, ensure you install it explicitly: npm install react-slick slick-carousel

Firebase Configuration
Firebase Account: You will need a Google Firebase project.

Important: This project uses Cloud Functions, which requires your Firebase project to be on the Blaze (Pay-as-you-go) Plan. You will not be charged if you stay within the free tier limits, but a billing account is required for deployment.
This project relies entirely on Firebase for authentication and database services. You will need to set up your own Firebase project for it to work.

Go to the Firebase Console and create a new project.

Enable Authentication (Email/Password provider).

Enable Firestore Database.

Copy your web app configuration keys from the project settings.

Open src/firebase.js in your code editor and replace the placeholder keys with your actual Firebase configuration.

Database Rules:

To ensure the application functions correctly during development and testing, go to the Firestore Database tab in your Firebase Console, select the Rules tab, and paste the following rules.

Note: These rules allow open read/write access and are intended for development or testing purposes only

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow anyone to read and write to the database (FOR DEVELOPMENT ONLY)
    match /{document=**} {
      allow read, write: if true;
    }
    
  }
}

How to Run
To start the development server:
npm start


Setting Up the Admin
The application does not have a public registration form for Administrators. To access the Admin Dashboard, you must manually promote a user in the database.

Run the application using npm start.

Go to the Login page.

Register a new account or attempt to login (which creates a user record in Authentication).

Go to your Firebase Console > Firestore Database > users collection.

Find the document corresponding to the user you just created.

Change the role field from "patient" or "doctor" to admin.

You can now log in as an Admin and manage the platform.

How it Works:
The workflow of the application is designed to mimic a real-world medical process:

Doctor Registration: A doctor signs up via the registration page. Their account is set to "pending" status.

Verification: The Admin logs in, reviews the doctor's application (license, hospital info), and approves their account and gets the .

Patient Onboarding: Once approved, the Doctor logs in and manually registers their patients. This generates credentials for the patient.

Interaction: The Patient logs in using the credentials provided by the doctor. They can now view their medical file, request appointments, chat, or accept video calls initiated by the doctor.

To view a demonstartio visit the video : https://youtu.be/2QCJRZo30FI

I hope this project helps anyone looking to understand how to build complex React applications with Firebase integration. 34add2264ec83422ce090d621aa83abbbd5e54f5
