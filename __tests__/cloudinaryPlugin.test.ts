import { UploadApiResponse } from "cloudinary";
import { FieldBase } from "payload/dist/fields/config/types";
import { PayloadRequest } from "payload/types";
import { cloudinaryPlugin, CloudinaryPluginRequest } from "../src";
import {
  beforeChangeHook,
  getPartialField,
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
    beforeAll(() => {
      spyUpload = jest
        .spyOn(CloudinaryService.prototype, "upload")
        .mockImplementation();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });
    it("'beforeChangeHook' should return undefined for invalid inputs", async () => {
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
    it("'beforeChangeHook' should execute 'upload' method", async () => {
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
});
