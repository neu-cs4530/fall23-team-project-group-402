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
import { Vehicle, VehicleType } from '../../../types/CoveyTownSocket';
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
  const [equippedVehicle, setEquippedVehicle] = useState<Vehicle | undefined>(
    coveyTownController.ourPlayer.vehicle,
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
    vehicleRackAreaController.addListener('equipChange', setEquippedVehicle);
    vehicleRackAreaController.addListener('unequipChange', setEquippedVehicle);
    return () => {
      vehicleRackAreaController.removeListener('equipChange', setEquippedVehicle);
      vehicleRackAreaController.removeListener('unequipChange', setEquippedVehicle);
    };
  }, [coveyTownController, newRack, vehicleRackAreaController]);

  function handleSelectVehicle(vehicleType: VehicleType) {
    setSelectedVehicle(() => {
      vehicleRackAreaController.vehicle = vehicleType;
      console.log(vehicleRackAreaController.vehicle);
      return vehicleType; // Return the new state value
    });
  }

  function handleRemoveVehicle() {
    setSelectedVehicle(() => {
      vehicleRackAreaController.vehicle = undefined;
      console.log(vehicleRackAreaController.vehicle);
      return undefined;
    });
  }

  function handleEquipVehicle() {
    try {
      const vehicle = vehicleRackAreaController.equipVehicle();
      coveyTownController.emitVehicleChange(vehicle);
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
                backgroundColor: selectedVehicle === vehicleEnum.type ? 'lightBlue' : 'transparent',
                borderColor: selectedVehicle === vehicleEnum.type ? 'darkBlue' : 'transparent',
              }}
              onClick={() => handleSelectVehicle(vehicleEnum.type as VehicleType)}>
              {vehicleEnum.label}
            </Button>
          ))}
          <Button
            key={'undefined'}
            style={{
              backgroundColor: selectedVehicle === undefined ? 'lightBlue' : 'transparent',
              borderColor: selectedVehicle === undefined ? 'darkBlue' : 'transparent',
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
