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
  const [vehicle, setVehicle] = useState<VehicleType | undefined>(
    vehicleRackAreaController.vehicle,
  );
  const toast = useToast();

  const vehicles = [
    { type: 'skateboard', label: 'Skateboard', imageSrc: '' },
    { type: 'bike', label: 'Bike', imageSrc: '' },
    { type: 'horse', label: 'Horse', imageSrc: '' },
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
      coveyTownController.interactEnd(newRack);
      coveyTownController.unPause();
    }
  }, [coveyTownController, newRack]);

  function handleSelectVehicle(selectedVehicle: VehicleType) {
    setVehicle(() => {
      vehicleRackAreaController.vehicle = selectedVehicle;
      console.log(vehicleRackAreaController.vehicle);
      return selectedVehicle; // Return the new state value
    });
  }

  function handleRemoveVehicle() {
    setVehicle(() => {
      vehicleRackAreaController.vehicle = undefined;
      console.log(vehicleRackAreaController.vehicle);
      return undefined;
    });
  }

  function handleEquipVehicle() {
    try {
      vehicleRackAreaController.equipVehicle();
      toast({
        title: `Success`,
        description:
          coveyTownController.ourPlayer.vehicle?.vehicleType !== undefined
            ? `Equipped: ${toTitleCase(coveyTownController.ourPlayer.vehicle?.vehicleType)}`
            : `Unequipped Vehicle`,
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
                backgroundColor: vehicle === vehicleEnum.type ? 'lightBlue' : 'transparent',
                borderColor: vehicle === vehicleEnum.type ? 'darkBlue' : 'transparent',
              }}
              onClick={() => handleSelectVehicle(vehicleEnum.type as VehicleType)}>
              {vehicleEnum.label}
            </Button>
          ))}
          <Button
            key={'undefined'}
            style={{
              backgroundColor: vehicle === undefined ? 'lightBlue' : 'transparent',
              borderColor: vehicle === undefined ? 'darkBlue' : 'transparent',
            }}
            onClick={handleRemoveVehicle}>
            Unequip
          </Button>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme='blue' mr={3} onClick={handleEquipVehicle}>
            Equip
          </Button>
          <Button onClick={closeModal}>Cancel</Button>
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
