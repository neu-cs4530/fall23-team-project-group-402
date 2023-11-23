import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { nanoid } from 'nanoid';
import React from 'react';
import { GameResult } from '../../../../types/CoveyTownSocket';
import VehicleTrickLeaderboard from './VehicleTrickLeaderboard';
import userEvent from '@testing-library/user-event';

describe('[T4] Leaderboard', () => {
  // Spy on console.error and intercept react key warnings to fail test
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParms: any[]]>;
  beforeAll(() => {
    // Spy on console.error and intercept react key warnings to fail test
    consoleErrorSpy = jest.spyOn(global.console, 'error');
    consoleErrorSpy.mockImplementation((message?, ...optionalParams) => {
      const stringMessage = message as string;
      if (stringMessage.includes && stringMessage.includes('children with the same key,')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      } else if (stringMessage.includes && stringMessage.includes('warning-keys')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      }
      // eslint-disable-next-line no-console -- we are wrapping the console with a spy to find react warnings
      console.warn(message, ...optionalParams);
    });
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  const results: GameResult[] = [
    { gameID: nanoid(), scores: { ['ABY']: 100 } },
    { gameID: nanoid(), scores: { ['SWE']: 2000 } },
    { gameID: nanoid(), scores: { ['JOB']: 300 } },
    { gameID: nanoid(), scores: { ['JOB']: 500 } },
  ];
  function checkRow(row: HTMLElement, player: string, high_score: number) {
    const columns = within(row).getAllByRole('gridcell');
    expect(columns).toHaveLength(2);
    expect(columns[0]).toHaveTextContent(player);
    expect(columns[1]).toHaveTextContent(high_score.toString());
  }

  it('should render a table with the correct headers', () => {
    render(<VehicleTrickLeaderboard results={results} isPersistent={false} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveTextContent('Player');
    expect(headers[1]).toHaveTextContent('High Score');
  });
  it('should have an interactable tooltip next to Player header (non-persistent storage)', async () => {
    render(<VehicleTrickLeaderboard results={results} isPersistent={false} />);
    try {
      await screen.findByText('tooltip');
      throw new Error('Tooltip was found when it should not be present');
    } catch (error) {
      if ((error as Error).message !== 'Tooltip was found when it should not be present') {
        // Test passes because findByText threw an error, meaning the tooltip was not found
      } else {
        // Test fails because the tooltip was found
        throw error;
      }
    }
    fireEvent.mouseOver(screen.getByText('ⓘ'));
    expect(await screen.findByText('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByText('ⓘ'));
    setTimeout(async () => {
      try {
        await screen.findByText('tooltip');
        throw new Error('Tooltip was found when it should not be present');
      } catch (error) {
        if ((error as Error).message !== 'Tooltip was found when it should not be present') {
          // Test passes because findByText threw an error, meaning the tooltip was not found
        } else {
          // Test fails because the tooltip was found
          throw error;
        }
      }
    }, 1000);
  });
  it('should render a row for each player and consolidate duplicates if database non-persistent', () => {
    render(<VehicleTrickLeaderboard results={results} isPersistent={false} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4);
  });
  it('should render a row for each player and not consolidate duplicates if database persistent', () => {
    render(<VehicleTrickLeaderboard results={results} isPersistent={true} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(5);
  });
  it('should render the players in order of wins', () => {
    render(<VehicleTrickLeaderboard results={results} isPersistent={false} />);
    const rows = screen.getAllByRole('row');
    checkRow(rows[1], 'SWE', 2000);
    checkRow(rows[2], 'JOB', 500);
    checkRow(rows[3], 'ABY', 100);
  });
});
