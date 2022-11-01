import { UploadApiResponse } from "cloudinary";
import { FieldBase } from "payload/dist/fields/config/types";
import { PayloadRequest } from "payload/types";
import { cloudinaryPlugin, CloudinaryPluginRequest } from "../src";
import {
  afterDeleteHook,
  beforeChangeHook,
  getPartialField,
  GROUP_NAME,
  mapRequiredFields,
} from "../src/plugins/cloudinaryPlugin";
import { CloudinaryService } from "../src/services/cloudinaryService";
describe("cloudinaryPlugin", () => {
  it("config with empty collections should not throw exception", () => {
    const plugin = cloudinaryPlugin();
    expect(() => plugin({})).not.toThrowError();
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
      expect(expected.length).toBe(3);
      expect(
        expected.find((item) => (item as FieldBase).name === "public_id")
      ).not.toBeNull();
      expect(
        expected.find(
          (item) => (item as FieldBase).name === "original_filename"
        )
      ).not.toBeNull();
      expect(
        expected.find((item) => (item as FieldBase).name === "secure_url")
      ).not.toBeNull();
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
          })
        ).toBeUndefined();
        expect(
          await beforeChangeHook({
            req: { files: [] as unknown } as PayloadRequest<any>,
            data: { filename: null } as Partial<any>,
            operation: "create",
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
          } as CloudinaryPluginRequest,
          data: { filename: "sample-file.png" } as Partial<any>,
          operation: "create",
        });
        expect(spyUpload).toBeCalledTimes(1);
      });
    });
    describe("afterDeleteHook", () => {
      it("should return undefined for invalid inputs", async () => {
        expect(
          await afterDeleteHook({
            req: {} as PayloadRequest<any>,
            doc: {} as any,
            id: "sample-id",
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
        });
        expect(spyDelete).toBeCalledTimes(1);
      });
    });
  });
});
