import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  getRoot(@Res() res: Response) {
    // Redirect browser visits on root http://localhost:3000 to Swagger UI at /api
    return res.redirect('/api');
  }

  @Get('health')
  getHealth() {
    return {
      status: 'online',
      platform: 'Lumina Multi-Tenant Academic & SaaS Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('docs/swagger.json')
  @ApiExcludeEndpoint()
  getSwaggerJson(@Res() res: Response) {
    const swaggerFilePath = require('path').resolve(process.cwd(), 'docs', 'swagger.json');
    if (require('fs').existsSync(swaggerFilePath)) {
      return res.sendFile(swaggerFilePath);
    }
    return res.redirect('/api-json');
  }
}
