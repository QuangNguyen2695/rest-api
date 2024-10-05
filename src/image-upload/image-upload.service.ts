import { Injectable } from '@nestjs/common';
import { CreateImageUploadDto } from './dto/create-image-upload.dto';
import { UpdateImageUploadDto } from './dto/update-image-upload.dto';
import { storage } from 'firebase-admin';

@Injectable()
export class ImageUploadService {
  async create(createImageUploadDto: CreateImageUploadDto) {
    const { image, pathname } = createImageUploadDto;
    const getBase64MimeType = encoded => {
      let result = null
      if (typeof encoded !== 'string') {
        return result
      }
      const mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)
      if (mime && mime.length) {
        result = mime[1]
      }
      return result
    }

    const getBase64Data = encoded => {
      const base64EncodedString = encoded.replace(/^data:\w+\/\w+;base64,/, '')
      return base64EncodedString
    }
    const contentType = getBase64MimeType(image);

    const photoData = getBase64Data(image);

    const fileBuffer = Buffer.from(photoData, "base64");

    const bucket = storage().bucket();

    const options = {
      metadata: {
        contentType,
      },
    };
    const file = bucket.file(pathname);

    file.save(fileBuffer, options);

    return await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491'
    }).then(signedUrls => {
      return signedUrls[0];
    });
  }


  findAll() {
    return `This action returns all imageUpload`;
  }

  findOne(id: number) {
    return `This action returns a #${id} imageUpload`;
  }

  update(id: number, updateImageUploadDto: UpdateImageUploadDto) {
    return `This action updates a #${id} imageUpload`;
  }

  remove(id: number) {
    return `This action removes a #${id} imageUpload`;
  }
}
