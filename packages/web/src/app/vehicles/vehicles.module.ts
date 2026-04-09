import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { VehiclesRoutingModule } from './vehicles-routing.module';
import { VehicleListComponent } from './vehicle-list/vehicle-list.component';
import { VehicleFormComponent } from './vehicle-form/vehicle-form.component';

@NgModule({
  declarations: [VehicleListComponent, VehicleFormComponent],
  imports: [CommonModule, ReactiveFormsModule, VehiclesRoutingModule],
})
export class VehiclesModule {}
