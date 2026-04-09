import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @Length(7, 10)
  placa: string;

  @IsString()
  @IsNotEmpty()
  @Length(17, 17)
  chassi: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{9,11}$/, { message: 'renavam must contain 9 to 11 digits' })
  renavam: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  modelo: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  marca: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  ano: number;
}
