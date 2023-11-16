import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
  Image,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import VehicleRackAreaController from '../../../classes/interactable/VehicleRackAreaController';
import { useInteractable, useInteractableAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { VehicleType } from '../../../types/CoveyTownSocket';
import VehicleRackArea from './VehicleRackArea';

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
    { type: 'skateboard', label: 'Skateboard', imageSrc: '', speed: 1.5 },
    { type: 'bike', label: 'Bike', imageSrc: '', speed: 2 },
    { type: 'horse', label: 'Horse', imageSrc: '', speed: 3 },
  ];

  /**
   * Function found on internet that title cases a given string
   * Used for the toast to display what vehicle was equipped
   *
   * @param str string to tile case
   * @returns title cased string
   */
  function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
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

  function handleSelectVehicle(vehicleType: VehicleType) {
    setSelectedVehicle(() => {
      vehicleRackAreaController.vehicle = vehicleType;
      return vehicleType; // Return the new state value
    });
  }

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
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select a vehicle </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {vehicles.map(vehicleEnum => (
            <Button
              key={vehicleEnum.type}
              style={{
                backgroundColor: selectedVehicle === vehicleEnum.type ? 'lightBlue' : 'transparent',
                borderColor: selectedVehicle === vehicleEnum.type ? 'darkBlue' : 'transparent',
              }}
              onClick={() => handleSelectVehicle(vehicleEnum.type as VehicleType)}
              mr={10}>
              {vehicleEnum.label}
              <Image src='https://bit.ly/dan-abramov' width={50} height={50}></Image>
            </Button>
          ))}
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
