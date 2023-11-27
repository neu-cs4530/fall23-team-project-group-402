import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { mock, mockReset } from 'jest-mock-extended';
import React from 'react';
import { nanoid } from 'nanoid';
import { act } from 'react-dom/test-utils';
import PlayerController from '../../../../classes/PlayerController';
import TownController, * as TownControllerHooks from '../../../../classes/TownController';
import TownControllerContext from '../../../../contexts/TownControllerContext';
import { PlayerLocation } from '../../../../types/CoveyTownSocket';
import PhaserGameArea from '../GameArea';
import VehicleRackAreaWrapper from './SelectVehicleRack';
import VehicleRackAreaController from '../../../../classes/interactable/VehicleRackAreaController';
import userEvent from '@testing-library/user-event';

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
  public constructor() {
    super(nanoid(), mock<TownController>(), undefined);
  }
}

describe('VehicleRackArea', () => {
  // Spy on console.error and intercept react key warnings to fail test
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParms: any[]]>;
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

  let ourPlayer: PlayerController;
  const townController = mock<TownController>();
  Object.defineProperty(townController, 'ourPlayer', { get: () => ourPlayer });
  const vehickeRackAreaController = new MockVehicleRackAreaController();

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
    mockReset(townController);
    useInteractableAreaControllerSpy.mockReturnValue(vehickeRackAreaController);
    mockToast.mockClear();
  });
  describe('VehicleRackArea', () => {
    it('Renders all 3 cards labels', () => {
      renderVehicleRackArea();
      vehicles.forEach(vehicle => expect(screen.getByText(vehicle.label)).toBeInTheDocument());
    });
    it('Includes a tooltip that has the town ID', async () => {
      const renderData = renderVehicleRackArea();
      expect(renderData.queryByRole('tooltip')).toBeNull();
      const toolTip = await renderData.findByText('tooltip');
      expect(toolTip.parentElement).toHaveTextContent(
        'Select a vehicle to move around town faster.',
      );
    });
    it('Renders all 3 equip buttons', async () => {
      const renderData = renderVehicleRackArea();
      const equipButtons = renderData.getAllByText('Equip');
      expect(equipButtons.length).toEqual(3);
    });

    it('Equipping a vehicle updates player.vehicle.vehicleType', () => {});

    it('Equipping a vehicle updates the toast message', async () => {
      // Receiving unequipped but in game it is showing equipped
      renderVehicleRackArea();
      const equipButtons = screen.getAllByText('Equip');
      fireEvent.click(equipButtons[0]);
      // Wait for the toast to be shown
      await waitFor(() => expect(mockToast).toHaveBeenCalled());
      // Check the toast message
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          description: 'Equipped bike',
          status: 'info',
        }),
      );
    });

    it('Unequipping a vehicle updates player.vehicle.vehicleType', () => {});

    it('Unequipping a vehicle updates the toast message', async () => {});
  });
  test('Button toggles text and equips/unequips the vehicle', async () => {
    // Mock dependencies
    const mockVehicle = { vehicleType: 'bike', speedMultiplier: 2 };
    const mockEquipVehicle = jest.fn();
    const mockUnequipVehicle = jest.fn();
    const mockCoveyTownController = {
      ourPlayer: { vehicle: mockVehicle },
      emitVehicleChange: jest.fn(),
    };
    const mockVehicleRackAreaController = {
      equipVehicle: mockEquipVehicle,
      unequipVehicle: mockUnequipVehicle,
    };

    renderVehicleRackArea();

    // Initial state check
    expect(screen.getAllByText('Equip')[0]).toBeInTheDocument();

    // Click the button to equip the vehicle
    fireEvent.click(screen.getAllByText('Equip')[0]);

    // Check the updated state and behavior
    await waitFor(() => {
      expect(screen.getByText('Unequip')).toBeInTheDocument();
      expect(mockEquipVehicle).toHaveBeenCalledWith('bike');
      expect(mockCoveyTownController.emitVehicleChange).toHaveBeenCalledWith(mockVehicle);
    });

    // Click the button to unequip the vehicle
    fireEvent.click(screen.getByText('Unequip'));

    // Check the updated state and behavior
    await waitFor(() => {
      expect(screen.getByText('Equip')).toBeInTheDocument();
      expect(mockUnequipVehicle).toHaveBeenCalled();
      expect(mockCoveyTownController.emitVehicleChange).toHaveBeenCalledWith(undefined);
    });
  });
});
