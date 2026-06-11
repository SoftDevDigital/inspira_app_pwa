import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const storageService = {
  async uploadFile(path: string, file: File): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  async uploadAudio(file: File, name: string): Promise<string> {
    const filename = `${Date.now()}_${name}`;
    return this.uploadFile(`audiobooks/audio/${filename}`, file);
  },

  async uploadCover(file: File, name: string): Promise<string> {
    const filename = `${Date.now()}_${name}`;
    return this.uploadFile(`audiobooks/covers/${filename}`, file);
  }
};
