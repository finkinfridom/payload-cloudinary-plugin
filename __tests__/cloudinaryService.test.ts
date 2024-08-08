import { describe, expect } from "@jest/globals";

import {
  CloudinaryService,
  mediaManagement,
} from "../src/services/cloudinaryService";
import payload, { buildConfig } from "payload";
import path from "path";
import fs from "fs";
import type { UploadApiResponse } from "cloudinary";
import { v2 as cloudinary } from "cloudinary";
import type { CloudinaryPluginRequest } from "../src";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { slateEditor } from "@payloadcms/richtext-slate";
import type { Config } from "payload";
jest.mock("cloudinary");
jest.mock("payload");
const staticDir = "__tmp_media__";
describe("cloudinaryService", () => {
  let spyDelete;
  const baseConfig = {
    db: mongooseAdapter({ url: "" }),
    editor: slateEditor({}),
  } as Config;
  beforeAll(() => {
    if (fs.existsSync(staticDir)) {
      fs.rmdirSync(staticDir, {
        recursive: true,
      });
    }
    jest.spyOn(cloudinary.uploader, "upload").mockResolvedValue({
      public_id: "test-12345",
    } as UploadApiResponse);
    spyDelete = jest.spyOn(cloudinary.uploader, "destroy").mockImplementation();
  });
  const service = new CloudinaryService();
  const payloadConfig = buildConfig({
    ...baseConfig,
    collections: [],
  });
  describe("upload", () => {
    beforeAll(async () => {
      payload.config = await payloadConfig;
      payload.config.paths = {
        ...payload.config.paths,
        configDir: path.dirname("."),
        config: "",
      };
    });
    it("disableLocalStorage option as 'true' should create and remove tmp file", async () => {
      const testStaticDir = `${staticDir}/__tests__/disableLocalStorage`;
      const response = await service.upload(
        "test.txt",
        Buffer.from("this is a test", "utf-8"),
        payload,
        {
          slug: "media",
          upload: {
            disableLocalStorage: true,
            staticURL: "/media",
            staticDir: testStaticDir,
          },
        } as any
      );
      expect(response.public_id).toBe("test-12345");
      const files = fs.readdirSync(testStaticDir);
      expect(files).toHaveLength(0);
    });
  });
  describe("delete", () => {
    it("should execute 'destroy' method", async () => {
      await service.delete("12356.png");
      expect(spyDelete).toBeCalledTimes(1);
    });
  });
  describe("mediaManagement", () => {
    it("should return enriched req", () => {
      const handler = mediaManagement();
      const req = {} as CloudinaryPluginRequest;
      handler(req, {}, () => {});
      expect(req.cloudinaryService).not.toBeUndefined();
    });
  });
});
