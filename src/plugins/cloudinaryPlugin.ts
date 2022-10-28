import { UploadApiResponse } from "cloudinary";
import { Config, Plugin } from "payload/config";
import { IncomingUploadType } from "payload/dist/uploads/types";
import { APIError } from "payload/errors";
import { Field, CollectionBeforeChangeHook, CollectionAfterDeleteHook, CollectionAfterReadHook } from "payload/types";

import { CloudinaryPluginRequest, PluginConfig } from "../types";

const GROUP_NAME = "cloudinary";
export const DEFAULT_REQUIRED_FIELDS = [{ name: "public_id", label: "Public ID" }, { name: "original_filename", label: "Original filename" }, { name: "secure_url", label: "URL" }];

const setCloudinaryField = (inputField: Partial<Field> | string): Field => {
    const numberField = ["height", "width", "size"];
    const booleanField = ["isPrivateFile"];

    const field: Partial<Field> = typeof inputField === "string" ? {
        name: inputField
    } : inputField;
    // @ts-ignore
    const name = field.name;
    if (numberField.includes(name)) {
        field.type = "number";
    } else if (booleanField.includes(name)) {
        field.type = "checkbox";
    } else {
        field.type = "text";
    }

    return field as Field;
};


export const mapRequiredFields = (additionalFields?: Array<Partial<Field> | string>): Field[] => {
    return (additionalFields || []).concat(DEFAULT_REQUIRED_FIELDS).map((name) => setCloudinaryField(name));
}
export const beforeChangeHook: CollectionBeforeChangeHook = async (args) => {
    const file = args.req.files?.file;
    if (!(file && args.data.filename)) {
        return;
    }
    try {
        const uploadResponse = await (
            args.req as CloudinaryPluginRequest
        ).cloudinaryService.upload(
            args.data.filename,
            file.data,
            args.req.payload,
            args.req.collection?.config
        );
        return {
            ...args.data,
            [GROUP_NAME]: uploadResponse,
        };
    } catch (e) {
        throw new APIError(`Cloudinary: ${JSON.stringify(e)}`);
    }
}
export const afterDeleteHook: CollectionAfterDeleteHook = async ({ req, doc }) => {
    if (!doc[GROUP_NAME]) {
        return;
    }
    try {
        await (req as CloudinaryPluginRequest).cloudinaryService.delete(
            (doc[GROUP_NAME] as UploadApiResponse).public_id
        );
    }
    catch (e) {
        throw new APIError(`Cloudinary: ${JSON.stringify(e)}`);
    }
}
export const afterReadHook: CollectionAfterReadHook = async ({ doc }) => {
    const newDoc = {
        ...doc,
        original_doc: {
            url: doc.url,
            filename: doc.filename
        },
        url: doc.cloudinary.secure_url,
        filename: doc.cloudinary.public_id
    };
    return newDoc;
}
const cloudinaryPlugin = (pluginConfig?: PluginConfig) => {
    return ((incomingConfig: Config): Config => {
        const config: Config = {
            ...incomingConfig,
            collections: (incomingConfig.collections || []).map(collection => {
                if (!collection.upload) {
                    return collection;
                }
                return {
                    ...collection,
                    hooks: {
                        ...collection.hooks,
                        beforeChange: [...collection.hooks?.beforeChange || [], beforeChangeHook],
                        afterDelete: [...collection.hooks?.afterDelete || [], afterDeleteHook],
                        afterRead: [...collection.hooks?.afterRead || [], afterReadHook],
                    },
                    fields: [
                        ...collection.fields,
                        {
                            name: GROUP_NAME,
                            type: "group",
                            fields: [...mapRequiredFields(pluginConfig?.cloudinaryFields)],
                            admin: { readOnly: true },
                        },
                    ],
                    upload: {
                        ...collection.upload as IncomingUploadType,
                        adminThumbnail: ({ doc }) => {
                            return (doc[GROUP_NAME] as UploadApiResponse)?.secure_url;
                        },
                    }
                }
            })
        }
        return config;
    }) as Plugin
};
export default cloudinaryPlugin;