import { ConfigOptions, DeliveryType, ResourceType, UploadApiOptions, UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { Payload } from "payload";
import { PayloadRequest, SanitizedCollectionConfig } from "payload/types";

import fs from "fs";
import path from "path";

export declare type CloudinaryPluginRequest = PayloadRequest & {
    cloudinaryService: CloudinaryService;
};
class CloudinaryService {
    private config?: ConfigOptions;
    private options?: UploadApiOptions;
    constructor(config?: ConfigOptions, options?: UploadApiOptions) {
        this.config = config;
        this.options = options;
    }
    async upload(
        filename: string,
        buffer: Buffer,
        payload: Payload,
        collectionConfig?: SanitizedCollectionConfig
    ): Promise<UploadApiResponse> {
        cloudinary.config({
            ...this.config,
            api_key: this.config?.api_key || process.env.CLOUDINARY_API_KEY,
            api_secret: this.config?.api_secret || process.env.CLOUDINARY_API_SECRET,
            cloud_name: this.config?.cloud_name || process.env.CLOUDINARY_CLOUD_NAME,
        });
        const { staticDir = "__tmp_media__", staticURL = "/media" } =
            collectionConfig?.upload;
        const staticPath = path.resolve(payload.config.paths.configDir, staticDir);
        let tmpFileName = path.join(staticPath, filename);
        const mustDeleteTempFile = collectionConfig?.upload.disableLocalStorage;
        if (collectionConfig?.upload.disableLocalStorage) {
            await fs.promises.mkdir(staticPath, { recursive: true });
            const tmpFileName = path.join(
                staticPath,
                `${new Date().getTime()}_${filename}`
            );
            await fs.promises.writeFile(tmpFileName, buffer);
        }
        const uploadPromise = cloudinary.uploader.upload(tmpFileName, {
            ...this.options,
            folder: this.options?.folder || staticURL,
        });
        if (mustDeleteTempFile) {
            await fs.promises.rm(tmpFileName);
        }
        return uploadPromise;
    }
    async delete(
        public_id: string,
        options?: {
            resource_type?: ResourceType;
            type?: DeliveryType;
            invalidate?: boolean;
        }
    ): Promise<any> {
        return cloudinary.uploader.destroy(public_id, options);
    }
}
export function mediaManagement(config?: ConfigOptions, uploadApiOptions?: UploadApiOptions) {
    const service = new CloudinaryService(config, uploadApiOptions);
    return (req: CloudinaryPluginRequest, _, next) => {
        req.cloudinaryService = service;
        next();
    }
}