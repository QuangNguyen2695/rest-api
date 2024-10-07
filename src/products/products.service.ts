import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ImageUploadService } from '@/image-upload/image-upload.service';
import { CreateImageUploadDto } from '@/image-upload/dto/create-image-upload.dto';
import { FirebaseAdmin } from '@/config/firebase.setup';
import { firestore } from 'firebase-admin';
import { ProductDtoRes, SearchProductsRes } from './dto/product.dto';
import { generateKeywords } from '@/utils/utils.dto';

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

      createProductDto = await this.uploadProductImage(createProductDto);
      createProductDto = await this.uploadProductOptionsImage(createProductDto);

      const createOptionDtoToInsert = {
        ...createProductDto,
        id: id,
        createAt: firestore.FieldValue.serverTimestamp(),
        updateAt: firestore.FieldValue.serverTimestamp(),
      };

      createOptionDtoToInsert.keywords = this.generateProductsKeywords(createProductDto);
      console.log("🚀 ~ ProductsService ~ create ~ createOptionDtoToInsert:", createOptionDtoToInsert)

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

  async search(pageIdx: number, pageSize: number, keyword: string, sortBy: any, filter: string) {
    try {
      const res = new SearchProductsRes();
      if (!pageIdx && !pageSize) {
        const products = await this.getAllProducts();
        return Object.assign(res, products);
      }

      // build search query
      let query = await this.buildSearchQuery(keyword);

      //Get total item
      const totalItem = (await query.count().get()).data().count;
      sortBy = sortBy || 'desc';
      // Apply sorting
      query = query.orderBy('createAt', sortBy);

      // Apply pagination
      if (pageIdx && pageSize) {
        const offset = (pageIdx - 1) * pageSize;
        query = query.offset(offset).limit(pageSize);
      }

      const snapshot = await query.get();
      const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      res.products = Object.assign(res.products, result);;
      res.pageIdx = pageIdx;
      res.totalPage = Math.ceil(totalItem / pageSize) || 1;
      res.totalItem = totalItem;
      return res;
    } catch (error) {
      console.error("Error in searchOptions:", error);
      throw new Error("An error occurred while searching options");
    }
  }

  async findOne(id: number) {
    const docRef = this.productsRef.doc(id.toString());
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error("Product not found");
    }

    return Object.assign(new ProductDtoRes(), docSnapshot.data());
  }

  async update(updateProductDto: UpdateProductDto) {
    if (!updateProductDto || typeof updateProductDto !== 'object' || Array.isArray(updateProductDto)) {
      throw new Error("Invalid input: must be an object");
    }

    try {

      const docRef = this.productsRef.doc();
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw new Error("Option not found");
      }

      updateProductDto.keywords = generateKeywords([updateProductDto.name, updateProductDto.desc]);
      console.log("🚀 ~ OptionsService ~ updateOptions ~ options.keywords:", updateProductDto.keywords)


      const updateProductDtoToInsert = {
        ...updateProductDto,
        updateAt: firestore.FieldValue.serverTimestamp()
      };

      await docRef.update(updateProductDtoToInsert);

      return Object.assign(new ProductDtoRes(), updateProductDtoToInsert);

    } catch (error) {
      console.error("Error in updateOptions:", error);
      throw new Error(`An error occurred while updating options: ${error.message}`);
    }
  }

  async remove(id: number) {
    const docRef = this.productsRef.doc();
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error("Option not found");
    }

    try {
      await this.productsRef.doc(id.toString()).delete();
      await this.decrementTotalItem();
      return true;
    } catch (error) {
      console.error("Error in deleteOptions:", error);
      throw new Error("An error occurred while deleting options");
    }
  }

  async getAllProducts() {
    const productsSnap = await this.productsRef.get();
    return productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    createProductDto.galleryImage = galleryImageUrls;
    return createProductDto;
  }

  async uploadProductOptionsImage(createProductDto: CreateProductDto) {
    const id = createProductDto.id;

    if (createProductDto.options) {
      const optionsImageUrls = await Promise.all(
        createProductDto.options.map(async (option) => {
          const optionImageUrls = await Promise.all(
            option.option_values.map(async (optionValue) => {
              if (optionValue.image) {
                const createVariantImageUploadDto = Object.assign(new CreateImageUploadDto(), {
                  image: optionValue.image,
                  pathname: `${this.productStoragePath}${id}/options/${option.option_id}/${optionValue.name}.jpg`,
                });
                return await this.imageUploadService.create(createVariantImageUploadDto);
              }
              return null; // Handle cases where optionValue.image is null or undefined
            }),
          );
          return {
            ...option,
            option_values: option.option_values.map((optionValue, idx) => (
              {
                ...optionValue,
                image: optionImageUrls[idx],
              }
            )),
          };
        }),
      );
      createProductDto.options = optionsImageUrls;
    }
    return createProductDto;
  }

  async getNextId() {
    const doc = await this.counterRef.get();
    return doc.exists ? doc.data().numIncrease : 0;
  }

  generateProductsKeywords(createProductDto: CreateProductDto) {
    const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
      'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with']);

    const tokenize = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, '')  // Remove punctuation
        .split(/\s+/)             // Split on whitespace
        .filter(word => word.length > 1 && !stopWords.has(word));  // Remove stop words and single-character words
    };

    const nameTokens = tokenize(createProductDto.name);
    const descriptionTokens = createProductDto.desc ? tokenize(createProductDto.desc) : [];
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

  buildSearchQuery(keyword) {
    let query = this.productsRef.where(firestore.FieldPath.documentId(), '!=', 'counter');

    if (keyword && keyword.trim()) {
      const searchTokens = generateKeywords([keyword]);

      if (searchTokens.length > 0) {
        query = query.where('keywords', 'array-contains-any', searchTokens);
      }
    }

    return query;
  }
}
