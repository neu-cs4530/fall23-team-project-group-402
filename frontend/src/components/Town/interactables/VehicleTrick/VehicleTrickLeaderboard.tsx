import { Box, Container, Divider, Table, Tbody, Td, Thead, Tr } from '@chakra-ui/react';
import React, { useState } from 'react';
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
  playerID,
}: {
  results: GameResult[];
  playerID: string;
}): JSX.Element {
  const [currentUserHighScore, setCurrentUserHighScore] = useState(0);

  const highScoreByPlayer: Record<string, { player: string; highScore: number }> = {};
  results.forEach(result => {
    const player = Object.keys(result.scores)[0];
    const playerCurrentScore = Object.values(result.scores)[0];
    const playerHighestScore = highScoreByPlayer[player]?.highScore || 0;
    const maxScore =
      playerCurrentScore > playerHighestScore ? playerCurrentScore : playerHighestScore;
    // Only display 3 letter usernames and not user ID values
    if (player.length === 3) {
      highScoreByPlayer[player] = {
        player: player,
        highScore: maxScore,
      };
    } else if (player === playerID) {
      setCurrentUserHighScore(playerHighestScore);
    }
    // Add logic to update currentuserhighscore
  });

  const rows = Object.keys(highScoreByPlayer).map(player => highScoreByPlayer[player]);
  rows.sort((a, b) => b.highScore - a.highScore);
  return (
    <Container>
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
      <Divider my={4} />
      <Box>
        <b>High Score This Session: {currentUserHighScore}</b>
      </Box>
    </Container>
  );
}
