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

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type CreateVehiclePayload = Omit<
  Vehicle,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;
