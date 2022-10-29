import { FieldBase } from "payload/dist/fields/config/types";
import { Field } from "payload/types";
import { cloudinaryPlugin } from "../src";
import {
  getPartialField,
  mapRequiredFields,
} from "../src/plugins/cloudinaryPlugin";

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
});
