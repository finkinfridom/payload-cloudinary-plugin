# payload-cloudinary-plugin

Extends `payloadcms` with Cloudinary integration

## Current status

[![codeql](https://github.com/finkinfridom/payload-cloudinary-plugin/actions/workflows/codeql.yml/badge.svg)](https://github.com/finkinfridom/payload-cloudinary-plugin/actions/workflows/codeql.yml)

[![test](https://github.com/finkinfridom/payload-cloudinary-plugin/actions/workflows/test.yml/badge.svg)](https://github.com/finkinfridom/payload-cloudinary-plugin/actions/workflows/test.yml)

[![publish](https://github.com/finkinfridom/payload-cloudinary-plugin/actions/workflows/publish.yml/badge.svg)](https://github.com/finkinfridom/payload-cloudinary-plugin/actions/workflows/publish.yml)

[![GitHub Super-Linter](https://github.com/finkinfridom/payload-cloudinary-plugin/workflows/Lint%20Code%20Base/badge.svg)](https://github.com/finkinfridom/payload-cloudinary-plugin/actions/workflows/linter.yml)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/320b671855ce462d9c21b3769486c256)](https://app.codacy.com/gh/finkinfridom/payload-cloudinary-plugin/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

## Install

`yarn add payload-cloudinary-plugin`

## Get Started

### Set cloudinary environment variables
```
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>
```

### server.ts

```js
import { mediaManagement } from "payload-cloudinary-plugin";

app.use(mediaManagement());
```

### payload.config.ts

```js
import cloudinaryPlugin from "payload-cloudinary-plugin/dist/plugins";

export default buildConfig({
    ....
    plugins: [cloudinaryPlugin()]
    ....
})
```

### mediaManagement function

```js
function mediaManagement(
  config?: ConfigOptions,
  uploadApiOptions?: UploadApiOptions,
  uploadResourceTypeHandler?: Function
)
```

The function may receive a `ConfigOptions` and a `UploadApiOptions` from `cloudinary` package.
Additionally, you can specify a `uploadResourceTypeHandler` to manage which `resource_type` parameter must be passed to `cloudinary.upload` (see here: https://cloudinary.com/documentation/image_upload_api_reference#upload_optional_parameters for additional information).

If the `uploadResourceTypeHandler` is NOT specified, `resource_type: auto` will be passed to upload method.
