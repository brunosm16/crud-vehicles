import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Vehicle,
  PaginatedResponse,
  CreateVehiclePayload,
  UpdateVehiclePayload,
} from './vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private readonly url = `${environment.apiUrl}/vehicles`;

  constructor(private readonly http: HttpClient) {}

  getAll(
    params: Record<string, string | number> = {}
  ): Observable<PaginatedResponse<Vehicle>> {
    return this.http.get<PaginatedResponse<Vehicle>>(this.url, { params });
  }

  getOne(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.url}/${id}`);
  }

  create(payload: CreateVehiclePayload): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.url, payload);
  }

  update(id: string, payload: UpdateVehiclePayload): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.url}/${id}`, payload);
  }

  replace(id: string, payload: CreateVehiclePayload): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.url}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
