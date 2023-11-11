import * as fs from 'fs';
import { mockClear } from 'jest-mock-extended';
import TrickWordGenerator, {
  FILE_ERROR_MESSAGE,
  WORD_LIST_NOT_LOADED_MESSAGE,
} from './TrickWordGenerator';

// Need to put outside of describe since fs is a module
jest.mock('fs');

describe('TrickWordGenerator', () => {
  const wordList = ['apple', 'banana', 'clementine'];
  let wordGenerator: TrickWordGenerator;
  let readFileSpy: jest.SpyInstance;
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    wordGenerator = new TrickWordGenerator();
    readFileSpy = jest.spyOn(fs, 'readFileSync');
    readFileSpy.mockReturnValue('apple\nbanana\nclementine');
    randomSpy = jest.spyOn(Math, 'random');

    mockClear(readFileSpy);
    mockClear(randomSpy);
  });
  describe('loadWords', () => {
    it('throws an error if reading the file failed', () => {
      readFileSpy.mockImplementation(() => {
        throw new Error('test');
      });
      expect(() => {
        wordGenerator.loadWords();
      }).toThrowError(new Error(FILE_ERROR_MESSAGE));
      expect(readFileSpy).toHaveBeenCalled();
    });
    it('loads the words correctly', () => {
      wordGenerator.loadWords();

      // Check words loaded by grabbing one of the loaded words
      const nextWord = wordGenerator.nextWord();
      expect(wordList).toContain(nextWord);
      expect(readFileSpy).toHaveBeenCalled();
    });
  });
  describe('nextWord', () => {
    it('throws an error if the word list has not been loaded yet', () => {
      expect(() => {
        wordGenerator.nextWord();
      }).toThrowError(new Error(WORD_LIST_NOT_LOADED_MESSAGE));
      expect(readFileSpy).not.toHaveBeenCalled();
      expect(randomSpy).not.toHaveBeenCalled();
    });
    it('returns a random word from the loaded words', () => {
      wordGenerator.loadWords();
      randomSpy.mockReturnValue(0.1); // floor(0.1 * 3) = index 0

      expect(wordGenerator.nextWord()).toEqual(wordList[0]);
      expect(randomSpy).toHaveBeenCalled();

      randomSpy.mockClear();
      randomSpy.mockReturnValue(0.5); // floor(0.5 * 3) = index 1

      expect(wordGenerator.nextWord()).toEqual(wordList[1]);
      expect(randomSpy).toHaveBeenCalled();
    });
  });
});
