import { Injectable } from '@nestjs/common';
import { firestore } from 'firebase-admin';
import { FirebaseAdmin } from '@/config/firebase.setup';
import { CategoriesDtoRes, CreateCategoriesDto, SearchCategoriesRes, TreeCategoryDto, UpdateCategoriesDto } from './dto/categories.dto';
import { v4 as uuidv4 } from 'uuid';
import { decrementTotalItem, getNextId, incrementCounter, TimeStampFB } from '@/utils/utils.dto';

@Injectable()
export class CategoriesService {
  categoriesRef: FirebaseFirestore.CollectionReference;
  counterRef: FirebaseFirestore.DocumentReference;

  fDB: FirebaseFirestore.Firestore;

  constructor(private readonly admin: FirebaseAdmin) {
    this.fDB = this.admin.fDB();
    this.categoriesRef = this.fDB.collection("categories");
    this.counterRef = this.categoriesRef.doc("counter");

  }

  async create(createCategoriesDto: CreateCategoriesDto): Promise<any> {
    if (!CreateCategoriesDto || typeof createCategoriesDto !== 'object' || Array.isArray(createCategoriesDto)) {
      throw new Error("Invalid input: must be an object");
    }

    if (!createCategoriesDto.name || typeof createCategoriesDto.name !== 'string') {
      throw new Error("Invalid input: name is required and must be a string");
    }

    try {
      const id = await getNextId(this.counterRef);
      createCategoriesDto.id = id;  // Assign the new ID to the createCategoriesDto instance

      const createCategoriesDtoToInsert = {
        ...createCategoriesDto,
        id: id,
        indexTreeCategories: await this.setIndexTreeCategories(createCategoriesDto.parentId),
        createAt: firestore.FieldValue.serverTimestamp(),
        updateAt: firestore.FieldValue.serverTimestamp()
      };

      createCategoriesDtoToInsert.keywords = this.generateKeywords(createCategoriesDtoToInsert.name, createCategoriesDtoToInsert.description);

      await this.categoriesRef.doc(id.toString()).set(createCategoriesDtoToInsert);

      await incrementCounter(this.counterRef);

      // Fetch the created document to return the most current data
      const createdSnapshot = await this.categoriesRef.doc(id.toString()).get();
      return Object.assign(new CategoriesDtoRes(), createdSnapshot.data());
    } catch (error) {
      console.error("Error in createCategoriess:", error);
      throw new Error(`An error occurred while creating categoriess: ${error.message}`);
    }
  }

  async setIndexTreeCategories(parentId: number) {
    if (!parentId) {
      return 0;
    }
    const parentCategories = await this.findOne(parentId);
    return parentCategories.indexTreeCategories += 1;
  }

  async search(pageIdx: number, pageSize: number, keyword: string, sortBy: any, filter: string) {
    try {
      const res = new SearchCategoriesRes();
      console.log("🚀 ~ CategoriessService ~ search ~ pageSize:", pageSize)
      console.log("🚀 ~ CategoriessService ~ search ~ pageIdx:", pageIdx)
      if (!pageIdx && !pageSize) {
        const categoriess = await this.getAllCategoriess();
        return Object.assign(res, categoriess);
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

      res.categories = Object.assign(res.categories, result);;
      res.pageIdx = pageIdx;
      res.totalPage = Math.ceil(totalItem / pageSize) || 1;
      res.totalItem = totalItem;
      return res;
    } catch (error) {
      console.error("Error in searchCategoriess:", error);
      throw new Error("An error occurred while searching categoriess");
    }
  }

  async findOne(id: number) {
    const docRef = this.categoriesRef.doc(id.toString());
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error("Categories not found");
    }

    return Object.assign(new CategoriesDtoRes(), docSnapshot.data());

  }

  async update(updateCategoriesDto: UpdateCategoriesDto) {
    if (!updateCategoriesDto || typeof updateCategoriesDto !== 'object' || Array.isArray(updateCategoriesDto)) {
      throw new Error("Invalid input: must be an object");
    }

    try {

      const docRef = this.categoriesRef.doc(updateCategoriesDto.id.toString());
      const docSnapshot = await docRef.get();

      const category = docSnapshot.data();

      const checkUpdateBackToChilrent = await this.checkUpdateBackToChilrent(updateCategoriesDto, category);

      if (checkUpdateBackToChilrent) {
        const chilrentOfCategory = await this.getchilrendCategory(category);
        await Promise.all(
          chilrentOfCategory.map(async (c: any) => {
            c.parentId = category.parentId;
            return this.update(c);
          })
        );
      }

      console.log("🚀 ~ CategoriesService ~ update ~ checkUpdateBackToChilrent:", checkUpdateBackToChilrent)

      if (!docSnapshot.exists) {
        throw new Error("Categories not found");
      }

      updateCategoriesDto.keywords = this.generateKeywords(updateCategoriesDto.name, updateCategoriesDto.description);
      console.log("🚀 ~ CategoriessService ~ updateCategoriess ~ categoriess.keywords:", updateCategoriesDto.keywords)


      const UpdateCategoriesDtoToInsert = {
        ...updateCategoriesDto,
        updateAt: firestore.FieldValue.serverTimestamp()
      };

      await docRef.update(UpdateCategoriesDtoToInsert);

      return Object.assign(new CategoriesDtoRes(), UpdateCategoriesDtoToInsert);

    } catch (error) {
      console.error("Error in updateCategoriess:", error);
      throw new Error(`An error occurred while updating categoriess: ${error.message}`);
    }
  }

  async checkUpdateBackToChilrent(updateCategoriesDto: any, category: any): Promise<boolean> {
    const chilrentOfCategory = await this.getchilrendCategory(category);

    // Use Promise.all with map instead of forEach
    const results = await Promise.all(
      chilrentOfCategory.map(async (c: any) => {
        // Direct match found
        if (c.id === updateCategoriesDto.parentId) {
          return true;
        }
        // Recursively check children
        return await this.checkUpdateBackToChilrent(updateCategoriesDto, c);
      })
    );

    // Return true if any child returns true
    return results.some(result => result === true);
  }

  async getchilrendCategory(category: any) {
    const queryGetChilrentOfCategory = this.categoriesRef
      .where(firestore.FieldPath.documentId(), '!=', 'counter')
      .where('parentId', '==', category.id);

    const ChilrentOfCategorySnapshot = await queryGetChilrentOfCategory.get();
    return ChilrentOfCategorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async remove(id: number) {
    const docRef = this.categoriesRef.doc(id.toString());
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error("Categories not found");
    }

    try {
      await this.categoriesRef.doc(id.toString()).delete();
      await decrementTotalItem(this.counterRef);
      return true;
    } catch (error) {
      console.error("Error in deleteCategoriess:", error);
      throw new Error("An error occurred while deleting categoriess");
    }
  }

  generateKeywords(name, description) {
    const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
      'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with']);

    const tokenize = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, '')  // Remove punctuation
        .split(/\s+/)             // Split on whitespace
        .filter(word => word.length > 1 && !stopWords.has(word));  // Remove stop words and single-character words
    };

    const nameTokens = tokenize(name);
    const descriptionTokens = description ? tokenize(description) : [];

    const allTokens = [...new Set([...nameTokens, ...descriptionTokens])];

    const keywords = [];
    for (let i = 0; i < allTokens.length; i++) {
      keywords.push(allTokens[i]);
      if (i < allTokens.length - 1) {
        keywords.push(`${allTokens[i]} ${allTokens[i + 1]}`);
      }
    }

    return keywords;
  }

  buildSearchQuery(keyword) {
    let query = this.categoriesRef.where(firestore.FieldPath.documentId(), '!=', 'counter');

    if (keyword && keyword.trim()) {
      const searchTokens = this.generateKeywords(keyword, '');
      console.log("🚀 ~ CategoriessService ~ buildSearchQuery ~ searchTokens:", searchTokens);

      if (searchTokens.length > 0) {
        query = query.where('keywords', 'array-contains-any', searchTokens);
      }
    }

    return query;
  }

  async getAllCategoriess() {
    const categoriessSnap = await this.categoriesRef.get();
    return categoriessSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
