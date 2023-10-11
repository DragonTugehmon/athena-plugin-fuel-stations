import * as alt from 'alt-server';
import * as Athena from '@AthenaServer/api';

import { VEHICLE_STATE } from '../../shared/vehicle';
import { distance2d } from '@AthenaShared/utility/vector';
import { FUEL_CONFIG } from './config';
import { ATHENA_EVENTS_VEHICLE } from '@AthenaPlugins/plugin-fuel-stations/shared/events';
import { toggleEngine } from '@AthenaServer/vehicle/controls';

export class FuelSystem {
    static init() {
        alt.setInterval(FuelSystem.updateDrivingPlayers, FUEL_CONFIG.TIME_BETWEEN_UPDATES);

        Athena.vehicle.events.on('engine-started', (vehicle: alt.Vehicle) => {
            if (!vehicle.engineOn && !FuelSystem.hasFuel(vehicle)) {
                return { status: false, response: 'Vehicle has no fuel.' };
            }

            if (vehicle['isRefueling']) {
                return { status: false, response: 'Vehicle is being refueled still.' };
            }

            return { status: true, response: '' };
        });
    }

    static updateDrivingPlayers() {
        const vehicles = [...alt.Vehicle.all];
        for (const element of vehicles) {
            const vehicle = element;
            if (!vehicle?.valid || !vehicle.engineOn) {
                continue;
            }

            FuelSystem.tick(vehicle);
        }
    }

    static hasFuel(vehicle: alt.Vehicle) {
        const vehicleData = Athena.document.vehicle.get(vehicle);

        if (!vehicleData) {
            return true;
        }

        if (vehicleData.fuel === undefined || vehicleData.fuel === null) {
            vehicleData.fuel = FUEL_CONFIG.MAXIMUM_FUEL;
            return true;
        }

        if (vehicleData.fuel <= 0) {
            return false;
        }

        return true;
    }

    static tick(vehicle: alt.Vehicle) {
        if (!vehicle?.valid) {
            return;
        }

        const vehicleData = Athena.document.vehicle.get(vehicle);
        if (!vehicleData) {
            Athena.document.vehicle.set(vehicle, 'fuel', FUEL_CONFIG.MAXIMUM_FUEL);
            return;
        }

        if (vehicleData.fuel === undefined || vehicleData.fuel === null) {
            vehicleData.fuel = 100;
        }

        if (!vehicle.lastPosition) {
            vehicle.lastPosition = vehicle.pos;
        }

        const dist = distance2d(vehicle.pos, vehicle.lastPosition);
        if (dist >= 5) {
            Athena.events.vehicle.trigger(ATHENA_EVENTS_VEHICLE.DISTANCE_TRAVELED, vehicle, dist);
            vehicle.lastPosition = vehicle.pos;
        }

        if (!vehicle.engineOn) {
            vehicle.setSyncedMeta(VEHICLE_STATE.FUEL, vehicleData.fuel);
            return;
        }

        vehicleData.fuel = vehicleData.fuel - FUEL_CONFIG.FUEL_LOSS_PER_TICK;

        if (vehicleData.fuel < 0) {
            vehicleData.fuel = 0;

            if (vehicle.engineOn) {
                vehicle.engineOn = false;
            }
        }

        vehicle.setSyncedMeta(VEHICLE_STATE.FUEL, vehicleData.fuel);
        vehicle.setSyncedMeta(VEHICLE_STATE.POSITION, vehicle.pos);

        if (!vehicle.nextSave || Date.now() > vehicle.nextSave) {
            Athena.document.vehicle.set(vehicle, 'fuel', vehicleData.fuel);
            vehicle.nextSave = Date.now() + 15000;
        }
    }

    static enterVehicle(player: alt.Player, vehicle: alt.Vehicle) {
        const vehicleData = Athena.document.vehicle.get(vehicle);
        if (!vehicleData) {
            vehicle.setSyncedMeta(VEHICLE_STATE.FUEL, FUEL_CONFIG.MAXIMUM_FUEL);
            return;
        }

        if (vehicleData.fuel === undefined || vehicleData.fuel === null) {
            vehicleData.fuel = 100;
        }

        vehicle.setSyncedMeta(VEHICLE_STATE.FUEL, vehicleData.fuel);
    }
}

alt.on('playerEnteredVehicle', FuelSystem.enterVehicle);

Athena.vehicle.events.on('engine-started', (veh: alt.Vehicle, player: alt.Player) => {
    const vehData = Athena.document.vehicle.get(veh);

    if (vehData.fuel <= 0) {
        toggleEngine(veh);
        Athena.player.emit.message(player, `Fuel is empty.`);
    }
});
