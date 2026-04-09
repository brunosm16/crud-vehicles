import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { VehicleFormComponent } from './vehicle-form.component';
import { VehiclesService } from '../vehicles.service';
import { CommonModule } from '@angular/common';

const mockService = {
  getOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

describe('VehicleFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VehicleFormComponent],
      imports: [ReactiveFormsModule, RouterTestingModule, CommonModule],
      providers: [{ provide: VehiclesService, useValue: mockService }],
    }).compileComponents();
  });

  it('should create the form with 6 fields', () => {
    const fixture = TestBed.createComponent(VehicleFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.form.contains('placa')).toBe(true);
    expect(comp.form.contains('chassi')).toBe(true);
    expect(comp.form.contains('renavam')).toBe(true);
    expect(comp.form.contains('modelo')).toBe(true);
    expect(comp.form.contains('marca')).toBe(true);
    expect(comp.form.contains('ano')).toBe(true);
  });

  it('form should be invalid when empty', () => {
    const fixture = TestBed.createComponent(VehicleFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('should call create on submit with valid data', () => {
    mockService.create.mockReturnValue(of({}));
    const fixture = TestBed.createComponent(VehicleFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.form.setValue({
      placa: 'ABC1D23',
      chassi: '9BWZZZ377VT004251',
      renavam: '12345678901',
      modelo: 'Corolla',
      marca: 'Toyota',
      ano: 2022,
    });
    comp.submit();
    expect(mockService.create).toHaveBeenCalled();
  });
});
