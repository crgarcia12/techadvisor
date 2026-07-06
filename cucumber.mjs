export default {
  paths: ["tests/features/**/*.feature"],
  import: ["tests/support/**/*.mjs", "tests/features/steps/**/*.mjs"],
  format: ["progress"],
  publishQuiet: true,
  timeout: 60000,
};
