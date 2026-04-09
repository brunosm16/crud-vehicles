import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { VehiclesModule } from './vehicles.module';
import { Vehicle } from './vehicle.entity';

const validDto = {
  placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251',
  renavam: '12345678901',
  modelo: 'Corolla',
  marca: 'Toyota',
  ano: 2022,
};

describe('Vehicles API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Vehicle],
          synchronize: true,
        }),
        VehiclesModule,
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/vehicles returns empty array initially', async () => {
    const res = await request(app.getHttpServer()).get('/api/vehicles');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  let createdId: string;

  it('POST /api/vehicles creates a vehicle', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send(validDto);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      placa: validDto.placa,
      chassi: validDto.chassi,
      renavam: validDto.renavam,
      modelo: validDto.modelo,
      marca: validDto.marca,
      ano: validDto.ano,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
    createdId = res.body.id;
  });

  it('POST /api/vehicles rejects empty body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBeInstanceOf(Array);
  });

  it('POST /api/vehicles rejects invalid placa length', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({
        ...validDto,
        placa: 'AB',
        chassi: '9BWZZZ377VT004299',
        renavam: '99999999999',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/vehicles rejects invalid chassi length', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({
        ...validDto,
        chassi: '123',
        placa: 'XYZ9A99',
        renavam: '99999999999',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/vehicles rejects invalid renavam format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({
        ...validDto,
        renavam: 'abc',
        placa: 'XYZ9A99',
        chassi: '9BWZZZ377VT004299',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/vehicles rejects invalid ano', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({
        ...validDto,
        ano: 1800,
        placa: 'XYZ9A99',
        chassi: '9BWZZZ377VT004299',
        renavam: '99999999999',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/vehicles rejects non-whitelisted fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({
        ...validDto,
        placa: 'XYZ9A99',
        chassi: '9BWZZZ377VT004299',
        renavam: '99999999999',
        extra: 'nope',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/vehicles rejects missing required fields', async () => {
    const { placa, ...withoutPlaca } = validDto;
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send(withoutPlaca);

    expect(res.status).toBe(400);
  });

  it('POST /api/vehicles returns 409 for duplicate placa', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({
        ...validDto,
        chassi: '9BWZZZ377VT004299',
        renavam: '99999999999',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('mesma placa');
  });

  it('POST /api/vehicles returns 409 for duplicate chassi', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({ ...validDto, placa: 'XYZ9A99', renavam: '99999999999' });

    expect(res.status).toBe(409);
  });

  it('POST /api/vehicles returns 409 for duplicate renavam', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({ ...validDto, placa: 'XYZ9A99', chassi: '9BWZZZ377VT004299' });

    expect(res.status).toBe(409);
  });

  it('GET /api/vehicles returns created vehicles', async () => {
    const res = await request(app.getHttpServer()).get('/api/vehicles');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].placa).toBe(validDto.placa);
  });

  it('GET /api/vehicles/:id returns a vehicle', async () => {
    const res = await request(app.getHttpServer()).get(
      `/api/vehicles/${createdId}`
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
    expect(res.body.placa).toBe(validDto.placa);
  });

  it('GET /api/vehicles/:id returns 404 for unknown id', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app.getHttpServer()).get(
      `/api/vehicles/${fakeId}`
    );
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('não encontrado');
  });

  it('GET /api/vehicles/:id returns 400 for invalid uuid', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/vehicles/not-a-uuid'
    );
    expect(res.status).toBe(400);
  });

  it('PUT /api/vehicles/:id updates a vehicle', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/vehicles/${createdId}`)
      .send({ modelo: 'Corolla Cross', ano: 2023 });

    expect(res.status).toBe(200);
    expect(res.body.modelo).toBe('Corolla Cross');
    expect(res.body.ano).toBe(2023);
    expect(res.body.placa).toBe(validDto.placa);
  });

  it('PUT /api/vehicles/:id returns 404 for unknown id', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app.getHttpServer())
      .put(`/api/vehicles/${fakeId}`)
      .send({ modelo: 'Phantom' });

    expect(res.status).toBe(404);
  });

  it('PUT /api/vehicles/:id returns 400 for invalid uuid', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/vehicles/not-a-uuid')
      .send({ modelo: 'Test' });

    expect(res.status).toBe(400);
  });

  it('PUT /api/vehicles/:id returns 400 for invalid field values', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/vehicles/${createdId}`)
      .send({ ano: 1800 });

    expect(res.status).toBe(400);
  });

  it('PUT /api/vehicles/:id returns 409 on conflict with another vehicle', async () => {
    const second = await request(app.getHttpServer())
      .post('/api/vehicles')
      .send({
        placa: 'DEF5E67',
        chassi: '1HGBH41JXMN109186',
        renavam: '98765432101',
        modelo: 'Civic',
        marca: 'Honda',
        ano: 2023,
      });
    expect(second.status).toBe(201);

    const res = await request(app.getHttpServer())
      .put(`/api/vehicles/${second.body.id}`)
      .send({ placa: validDto.placa });

    expect(res.status).toBe(409);
  });

  it('PUT /api/vehicles/:id allows updating with own unique values', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/vehicles/${createdId}`)
      .send({ placa: validDto.placa, modelo: 'Corolla GLi' });

    expect(res.status).toBe(200);
    expect(res.body.modelo).toBe('Corolla GLi');
  });

  it('DELETE /api/vehicles/:id returns 400 for invalid uuid', async () => {
    const res = await request(app.getHttpServer()).delete(
      '/api/vehicles/not-a-uuid'
    );
    expect(res.status).toBe(400);
  });

  it('DELETE /api/vehicles/:id returns 404 for unknown id', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app.getHttpServer()).delete(
      `/api/vehicles/${fakeId}`
    );
    expect(res.status).toBe(404);
  });

  it('DELETE /api/vehicles/:id removes a vehicle', async () => {
    const res = await request(app.getHttpServer()).delete(
      `/api/vehicles/${createdId}`
    );
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const check = await request(app.getHttpServer()).get(
      `/api/vehicles/${createdId}`
    );
    expect(check.status).toBe(404);
  });

  it('GET /api/vehicles returns vehicles ordered by createdAt DESC', async () => {
    const all = await request(app.getHttpServer()).get('/api/vehicles');
    for (const v of all.body) {
      await request(app.getHttpServer()).delete(`/api/vehicles/${v.id}`);
    }

    await request(app.getHttpServer()).post('/api/vehicles').send({
      placa: 'AAA1A11',
      chassi: '11111111111111111',
      renavam: '11111111111',
      modelo: 'First',
      marca: 'Brand',
      ano: 2020,
    });

    await request(app.getHttpServer()).post('/api/vehicles').send({
      placa: 'BBB2B22',
      chassi: '22222222222222222',
      renavam: '22222222222',
      modelo: 'Second',
      marca: 'Brand',
      ano: 2021,
    });

    const res = await request(app.getHttpServer()).get('/api/vehicles');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].modelo).toBe('Second');
    expect(res.body[1].modelo).toBe('First');
  });
});
