/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [require.resolve("./base.js"), "next/core-web-vitals"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@next/next/no-html-link-for-pages": "off",
  },
};
