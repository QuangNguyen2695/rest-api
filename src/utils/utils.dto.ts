import { firestore } from "firebase-admin";

export class TimeStampFB {
    seconds: number;
    nanoseconds: number;

    toDate() {
        return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
    }

    toString() {
        return `TimeStampFB(seconds=${this.seconds}, nanoseconds=${this.nanoseconds})`;
    }
}

export function generateKeywords(listGenerate: Array<string>) {
    const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
        'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with']);

    const tokenize = (text) => {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')  // Remove punctuation
            .split(/\s+/)             // Split on whitespace
            .filter(word => word.length > 1 && !stopWords.has(word));  // Remove stop words and single-character words
    };

    let listTokens = [];

    listGenerate.forEach((keyword: string) => {
        const token = tokenize(keyword);
        listTokens.push(token);
    })


    const allTokens = [...new Set(listGenerate)];

    const keywords = [];
    for (let i = 0; i < allTokens.length; i++) {
        keywords.push(allTokens[i]);
        if (i < allTokens.length - 1) {
            keywords.push(`${allTokens[i]} ${allTokens[i + 1]}`);
        }
    }

    return keywords;
}


export async function getNextId(counterRef: FirebaseFirestore.DocumentReference) {
    const doc = await counterRef.get();
    return doc.exists ? doc.data().numIncrease : 0;
}

export async function incrementCounter(counterRef: FirebaseFirestore.DocumentReference) {
    await counterRef.set({
        numIncrease: firestore.FieldValue.increment(1),
        totalItem: firestore.FieldValue.increment(1),
    }, { merge: true });
}

export async function decrementTotalItem(counterRef: FirebaseFirestore.DocumentReference) {
    await counterRef.set({
        totalItem: firestore.FieldValue.increment(-1),
    }, { merge: true });
}