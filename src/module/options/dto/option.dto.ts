import { TimeStampFB } from "@/utils/utils.dto";
import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class SearchOptionsRes {
    pageIdx: number = 0;
    options: Array<OptionDtoRes> = [];
    totalPage: number = 0;
    totalItem: number = 0
}

export class OptionDto {
    id: string;
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    description: string
    createAt: TimeStampFB;
    updateAt: TimeStampFB;
}

export class OptionDtoRes {
    id: string;
    name: string;
    description: string
    createAt: TimeStampFB;
    updateAt: TimeStampFB;
}

export class CreateOptionDto {

    id: number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    description: string

    createAt: TimeStampFB;
    updateAt: TimeStampFB;

    keywords: string[]
}

export class UpdateOptionDto extends PartialType(CreateOptionDto) {
    @IsNotEmpty()
    @IsNumber()
    id: number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    description: string
}

export class SearchOptionsQuery {

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

