const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

// =========================================================
// 1. DOCTOR APPROVAL TRIGGER
// Runs when Admin changes status to 'approved'
// =========================================================
exports.onApplicationApproved = functions.firestore
  .document("doctor_applications/{appId}")
  .onUpdate(async (change, context) => {
    
    const newData = change.after.data();
    const previousData = change.before.data();
    const docId = context.params.appId;

    // Check if the status changed to 'approved'
    if (newData && newData.status === "approved" && previousData.status !== "approved") {
      
      console.log(`Processing approval for doctor application: ${docId}`);
      
      const email = newData.email;
      const name = newData.fullName;
      
      // Generate a temporary password (e.g., "MediPortal5821")
      const tempPassword = "MediPortal" + Math.floor(1000 + Math.random() * 9000);

      try {
        // Create the User in Firebase Authentication
        const userRecord = await admin.auth().createUser({
          email: email,
          password: tempPassword,
          displayName: name,
        });

        console.log(`Successfully created new doctor user: ${userRecord.uid}`);

        // Create the User Document in Firestore 'users' collection
        await admin.firestore().collection("users").doc(userRecord.uid).set({
          fullName: name,
          email: email,
          role: "doctor",
          phone: newData.phone || "",
          license: newData.license || "",
          hospital: newData.hospital || "",
          cid: newData.cid || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isFirstLogin: true // Triggers the ChangePassword.jsx redirect
        });

        // Update the Application doc to link to the new User ID
        await change.after.ref.update({
          linkedUserId: userRecord.uid,
          tempPasswordAssigned: tempPassword,
          status: "approved"
        });

        console.log("Doctor profile created and linked.");

      } catch (error) {
        console.error("Error creating doctor account:", error);
      }
    }
    return null;
  });


// =========================================================
// 2. PATIENT REGISTRATION TRIGGER (UPDATED)
// Handles: Account Creation + Case Creation + Team Invites
// =========================================================
exports.onPatientRegistered = functions.firestore
  .document("patient_registrations/{regId}")
  .onCreate(async (snap, context) => {
    
    const data = snap.data();
    const regId = context.params.regId;
    console.log(`Processing patient registration for: ${data.email}`);

    // Generate a temporary password for the patient
    const tempPassword = "Patient" + Math.floor(1000 + Math.random() * 9000);

    try {
      // --- STEP 1: Create Patient Account in Firebase Auth ---
      const userRecord = await admin.auth().createUser({
        email: data.email,
        password: tempPassword,
        displayName: data.fullName,
      });

      console.log(`Patient Auth created: ${userRecord.uid}`);

      // Create Patient Profile in Firestore 'users'
      await admin.firestore().collection("users").doc(userRecord.uid).set({
        fullName: data.fullName,
        email: data.email,
        role: "patient",
        phone: data.phone || "",
        cid: data.cid || "",
        dob: data.dob || "",
        gender: data.gender || "Male",
        medicalHistory: data.medicalHistory || "",
        createdByDoctorId: data.createdByDoctorId, // Links patient to the specific doctor
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isFirstLogin: true, 
        tempPasswordAssigned: tempPassword // Stored for the doctor to give to the patient
      });

      // --- STEP 2: Handle Clinical Case (If checkbox was checked) ---
      let newCaseId = null;
      
      if (data.initialCase) {
        console.log("Creating clinical case...");
        
        // Create the Case Document
        const caseRef = await admin.firestore().collection("cases").add({
          title: data.initialCase.title,
          description: data.initialCase.description,
          patientId: userRecord.uid,
          patientName: data.fullName,
          leadDoctorId: data.createdByDoctorId, // The creator is the lead
          status: "active",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          teamMembers: [data.createdByDoctorId] // Start with the lead doctor in the team
        });
        
        newCaseId = caseRef.id;

        // --- STEP 3: Handle Team Invitations ---
        const invitedEmails = data.initialCase.invitedEmails || [];
        
        for (const email of invitedEmails) {
          try {
            // Find the doctor/user with this email
            const invitedUser = await admin.auth().getUserByEmail(email);
            
            // Add them to the case team array
            await caseRef.update({
              teamMembers: admin.firestore.FieldValue.arrayUnion(invitedUser.uid)
            });

            // Send In-App Notification to that doctor
            // (We write to their 'notifications' subcollection)
            await admin.firestore().collection("users").doc(invitedUser.uid).collection("notifications").add({
              type: "case_invite",
              title: "New Case Invitation",
              message: `Dr. ${data.doctorName} invited you to join case: ${data.initialCase.title}`,
              caseId: caseRef.id,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Invitation sent to ${email}`);
          } catch (err) {
            console.log(`Could not invite ${email} (User may not exist or not found):`, err.message);
          }
        }
      }

      // --- STEP 4: Finalize Request ---
      // Mark registration as complete and link everything
      await snap.ref.update({
        status: "completed",
        linkedUserId: userRecord.uid,
        generatedPassword: tempPassword,
        createdCaseId: newCaseId
      });

      console.log("Patient registration flow completed successfully.");

    } catch (error) {
      console.error("Error in patient registration flow:", error);
      
      // Mark the registration as failed so the doctor knows
      await snap.ref.update({ 
        status: "error", 
        errorMessage: error.message 
      });
    }
    return null;
  });