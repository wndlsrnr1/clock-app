/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "domain-is-pure",
      severity: "error",
      from: { path: "^src/contexts/[^/]+/domain" },
      to: {
        path: "^(src/platform|src/ui|src/bootstrap|node_modules/@neutralinojs|node_modules/react)",
      },
    },
    {
      name: "application-does-not-import-platform",
      severity: "error",
      from: { path: "^src/contexts/[^/]+/application" },
      to: { path: "^(src/platform|src/ui|src/bootstrap)" },
    },
    {
      name: "ui-does-not-import-platform",
      severity: "error",
      from: { path: "^src/ui" },
      to: { path: "^src/platform" },
    },
    {
      name: "platform-does-not-import-ui",
      severity: "error",
      from: { path: "^src/platform" },
      to: { path: "^src/ui" },
    }
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
};

