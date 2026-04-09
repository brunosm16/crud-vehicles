import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListVehiclesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  placa?: string;

  @IsOptional()
  @IsString()
  chassi?: string;

  @IsOptional()
  @IsString()
  renavam?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  ano?: number;
}
