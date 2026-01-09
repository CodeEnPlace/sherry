# Sherry

> javascript shell multi-tool

## Example

```javascript
import $ from "@codeenplace/sherry";

const currentGitHash = await $("git", "rev-parse", "HEAD");

for await (const commitInfo of $("git", "log")) {
  console.log({ commitInfo });
}

await $({ env: { NODE_ENV: "production" } })("npm", "run", "build");

await $("ls", "|", "rev");

await $("npm", "run", "build", {
  "--setting-one": true,
  "--setting-two": false,
  "--setting-three", "fooBarBaz"
});
```
