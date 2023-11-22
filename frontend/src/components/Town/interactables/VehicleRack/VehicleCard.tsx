'use client';

import {
  Heading,
  Avatar,
  Box,
  Center,
  Flex,
  Text,
  Stack,
  Button,
  useColorModeValue,
  Image,
} from '@chakra-ui/react';
import React from 'react';
import { VehicleProps } from './VehicleProps';

export const VehicleCard = ({
  label,
  imageURL,
  animationURL,
  speed,
  imageAlt,
  tricks,
}: VehicleProps) => {
  {
    return (
      <Center py={6}>
        <Box
          maxW={'270px'}
          w={'full'}
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow={'2xl'}
          rounded={'md'}
          overflow={'hidden'}>
          <Image height={'120px'} width={'full'} src={imageURL} objectFit='cover' alt='#' />
          <Flex justify={'center'} mt={-12}>
            <Avatar
              size={'xl'}
              src={imageURL}
              css={{
                border: '2px solid white',
              }}
            />
          </Flex>

          <Box p={6}>
            <Stack spacing={0} align={'center'} mb={5}>
              <Heading fontSize={'2xl'} fontWeight={500} fontFamily={'body'}>
                {label}
              </Heading>
            </Stack>

            <Stack direction={'row'} justify={'center'} spacing={6}>
              <Stack spacing={0} align={'center'}>
                <Text fontWeight={600}>{speed}</Text>
                <Text fontSize={'sm'} color={'gray.500'}>
                  Speed
                </Text>
              </Stack>
              <Stack spacing={0} align={'center'}>
                <Text fontWeight={600}>{tricks}</Text>
                <Text fontSize={'sm'} color={'gray.500'}>
                  Tricks
                </Text>
              </Stack>
            </Stack>

            <Button
              w={'full'}
              mt={8}
              bg='blue.600'
              color={'white'}
              rounded={'md'}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}>
              Equip
            </Button>
          </Box>
        </Box>
      </Center>
    );
  }
};
