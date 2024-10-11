import { TimeStampFB } from "@/utils/utils.dto";
import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsString, IsOptional } from "class-validator";

export class SearchCategoriesRes {
    pageIdx: number = 0;
    categoriess: Array<CategoriesDtoRes> = [];
    totalPage: number = 0;
    totalItem: number = 0
}

export class CategoriesDto {
    id: string;
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    description: string
    createAt: TimeStampFB;
    updateAt: TimeStampFB;
}

export class CategoriesDtoRes {
    id: string;
    name: string;
    description: string
    createAt: TimeStampFB;
    updateAt: TimeStampFB;
}

export class TreeCategoryDto {
    id: string;
    name: string;
    createAt: TimeStampFB;
    updateAt: TimeStampFB;
}

export class CreateCategoriesDto {

    id: number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    description: string

    @IsOptional()
    @IsString()
    parentId: string;

    @IsOptional()
    @IsString()
    categoriesTypeId: string;


    createAt: TimeStampFB;
    updateAt: TimeStampFB;

    keywords: string[]
}

export class UpdateCategoriesDto extends PartialType(CreateCategoriesDto) {
    @IsNotEmpty()
    @IsNumber()
    id: number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    description: string
}

export class SearchCategoriessQuery {

    @Type(() => Number)
    @IsNotEmpty()
    @IsInt()
    pageIdx: number;

    @Type(() => Number)
    @IsNotEmpty()
    @IsInt()
    pageSize: number;

    @IsOptional()
    @IsString()
    keyword: string;

    @IsOptional()
    @IsString()
    sortBy: string;

    @IsOptional()
    @IsString()
    filter: string;
}

