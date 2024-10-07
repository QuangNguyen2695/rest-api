import { TimeStampFB } from "@/utils/utils.dto";

export class CreateProductDto {
    id: string;
    name: string;
    cate: string;
    desc: string;
    mainImage: string;
    galleryImage: Array<string>;
    options: Array<ProductOption>;
    variants: Array<VariantsDto>;
    createAt: TimeStampFB;
    updateAt: TimeStampFB;
    keywords: string[]
}

export class ProductOption {
    option_id: string;
    option_values: Array<ProductOptionValue>;
    isOptionSetup: boolean
}

export class ProductOptionValue {
    image: string;
    name: string;
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
