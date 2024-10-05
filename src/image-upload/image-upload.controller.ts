import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { CreateImageUploadDto } from './dto/create-image-upload.dto';
import { UpdateImageUploadDto } from './dto/update-image-upload.dto';

@Controller('image-upload')
export class ImageUploadController {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  @Post()
  create(@Body() createImageUploadDto: CreateImageUploadDto) {
    return this.imageUploadService.create(createImageUploadDto);
  }

  @Get()
  findAll() {
    return this.imageUploadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imageUploadService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImageUploadDto: UpdateImageUploadDto) {
    return this.imageUploadService.update(+id, updateImageUploadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imageUploadService.remove(+id);
  }
}
