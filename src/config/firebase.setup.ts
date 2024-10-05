import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

let app: admin.app.App = null;
let fDB: FirebaseFirestore.Firestore = null;

@Injectable()
export class FirebaseAdmin implements OnApplicationBootstrap {

    constructor(private configService: ConfigService) {
        if (!app) {
            const firebaseKeyPath = this.configService.get<string>('FIREBASEKEYPATH')
            const serviceAccount = firebaseKeyPath;
            app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: "productshowing-708f8.appspot.com"
            });
            fDB = app.firestore();
        }
    }
    async onApplicationBootstrap() {

    }

    setup() {
        return app;
    }

    fDB() {
        return fDB;
    }

}

