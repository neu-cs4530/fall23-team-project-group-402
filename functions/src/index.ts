import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Endpoint: /topScores
 * Methods: GET, POST
 *
 * GET:
 *   - Retrieves the top 10 Vehicle Trick game stores from the database.
 *   - Response is a list of { "initials": string, "score": number } objects.
 * POST:
 *   - Attempts to add a new score to the database. The new score is represented
 *     in the request body as JSON: { "initials": string, "score": number }.
 *     The new score will only be added to the database if it would be in the
 *     top 10.
 *   - Response is a list of { "initials": string, "score": number } objects
 *     containing the top 10 scores, possibly including the score in the request
 *     body.
 *
 * ERRORS:
 *   - 404 if the top_scores Firestore document cannot be found
 *   - 405 if an HTTP method not in [GET, POST] is used
 *   - 500 if the top_scores document is formatted incorrectly or any other
 *     server error occurrs
 *
 * Invariants: The leaderboard will contain at most 10 scores at any time.
 *             Any time a new score is added, the database will be filtered
 *             to only contain the top 10 scores. Additionally, the scores
 *             in the database will always be sorted in descreasing order
 *             of score.
 */
export const topScores = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method === "GET" || req.method === "POST") {
      // Retrieve the scores from the top_scores Firestore document
      const db = admin.firestore();
      const docRef = db.collection("tricks").doc("top_scores");
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

      const scoresArray = data.scores.map((entry:
        { initials: string; score: number }) => ({
        initials: entry.initials,
        score: entry.score,
      }));

      if (req.method === "POST") {
        // Check if there is any score less than the new score
        const newScore = req.body;

        if (scoresArray.length < 10) {
          scoresArray.push(newScore);
        } else {
          // Since the list is always sorted we can just check the last score
          if (scoresArray[9].score < newScore.score) {
            scoresArray.pop();
            scoresArray.push(newScore);
          }
        }
        scoresArray.sort((entry1, entry2) => entry2.score - entry1.score);
        await docRef.update({"scores": scoresArray});
      }

      res.status(200).json(scoresArray);
    } else {
      res.status(405).send("Method not allowed");
    }
  } catch (error) {
    console.error("Error fetching scores:", error);
    res.status(500).send("Error fetching scores");
  }
});
