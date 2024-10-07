import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsQuery } from './dto/product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  search(
    @Query(new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true
    })) query: SearchProductsQuery
  ) {
    console.log("🚀 ~ ProductsController ~ search:")
    const { pageIdx = 0, pageSize = 0, keyword = "", sortBy = "", filter = "" } = query;
    return this.productsService.search(+pageIdx, +pageSize, keyword, sortBy, filter);
  }

  @Get('findOne')
  findOne(@Query('id') id: string) {
    console.log("🚀 ~ ProductsController ~ findOne ~ findOne:")
    return this.productsService.findOne(+id);
  }

  @Put()
  update(@Body() updateOptionDto: UpdateProductDto) {
    return this.productsService.update(updateOptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
