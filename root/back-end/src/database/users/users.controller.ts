import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from '../../common/dto/create-user.dto';

@ApiTags('Users')
@ApiHeader({ name: 'x-role', required: true, description: 'Role of the requesting user' })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('Dean', 'Assistant_Dean_1', 'Assistant_Dean_2', 'Faculty')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles('Dean')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created.' })
  @ApiResponse({ status: 400, description: 'Validation or duplicate error.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create({
      userId: dto.User_ID,
      fullName: dto.Full_Name,
      email: dto.Email,
      password: dto.Password,
      role: dto.Role,
      deptId: dto.Dept_ID,
    });
  }

  @Put(':id')
  @Roles('Dean')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, {
      fullName: body.Full_Name,
      email: body.Email,
      role: body.Role,
      deptId: body.Dept_ID,
    });
  }

  @Delete(':id')
  @Roles('Dean')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
