import {
  Button,
  Heading,
  Box,
  Center,
  Text,
  Stack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
  SimpleGrid,
  Tooltip,
  useBoolean
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import VehicleRackAreaController from '../../../../classes/interactable/VehicleRackAreaController';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { VehicleType } from '../../../../types/CoveyTownSocket';
import VehicleRackArea from '../VehicleRackArea';
import { VehicleProps } from './VehicleProps';
import { BikeIcon } from './BikeIcon';
import { SkateboardIcon } from './SkateboardIcon';
import { HorseIcon } from './HorseIcon';
import { SkateboardHalfIcon } from './SkateboardHalfIcon';

const OVERLAY_COLOR = '#BEC2cB'
const CARD_COLOR = "#ffffff"
const BORDER_CARD_COLOR = '#000000'
const BORDER_CARD_COLOR_SELECTED = 'gold'
const BUTTON_COLOR_SELECTED = "blue"
const BUTTON_COLOR_UNSELECTED = "blue"
const BUTTON_COLOR_UNEQUIP = "blue"
const BUTTON_COLOR_EQUIPPED = "blue"
const tooltipText = 'Select a vehicle to move around town faster. You will also become eligible to play the typing minigame!';

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

  const [bikeAnim, setBikeAnim] = useBoolean()
  const [skateboardAnim, setSkateboardAnim] = useBoolean()
  const [horseAnim, setHorseAnim] = useBoolean()

  const toast = useToast();

  const vehicles = [
    {
      type: 'bike',
      label: 'Bike',
      imageURL: ['./images/bike.png'],
      animationURL: ['./animations/bike-anim.gif'],
      imageAlt: 'bike',
      previewed: bikeAnim,
    },
    {
      type: 'horse',
      label: 'Horse',
      imageURL: ['./images/horse.png'],
      animationURL: ['./animations/horse-anim.gif'],
      imageAlt: 'horse',
      previewed: horseAnim,
    },
    {
      type: 'skateboard',
      label: 'Skateboard',
      imageURL: ['./images/skateboard.png'],
      animationURL: ['./animations/skateboard-anim1.gif', './animations/skateboard-anim2.gif', './animations/skateboard-anim3.gif'],
      imageAlt: 'skateboard',
      previewed: skateboardAnim,
    },
  ];

  const VehicleCard = ({
    type,
    label,
    imageURL,
    animationURL,
    imageAlt,
    previewed,
  }: VehicleProps) => {
    {
      return (
        <Center paddingTop={0} paddingBottom={6}>
          <Box
            maxW={'270px'}
            w={'full'}
            bgColor={CARD_COLOR}
            boxShadow={'dark-lg'}
            rounded={'md'}
            overflow={'hidden'}
            borderWidth={3}
            borderColor={selectedVehicle === type ? BORDER_CARD_COLOR_SELECTED : BORDER_CARD_COLOR}>
            <Center>
            <Box
              borderColor={selectedVehicle === type ? BORDER_CARD_COLOR_SELECTED : BORDER_CARD_COLOR}
              rounded={'md'}
              borderWidth={3}
              alignSelf={'center'}
              width={'full'}
              height={'full'}
              ml={4}
              mr={4}
              mt={4}
              mb={-2}
              bgImage={'./images/bgimage.png'} >
              <Center height={'full'}>
                <Image height={'140'} width={'50'} src={previewed ? animationURL[Math.floor((Math.random()*animationURL.length))] : imageURL[Math.floor((Math.random()*imageURL.length))]} objectFit='cover' alt={imageAlt} />
              </Center>
              </Box>
            </Center>

            <Box p={6}>
              <Stack spacing={0} align={'center'} mb={2}>
                <Heading fontSize={'2xl'} fontWeight={'bold'} fontFamily={'heading'} fontStyle={'serif'}>
                  {label}
                </Heading>
              </Stack>

              <Stack direction={'column'} justify={'center'} spacing={1}>
                <Stack spacing={0} align={'left'}>
                  <Text fontSize={'xl'} fontWeight={700}>Speed {type === 'skateboard' ? <><SkateboardIcon fontSize={'3xl'}/><SkateboardHalfIcon fontSize={'3xl'}/></> : type === 'bike' ? <><BikeIcon fontSize={'3xl'}/><BikeIcon fontSize={'3xl'}/></> : <><HorseIcon fontSize={'3xl'}/><HorseIcon fontSize={'3xl'}/><HorseIcon fontSize={'3xl'}/></>}</Text>
                </Stack>
                <Stack spacing={0} align={'left'}>
                  <Text fontSize={'xl'}fontWeight={700}>Tricks {type === 'skateboard' ? <><SkateboardIcon fontSize={'3xl'}/><SkateboardIcon fontSize={'3xl'}/><SkateboardIcon fontSize={'3xl'}/></> : type === 'bike' ? <><BikeIcon fontSize={'3xl'}/></> : <><HorseIcon fontSize={'3xl'}/></>}</Text>
                </Stack>
              </Stack>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
              <Button
                w={'full'}
                mt={4}
                color={'white'}
                rounded={'md'}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
                style={{
                  backgroundColor: coveyTownController.ourPlayer.vehicle?.vehicleType === type ? BUTTON_COLOR_EQUIPPED : selectedVehicle === type ? 'blue' : 'darkblue',
                  borderColor: coveyTownController.ourPlayer.vehicle?.vehicleType === type ? 'transparent' : selectedVehicle === type ? 'yellow' : 'blue',
                }}
                onClick={() => handleSelectVehicle(type as VehicleType)}>
                {coveyTownController.ourPlayer.vehicle?.vehicleType === type ? 'Unequip' : 'Equip'}
              </Button>
              <Button
                w={'full'}
                mt={4}
                color={'white'}
                rounded={'md'}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
                colorScheme='blue'
                onClick={type === 'bike' ? setBikeAnim.toggle : type === 'horse' ? setHorseAnim.toggle : setSkateboardAnim.toggle}>
                  {previewed ? 'Image' : 'Preview'}
              </Button>
              </SimpleGrid>
              
            </Box>
          </Box>
        </Center>
      );
    }
  };

  function handleSelectVehicle(vehicleType: VehicleType) {
    setSelectedVehicle(() => {
      if (coveyTownController.ourPlayer.vehicle?.vehicleType === vehicleType) {
        vehicleRackAreaController.vehicle = undefined;
        handleUnequipVehicle();
        return undefined;
      } else {
        vehicleRackAreaController.vehicle = vehicleType;
        handleEquipVehicle();
        return vehicleType; // Return the new state value
      }
    });
  }

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
      <ModalOverlay bgSize={'cover'}/>
      <ModalContent
        minHeight={200}
        minWidth={400}
        maxW="1000px"
        bgColor={OVERLAY_COLOR}>
        <ModalHeader ml={5}>
          <Tooltip defaultIsOpen={false} label={tooltipText} placement='top-start' >
            ⓘ
          </Tooltip>
          Vehicle Rack
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2}>
            {vehicles.map(vehicleEnum => (
              <VehicleCard
                type={vehicleEnum.type}
                key={vehicleEnum.type}
                label={vehicleEnum.label}
                imageURL={vehicleEnum.imageURL}
                animationURL={vehicleEnum.animationURL}
                imageAlt={vehicleEnum.imageAlt}
                previewed={vehicleEnum.previewed}
              />
            ))}
          </SimpleGrid>
          {/* <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <Button
              colorScheme={BUTTON_COLOR_EQUIPPED}
              onClick={handleEquipVehicle}
              disabled={
                !selectedVehicle || selectedVehicle === coveyTownController.ourPlayer.vehicle?.vehicleType
              }
              marginLeft={5}
              marginRight={5}>
              Equip
            </Button>
            <Button
              onClick={handleUnequipVehicle}
              disabled={coveyTownController.ourPlayer.vehicle?.vehicleType === undefined}
              marginRight={5}
              marginLeft={5}>
              Unequip
            </Button>
          </SimpleGrid> */}
        </ModalBody>
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
