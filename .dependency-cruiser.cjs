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
      name: "main-imports-app-only",
      severity: "error",
      from: { path: "^src/main\\.tsx$" },
      to: { path: "^src/(?:contexts|features|shared|ui|platform|bootstrap)" },
    },
    {
      name: "shared-is-domain-neutral",
      severity: "error",
      from: { path: "^src/shared" },
      to: { path: "^src/(app|contexts|features)" },
    },
    {
      name: "business-modules-do-not-import-app",
      severity: "error",
      from: { path: "^src/(?:contexts|features)" },
      to: { path: "^src/app" },
    },
    {
      name: "rhythm-internals-are-private",
      severity: "error",
      from: { path: "^(?!src/contexts/rhythm/|src/app/composition/)" },
      to: { path: "^src/contexts/rhythm/(?!public(?:-(?:model|presentation))?\\.ts$|composition\\.ts$)" },
    },
    {
      name: "todo-internals-are-private",
      severity: "error",
      from: { path: "^(?!src/contexts/todo/|src/app/composition/)" },
      to: { path: "^src/contexts/todo/(?!public(?:-(?:model|presentation))?\\.ts$|composition\\.ts$)" },
    },
    {
      name: "preferences-internals-are-private",
      severity: "error",
      from: { path: "^(?!src/contexts/preferences/|src/app/composition/)" },
      to: { path: "^src/contexts/preferences/(?!public(?:-(?:model|presentation))?\\.ts$|composition\\.ts$)" },
    },
    {
      name: "data-transfer-internals-are-private",
      severity: "error",
      from: { path: "^(?!src/features/data-transfer/|src/app/composition/)" },
      to: { path: "^src/features/data-transfer/(?!public(?:-presentation)?\\.ts$|composition\\.ts$)" },
    },
    {
      name: "composition-entry-is-app-only",
      severity: "error",
      from: { path: "^(?!src/app/composition/)" },
      to: { path: "^src/(?:contexts/(?:rhythm|todo|preferences)|features/data-transfer)/composition\\.ts$" },
    },
    {
      name: "inner-layers-do-not-import-outer-layers",
      severity: "error",
      from: { path: "^src/(?:contexts/[^/]+|features/data-transfer)/domain" },
      to: { path: "^src/(?:contexts/[^/]+|features/data-transfer)/(?:application|infrastructure|presentation)" },
    },
    {
      name: "application-does-not-import-outer-layers",
      severity: "error",
      from: { path: "^src/(?:contexts/[^/]+|features/data-transfer)/application" },
      to: { path: "^src/(?:contexts/[^/]+|features/data-transfer)/(?:infrastructure|presentation)" },
    },
    {
      name: "inner-layers-do-not-import-frameworks",
      severity: "error",
      from: { path: "^src/(?:contexts/[^/]+|features/data-transfer)/(?:domain|application)" },
      to: { path: "^node_modules/(?:@neutralinojs|react|react-dom)" },
    },
    {
      name: "rhythm-does-not-import-preferences",
      severity: "error",
      from: { path: "^src/contexts/rhythm" },
      to: { path: "^src/contexts/preferences" },
    },
    {
      name: "preferences-uses-rhythm-public-model-only",
      severity: "error",
      from: { path: "^src/contexts/preferences" },
      to: {
        path: "^src/contexts/rhythm",
        pathNot: "^src/contexts/rhythm/public-model\\.ts$",
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
};
