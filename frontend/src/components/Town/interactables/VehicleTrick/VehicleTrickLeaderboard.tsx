import {
  Box,
  Tab,
  Table,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
} from '@chakra-ui/react';
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
 * - Rank: The rank of the player in the leaderboard
 * - Player: the three letter username for the player
 * - Score: the player's highest score
 * Each column has a header with the name of the column.
 *
 *
 * The table is sorted by score, with the player with the highest score at the top.
 *
 * @returns
 */
export default function VehicleTrickLeaderboard({
  localResults,
  persistentResults,
}: {
  localResults: GameResult[];
  persistentResults: GameResult[];
}): JSX.Element {
  const localLeaderboardTooltip = 'This leaderboard consolidates duplicate username entries';
  const persistentLeaderboardTooltip =
    'This leaderboard does not consolidate duplicate username entries';
  const font = 'serif';
  // /**
  //  * Creates the leaderboard rows to render given the game's history.
  //  * Note, for the current session leaderboard, only the highest score for each initial
  //  * is kept. For the persistent leaderboard, no filtering is done.
  //  * @returns The list of leaderboard rows to render
  //  */
  function localLeaderboardRows(): LeaderboardRow[] {
    const leaderboardList: LeaderboardRow[] = [];

    for (const result of localResults) {
      const resultScores = result.scores;
      const player = Object.keys(resultScores)[0]; // Only 1 player per result
      const playerScore = resultScores[player];

      const existingScoreIndex = leaderboardList.findIndex(row => row.initials === player);

      if (existingScoreIndex !== -1) {
        if (leaderboardList[existingScoreIndex].score < playerScore) {
          leaderboardList.splice(existingScoreIndex, 1);
          leaderboardList.push({ initials: player, score: playerScore });
        }
      } else {
        leaderboardList.push({ initials: player, score: playerScore });
      }
    }

    // The persistent leaderboard should already be sorted from the API call
    leaderboardList.sort((score1, score2) => {
      return score2.score - score1.score;
    });

    return leaderboardList;
  }

  function persistentLeaderboardRows(): LeaderboardRow[] {
    const leaderboardList: LeaderboardRow[] = [];

    for (const result of persistentResults) {
      const resultScores = result.scores;
      const player = Object.keys(resultScores)[0]; // Only 1 player per result
      const playerScore = resultScores[player];
      leaderboardList.push({ initials: player, score: playerScore });
    }

    return leaderboardList;
  }

  function showLeaderboard(leaderboardList: LeaderboardRow[]) {
    return (
      <Box
        overflowY='scroll'
        maxHeight='350px'
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
                fontFamily={font}
                fontSize={15}
                borderBottom={'none'}>
                Rank
              </Th>
              <Th
                textColor={'black'}
                textAlign={'center'}
                fontWeight={'medium'}
                fontFamily={font}
                fontSize={15}
                borderBottom={'none'}>
                Initials
              </Th>
              <Th
                textColor={'black'}
                textAlign={'center'}
                fontWeight={'medium'}
                fontFamily={font}
                fontSize={15}
                borderBottom={'none'}>
                High Score
              </Th>
            </Tr>
          </Thead>
          <Tbody style={{ overflowY: 'auto' }} textAlign={'center'}>
            {leaderboardList.map(record => {
              const playerIndex = leaderboardList.findIndex(
                player => player.initials === record.initials && player.score === record.score,
              );

              return (
                <Tr key={nanoid()}>
                  <Td
                    textColor={'black'}
                    textAlign={'center'}
                    maxWidth={30}
                    fontWeight={'medium'}
                    fontFamily={font}
                    fontSize={15}
                    borderBottom={'none'}>
                    {playerIndex + 1}
                  </Td>
                  <Td
                    textColor={'black'}
                    textAlign={'center'}
                    maxWidth={30}
                    fontWeight={'medium'}
                    fontFamily={font}
                    fontSize={15}
                    borderBottom={'none'}>
                    {record.initials}
                  </Td>
                  <Td
                    textColor={'black'}
                    textAlign={'center'}
                    maxWidth={30}
                    fontWeight={'medium'}
                    fontFamily={font}
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

  return (
    <Tabs isFitted variant='line' mt={-5}>
      <TabList>
        <Tab
          bgColor={'lightblue'}
          _active={{ bgColor: 'lightblue' }}
          _focus={{}}
          textColor={'black'}
          textAlign={'center'}
          fontWeight={'medium'}
          fontFamily={font}
          fontSize={15}>
          <Tooltip
            label={localLeaderboardTooltip}
            placement='bottom-start'
            aria-label='local-tooltip'>
            ⓘ
          </Tooltip>
          <Text as={'span'} ml={2}>
            Current
          </Text>
        </Tab>
        <Tab
          bgColor={'lightblue'}
          _active={{ bgColor: 'lightblue' }}
          _focus={{}}
          textColor={'black'}
          textAlign={'center'}
          fontWeight={'medium'}
          fontFamily={font}
          fontSize={15}>
          <Tooltip
            label={persistentLeaderboardTooltip}
            placement='bottom-start'
            aria-label='local-tooltip'>
            ⓘ
          </Tooltip>
          <Text as={'span'} ml={2}>
            All Time
          </Text>
        </Tab>
      </TabList>
      <TabPanels mt={-3}>
        <TabPanel>{showLeaderboard(localLeaderboardRows())}</TabPanel>
        <TabPanel>{showLeaderboard(persistentLeaderboardRows())}</TabPanel>
      </TabPanels>
    </Tabs>
  );
}
