import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mock, mockClear, mockReset } from 'jest-mock-extended';
import React from 'react';
import { nanoid } from 'nanoid';
import PlayerController from '../../../../classes/PlayerController';
import TownController, * as TownControllerHooks from '../../../../classes/TownController';
import TownControllerContext from '../../../../contexts/TownControllerContext';
import { PlayerLocation, Vehicle } from '../../../../types/CoveyTownSocket';
import PhaserGameArea from '../GameArea';
import VehicleRackAreaWrapper from './SelectVehicleRack';
import VehicleRackAreaController from '../../../../classes/interactable/VehicleRackAreaController';
import * as UseTownControllerHook from '../../../../hooks/useTownController';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});
const mockGameArea = mock<PhaserGameArea>();
mockGameArea.getData.mockReturnValue('VehicleRack');
jest.spyOn(TownControllerHooks, 'useInteractable').mockReturnValue(mockGameArea);
const useInteractableAreaControllerSpy = jest.spyOn(
  TownControllerHooks,
  'useInteractableAreaController',
);

const randomLocation = (): PlayerLocation => ({
  moving: Math.random() < 0.5,
  rotation: 'front',
  x: Math.random() * 1000,
  y: Math.random() * 1000,
});

class MockVehicleRackAreaController extends VehicleRackAreaController {
  ourPlayer: PlayerController;

  public constructor(townController: TownController, ourPlayer: PlayerController) {
    super(nanoid(), townController, undefined);
    this.ourPlayer = ourPlayer;
  }

  public get occupants(): PlayerController[] {
    return [this.ourPlayer];
  }

  public set occupants(newOccupants: PlayerController[]) {
    return;
  }

  public equipVehicle(): Vehicle | undefined {
    const vehicle = super.equipVehicle(); // Call the original method
    this.ourPlayer.vehicle = vehicle;
    return vehicle;
  }
}

describe('VehicleRackArea', () => {
  // Spy on console.error and intercept react key warnings to fail test
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParms: any[]]>;
  let ourPlayer: PlayerController;
  let townController: TownController;
  let useTownControllerSpy: jest.SpyInstance;
  beforeAll(() => {
    // Spy on console.error and intercept react key warnings to fail test
    consoleErrorSpy = jest.spyOn(global.console, 'error');
    consoleErrorSpy.mockImplementation((message?, ...optionalParams) => {
      const stringMessage = message as string;
      if (stringMessage.includes && stringMessage.includes('children with the same key,')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      } else if (stringMessage.includes && stringMessage.includes('warning-keys')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      }
      // eslint-disable-next-line no-console -- we are wrapping the console with a spy to find react warnings
      console.warn(message, ...optionalParams);
    });
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  const vehicles = [
    {
      type: 'bike',
      label: 'Bike',
      imageURL: ['url("./images/bike.png")'],
      animationURL: ['url("./animations/bike-anim.gif")'],
      imageAlt: 'bike',
    },
    {
      type: 'horse',
      label: 'Horse',
      imageURL: ['url("./images/horse.png")'],
      animationURL: ['url("./animations/horse-anim.gif")'],
      imageAlt: 'horse',
    },
    {
      type: 'skateboard',
      label: 'Skateboard',
      imageURL: ['url("./images/skateboard.png")'],
      animationURL: [
        'url("./animations/skateboard-anim1.gif")',
        'url("./animations/skateboard-anim2.gif")',
        'url("./animations/skateboard-anim3.gif")',
      ],
      imageAlt: 'skateboard',
    },
  ];

  function renderVehicleRackArea() {
    return render(
      <ChakraProvider>
        <TownControllerContext.Provider value={townController}>
          <VehicleRackAreaWrapper />
        </TownControllerContext.Provider>
      </ChakraProvider>,
    );
  }

  beforeEach(() => {
    ourPlayer = new PlayerController('ourPlayer', 'ourPlayer', randomLocation(), undefined);
    mockGameArea.name = nanoid();
    townController = mock<TownController>();
    useTownControllerSpy = jest.spyOn(UseTownControllerHook, 'default');
    useTownControllerSpy.mockReturnValue(townController);

    const vehicleRackAreaController = new MockVehicleRackAreaController(townController, ourPlayer);
    Object.defineProperty(townController, 'ourPlayer', {
      get: () => vehicleRackAreaController.ourPlayer,
    });

    mockReset(townController);
    useInteractableAreaControllerSpy.mockReturnValue(vehicleRackAreaController);
    mockToast.mockClear();
    mockClear(useTownControllerSpy);
  });
  describe('VehicleRackArea', () => {
    it('Renders all 3 cards labels', () => {
      renderVehicleRackArea();
      expect(useTownControllerSpy).toBeCalled();
      vehicles.forEach(vehicle => expect(screen.getByText(vehicle.label)).toBeInTheDocument());
    });
    it('Includes a tooltip that has the town ID', async () => {
      renderVehicleRackArea();
      const tooltips = screen.getAllByText('ⓘ');
      fireEvent.mouseOver(tooltips[0]);
      const tooltip = await screen.findByText('tooltip');
      expect(tooltip.parentElement).toHaveTextContent('Select a vehicle');
    });
    it('Renders all 3 equip buttons', async () => {
      const renderData = renderVehicleRackArea();
      const equipButtons = renderData.getAllByText('Equip');
      expect(equipButtons.length).toEqual(3);
    });
    it('Equipping a vehicle updates player.vehicle.vehicleType', () => {
      renderVehicleRackArea();
      const equipButtons = screen.getAllByText('Equip');
      const expectedVehicle: Vehicle = {
        vehicleType: 'bike',
        speedMultiplier: 2,
      };

      expect(ourPlayer.vehicle).toBeUndefined();
      fireEvent.click(equipButtons[0]);
      expect(ourPlayer.vehicle).toEqual(expectedVehicle);
    });
    it('Equipping a vehicle updates the toast message', async () => {
      renderVehicleRackArea();
      const equipButtons = screen.getAllByText('Equip');
      fireEvent.click(equipButtons[0]);

      await waitFor(() => expect(mockToast).toHaveBeenCalled());
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          description: 'Equipped bike',
          status: 'info',
        }),
      );
    });
  });
});
