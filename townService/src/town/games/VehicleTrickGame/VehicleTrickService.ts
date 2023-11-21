import axios from 'axios';
import { VehicleTrickScore } from '../../../types/CoveyTownSocket';

/**
 * The base path for our Firebase Cloud Functions.
 */
const SERVER_URL = 'https://us-central1-covey402.cloudfunctions.net';

/**
 * Class used to send HTTP requests to Firebase for score
 * persistance in the vehicle trick game.
 */
export default class VehicleTrickService {
  /**
   * Retrieves the top vehicle trick scores from the database.
   * Errors are propagated to the caller.
   * @returns The fetched top vehicle trick scores
   */
  async getTopScores(): Promise<VehicleTrickScore[]> {
    const response = await axios.get(`${SERVER_URL}/topScores`);
    return response.data;
  }

  /**
   * Adds a new score to the database. Note, the new score will only be added
   * if it would be in the top 10 of all time scores.
   * Errors are propagated to the caller.
   * @param scoreToAdd The score acheived in the vehicle trick game
   * @returns The updated top list of scores
   */
  async addScore(scoreToAdd: VehicleTrickScore): Promise<VehicleTrickScore[]> {
    const response = await axios.post(`${SERVER_URL}/topScores`, scoreToAdd);
    return response.data;
  }
}
