import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: 'dm3pbgdzl', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default class CloudinaryService {
  static async upload(file) {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'auto',
    });
    return result;
  }
}