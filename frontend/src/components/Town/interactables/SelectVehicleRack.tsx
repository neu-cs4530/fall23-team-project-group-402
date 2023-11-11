import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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

  const vehicles = [
    { type: 'bike', label: 'Bike', imageSrc: 'bike_image_url.jpg' },
    { type: 'skateboard', label: 'Skateboard', imageSrc: 'skateboard_image_url.jpg' },
    { type: 'horse', label: 'Horse', imageSrc: 'horse_image_url.jpg' },
  ];

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

  function handleVehicleClick(selectedVehicle: VehicleType) {
    setVehicle(() => {
      vehicleRackAreaController.vehicle = selectedVehicle;
      console.log(vehicleRackAreaController.vehicle);
      return selectedVehicle; // Return the new state value
    });
  }

  function handleVehicleEquip() {
    console.log('Equipping Vehicle');
    console.log(vehicleRackAreaController);
    console.log(coveyTownController.ourPlayer.vehicle);
    vehicleRackAreaController.equipVehicle();
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
                backgroundColor: vehicle === vehicleEnum.type ? 'yellow' : 'transparent',
              }}
              onClick={() => handleVehicleClick(vehicleEnum.type as VehicleType)}>
              {vehicleEnum.label}
            </Button>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme='blue' mr={3} onClick={handleVehicleEquip} disabled={!vehicle}>
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
