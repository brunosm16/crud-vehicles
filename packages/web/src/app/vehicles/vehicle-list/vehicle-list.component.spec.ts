import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, Subject } from 'rxjs';
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

const mockVehicle2: Vehicle = {
  id: 'uuid-2',
  placa: 'XYZ9A99',
  chassi: '1HGBH41JXMN109186',
  renavam: '99988877766',
  modelo: 'Civic',
  marca: 'Honda',
  ano: 2023,
};

const mockService = {
  getAll: jest.fn(),
  remove: jest.fn(),
};

describe('VehicleListComponent', () => {
  let router: Router;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockService.getAll.mockReturnValue(of([mockVehicle, mockVehicle2]));

    await TestBed.configureTestingModule({
      declarations: [VehicleListComponent],
      imports: [RouterTestingModule, CommonModule],
      providers: [{ provide: VehiclesService, useValue: mockService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('should load vehicles on init', () => {
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.vehicles).toEqual([
      mockVehicle,
      mockVehicle2,
    ]);
    expect(fixture.componentInstance.loading).toBe(false);
  });

  it('should set loading to true while fetching', () => {
    const subj = new Subject<Vehicle[]>();
    mockService.getAll.mockReturnValue(subj.asObservable());
    const fixture = TestBed.createComponent(VehicleListComponent);
    const comp = fixture.componentInstance;
    comp.load();
    expect(comp.loading).toBe(true);
    subj.next([]);
    subj.complete();
    expect(comp.loading).toBe(false);
  });

  it('should set error on getAll failure', () => {
    mockService.getAll.mockReturnValue(throwError(() => new Error('err')));
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error).toBe('Erro ao carregar veículos.');
    expect(fixture.componentInstance.loading).toBe(false);
  });

  it('should clear error before loading', () => {
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    fixture.componentInstance.error = 'old error';
    fixture.componentInstance.load();
    expect(fixture.componentInstance.error).toBe('');
  });

  it('should handle empty vehicle list', () => {
    mockService.getAll.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.vehicles).toEqual([]);
  });

  it('edit should navigate to edit route', () => {
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    fixture.componentInstance.edit('uuid-1');
    expect(router.navigate).toHaveBeenCalledWith([
      '/vehicles',
      'uuid-1',
      'edit',
    ]);
  });

  it('goToNew should navigate to new route', () => {
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    fixture.componentInstance.goToNew();
    expect(router.navigate).toHaveBeenCalledWith(['/vehicles', 'new']);
  });

  it('delete should call remove and reload on confirm', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    mockService.remove.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();

    fixture.componentInstance.delete('uuid-1');
    expect(mockService.remove).toHaveBeenCalledWith('uuid-1');
    expect(mockService.getAll).toHaveBeenCalledTimes(2); // init + reload
  });

  it('delete should not call remove when user cancels', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();

    fixture.componentInstance.delete('uuid-1');
    expect(mockService.remove).not.toHaveBeenCalled();
  });

  it('delete should set error on failure', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    mockService.remove.mockReturnValue(throwError(() => new Error('err')));
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();

    fixture.componentInstance.delete('uuid-1');
    expect(fixture.componentInstance.error).toBe('Erro ao excluir veículo.');
  });

  it('should render vehicle data in the table', () => {
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('ABC1D23');
    expect(rows[0].textContent).toContain('Toyota');
    expect(rows[1].textContent).toContain('Civic');
  });

  it('should show empty message when no vehicles', () => {
    mockService.getAll.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Nenhum veículo cadastrado.');
  });

  it('should show error message in the template', () => {
    mockService.getAll.mockReturnValue(throwError(() => new Error('err')));
    const fixture = TestBed.createComponent(VehicleListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error')?.textContent).toContain(
      'Erro ao carregar veículos.'
    );
  });
});
