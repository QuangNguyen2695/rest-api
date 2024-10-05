export class CreateProductDto {
    id: string;
    name: string;
    decs: string;
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
    image: string;
    name: string;
    option_id: string;
}
