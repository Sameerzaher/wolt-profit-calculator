export type VehicleType = "car" | "scooter" | "electric";

export interface VehicleSettings {
  type: VehicleType;
  fuelCostPerKm: number;
  monthlyInsurance: number;
  monthlyMaintenance: number;
  monthlyVehicleCost: number;
}

export const DEFAULT_VEHICLE_SETTINGS: VehicleSettings = {
  type: "car",
  fuelCostPerKm: 0.5,
  monthlyInsurance: 400,
  monthlyMaintenance: 200,
  monthlyVehicleCost: 0
};
