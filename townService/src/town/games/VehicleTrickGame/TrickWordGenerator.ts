import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const F = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(F);

/**
 * The filename containing all of the allowed words.
 */
const WORDS_FILENAME = path.join(DIRNAME, 'trick_words.txt');

export const FILE_ERROR_MESSAGE = 'Unable to read the word list file';

export const WORD_LIST_NOT_LOADED_MESSAGE = 'Word list not yet loaded';

/**
 * Class used to load the allowed words for the trick game and
 * generate a random target word.
 */
export default class TrickWordGenerator {
  private _wordList?: string[];

  /**
   * Loads the all trick words from the file containing all of the words.
   * @throws Error if a file loading error occurs.
   */
  loadWords() {
    try {
      const data = fs.readFileSync(WORDS_FILENAME, 'utf-8');
      this._wordList = data.split('\n');
    } catch {
      throw new Error(FILE_ERROR_MESSAGE);
    }
  }

  /**
   * Randomly generates the next word for the trick game.
   * @returns The next word for the trick game
   * @throws Error if the word list has not been loaded yet
   */
  nextWord(): string {
    if (!this._wordList) {
      throw new Error(WORD_LIST_NOT_LOADED_MESSAGE);
    }
    const wordIndex = Math.floor(Math.random() * this._wordList.length);
    return this._wordList[wordIndex];
  }
}
