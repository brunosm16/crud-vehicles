import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Vehicle } from '../vehicle.model';
import { VehiclesService } from '../vehicles.service';

@Component({
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.scss'],
})
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  loading = false;
  error = '';

  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.vehiclesService.getAll().subscribe({
      next: (response) => {
        this.vehicles = response.data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar veículos.';
        this.loading = false;
      },
    });
  }

  edit(id: string): void {
    this.router.navigate(['/vehicles', id, 'edit']);
  }

  delete(id: string): void {
    if (!confirm('Confirma exclusão do veículo?')) return;
    this.vehiclesService.remove(id).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'Erro ao excluir veículo.'),
    });
  }

  goToNew(): void {
    this.router.navigate(['/vehicles', 'new']);
  }
}
