import { TimeStampFB } from "@/utils/utils.dto";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";


export class SearchProductsRes {
    pageIdx: number = 0;
    products: Array<ProductDtoRes> = [];
    totalPage: number = 0;
    totalItem: number = 0
}

export class ProductDtoRes {
    id: string;
    name: string;
    cate: string;
    desc: string;
    mainImage: string;
    galleryImage: Array<string>;
    variants: Array<VariantsDto>;
    createAt: TimeStampFB;
    updateAt: TimeStampFB;
    keywords: string[]
}

export class VariantsDto {
    upc: string;
    qty: number;
    price: string;
    option_values: Array<VariantOptionValuesDto>;
}

export class VariantOptionValuesDto {
    name: string;
    option_id: string;
}



export class SearchProductsQuery {

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

