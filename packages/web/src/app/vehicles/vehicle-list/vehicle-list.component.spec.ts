import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { VehicleListComponent } from './vehicle-list.component';
import { VehiclesService } from '../vehicles.service';
import { Vehicle } from '../vehicle.model';
import { CommonModule } from '@angular/common';

const mockVehicle: Vehicle = {
  id: 'uuid-1',
  placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251',
  renavam: '12345678901',
  modelo: 'Corolla',
  marca: 'Toyota',
  ano: 2022,
};

const mockService = {
  getAll: jest.fn(),
  remove: jest.fn(),
};

describe('VehicleListComponent', () => {
  beforeEach(async () => {
    mockService.getAll.mockReturnValue(of([mockVehicle]));

    await TestBed.configureTestingModule({
      declarations: [VehicleListComponent],
      imports: [RouterTestingModule, CommonModule],
      providers: [{ provide: VehiclesService, useValue: mockService }],
    }).compileComponents();
  });

  it('should load vehicles on init', () => {
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.vehicles).toEqual([mockVehicle]);
  });

  it('should set error on getAll failure', () => {
    mockService.getAll.mockReturnValue(throwError(() => new Error('err')));
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error).toBeTruthy();
  });
});
