import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { VehiclesService } from './vehicles.service';
import { Vehicle, PaginatedResponse } from './vehicle.model';

const mockVehicle: Vehicle = {
  id: 'uuid-1',
  placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251',
  renavam: '12345678901',
  modelo: 'Corolla',
  marca: 'Toyota',
  ano: 2022,
};

const mockPaginatedResponse: PaginatedResponse<Vehicle> = {
  data: [mockVehicle],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
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

  describe('getAll', () => {
    it('should return paginated response', () => {
      service.getAll().subscribe((response) => {
        expect(response).toEqual(mockPaginatedResponse);
      });
      const req = httpMock.expectOne('/api/vehicles');
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should pass query params', () => {
      service.getAll({ page: 2, limit: 5, marca: 'Toyota' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === '/api/vehicles');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('5');
      expect(req.request.params.get('marca')).toBe('Toyota');
      req.flush({
        data: [],
        meta: { total: 0, page: 2, limit: 5, totalPages: 0 },
      });
    });

    it('should return empty data when no vehicles', () => {
      const empty = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      service.getAll().subscribe((response) => {
        expect(response.data).toEqual([]);
      });
      const req = httpMock.expectOne('/api/vehicles');
      req.flush(empty);
    });

    it('should propagate HTTP errors', () => {
      service.getAll().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });
      const req = httpMock.expectOne('/api/vehicles');
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });

  describe('getOne', () => {
    it('should return a single vehicle', () => {
      service.getOne('uuid-1').subscribe((v) => {
        expect(v).toEqual(mockVehicle);
      });
      const req = httpMock.expectOne('/api/vehicles/uuid-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockVehicle);
    });

    it('should build URL with the given id', () => {
      service.getOne('abc-123').subscribe();
      const req = httpMock.expectOne('/api/vehicles/abc-123');
      expect(req.request.method).toBe('GET');
      req.flush(mockVehicle);
    });

    it('should propagate 404 error', () => {
      service.getOne('nonexistent').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });
      const req = httpMock.expectOne('/api/vehicles/nonexistent');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('create', () => {
    it('should POST payload and return created vehicle', () => {
      const { id, ...payload } = mockVehicle;
      service.create(payload).subscribe((v) => {
        expect(v).toEqual(mockVehicle);
      });
      const req = httpMock.expectOne('/api/vehicles');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockVehicle);
    });

    it('should propagate 409 conflict error', () => {
      const { id, ...payload } = mockVehicle;
      service.create(payload).subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
        },
      });
      const req = httpMock.expectOne('/api/vehicles');
      req.flush(
        { message: 'Já existe um veículo com esta placa.' },
        { status: 409, statusText: 'Conflict' }
      );
    });
  });

  describe('update', () => {
    it('should PATCH payload and return updated vehicle', () => {
      const payload = { modelo: 'Civic' };
      service.update('uuid-1', payload).subscribe((v) => {
        expect(v.modelo).toBe('Civic');
      });
      const req = httpMock.expectOne('/api/vehicles/uuid-1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...mockVehicle, modelo: 'Civic' });
    });

    it('should propagate 404 when vehicle not found', () => {
      service.update('bad-id', { modelo: 'X' }).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });
      const req = httpMock.expectOne('/api/vehicles/bad-id');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('replace', () => {
    it('should PUT full payload and return replaced vehicle', () => {
      const { id, ...payload } = mockVehicle;
      service.replace('uuid-1', payload).subscribe((v) => {
        expect(v).toEqual(mockVehicle);
      });
      const req = httpMock.expectOne('/api/vehicles/uuid-1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockVehicle);
    });

    it('should propagate 404 when vehicle not found', () => {
      const { id, ...payload } = mockVehicle;
      service.replace('bad-id', payload).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });
      const req = httpMock.expectOne('/api/vehicles/bad-id');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('remove', () => {
    it('should DELETE the vehicle', () => {
      service.remove('uuid-1').subscribe();
      const req = httpMock.expectOne('/api/vehicles/uuid-1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should propagate 404 when vehicle not found', () => {
      service.remove('bad-id').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });
      const req = httpMock.expectOne('/api/vehicles/bad-id');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
