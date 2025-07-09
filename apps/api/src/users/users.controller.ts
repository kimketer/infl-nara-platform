import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '현재 사용자 프로필 조회' })
  @ApiResponse({ status: 200, description: '사용자 프로필 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    const { password, ...result } = user;
    return result;
  }

  @Patch('me')
  @ApiOperation({ summary: '현재 사용자 프로필 수정' })
  @ApiResponse({ status: 200, description: '프로필 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(req.user.id, updateUserDto);
    const { password, ...result } = user;
    return result;
  }
} 