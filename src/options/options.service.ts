import { Injectable } from '@nestjs/common';
import { CreateOptionDto, OptionDto, OptionDtoRes, SearchOptionsRes, UpdateOptionDto } from './dto/option.dto';
import { firestore } from 'firebase-admin';
import { FirebaseAdmin } from '@/config/firebase.setup';
import { checkPrime } from 'crypto';

@Injectable()
export class OptionsService {
  optionsRef: FirebaseFirestore.CollectionReference;
  counterRef: FirebaseFirestore.DocumentReference;

  fDB: FirebaseFirestore.Firestore;

  constructor(private readonly admin: FirebaseAdmin) {
    this.fDB = this.admin.fDB();
    console.log("🚀 ~ OptionsService ~ constructor ~ firestore:", firestore)
    this.optionsRef = this.fDB.collection("options");
    this.counterRef = this.optionsRef.doc("counter");
  }

  async create(createOptionDto: CreateOptionDto): Promise<any> {
    if (!CreateOptionDto || typeof createOptionDto !== 'object' || Array.isArray(createOptionDto)) {
      throw new Error("Invalid input: must be an object");
    }

    if (!createOptionDto.name || typeof createOptionDto.name !== 'string') {
      throw new Error("Invalid input: name is required and must be a string");
    }

    try {
      const id = await this.getNextId();
      createOptionDto.id = id;  // Assign the new ID to the createOptionDto instance

      const createOptionDtoToInsert = {
        ...createOptionDto,
        id: id,
        createAt: firestore.FieldValue.serverTimestamp(),
        updateAt: firestore.FieldValue.serverTimestamp()
      };

      createOptionDtoToInsert.keywords = this.generateKeywords(createOptionDtoToInsert.name, createOptionDtoToInsert.description);

      await this.optionsRef.doc(id.toString()).set(createOptionDtoToInsert);

      await this.incrementCounter();

      // Fetch the created document to return the most current data
      const createdSnapshot = await this.optionsRef.doc(id.toString()).get();
      return Object.assign(new OptionDtoRes(), createdSnapshot.data());
    } catch (error) {
      console.error("Error in createOptions:", error);
      throw new Error(`An error occurred while creating options: ${error.message}`);
    }
  }


  async search(pageIdx: number, pageSize: number, keyword: string, sortBy: any, filter: string) {
    try {
      const res = new SearchOptionsRes();
      console.log("🚀 ~ OptionsService ~ search ~ pageSize:", pageSize)
      console.log("🚀 ~ OptionsService ~ search ~ pageIdx:", pageIdx)
      if (!pageIdx && !pageSize) {
        const options = await this.getAllOptions();
        return Object.assign(res, options);
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

      res.options = Object.assign(res.options, result);;
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
    const docRef = this.optionsRef.doc(id.toString());
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error("Option not found");
    }

    return Object.assign(new OptionDtoRes(), docSnapshot.data());

  }


  async update(updateOptionDto: UpdateOptionDto) {
    if (!updateOptionDto || typeof updateOptionDto !== 'object' || Array.isArray(updateOptionDto)) {
      throw new Error("Invalid input: must be an object");
    }

    try {

      const docRef = this.optionsRef.doc();
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw new Error("Option not found");
      }

      updateOptionDto.keywords = this.generateKeywords(updateOptionDto.name, updateOptionDto.description);
      console.log("🚀 ~ OptionsService ~ updateOptions ~ options.keywords:", updateOptionDto.keywords)


      const UpdateOptionDtoToInsert = {
        ...updateOptionDto,
        updateAt: firestore.FieldValue.serverTimestamp()
      };

      await docRef.update(UpdateOptionDtoToInsert);

      return Object.assign(new OptionDtoRes(), UpdateOptionDtoToInsert);

    } catch (error) {
      console.error("Error in updateOptions:", error);
      throw new Error(`An error occurred while updating options: ${error.message}`);
    }
  }

  async remove(id: number) {
    const docRef = this.optionsRef.doc();
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error("Option not found");
    }

    try {
      await this.optionsRef.doc(id.toString()).delete();
      await this.decrementTotalItem();
      return true;
    } catch (error) {
      console.error("Error in deleteOptions:", error);
      throw new Error("An error occurred while deleting options");
    }
  }

  async getNextId() {
    const doc = await this.counterRef.get();
    return doc.exists ? doc.data().numIncrease : 0;
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
    let query = this.optionsRef.where(firestore.FieldPath.documentId(), '!=', 'counter');

    if (keyword && keyword.trim()) {
      const searchTokens = this.generateKeywords(keyword, '');
      console.log("🚀 ~ OptionsService ~ buildSearchQuery ~ searchTokens:", searchTokens);

      if (searchTokens.length > 0) {
        query = query.where('keywords', 'array-contains-any', searchTokens);
      }
    }

    return query;
  }

  async getAllOptions() {
    const optionsSnap = await this.optionsRef.get();
    return optionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
