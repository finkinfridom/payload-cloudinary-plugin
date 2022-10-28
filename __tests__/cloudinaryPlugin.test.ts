import { Field } from "payload/types";
import { cloudinaryPlugin } from "../src"
import { mapRequiredFields } from "../src/plugins/cloudinaryPlugin"

describe("cloudinaryPlugin", () => {
    it("config with empty collections should not throw exception", () => {
        const plugin = cloudinaryPlugin();
        expect(() => plugin({})).not.toThrowError();
    })
    // it("mapRequiredFields should not return duplicate items", () => {
    //     const result = mapRequiredFields([{
    //         name: "public_id",
    //     }]);
    //     expect(result.filter(r => {
    //         return (r as any).name === "public_id"
    //     }).length).toBe(1)
    // })
})