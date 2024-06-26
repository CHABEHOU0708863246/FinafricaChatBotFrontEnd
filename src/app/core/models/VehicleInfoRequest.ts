import { VehicleInfo } from "./VehicleInfo";

export interface VehicleInfoRequest extends Omit<VehicleInfo, 'firstRegistrationDate'> {
  firstRegistrationDate: string;
}
