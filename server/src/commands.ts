import * as alt from 'alt-server';
import * as Athena from '@AthenaServer/api';

import { Vehicle_Behavior, VEHICLE_STATE } from '../../shared/vehicle';
import { isFlagEnabled } from '@AthenaShared/utility/flags';
import { FUEL_CONFIG } from './config';

function setFuel(player: alt.Player, amount: string) {
    let actualAmount = parseInt(amount);

    if (typeof actualAmount !== 'number') {
        Athena.player.emit.message(player, `Invalid amount to fuel to.`);
        return;
    }

    if (actualAmount > FUEL_CONFIG.MAXIMUM_FUEL) {
        actualAmount = FUEL_CONFIG.MAXIMUM_FUEL;
    }

    if (!player.vehicle) {
        Athena.player.emit.message(player, `Must be in a vehicle.`);
        return;
    }
    const vehicleData = Athena.document.vehicle.get(player.vehicle);

    if (!isFlagEnabled(vehicleData.fuel, Vehicle_Behavior.CONSUMES_FUEL)) {
        return;
    }

    vehicleData.fuel = actualAmount;
    player.vehicle.setSyncedMeta(VEHICLE_STATE.FUEL, vehicleData.fuel);
    player.vehicle.setSyncedMeta(VEHICLE_STATE.POSITION, vehicleData.pos);
    Athena.document.vehicle.set(player.vehicle, 'fuel', vehicleData.fuel);
}
