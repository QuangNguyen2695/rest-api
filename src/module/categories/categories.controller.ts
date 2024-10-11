import { Controller, Get, Post, Body, Put, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { Auth } from '@/decorators/auth.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoriesDto, SearchCategoriessQuery, UpdateCategoriesDto } from './dto/categories.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly optionsService: CategoriesService) { }

  // @Auth('ADMIN')
  @Post()
  create(@Body() createCategoriesDto: CreateCategoriesDto) {
    return this.optionsService.create(createCategoriesDto);
  }

  // @Auth('USER')
  @Get()
  search(
    @Query(new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true
    })) query: SearchCategoriessQuery
  ) {
    const { pageIdx = 0, pageSize = 0, keyword = "", sortBy = "", filter = "" } = query;
    return this.optionsService.search(+pageIdx, +pageSize, keyword, sortBy, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.optionsService.findOne(+id);
  }

  // @Auth('USER')
  @Put()
  update(@Body() updateCategoriesDto: UpdateCategoriesDto) {
    return this.optionsService.update(updateCategoriesDto);
  }

  // @Auth('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.optionsService.remove(+id);
  }
}
