import {
  CloudinaryService,
  mediaManagement,
} from "../src/services/cloudinaryService";
import payload from "payload";
import { buildConfig } from "payload/dist/config/build";
import path from "path";
import fs from "fs";
import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { CloudinaryPluginRequest } from "../src";
jest.mock("cloudinary");
jest.mock("payload");
const staticDir = "__tmp_media__";
describe("cloudinaryService", () => {
  let spyDelete;
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
