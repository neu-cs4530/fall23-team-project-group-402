import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { VehicleRackArea } from '../../types/CoveyTownSocket';
import TownController from '../TownController';
import VehicleRackAreaController, { VehicleRackAreaEvents } from './VehicleRackAreaController';
