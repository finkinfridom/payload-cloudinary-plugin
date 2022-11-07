# payload-cloudinary-plugin

Extends `payloadcms` with Cloudinary integration

## Install

`yarn add payload-cloudinary-plugin`

## Get Started

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
