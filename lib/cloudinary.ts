import { v2 as cloudinary } from "cloudinary";

type UploadResult = {
  imageUrl: string;
  publicId: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} nao configurado.`);
  return value;
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: requiredEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: requiredEnv("CLOUDINARY_API_KEY"),
    api_secret: requiredEnv("CLOUDINARY_API_SECRET"),
    secure: true
  });
  return cloudinary;
}

export function getUploadFolder(section = "gallery") {
  const base = process.env.CLOUDINARY_UPLOAD_FOLDER || "pistachio-creations";
  return `${base.replace(/\/+$/g, "")}/${section.replace(/^\/+/g, "")}`;
}

export async function uploadImageToCloudinary(
  buffer: Buffer,
  options: { folder?: string } = {}
): Promise<UploadResult> {
  const client = configureCloudinary();
  const folder = options.folder || getUploadFolder("gallery");

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          {
            quality: "auto:good",
            fetch_format: "auto"
          }
        ]
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary nao retornou resultado."));
          return;
        }
        resolve({
          imageUrl: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(buffer);
  });
}

export async function destroyCloudinaryAsset(publicId: string) {
  if (!publicId) return;
  const client = configureCloudinary();
  await client.uploader.destroy(publicId, { resource_type: "image" });
}
