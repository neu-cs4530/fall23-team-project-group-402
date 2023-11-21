import { Table, Tbody, Td, Thead, Tooltip, Tr } from '@chakra-ui/react';
import React from 'react';
import { GameResult } from '../../../../types/CoveyTownSocket';
import { nanoid } from 'nanoid';

/**
 * Represents a row in the leaderboard.
 */
type LeaderboardRow = {
  initials: string;
  score: number;
};

/**
 * A component that renders a list of GameResult's as a leaderboard, formatted as a table with the following columns:
 * - Player: the three letter username for the player
 * - Score: the player's highest score
 * Each column has a header (a table header `th` element) with the name of the column.
 *
 *
 * The table is sorted by score, with the player with the highest score at the top.
 *
 * @returns
 */
export default function VehicleTrickLeaderboard({
  results,
  isPersistent,
}: {
  results: GameResult[];
  isPersistent: boolean;
}): JSX.Element {
  const localLeaderboardTooltip = 'This leaderboard consolidates duplicate username entries';
  const persistentLeaderboardTooltip =
    'This leaderboard does not consolidate duplicate username entries';

  /**
   * Creates the leaderboard rows to render given the game's history.
   * Note, for the current session leaderboard, only the highest score for each initial
   * is kept. For the persistent leaderboard, no filtering is done.
   * @returns The list of leaderboard rows to render
   */
  function leaderboardRows(): LeaderboardRow[] {
    const leaderboardList: LeaderboardRow[] = [];

    for (const result of results) {
      const resultScores = result.scores;
      const player = Object.keys(resultScores)[0]; // Only 1 player per result
      const playerScore = resultScores[player];

      if (!isPersistent) {
        const existingScoreIndex = leaderboardList.findIndex(row => row.initials === player);

        if (existingScoreIndex !== -1) {
          if (leaderboardList[existingScoreIndex].score < playerScore) {
            leaderboardList.splice(existingScoreIndex, 1);
            leaderboardList.push({ initials: player, score: playerScore });
          }
        } else {
          leaderboardList.push({ initials: player, score: playerScore });
        }
      } else {
        leaderboardList.push({ initials: player, score: playerScore });
      }
    }

    if (!isPersistent) {
      // The persistent leaderboard should already be sorted from the API call
      leaderboardList.sort((score1, score2) => {
        return score2.score - score1.score;
      });
    }

    return leaderboardList;
  }

  return (
    <Table>
      <Thead>
        <Tr>
          <th>
            <span style={{ marginRight: '5px' }}>Player</span>
            <Tooltip
              label={isPersistent ? persistentLeaderboardTooltip : localLeaderboardTooltip}
              placement='bottom-start'>
              ⓘ
            </Tooltip>
          </th>
          <th>High Score</th>
        </Tr>
      </Thead>
      <Tbody>
        {leaderboardRows().map(record => {
          return (
            <Tr key={nanoid()}>
              <Td textAlign={'center'}>{record.initials}</Td>
              <Td textAlign={'center'}>{record.score}</Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}
