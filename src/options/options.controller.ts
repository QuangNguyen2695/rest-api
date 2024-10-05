import { Controller, Get, Post, Body, Put, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { OptionsService } from './options.service';
import { CreateOptionDto, SearchOptionsQuery, UpdateOptionDto } from './dto/option.dto';
import { Auth } from '@/decorators/auth.decorator';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) { }

  @Auth('ADMIN')
  @Post()
  create(@Body() createOptionDto: CreateOptionDto) {
    return this.optionsService.create(createOptionDto);
  }
  
  @Auth('USER')
  @Get()
  search(
    @Query(new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true
    })) query: SearchOptionsQuery
  ) {
    const { pageIdx = 0, pageSize = 0, keyword = "", sortBy = "", filter = "" } = query;
    return this.optionsService.search(+pageIdx, +pageSize, keyword, sortBy, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.optionsService.findOne(+id);
  }

  @Auth('USER')
  @Put()
  update(@Body() updateOptionDto: UpdateOptionDto) {
    return this.optionsService.update(updateOptionDto);
  }

  @Auth('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.optionsService.remove(+id);
  }
}
