// test-imports.ts
console.log("🚀 Import tester starting...");

const imports = [
  "./src/database/connection",
  "./src/cache/redis",
  "./src/websocket/socket-handler",
  "./src/utils/logger",
  "./src/middleware/error-handler",
  "./src/routes/auth",
  "./src/routes/users",
  "./src/routes/meetings",
  "./src/routes/spaces",
  "./src/routes/documents",
  "./src/routes/security",
  "./src/routes/transcription",
  "./src/routes/reminders",
  "./src/routes/ai",
  "./src/routes/industry",
  "./src/utils/swagger",
  "./src/services/recording-prevention",
  "./src/services/transcription",
  "./src/services/ai-adaptation",
  "./src/services/document-security",
  "./src/services/private-voice",
  "./src/services/smart-reminders",
  "./src/services/spaces-threading",
];

(async () => {
  for (const mod of imports) {
    console.log(`\n🔍 Trying to import: ${mod}`);
    try {
      await import(mod);
      console.log(`✅ Successfully imported: ${mod}`);
    } catch (err) {
      console.error(`❌ Failed importing: ${mod}`, err);
      process.exit(1); // Stop immediately when culprit is found
    }
  }

  console.log("\n🎉 All imports succeeded!");
})();
