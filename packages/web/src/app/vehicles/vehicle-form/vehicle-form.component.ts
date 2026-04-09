import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VehiclesService } from '../vehicles.service';

@Component({
  selector: 'app-vehicle-form',
  templateUrl: './vehicle-form.component.html',
  styleUrls: ['./vehicle-form.component.scss'],
})
export class VehicleFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  vehicleId = '';
  loading = false;
  submitting = false;
  error = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly vehiclesService: VehiclesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      placa: [
        '',
        [
          Validators.required,
          Validators.minLength(7),
          Validators.maxLength(10),
        ],
      ],
      chassi: [
        '',
        [
          Validators.required,
          Validators.minLength(17),
          Validators.maxLength(17),
        ],
      ],
      renavam: ['', [Validators.required, Validators.pattern(/^\d{9,11}$/)]],
      modelo: ['', [Validators.required, Validators.maxLength(100)]],
      marca: ['', [Validators.required, Validators.maxLength(50)]],
      ano: [
        null,
        [
          Validators.required,
          Validators.min(1900),
          Validators.max(new Date().getFullYear() + 1),
        ],
      ],
    });

    this.vehicleId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit = !!this.vehicleId && this.vehicleId !== 'new';

    if (this.isEdit) {
      this.loading = true;
      this.vehiclesService.getOne(this.vehicleId).subscribe({
        next: (v) => {
          this.form.patchValue(v);
          this.loading = false;
        },
        error: () => {
          this.error = 'Erro ao carregar veículo.';
          this.loading = false;
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.error = '';
    const payload = this.form.value;
    const req$ = this.isEdit
      ? this.vehiclesService.update(this.vehicleId, payload)
      : this.vehiclesService.create(payload);

    req$.subscribe({
      next: () => this.router.navigate(['/vehicles']),
      error: (err) => {
        this.error = err?.error?.message ?? 'Erro ao salvar veículo.';
        this.submitting = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/vehicles']);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.touched || ctrl.valid) return '';
    if (ctrl.errors?.['required']) return 'Campo obrigatório.';
    if (ctrl.errors?.['minlength'])
      return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres.`;
    if (ctrl.errors?.['maxlength'])
      return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    if (ctrl.errors?.['min']) return `Valor mínimo: ${ctrl.errors['min'].min}.`;
    if (ctrl.errors?.['max']) return `Valor máximo: ${ctrl.errors['max'].max}.`;
    if (ctrl.errors?.['pattern']) return 'Formato inválido.';
    return 'Valor inválido.';
  }
}
