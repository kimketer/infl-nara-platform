import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'inflnara-api',
      version: '1.0.0'
    };
  }

  @Get('metrics')
  metrics(@Res() res: Response) {
    res.set('Content-Type', 'text/plain');
    res.end('# Placeholder for Prometheus metrics\n');
  }
} 