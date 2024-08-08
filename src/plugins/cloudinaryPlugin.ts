import { UploadApiResponse } from "cloudinary";
import { Config, Plugin, APIError, UploadConfig } from "payload";
import { Field, FieldBase } from "payload/dist/fields/config/types";
import type {
  BeforeChangeHook,
  AfterDeleteHook,
  AfterReadHook,
} from "payload/dist/collections/config/types";

import { CloudinaryPluginRequest, PluginConfig } from "../types";

export const GROUP_NAME = "cloudinary";
export const DEFAULT_REQUIRED_FIELDS = [
  { name: "public_id", label: "Public ID" },
  { name: "original_filename", label: "Original filename" },
  { name: "format", label: "Format" },
  { name: "secure_url", label: "URL" },
  { name: "resource_type", label: "Resource Type" },
];

const setCloudinaryField = (inputField: Partial<Field> | string): Field => {
  const numberField = ["height", "width", "size"];
  const booleanField = ["isPrivateFile"];

  const field: Partial<Field> = getPartialField(inputField);
  const name = (field as FieldBase).name;
  if (numberField.includes(name)) {
    field.type = "number";
  } else if (booleanField.includes(name)) {
    field.type = "checkbox";
  } else {
    field.type = "text";
  }

  return field as Field;
};

export const getPartialField = (field: string | Partial<Field>) => {
  return typeof field === "string"
    ? {
        name: field,
      }
    : field;
};
export const mapRequiredFields = (
  additionalFields?: Array<Partial<Field> | string>
): Field[] => {
  const merge = (additionalFields || []).concat(DEFAULT_REQUIRED_FIELDS);
  return merge
    .filter(
      (item, idx, arr) =>
        arr.findIndex((itemToFind) => {
          const partialItem = getPartialField(item) as FieldBase;
          const partialItemToFind = getPartialField(itemToFind) as FieldBase;
          return partialItem.name === partialItemToFind.name;
        }) === idx
    )
    .map((name) => setCloudinaryField(name));
};
export const beforeChangeHook: BeforeChangeHook = async (args) => {
  const file = args.req.file;
  if (!(file && args.data?.filename)) {
    return;
  }
  try {
    const uploadResponse = await (
      args.req as CloudinaryPluginRequest
    ).cloudinaryService.upload(
      args.data.filename,
      file.data,
      args.req.payload,
      args.collection
    );
    return {
      ...args.data,
      [GROUP_NAME]: uploadResponse,
    };
  } catch (e) {
    throw new APIError(`Cloudinary: ${JSON.stringify(e)}`);
  }
};

export const afterDeleteHook: AfterDeleteHook = async ({ req, doc }) => {
  if (!doc[GROUP_NAME]) {
    return;
  }
  try {
    const apiResponse = doc[GROUP_NAME] as UploadApiResponse;
    await (req as CloudinaryPluginRequest).cloudinaryService.delete(
      apiResponse.public_id,
      {
        resource_type: apiResponse.resource_type,
      }
    );
  } catch (e) {
    throw new APIError(`Cloudinary: ${JSON.stringify(e)}`);
  }
};
export const afterReadHook: AfterReadHook = ({ doc }) => {
  const newDoc = {
    ...doc,
    original_doc: {
      url: doc.url,
      filename: doc.filename,
    },
    url: doc.cloudinary.secure_url,
    filename: doc.cloudinary.public_id,
  };
  return newDoc;
};
const cloudinaryPlugin = (pluginConfig?: PluginConfig) => {
  return ((incomingConfig: Config): Config => {
    const config: Config = {
      ...incomingConfig,
      collections: (incomingConfig.collections || []).map((collection) => {
        if (!collection.upload) {
          return collection;
        }
        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            beforeChange: [
              ...(collection.hooks?.beforeChange || []),
              beforeChangeHook,
            ],
            afterDelete: [
              ...(collection.hooks?.afterDelete || []),
              afterDeleteHook,
            ],
            afterRead: [...(collection.hooks?.afterRead || []), afterReadHook],
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
            ...(collection.upload as UploadConfig),
            adminThumbnail: ({ doc }) => {
              return (doc[GROUP_NAME] as UploadApiResponse)?.secure_url;
            },
          },
        };
      }),
    };
    return config;
  }) as Plugin;
};
export default cloudinaryPlugin;
