import { Box, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
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

  // /**
  //  * Creates the leaderboard rows to render given the game's history.
  //  * Note, for the current session leaderboard, only the highest score for each initial
  //  * is kept. For the persistent leaderboard, no filtering is done.
  //  * @returns The list of leaderboard rows to render
  //  */
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
    <Box
      overflowY='scroll'
      maxHeight='215px'
      css={{
        '&::-webkit-scrollbar': {
          width: '2px',
        },
        '&::-webkit-scrollbar-track': {
          width: '1px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'white',
          borderRadius: '1px',
        },
      }}
      mb={-20}>
      <Table>
        <Thead position={'sticky'} top={0} bgColor={'lightblue'}>
          <Tr>
            <Th
              textColor={'black'}
              textAlign={'center'}
              fontWeight={'medium'}
              fontFamily={'fantasy'}
              fontSize={15}
              borderBottom={'none'}>
              Rank
            </Th>
            <Th
              textColor={'black'}
              textAlign={'center'}
              fontWeight={'medium'}
              fontFamily={'fantasy'}
              fontSize={15}
              borderBottom={'none'}>
              Initials
            </Th>
            <Th
              textColor={'black'}
              textAlign={'center'}
              fontWeight={'medium'}
              fontFamily={'fantasy'}
              fontSize={15}
              borderBottom={'none'}>
              Score
            </Th>
          </Tr>
        </Thead>
        <Tbody style={{ overflowY: 'auto' }} textAlign={'center'}>
          {leaderboardRows().map(record => {
            const playerIndex = leaderboardRows().findIndex(
              player => player.initials === record.initials && player.score === record.score,
            );

            return (
              <Tr key={nanoid()}>
                <Td
                  textColor={'black'}
                  textAlign={'center'}
                  maxWidth={30}
                  fontWeight={'medium'}
                  fontFamily={'fantasy'}
                  fontSize={15}
                  borderBottom={'none'}>
                  {playerIndex + 1}
                </Td>
                <Td
                  textColor={'black'}
                  textAlign={'center'}
                  maxWidth={30}
                  fontWeight={'medium'}
                  fontFamily={'fantasy'}
                  fontSize={15}
                  borderBottom={'none'}>
                  {record.initials}
                </Td>
                <Td
                  textColor={'black'}
                  textAlign={'center'}
                  maxWidth={30}
                  fontWeight={'medium'}
                  fontFamily={'fantasy'}
                  fontSize={15}
                  borderBottom={'none'}>
                  {record.score}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
