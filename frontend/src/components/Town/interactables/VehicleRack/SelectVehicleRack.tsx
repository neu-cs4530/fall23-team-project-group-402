import {
  Button,
  Heading,
  Avatar,
  Box,
  Center,
  Flex,
  Text,
  Stack,
  useColorModeValue,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
  SimpleGrid,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import VehicleRackAreaController from '../../../../classes/interactable/VehicleRackAreaController';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { VehicleType } from '../../../../types/CoveyTownSocket';
import VehicleRackArea from '../VehicleRackArea';
import { VehicleProps } from './VehicleProps';

export function SelectVehicleArea({ vehicleArea }: { vehicleArea: VehicleRackArea }): JSX.Element {
  const coveyTownController = useTownController();
  const newRack = useInteractable('vehicleRackArea');
  const vehicleRackAreaController = useInteractableAreaController<VehicleRackAreaController>(
    vehicleArea?.name,
  );
  const isOpen = newRack !== undefined;
  vehicleRackAreaController.occupants = coveyTownController.players;
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | undefined>(
    vehicleRackAreaController.vehicle,
  );
  const toast = useToast();

  const vehicles = [
    {
      type: 'skateboard',
      label: 'Skateboard',
      imageURL: './skate-anim.jpg',
      animationURL: '',
      speed: 1.5,
      imageAlt: 'skateboard',
      tricks: 1,
    },
    {
      type: 'bike',
      label: 'Bike',
      imageURL: '',
      animationURL: '',
      speed: 2,
      imageAlt: 'bike',
      tricks: 1,
    },
    {
      type: 'horse',
      label: 'Horse',
      imageURL: '',
      animationURL: '',
      speed: 3,
      imageAlt: 'horse',
      tricks: 1,
    },
  ];

  function handleSelectVehicle(vehicleType: VehicleType) {
    setSelectedVehicle(() => {
      vehicleRackAreaController.vehicle = vehicleType;
      return vehicleType; // Return the new state value
    });
  }

  const VehicleCard = ({
    type,
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
                }}
                onClick={() => handleSelectVehicle(type as VehicleType)}>
                Equip
              </Button>
            </Box>
          </Box>
        </Center>
      );
    }
  };

  useEffect(() => {
    if (newRack) {
      coveyTownController.pause();
    } else {
      coveyTownController.unPause();
    }
  }, [coveyTownController, newRack]);

  const closeModal = useCallback(() => {
    if (newRack) {
      vehicleRackAreaController.vehicle = undefined;
      console.log('rest of function working');
      coveyTownController.interactEnd(newRack);
      coveyTownController.unPause();
    }
  }, [coveyTownController, newRack, vehicleRackAreaController]);

  function handleUnequipVehicle() {
    try {
      const vehicle = vehicleRackAreaController.unequipVehicle();
      coveyTownController.emitVehicleChange(vehicle);
      toast({
        title: `Success`,
        description: `Unequipped Vehicle`,
        status: 'info',
      });
    } catch (error) {
      toast({
        title: `Error unequipping vehicle`,
        description: (error as Error).toString,
        status: 'error',
      });
    }
    closeModal();
  }

  function handleEquipVehicle() {
    try {
      const vehicle = vehicleRackAreaController.equipVehicle();
      coveyTownController.emitVehicleChange(vehicle);
      toast({
        title: `Success`,
        description: `Equipped: ${selectedVehicle}`,
        status: 'info',
      });
    } catch (error) {
      toast({
        title: `Error equipping vehicle`,
        description: (error as Error).toString,
        status: 'error',
      });
    }
    closeModal();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay
        bgImg={
          'https://play-lh.googleusercontent.com/09v8anyuuqLYyLDMRxdsXWC5Pkz8wRNBttrElCiZWppNR5Pa2WOc5bt0OIiSYDWcMQ=w526-h296-rw'
        }
        bgSize={'cover'}
      />
      <ModalContent
        minHeight={600}
        minWidth={1000}
        bgImg={
          'https://play-lh.googleusercontent.com/09v8anyuuqLYyLDMRxdsXWC5Pkz8wRNBttrElCiZWppNR5Pa2WOc5bt0OIiSYDWcMQ=w526-h296-rw'
        }>
        <ModalHeader>Select a vehicle </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {vehicles.map(vehicleEnum => (
              <VehicleCard
                type={vehicleEnum.type}
                key={vehicleEnum.type}
                label={vehicleEnum.label}
                imageURL={vehicleEnum.imageURL}
                animationURL={vehicleEnum.animationURL}
                speed={vehicleEnum.speed}
                imageAlt={vehicleEnum.imageAlt}
                tricks={vehicleEnum.tricks}
              />
            ))}
          </SimpleGrid>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme='blue'
            mr={3}
            onClick={handleEquipVehicle}
            disabled={
              !selectedVehicle ||
              selectedVehicle === coveyTownController.ourPlayer.vehicle?.vehicleType
            }>
            Equip
          </Button>
          <Button
            onClick={handleUnequipVehicle}
            disabled={coveyTownController.ourPlayer.vehicle?.vehicleType === undefined}>
            Unequip
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function VehicleRackAreaWrapper(): JSX.Element {
  const vehicleRackArea = useInteractable<VehicleRackArea>('vehicleRackArea');
  if (vehicleRackArea) {
    return <SelectVehicleArea vehicleArea={vehicleRackArea} />;
  }
  return <></>;
}
