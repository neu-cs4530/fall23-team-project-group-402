import { mockClear } from 'jest-mock-extended';
import TrickWordGenerator from './TrickWordGenerator';

describe('TrickWordGenerator', () => {
  let wordGenerator: TrickWordGenerator;
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    wordGenerator = new TrickWordGenerator();
    randomSpy = jest.spyOn(Math, 'random');

    mockClear(randomSpy);
  });
  describe('nextWord', () => {
    it('returns a random word from the loaded words', () => {
      randomSpy.mockReturnValue(0.1);

      expect(wordGenerator.nextWord()).toEqual('trance');
      expect(randomSpy).toHaveBeenCalled();

      randomSpy.mockClear();
      randomSpy.mockReturnValue(0.5);

      expect(wordGenerator.nextWord()).toEqual('safari');
      expect(randomSpy).toHaveBeenCalled();
    });
  });
});
