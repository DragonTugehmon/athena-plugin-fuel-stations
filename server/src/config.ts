export const FUELSTATION_CONFIG = {
    FUEL_PRICE: 2,
    FUEL_RESET_TIMEOUT: 60000, // If the refuel takes longer than 10s. The next refuel will auto-clear after this time.
    FUEL_TIME: 600,
};

export const FUEL_CONFIG = {
    MAXIMUM_FUEL: 100, // Best left at 100
    FUEL_LOSS_PER_TICK: 0.15, // The amount of fuel lost every TIME_BETWEEN_UPDATES
    TIME_BETWEEN_UPDATES: 5000, // Best left at 5s
    FUEL_ON_NEW_VEHICLE_CREATE: 100, // Fuel when a new vehicle is created
};
