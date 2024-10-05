import { PartialType } from '@nestjs/mapped-types';
import { CreateImageUploadDto } from './create-image-upload.dto';

export class UpdateImageUploadDto extends PartialType(CreateImageUploadDto) {}
