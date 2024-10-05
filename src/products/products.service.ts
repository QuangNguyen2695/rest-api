import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ImageUploadService } from '@/image-upload/image-upload.service';
import { CreateImageUploadDto } from '@/image-upload/dto/create-image-upload.dto';
import { FirebaseAdmin } from '@/config/firebase.setup';
import { firestore } from 'firebase-admin';

@Injectable()
export class ProductsService {
  productsRef: FirebaseFirestore.CollectionReference;
  counterRef: FirebaseFirestore.DocumentReference;
  fDB: FirebaseFirestore.Firestore;

  productStoragePath = "products/"

  constructor(private readonly admin: FirebaseAdmin, private imageUploadService: ImageUploadService) {
    this.fDB = this.admin.fDB();
    this.productsRef = this.fDB.collection("products");
    this.counterRef = this.productsRef.doc("counter");
  }


  async create(createProductDto: CreateProductDto) {

    if (!createProductDto || typeof createProductDto !== 'object' || Array.isArray(createProductDto)) {
      throw new Error("Invalid input: must be an object");
    }

    if (!createProductDto.name || typeof createProductDto.name !== 'string') {
      throw new Error("Invalid input: name is required and must be a string");
    }
    try {

      const id = await this.getNextId();
      createProductDto.id = id;

      createProductDto = await this.uploadProductImage(createProductDto)
      createProductDto = await this.uploadProductVariantsImage(createProductDto)

      const createOptionDtoToInsert = {
        ...createProductDto,
        id: id,
        createAt: firestore.FieldValue.serverTimestamp(),
        updateAt: firestore.FieldValue.serverTimestamp(),
      };

      createOptionDtoToInsert.keywords = this.generateKeywords(createProductDto);

      await this.productsRef.doc(id.toString()).set(createOptionDtoToInsert);

      await this.incrementCounter();

      // Fetch the created document to return the most current data
      const createdSnapshot = await this.productsRef.doc(id.toString()).get();
      return Object.assign(new CreateProductDto(), createdSnapshot.data());

    } catch (error) {
      console.error("Error in createOptions:", error);
      throw new Error(`An error occurred while creating options: ${error.message}`);
    }
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }

  async uploadProductImage(createProductDto: CreateProductDto) {
    const id = createProductDto.id;

    const createMainImageUploadDto = Object.assign(new CreateImageUploadDto(), {
      image: createProductDto.mainImage,
      pathname: `${this.productStoragePath}${id}/mainImage/0.jpg`,
    });

    const urlMainImage = await this.imageUploadService.create(createMainImageUploadDto);
    createProductDto.mainImage = urlMainImage;

    const galleryImageUrls = await Promise.all(
      createProductDto.galleryImage.map(async (galleryImage, idx) => {
        const createGalleryImageUploadDto = Object.assign(new CreateImageUploadDto(), {
          image: galleryImage,
          pathname: `${this.productStoragePath}${id}/galleryImage/${idx}.jpg`,
        });
        return await this.imageUploadService.create(createGalleryImageUploadDto);
      }),
    );

    if (createProductDto.variants) {
      const variantsImageUrls = await Promise.all(
        createProductDto.variants.map(async (variant) => {
          if (!variant.upc) {
            variant.upc = "1" + Math.floor(Math.random() * 10000000);
          }
          const variantImageUrls = await Promise.all(
            variant.option_values.map(async (optionValue, idx) => {
              if (optionValue.image) {
                const createVariantImageUploadDto = Object.assign(new CreateImageUploadDto(), {
                  image: optionValue.image,
                  pathname: `${this.productStoragePath}${id}/variants/${variant.upc}/${idx}.jpg`,
                });
                return await this.imageUploadService.create(createVariantImageUploadDto);
              }
              return null; // Handle cases where optionValue.image is null or undefined
            }),
          );
          return {
            ...variant,
            option_values: variant.option_values.map((optionValue, idx) => (
              {
                ...optionValue,
                image: variantImageUrls[idx],
              }
            )),
          };
        }),
      );
      createProductDto.variants = variantsImageUrls;
    }

    createProductDto.galleryImage = galleryImageUrls;
    return createProductDto;
  }

  async uploadProductVariantsImage(createProductDto: CreateProductDto) {
    const id = createProductDto.id;

    if (createProductDto.variants) {
      const variantsImageUrls = await Promise.all(
        createProductDto.variants.map(async (variant) => {
          if (!variant.upc) {
            variant.upc = "100000" + Math.floor(Math.random() * 10);
          }
          const variantImageUrls = await Promise.all(
            variant.option_values.map(async (optionValue, idx) => {
              if (optionValue.image) {
                const createVariantImageUploadDto = Object.assign(new CreateImageUploadDto(), {
                  image: optionValue.image,
                  pathname: `${this.productStoragePath}${id}/variants/${variant.upc}/${idx}.jpg`,
                });
                return await this.imageUploadService.create(createVariantImageUploadDto);
              }
              return null; // Handle cases where optionValue.image is null or undefined
            }),
          );
          return {
            ...variant,
            option_values: variant.option_values.map((optionValue, idx) => (
              {
                ...optionValue,
                image: variantImageUrls[idx],
              }
            )),
          };
        }),
      );
      createProductDto.variants = variantsImageUrls;
    }
    return createProductDto;
  }



  async getNextId() {
    const doc = await this.counterRef.get();
    return doc.exists ? doc.data().numIncrease : 0;
  }

  generateKeywords(createProductDto: CreateProductDto) {
    const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
      'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with']);

    const tokenize = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, '')  // Remove punctuation
        .split(/\s+/)             // Split on whitespace
        .filter(word => word.length > 1 && !stopWords.has(word));  // Remove stop words and single-character words
    };

    const nameTokens = tokenize(createProductDto.name);
    const descriptionTokens = createProductDto.decs ? tokenize(createProductDto.decs) : [];
    let allTokens = [...new Set([...nameTokens, ...descriptionTokens])];

    if (createProductDto.variants) {
      createProductDto.variants.forEach(variant => {
        variant.option_values.forEach(optionValue => {
          const optionValueToken = optionValue.name ? tokenize(optionValue.name) : [];
          allTokens = [...allTokens, ...optionValueToken];
        })
      })
    }

    const keywords = [];
    for (let i = 0; i < allTokens.length; i++) {
      keywords.push(allTokens[i]);
      if (i < allTokens.length - 1) {
        keywords.push(`${allTokens[i]} ${allTokens[i + 1]}`);
      }
    }

    return keywords;
  }

  async incrementCounter() {
    await this.counterRef.set({
      numIncrease: firestore.FieldValue.increment(1),
      totalItem: firestore.FieldValue.increment(1),
    }, { merge: true });
  }

  async decrementTotalItem() {
    await this.counterRef.set({
      totalItem: firestore.FieldValue.increment(-1),
    }, { merge: true });
  }
}
