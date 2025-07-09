import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @IsNumber()
  @IsOptional()
  relatedEntityId?: number;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
} 