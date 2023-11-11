import { Button, Modal, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
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
    coveyTownController.unPause();
    close();
  }, [coveyTownController]);

  function handleVehicleClick(selectedVehicle: VehicleType) {
    setVehicle(selectedVehicle);
    console.log(vehicle);
  }

  function handleVehicleEquip() {
    console.log('Equipping Vehicle');
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
        <Button onClick={handleVehicleEquip} disabled={!vehicle}>
          Equip
        </Button>
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
