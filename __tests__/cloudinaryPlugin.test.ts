import { FieldBase, GroupField } from "payload/dist/fields/config/types";
import { PayloadRequest } from "payload/types";
import cloudinaryPlugin from "../src/plugins";
import { Plugin } from "payload/config";
import { CloudinaryPluginRequest } from "../src";
import {
  afterDeleteHook,
  afterReadHook,
  beforeChangeHook,
  getPartialField,
  GROUP_NAME,
  mapRequiredFields,
} from "../src/plugins/cloudinaryPlugin";
import { CloudinaryService } from "../src/services/cloudinaryService";
import { CollectionConfig } from "payload/dist/collections/config/types";
import {
  GetAdminThumbnail,
  IncomingUploadType,
} from "payload/dist/uploads/types";
import { UploadApiResponse } from "cloudinary";
import { RequestContext } from "payload";
describe("cloudinaryPlugin", () => {
  let plugin: Plugin;
  const defaultFieldsAsJson = JSON.stringify([
    "format",
    "original_filename",
    "public_id",
    "resource_type",
    "secure_url",
  ]);
  const reqContext = {} as RequestContext;
  beforeEach(() => {
    plugin = cloudinaryPlugin();
  });
  it("config with empty collections should not throw exception", () => {
    expect(async () => await plugin({})).not.toThrowError();
  });
  it("config with no 'upload' collection, should return same", async () => {
    const config = await plugin({
      collections: [{ slug: "sample-collection", fields: [] }],
    });
    const collection = config.collections
      ? config.collections[0]
      : ({} as Partial<CollectionConfig>);
    expect(collection.fields).toHaveLength(0);
    expect(collection.hooks).toBeUndefined();
  });
  it("config with 'upload' collection should return modified collection", async () => {
    const config = await plugin({
      collections: [
        {
          slug: "sample-collection",
          fields: [],
          upload: true,
        },
      ],
    });
    const collection = config.collections
      ? config.collections[0]
      : ({} as Partial<CollectionConfig>);
    expect(collection.hooks).not.toBeUndefined();
    expect(collection.hooks?.beforeChange).toHaveLength(1);
    expect(collection.hooks?.afterRead).toHaveLength(1);
    expect(collection.hooks?.afterDelete).toHaveLength(1);
  });
  it("config with 'upload' collection with 'hooks' should return modified collection", async () => {
    const config = await plugin({
      collections: [
        {
          slug: "sample-collection",
          fields: [],
          upload: true,
          hooks: {
            beforeChange: [function () {}],
            afterDelete: [function () {}],
            afterRead: [function () {}],
          },
        },
      ],
    });
    const collection = config.collections
      ? config.collections[0]
      : ({} as Partial<CollectionConfig>);
    const fields = collection.fields || [];
    const groupedFields = fields.find(
      (f) => (f as FieldBase).name === GROUP_NAME
    ) as GroupField;

    expect(groupedFields).not.toBeUndefined();
    expect(groupedFields.fields).toHaveLength(5);
    expect(
      JSON.stringify(
        groupedFields.fields.map((i) => (i as FieldBase).name).sort()
      )
    ).toBe(defaultFieldsAsJson);
    expect(collection.hooks?.beforeChange).toHaveLength(2);
    expect(collection.hooks?.afterRead).toHaveLength(2);
    expect(collection.hooks?.afterDelete).toHaveLength(2);
    const adminThumbnail = (collection.upload as IncomingUploadType)
      .adminThumbnail as GetAdminThumbnail;
    expect(adminThumbnail).not.toBeUndefined();
    if (adminThumbnail) {
      expect(
        adminThumbnail({
          doc: {
            [GROUP_NAME]: {
              secure_url: "https://my-img.com/1234.png",
            } as UploadApiResponse,
          } as Record<string, unknown>,
        })
      ).toBe("https://my-img.com/1234.png");
      expect(
        adminThumbnail({
          doc: {
            anyField: 1,
          } as Record<string, unknown>,
        })
      ).toBeUndefined();
    }
  });
  it("plugin with config should return additional fields", async () => {
    const enrichedPlugin = cloudinaryPlugin({
      cloudinaryFields: ["my-custom-field"],
    });
    const config = await enrichedPlugin({
      collections: [
        {
          slug: "sample-collection",
          fields: [],
          upload: true,
        },
      ],
    });
    const collection = config.collections
      ? config.collections[0]
      : ({} as Partial<CollectionConfig>);
    const groupedFields = collection.fields?.find(
      (f) => (f as FieldBase).name === GROUP_NAME
    ) as GroupField;
    expect(groupedFields.fields).toHaveLength(6);
    expect(
      groupedFields.fields.find(
        (f) => (f as FieldBase).name === "my-custom-field"
      )
    ).not.toBeUndefined();
  });
  it("getPartialField should enrich string", () => {
    expect(getPartialField("sample-field")).toHaveProperty(
      "name",
      "sample-field"
    );
  });
  describe("mapRequiredFields", () => {
    it("should not return duplicate items", () => {
      const result = mapRequiredFields([
        {
          name: "public_id",
        },
      ]);
      expect(
        result.filter((r) => {
          return (r as any).name === "public_id";
        })
      ).toHaveLength(1);
    });
    it("should return DEFAULT_REQUIRED_FIELDS", () => {
      const expected = mapRequiredFields();
      expect(expected.length).toBe(5);
      expect(
        JSON.stringify(expected.map((i) => (i as FieldBase).name).sort())
      ).toBe(defaultFieldsAsJson);
    });
    it("should set 'number' field on numeric fields", () => {
      const expected = mapRequiredFields([
        "height",
        "width",
        "size",
        "other-field",
      ]);
      expect(expected.filter((item) => item.type === "number")).toHaveLength(3);
    });
    it("should set 'checkbox' field on boolean field", () => {
      const expected = mapRequiredFields(["isPrivateFile", "other-field"]);
      expect(expected.filter((item) => item.type === "checkbox")).toHaveLength(
        1
      );
    });
  });
  describe("hooks", () => {
    let spyUpload;
    let spyDelete;
    beforeAll(() => {
      spyUpload = jest
        .spyOn(CloudinaryService.prototype, "upload")
        .mockImplementation();
      spyDelete = jest
        .spyOn(CloudinaryService.prototype, "delete")
        .mockImplementation();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });
    describe("beforeChangeHook", () => {
      it("should return undefined for invalid inputs", async () => {
        expect(
          await beforeChangeHook({
            req: {} as PayloadRequest<any>,
            data: {} as Partial<any>,
            operation: "create",
            context: reqContext,
          })
        ).toBeUndefined();
        expect(
          await beforeChangeHook({
            req: { files: {} as unknown } as PayloadRequest<any>,
            data: { filename: null } as Partial<any>,
            operation: "create",
            context: reqContext,
          })
        ).toBeUndefined();
        expect(
          await beforeChangeHook({
            req: {
              files: { file: "sample-file.jpg" } as unknown,
            } as PayloadRequest<any>,
            data: null as unknown as Partial<any>,
            operation: "create",
            context: reqContext,
          })
        ).toBeUndefined();
        expect(
          await beforeChangeHook({
            req: {
              files: { file: "sample-file.jpg" } as unknown,
            } as PayloadRequest<any>,
            data: { filename: null } as Partial<any>,
            operation: "create",
            context: reqContext,
          })
        ).toBeUndefined();
      });
      it("should execute 'upload' method", async () => {
        const cloudinaryService = new CloudinaryService();
        await beforeChangeHook({
          req: {
            cloudinaryService,
            files: {
              file: Buffer.from("sample"),
            } as unknown,
            collection: { config: plugin({}) },
          } as CloudinaryPluginRequest,
          data: { filename: "sample-file.png" } as Partial<any>,
          operation: "create",
          context: reqContext,
        });
        await beforeChangeHook({
          req: {
            cloudinaryService,
            files: {
              file: Buffer.from("sample"),
            } as unknown,
          } as CloudinaryPluginRequest,
          data: { filename: "sample-file.png" } as Partial<any>,
          operation: "create",
          context: reqContext,
        });
        expect(spyUpload).toBeCalledTimes(2);
      });
    });
    describe("afterDeleteHook", () => {
      it("should return undefined for invalid inputs", async () => {
        expect(
          await afterDeleteHook({
            req: {} as PayloadRequest<any>,
            doc: {} as any,
            id: "sample-id",
            context: reqContext,
          })
        ).toBeUndefined();
      });
      it("should execute 'delete' method", async () => {
        const cloudinaryService = new CloudinaryService();
        const doc = {};
        doc[GROUP_NAME] = { public_id: "sample-public-id" };
        await afterDeleteHook({
          req: {
            cloudinaryService,
          } as CloudinaryPluginRequest,
          doc: doc,
          id: "sample-id",
          context: reqContext,
        });
        expect(spyDelete).toBeCalledTimes(1);
      });
    });
    describe("afterReadHook", () => {
      it("should extend input 'doc'", () => {
        const doc = {
          url: "http://localhost:5000/media/sample-local.jpg",
          filename: "sample-local.jpg",
        };
        doc[GROUP_NAME] = {
          secure_url: "https://res.cloudinary.com/sample-public-id.jpg",
          public_id: "sample-public-id",
        };
        const result = afterReadHook({
          doc: doc,
          req: {} as any,
          context: reqContext,
        });
        expect(result).toHaveProperty("original_doc");
        expect(result.url).toBe(doc[GROUP_NAME].secure_url);
        expect(result.filename).toBe(doc[GROUP_NAME].public_id);
      });
    });
  });
});
