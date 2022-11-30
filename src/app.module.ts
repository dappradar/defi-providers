import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DappsService } from './dapps/dapps.service';
import { DappsModule } from './dapps/dapps.module';

@Module({
  imports: [DappsModule],
  controllers: [AppController],
  providers: [AppService, DappsService],
})
export class AppModule {}
