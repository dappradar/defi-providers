import { Module } from '@nestjs/common';
import { DappsService } from './dapps.service';

@Module({
  providers: [DappsService],
})
export class DappsModule {}
