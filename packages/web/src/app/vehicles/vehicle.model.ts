export interface Vehicle {
  id: string;
  placa: string;
  chassi: string;
  renavam: string;
  modelo: string;
  marca: string;
  ano: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateVehiclePayload = Omit<
  Vehicle,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;
