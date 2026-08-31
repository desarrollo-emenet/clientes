import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';
@Injectable({
  providedIn: 'root'
})
export class CompressService {
  async compressImage(file: File): Promise<File> {
        const options = {
            maxSizeMB: 1,               // máximo 1 MB
            maxWidthOrHeight: 1600,     // redimensiona
            useWebWorker: true
        };

        if (file.type.startsWith('image/')) {
          return await imageCompression(file, options);
        }
        return file;

    }
}
