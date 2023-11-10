import * as fs from 'fs';
import InvalidParametersError from '../../../lib/InvalidParametersError';

const WORDS_FILENAME = 'trick_words.txt';

export default class TrickWordGenerator {
  private _wordList?: string[];

  /**
   * Loads the trick words from the file containing all of the words.
   */
  loadWords() {
    try {
      const data = fs.readFileSync(WORDS_FILENAME, 'utf-8');
      this._wordList = data.split('\n');
    } catch {
      throw new Error('Unable to read words from trick word list');
    }
  }

  /**
   * Randomly generates the next word for the trick game.
   * @returns The next word for the trick game
   */
  nextWord(): string {
    if (!this._wordList) {
      throw new InvalidParametersError('Word list not loaded');
    }
    const wordIndex = Math.floor(Math.random() * this._wordList.length);
    return this._wordList[wordIndex];
  }
}
