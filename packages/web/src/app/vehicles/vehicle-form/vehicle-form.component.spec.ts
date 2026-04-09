import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NgZone } from '@angular/core';
import { VehicleFormComponent } from './vehicle-form.component';
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

const validFormData = {
  placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251',
  renavam: '12345678901',
  modelo: 'Corolla',
  marca: 'Toyota',
  ano: 2022,
};

const mockService = {
  getOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

let currentRouteId: string | null = null;
const mockActivatedRoute = {
  snapshot: { paramMap: { get: () => currentRouteId } },
};

function createComponent(routeId: string | null = null) {
  currentRouteId = routeId;
  const fixture = TestBed.createComponent(VehicleFormComponent);
  fixture.detectChanges();
  return fixture;
}

describe('VehicleFormComponent', () => {
  let router: Router;

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      declarations: [VehicleFormComponent],
      imports: [ReactiveFormsModule, RouterTestingModule, CommonModule],
      providers: [
        { provide: VehiclesService, useValue: mockService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  describe('form initialization', () => {
    it('should create the form with 6 fields', () => {
      const fixture = createComponent();
      const comp = fixture.componentInstance;
      expect(comp.form.contains('placa')).toBe(true);
      expect(comp.form.contains('chassi')).toBe(true);
      expect(comp.form.contains('renavam')).toBe(true);
      expect(comp.form.contains('modelo')).toBe(true);
      expect(comp.form.contains('marca')).toBe(true);
      expect(comp.form.contains('ano')).toBe(true);
    });

    it('form should be invalid when empty', () => {
      const fixture = createComponent();
      expect(fixture.componentInstance.form.invalid).toBe(true);
    });

    it('form should be valid with correct data', () => {
      const fixture = createComponent();
      fixture.componentInstance.form.setValue(validFormData);
      expect(fixture.componentInstance.form.valid).toBe(true);
    });

    it('should not be in edit mode when no id param', () => {
      const fixture = createComponent();
      expect(fixture.componentInstance.isEdit).toBe(false);
    });

    it('should not be in edit mode when id is "new"', () => {
      const fixture = createComponent('new');
      expect(fixture.componentInstance.isEdit).toBe(false);
    });
  });

  describe('edit mode', () => {
    it('should be in edit mode when id param is a uuid', () => {
      mockService.getOne.mockReturnValue(of(mockVehicle));
      const fixture = createComponent('uuid-1');
      expect(fixture.componentInstance.isEdit).toBe(true);
      expect(fixture.componentInstance.vehicleId).toBe('uuid-1');
    });

    it('should load and populate form in edit mode', () => {
      mockService.getOne.mockReturnValue(of(mockVehicle));
      const fixture = createComponent('uuid-1');
      const comp = fixture.componentInstance;
      expect(comp.form.get('placa')?.value).toBe('ABC1D23');
      expect(comp.form.get('marca')?.value).toBe('Toyota');
      expect(comp.form.get('ano')?.value).toBe(2022);
      expect(comp.loading).toBe(false);
    });

    it('should set error when getOne fails in edit mode', () => {
      mockService.getOne.mockReturnValue(
        throwError(() => new Error('not found'))
      );
      const fixture = createComponent('uuid-1');
      expect(fixture.componentInstance.error).toBe('Erro ao carregar veículo.');
      expect(fixture.componentInstance.loading).toBe(false);
    });
  });

  describe('form validation', () => {
    it('placa should require min 7 chars', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('placa')!;
      ctrl.setValue('AB');
      expect(ctrl.hasError('minlength')).toBe(true);
    });

    it('chassi should require exactly 17 chars', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('chassi')!;
      ctrl.setValue('SHORT');
      expect(ctrl.hasError('minlength')).toBe(true);

      ctrl.setValue('9BWZZZ377VT0042519BWZZZ377VT004251');
      expect(ctrl.hasError('maxlength')).toBe(true);
    });

    it('renavam should match digits pattern', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('renavam')!;
      ctrl.setValue('ABCDEFGH');
      expect(ctrl.hasError('pattern')).toBe(true);

      ctrl.setValue('12345678901');
      expect(ctrl.hasError('pattern')).toBe(false);
    });

    it('ano should have min/max constraints', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('ano')!;
      ctrl.setValue(1800);
      expect(ctrl.hasError('min')).toBe(true);

      ctrl.setValue(3000);
      expect(ctrl.hasError('max')).toBe(true);

      ctrl.setValue(2022);
      expect(ctrl.errors).toBeNull();
    });

    it('all fields should be required', () => {
      const fixture = createComponent();
      const comp = fixture.componentInstance;
      for (const field of [
        'placa',
        'chassi',
        'renavam',
        'modelo',
        'marca',
        'ano',
      ]) {
        expect(comp.form.get(field)?.hasError('required')).toBe(true);
      }
    });
  });

  describe('submit', () => {
    it('should not submit when form is invalid', () => {
      const fixture = createComponent();
      fixture.componentInstance.submit();
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      const fixture = createComponent();
      const comp = fixture.componentInstance;
      comp.submit();
      expect(comp.form.get('placa')?.touched).toBe(true);
      expect(comp.form.get('ano')?.touched).toBe(true);
    });

    it('should call create on submit in create mode', () => {
      mockService.create.mockReturnValue(of(mockVehicle));
      const fixture = createComponent();
      fixture.componentInstance.form.setValue(validFormData);
      fixture.componentInstance.submit();
      expect(mockService.create).toHaveBeenCalledWith(validFormData);
    });

    it('should call update on submit in edit mode', () => {
      mockService.getOne.mockReturnValue(of(mockVehicle));
      mockService.update.mockReturnValue(of(mockVehicle));
      const fixture = createComponent('uuid-1');
      fixture.componentInstance.form.patchValue({ modelo: 'Civic' });
      fixture.componentInstance.submit();
      expect(mockService.update).toHaveBeenCalledWith(
        'uuid-1',
        expect.objectContaining({ modelo: 'Civic' })
      );
    });

    it('should navigate to /vehicles after successful create', () => {
      mockService.create.mockReturnValue(of(mockVehicle));
      const fixture = createComponent();
      fixture.componentInstance.form.setValue(validFormData);
      const ngZone = TestBed.inject(NgZone);
      ngZone.run(() => fixture.componentInstance.submit());
      expect(router.navigate).toHaveBeenCalledWith(['/vehicles']);
    });

    it('should set error on submit failure', () => {
      mockService.create.mockReturnValue(
        throwError(() => ({
          error: { message: 'Placa duplicada' },
        }))
      );
      const fixture = createComponent();
      fixture.componentInstance.form.setValue(validFormData);
      fixture.componentInstance.submit();
      expect(fixture.componentInstance.error).toBe('Placa duplicada');
      expect(fixture.componentInstance.submitting).toBe(false);
    });

    it('should set default error when no message in error response', () => {
      mockService.create.mockReturnValue(throwError(() => ({ error: {} })));
      const fixture = createComponent();
      fixture.componentInstance.form.setValue(validFormData);
      fixture.componentInstance.submit();
      expect(fixture.componentInstance.error).toBe('Erro ao salvar veículo.');
    });

    it('should set submitting to true during submit', () => {
      mockService.create.mockReturnValue(of(mockVehicle));
      const fixture = createComponent();
      const comp = fixture.componentInstance;
      comp.form.setValue(validFormData);
      comp.submit();
      expect(mockService.create).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should navigate to /vehicles', () => {
      const fixture = createComponent();
      const ngZone = TestBed.inject(NgZone);
      ngZone.run(() => fixture.componentInstance.cancel());
      expect(router.navigate).toHaveBeenCalledWith(['/vehicles']);
    });
  });

  describe('getError', () => {
    it('should return empty string for untouched field', () => {
      const fixture = createComponent();
      expect(fixture.componentInstance.getError('placa')).toBe('');
    });

    it('should return "Campo obrigatório." for required error', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('placa')!;
      ctrl.markAsTouched();
      expect(fixture.componentInstance.getError('placa')).toBe(
        'Campo obrigatório.'
      );
    });

    it('should return minlength message', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('placa')!;
      ctrl.setValue('AB');
      ctrl.markAsTouched();
      expect(fixture.componentInstance.getError('placa')).toContain('Mínimo');
    });

    it('should return maxlength message', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('marca')!;
      ctrl.setValue('A'.repeat(51));
      ctrl.markAsTouched();
      expect(fixture.componentInstance.getError('marca')).toContain('Máximo');
    });

    it('should return min value message', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('ano')!;
      ctrl.setValue(1800);
      ctrl.markAsTouched();
      expect(fixture.componentInstance.getError('ano')).toContain(
        'Valor mínimo'
      );
    });

    it('should return max value message', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('ano')!;
      ctrl.setValue(9999);
      ctrl.markAsTouched();
      expect(fixture.componentInstance.getError('ano')).toContain(
        'Valor máximo'
      );
    });

    it('should return pattern message for invalid renavam', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('renavam')!;
      ctrl.setValue('INVALID');
      ctrl.markAsTouched();
      expect(fixture.componentInstance.getError('renavam')).toBe(
        'Formato inválido.'
      );
    });

    it('should return empty string for valid touched field', () => {
      const fixture = createComponent();
      const ctrl = fixture.componentInstance.form.get('modelo')!;
      ctrl.setValue('Corolla');
      ctrl.markAsTouched();
      expect(fixture.componentInstance.getError('modelo')).toBe('');
    });

    it('should return empty string for unknown field', () => {
      const fixture = createComponent();
      expect(fixture.componentInstance.getError('nonexistent')).toBe('');
    });
  });
});
