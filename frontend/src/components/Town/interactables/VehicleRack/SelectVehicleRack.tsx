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

const OVERLAY_COLOR = 'transparent';
// const CARD_COLOR = '#BEE3F8';
const CARD_COLOR = '#e5f3fc';
const BORDER_CARD_COLOR_UNEQUIPPED = '#4299E1';
const BORDER_CARD_COLOR_EQUIPPED = '#1A365D';
const BUTTON_COLOR_UNEQUIPPED = '#4299E1';
const BUTTON_COLOR_EQUIPPED = '#1A365D';
const TOOL_TIP_TEXT =
  'Select a vehicle to move around town faster. You will also become eligible to play the typing minigame!';
const OVERLAY_BORDER_COLOR = '#1A365D';

export function SelectVehicleArea({ vehicleArea }: { vehicleArea: VehicleRackArea }): JSX.Element {
  const coveyTownController = useTownController();
  const newRack = useInteractable<VehicleRackArea>('vehicleRackArea');
  const vehicleRackAreaController = useInteractableAreaController<VehicleRackAreaController>(
    vehicleArea?.name,
  );
  const isOpen = newRack !== undefined;
  vehicleRackAreaController.occupants = coveyTownController.players;

  const [bikeImage, setBikeImage] = useState('url("./images/bike.png")');
  const [skateboardImage, setSkateboardImage] = useState('url("./images/skateboard.png")');
  const [horseImage, setHorseImage] = useState('url("./images/horse.png")');
  const [bikeEquip, setBikeEquip] = useState(
    coveyTownController.ourPlayer.vehicle?.vehicleType === 'bike',
  );
  const [skateboardEquip, setSkateboardEquip] = useState(
    coveyTownController.ourPlayer.vehicle?.vehicleType === 'skateboard',
  );
  const [horseEquip, setHorseEquip] = useState(
    coveyTownController.ourPlayer.vehicle?.vehicleType === 'horse',
  );

  const toast = useToast();

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
      coveyTownController.interactEnd(newRack);
      coveyTownController.unPause();
    }
  }, [coveyTownController, newRack, vehicleRackAreaController]);

  function _equipVehicle(vehicleType: VehicleType) {
    switch (vehicleType) {
      case 'bike':
        setBikeEquip(true);
        setHorseEquip(false);
        setSkateboardEquip(false);
        break;
      case 'horse':
        setHorseEquip(true);
        setBikeEquip(false);
        setSkateboardEquip(false);
        break;
      case 'skateboard':
        setSkateboardEquip(true);
        setBikeEquip(false);
        setHorseEquip(false);
        break;
    }
  }

  function handleEquipVehicle() {
    try {
      const vehicle = vehicleRackAreaController.equipVehicle();
      coveyTownController.emitVehicleChange(vehicle);
      _equipVehicle(vehicle?.vehicleType as VehicleType);
      toast({
        title: `Success`,
        description: `${vehicle ? `Equipped ${vehicle.vehicleType}` : 'Unequipped'}`,
        status: 'info',
      });
    } catch (error) {
      toast({
        title: `Error`,
        description: (error as Error).toString,
        status: 'error',
      });
    }
  }

  function handleSelectVehicle(vehicleType: VehicleType) {
    if (coveyTownController.ourPlayer.vehicle?.vehicleType === vehicleType) {
      vehicleRackAreaController.vehicle = undefined;
      handleEquipVehicle();
      setBikeEquip(false);
      setSkateboardEquip(false);
      setHorseEquip(false);
    } else {
      vehicleRackAreaController.vehicle = vehicleType;
      handleEquipVehicle();
    }
  }

  const vehicles = [
    {
      type: 'bike',
      label: 'Bike',
      equip: bikeEquip,
      image: bikeImage,
      imageURL: ['url("./images/bike.png")'],
      animationURL: ['url("./animations/bike-anim.gif")'],
      imageAlt: 'bike',
    },
    {
      type: 'horse',
      label: 'Horse',
      equip: horseEquip,
      image: horseImage,
      imageURL: ['url("./images/horse.png")'],
      animationURL: ['url("./animations/horse-anim.gif")'],
      imageAlt: 'horse',
    },
    {
      type: 'skateboard',
      label: 'Skateboard',
      equip: skateboardEquip,
      image: skateboardImage,
      imageURL: ['url("./images/skateboard.png")'],
      animationURL: [
        'url("./animations/skateboard-anim1.gif")',
        'url("./animations/skateboard-anim2.gif")',
        'url("./animations/skateboard-anim3.gif")',
      ],
      imageAlt: 'skateboard',
    },
  ];

  function handleMouseEnter(type: VehicleType, listOfAnimations: string[]) {
    switch (type) {
      case 'bike':
        setBikeImage(listOfAnimations[Math.floor(Math.random() * listOfAnimations.length)]);
        break;
      case 'horse':
        setHorseImage(listOfAnimations[Math.floor(Math.random() * listOfAnimations.length)]);
        break;
      case 'skateboard':
        setSkateboardImage(listOfAnimations[Math.floor(Math.random() * listOfAnimations.length)]);
        break;
    }
  }

  function handleMouseLeave(type: VehicleType, listOfImages: string[]) {
    switch (type) {
      case 'bike':
        setBikeImage(listOfImages[Math.floor(Math.random() * listOfImages.length)]);
        break;
      case 'horse':
        setHorseImage(listOfImages[Math.floor(Math.random() * listOfImages.length)]);
        break;
      case 'skateboard':
        setSkateboardImage(listOfImages[Math.floor(Math.random() * listOfImages.length)]);
        break;
    }
  }

  const VehicleCard = ({
    type,
    label,
    equip,
    image,
    imageURL,
    animationURL,
    imageAlt,
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
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: 'lg',
            }}
            borderColor={equip ? BORDER_CARD_COLOR_EQUIPPED : BORDER_CARD_COLOR_UNEQUIPPED}>
            <Center>
              <Box
                borderColor={equip ? BORDER_CARD_COLOR_EQUIPPED : BORDER_CARD_COLOR_UNEQUIPPED}
                rounded={'md'}
                borderWidth={3}
                alignSelf={'center'}
                width={'full'}
                height={'full'}
                ml={4}
                mr={4}
                mt={4}
                mb={-2}
                bgImage={'./images/bgimage.png'}
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: 'lg',
                }}>
                <Center height={'full'}>
                  <Image
                    alt={imageAlt}
                    height={'170'}
                    width={'full'}
                    style={{ content: image, width: 'full', height: '140' }}
                    onMouseEnter={() => {
                      handleMouseEnter(type as VehicleType, animationURL);
                    }}
                    onMouseLeave={() => {
                      handleMouseLeave(type as VehicleType, imageURL);
                    }}
                  />
                </Center>
              </Box>
            </Center>

            <Box p={6}>
              <Stack spacing={0} align={'center'} mb={2}>
                <Heading
                  fontSize={'2xl'}
                  fontWeight={'bold'}
                  fontFamily={'heading'}
                  fontStyle={'serif'}>
                  {label}
                </Heading>
              </Stack>

              <Stack direction={'column'} justify={'center'} spacing={1}>
                <Stack spacing={0} align={'left'}>
                  <Text fontSize={'xl'} fontWeight={700}>
                    Speed{' '}
                    {type === 'skateboard' ? (
                      <>
                        <SkateboardIcon fontSize={'3xl'} />
                        <SkateboardHalfIcon fontSize={'3xl'} />
                      </>
                    ) : type === 'bike' ? (
                      <>
                        <BikeIcon fontSize={'3xl'} />
                        <BikeIcon fontSize={'3xl'} />
                      </>
                    ) : (
                      <>
                        <HorseIcon fontSize={'3xl'} />
                        <HorseIcon fontSize={'3xl'} />
                        <HorseIcon fontSize={'3xl'} />
                      </>
                    )}
                  </Text>
                </Stack>
                <Stack spacing={0} align={'left'}>
                  <Text fontSize={'xl'} fontWeight={700}>
                    Tricks{' '}
                    {type === 'skateboard' ? (
                      <>
                        <SkateboardIcon fontSize={'3xl'} />
                        <SkateboardIcon fontSize={'3xl'} />
                        <SkateboardIcon fontSize={'3xl'} />
                      </>
                    ) : type === 'bike' ? (
                      <>
                        <BikeIcon fontSize={'3xl'} />
                      </>
                    ) : (
                      <>
                        <HorseIcon fontSize={'3xl'} />
                      </>
                    )}
                  </Text>
                </Stack>
              </Stack>
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
                  backgroundColor: equip ? BUTTON_COLOR_EQUIPPED : BUTTON_COLOR_UNEQUIPPED,
                }}
                onClick={() => handleSelectVehicle(type as VehicleType)}>
                {equip ? 'Unequip' : 'Equip'}
              </Button>
            </Box>
          </Box>
        </Center>
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay bgSize={'cover'} bg='rgba(0, 0, 0, .4)' />
      <ModalContent
        minHeight={200}
        maxW='1000px'
        bgColor={OVERLAY_COLOR}
        borderColor={OVERLAY_BORDER_COLOR}>
        <ModalHeader ml={5} textAlign={'center'} display='flex' alignItems='center'>
          <Tooltip
            defaultIsOpen={false}
            label={TOOL_TIP_TEXT}
            placement='top-start'
            aria-label='tooltip'
            mr={5}
            bgColor={'white'}
            bgSize={10}
            color={'black'}>
            <Text fontSize={24} fontFamily={'serif'} color={'#e5f3fc'}>
              ⓘ
            </Text>
          </Tooltip>
          <Text
            flex='1'
            fontSize={36}
            fontFamily={'monospace'}
            color={'#e5f3fc'}
            fontWeight={'bold'}>
            Vehicle Rack
          </Text>
          <Box
            width='25px'
            height='25px'
            borderWidth={2}
            borderRadius='full'
            mt={0}
            mr={6}
            color={'#e5f3fc'}>
            <ModalCloseButton mt={5} mr={8} fontWeight={'bold'} _focus={{}} color={'#e5f3fc'} />
          </Box>
        </ModalHeader>

        <ModalBody pb={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2}>
            {vehicles.map(vehicleEnum => (
              <VehicleCard
                type={vehicleEnum.type}
                key={vehicleEnum.type}
                equip={vehicleEnum.equip}
                label={vehicleEnum.label}
                image={vehicleEnum.image}
                imageURL={vehicleEnum.imageURL}
                animationURL={vehicleEnum.animationURL}
                imageAlt={vehicleEnum.imageAlt}
              />
            ))}
          </SimpleGrid>
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
