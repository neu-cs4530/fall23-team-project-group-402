/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as functions from 'firebase-functions'
// import * as logger from "firebase-functions/logger";

import * as functions from "firebase-functions";
// import * as express from "express";
import * as admin from "firebase-admin";

admin.initializeApp();

export const getScores = functions.https.onRequest(async (req, res) => {
  try {
    const db = admin.firestore();

    // Reference to the top_scores document
    const docRef = db.collection("tricks").doc("top_scores");

    // Get the document snapshot
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      res.status(404).send("Document not found");
      return;
    }

    const data = docSnapshot.data();
    if (!data || !data.scores || !Array.isArray(data.scores)) {
      res.status(500).send("Invalid data structure in document");
      return;
    }

    // Extract scores from the document and return as an array
    const scoresArray = data.scores.map((score:
      { initials: string; score: number }) => ({
      initials: score.initials,
      score: score.score,
    }));

    res.status(200).json(scoresArray);
  } catch (error) {
    console.error("Error fetching scores:", error);
    res.status(500).send("Error fetching scores");
  }
});

// Create an Express app
// const app = express();

// // Define a route
// // app.get("*", (req, res) => {
// //   return res.status(200).send("Test");
// // });

// // HTTP function using Express app
// // export const helloWorld = functions.https.onRequest(app);
// // exports.helloWorld = functions.https.onRequest(app);

// app.get("/hello", async (req, res) => {
//   return res.status(200).json({message: "Test"});
// });

// exports.hello = functions.https.onRequest(app);


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
