import { fireEvent, render, screen, within } from '@testing-library/react';
import { nanoid } from 'nanoid';
import React from 'react';
import { GameResult } from '../../../../types/CoveyTownSocket';
import VehicleTrickLeaderboard from './VehicleTrickLeaderboard';

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
  function checkRow(row: HTMLElement, rank: number, player: string, high_score: number) {
    const columns = within(row).getAllByRole('gridcell');
    expect(columns).toHaveLength(3);
    expect(columns[0]).toHaveTextContent(rank.toString());
    expect(columns[1]).toHaveTextContent(player);
    expect(columns[2]).toHaveTextContent(high_score.toString());
  }
  async function checkForTooltip(present: boolean) {
    if (present) {
      expect(await screen.findByText('tooltip')).toBeInTheDocument();
    } else {
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
    }
  }
  async function checkTooltipText(persistentLeaderboard: boolean) {
    const tooltipText = persistentLeaderboard
      ? 'leaderboard does not consolidate'
      : 'leaderboard consolidates';

    const tooltip = await screen.findByText('tooltip');
    expect(tooltip.parentElement).toHaveTextContent(tooltipText);
  }

  it('should render a table with the correct headers', () => {
    render(<VehicleTrickLeaderboard results={results} isPersistent={false} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('Rank');
    expect(headers[1]).toHaveTextContent('Player');
    expect(headers[2]).toHaveTextContent('High Score');
  });
  describe('tooltip behaviors', () => {
    it('should have an interactable tooltip next to Player header (non-persistent storage)', async () => {
      render(<VehicleTrickLeaderboard results={results} isPersistent={false} />);
      await checkForTooltip(false);
      fireEvent.mouseOver(screen.getByText('ⓘ'));
      await checkForTooltip(true);
      fireEvent.mouseLeave(screen.getByText('ⓘ'));
      setTimeout(async () => {
        await checkForTooltip(false);
      }, 1000);
    });
    it('interactable tooltip should have correct text (non-persistent storage)', async () => {
      render(<VehicleTrickLeaderboard results={results} isPersistent={false} />);
      fireEvent.mouseOver(screen.getByText('ⓘ'));
      await checkForTooltip(true);
      await checkTooltipText(false);
    });
    it('interactable tooltip should have correct text (persistent storage)', async () => {
      render(<VehicleTrickLeaderboard results={results} isPersistent={true} />);
      fireEvent.mouseOver(screen.getByText('ⓘ'));
      await checkForTooltip(true);
      await checkTooltipText(true);
    });
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
    checkRow(rows[1], 1, 'SWE', 2000);
    checkRow(rows[2], 2, 'JOB', 500);
    checkRow(rows[3], 3, 'ABY', 100);
  });
});
