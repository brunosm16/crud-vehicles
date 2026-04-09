import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.model';

const mockVehicle: Vehicle = {
  id: 'uuid-1',
  placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251',
  renavam: '12345678901',
  modelo: 'Corolla',
  marca: 'Toyota',
  ano: 2022,
};

describe('VehiclesService', () => {
  let service: VehiclesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VehiclesService],
    });
    service = TestBed.inject(VehiclesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll should return vehicles array', () => {
    service.getAll().subscribe((vehicles) => {
      expect(vehicles).toEqual([mockVehicle]);
    });
    const req = httpMock.expectOne('/api/vehicles');
    expect(req.request.method).toBe('GET');
    req.flush([mockVehicle]);
  });

  it('getOne should return a single vehicle', () => {
    service.getOne('uuid-1').subscribe((v) => {
      expect(v).toEqual(mockVehicle);
    });
    const req = httpMock.expectOne('/api/vehicles/uuid-1');
    expect(req.request.method).toBe('GET');
    req.flush(mockVehicle);
  });

  it('create should POST and return vehicle', () => {
    const { id, ...payload } = mockVehicle;
    service.create(payload).subscribe((v) => {
      expect(v).toEqual(mockVehicle);
    });
    const req = httpMock.expectOne('/api/vehicles');
    expect(req.request.method).toBe('POST');
    req.flush(mockVehicle);
  });

  it('update should PUT and return vehicle', () => {
    service.update('uuid-1', { modelo: 'Civic' }).subscribe((v) => {
      expect(v.modelo).toBe('Civic');
    });
    const req = httpMock.expectOne('/api/vehicles/uuid-1');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockVehicle, modelo: 'Civic' });
  });

  it('remove should DELETE vehicle', () => {
    service.remove('uuid-1').subscribe();
    const req = httpMock.expectOne('/api/vehicles/uuid-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
