export default {
  paths: ["tests/features/**/*.feature"],
  import: ["tests/support/**/*.mjs", "tests/features/steps/**/*.mjs"],
  format: ["progress"],
  timeout: 60000,
};
