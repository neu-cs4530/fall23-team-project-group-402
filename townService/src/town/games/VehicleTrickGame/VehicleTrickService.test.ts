import { mockClear } from 'jest-mock-extended';
import axios from 'axios';
import VehicleTrickService from './VehicleTrickService';
import { VehicleTrickScore } from '../../../types/CoveyTownSocket';

describe('VehicleTrickService', () => {
  let service: VehicleTrickService;
  let getSpy: jest.SpyInstance;
  let postSpy: jest.SpyInstance;
  const topScoresURL = 'https://us-central1-covey402.cloudfunctions.net/topScores';
  const mockData: VehicleTrickScore[] = [
    { initials: 'ABC', score: 400 },
    { initials: 'DEF', score: 300 },
    { initials: 'GHI', score: 200 },
  ];

  beforeEach(() => {
    service = new VehicleTrickService();
    getSpy = jest.spyOn(axios, 'get');
    postSpy = jest.spyOn(axios, 'post');
    mockClear(getSpy);
    mockClear(postSpy);
  });

  describe('getTopScores', () => {
    it('throws an error if the request throws an error', async () => {
      getSpy.mockRejectedValue(new Error('test error'));

      await expect(service.getTopScores()).rejects.toThrowError();
      expect(getSpy).toHaveBeenCalledWith(topScoresURL);
      expect(postSpy).not.toHaveBeenCalled();
      expect.assertions(3);
    });
    it('retrieves the top scores', async () => {
      const mockResponse = { data: mockData };
      getSpy.mockResolvedValue(mockResponse);

      await expect(service.getTopScores()).resolves.toEqual(mockData);
      expect(getSpy).toHaveBeenCalledWith(topScoresURL);
      expect(postSpy).not.toHaveBeenCalled();
      expect.assertions(3);
    });
  });
  describe('addScore', () => {
    it('throws an error if the request throws an error', async () => {
      postSpy.mockRejectedValue(new Error('test error'));
      const newScore: VehicleTrickScore = { initials: 'XYZ', score: 100 };

      await expect(service.addScore(newScore)).rejects.toThrowError();
      expect(postSpy).toHaveBeenCalledWith(topScoresURL, newScore);
      expect(getSpy).not.toHaveBeenCalled();
      expect.assertions(3);
    });
    it('retrieves the updated scores', async () => {
      const newScore: VehicleTrickScore = { initials: 'XYZ', score: 100 };
      const updatedScores = [...mockData, newScore];
      const mockResponse = { data: updatedScores };
      postSpy.mockResolvedValue(mockResponse);

      await expect(service.addScore(newScore)).resolves.toEqual(updatedScores);
      expect(postSpy).toHaveBeenCalledWith(topScoresURL, newScore);
      expect(getSpy).not.toHaveBeenCalled();
      expect.assertions(3);
    });
  });
});
