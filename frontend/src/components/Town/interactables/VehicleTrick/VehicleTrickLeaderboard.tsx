import { Table, Tbody, Td, Thead, Tr } from '@chakra-ui/react';
import React from 'react';
import { GameResult } from '../../../../types/CoveyTownSocket';

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
}: {
  results: GameResult[];
}): JSX.Element {
  const highScoreByPlayer: Record<string, { player: string; highScore: number }> = {};
  results.forEach(result => {
    const player = Object.keys(result.scores)[0];
    const playerCurrentScore = Object.values(result.scores)[0];
    const playerHighestScore = highScoreByPlayer[player]?.highScore || 0;

    highScoreByPlayer[player] = {
      player: player,
      highScore: playerCurrentScore > playerHighestScore ? playerCurrentScore : playerHighestScore,
    };
  });

  const rows = Object.keys(highScoreByPlayer).map(player => highScoreByPlayer[player]);
  rows.sort((a, b) => b.highScore - a.highScore);
  return (
    <Table>
      <Thead>
        <Tr>
          <th>Player</th>
          <th>HighScore</th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map(record => {
          return (
            <Tr key={record.player}>
              <Td textAlign={'center'}>{record.player}</Td>
              <Td textAlign={'center'}>{record.highScore}</Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}
