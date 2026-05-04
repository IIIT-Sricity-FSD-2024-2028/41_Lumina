import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Roles('*') // Public — no role required
  @ApiOperation({ summary: 'Authenticate a user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        User_ID: { type: 'string', example: 'S2024001' },
        Password: { type: 'string', example: 'password123' },
      },
      required: ['User_ID', 'Password'],
    },
  })
  @ApiResponse({ status: 201, description: 'Login successful. Returns session object.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(@Body() body: { User_ID: string; Password: string }) {
    return this.authService.login(body.User_ID, body.Password);
  }
}
