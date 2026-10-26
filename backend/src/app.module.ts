import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ForwardAuthGuard } from './auth/forward-auth.guard.js';
import { FillUpsModule } from './fill-ups/fill-ups.module.js';
import { FuelTypesModule } from './fuel-types/fuel-types.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StatsModule } from './stats/stats.module.js';
import { getUploadsDir } from './vehicles/uploads.util.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: getUploadsDir(),
      serveRoot: '/api/uploads',
    }),
    PrismaModule,
    VehiclesModule,
    FuelTypesModule,
    FillUpsModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ForwardAuthGuard }],
})
export class AppModule {}
