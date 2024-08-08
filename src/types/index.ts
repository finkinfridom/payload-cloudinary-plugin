import type { Field } from "payload/dist/fields/config/types";
import type { CloudinaryService } from "../services/cloudinaryService";
import type { PayloadRequest } from "payload";

export declare type PluginConfig = {
  cloudinaryFields: Array<string | Partial<Field>>;
};

export declare type CloudinaryPluginRequest = PayloadRequest & {
  cloudinaryService: CloudinaryService;
};
