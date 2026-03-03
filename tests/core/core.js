const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const slaWizard = require("../../index.js");

const OAS_PATH = path.join(__dirname, "./specs/examples/test-oas.yaml");
const SLA_PATH = path.join(__dirname, "./specs/examples/test-sla.yaml");
const OUTPUT_DIR = path.join(__dirname, "./test-core-output");

describe("SLA Wizard Core Comprehensive Test Suite", function () {
  this.timeout(15000);

  before(function () {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  after(function () {
    if (fs.existsSync(OUTPUT_DIR)) {
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  describe("1. Programmatic API - Proxy Support", function () {
    const proxies = ["nginx", "haproxy", "traefik", "envoy"];

    proxies.forEach((proxy) => {
      it(`should generate configuration for ${proxy} via default function`, function () {
        const outFile = path.join(OUTPUT_DIR, `prog-default-${proxy}.conf`);
        slaWizard(proxy, { outFile, oas: OAS_PATH, sla: SLA_PATH });
        expect(fs.existsSync(outFile)).to.be.true;
        const content = fs.readFileSync(outFile, "utf8");
        expect(content).to.not.be.empty;
      });

      it(`should generate configuration for ${proxy} via .config() method`, function () {
        const outFile = path.join(OUTPUT_DIR, `prog-method-${proxy}.conf`);
        slaWizard.config(proxy, { outFile, oas: OAS_PATH, sla: SLA_PATH });
        expect(fs.existsSync(outFile)).to.be.true;
      });
    });
  });

  describe("2. Programmatic API - Options Support", function () {
    it("should respect authLocation and authName options (programmatic)", function () {
      const proxy = "nginx";
      const outFile = path.join(OUTPUT_DIR, "prog-options.conf");
      slaWizard(proxy, {
        outFile,
        oas: OAS_PATH,
        sla: SLA_PATH,
        authLocation: "query",
        authName: "api-key-param",
      });
      expect(fs.existsSync(outFile)).to.be.true;
      const content = fs.readFileSync(outFile, "utf8");
      // Basic check for customized auth parameter in nginx config
      expect(content).to.contain("$arg_api-key-param");
    });

    it("should respect proxyPort option (programmatic)", function () {
      const proxy = "nginx";
      const outFile = path.join(OUTPUT_DIR, "prog-port.conf");
      slaWizard(proxy, {
        outFile,
        oas: OAS_PATH,
        sla: SLA_PATH,
        proxyPort: 8888,
      });
      expect(fs.existsSync(outFile)).to.be.true;
      const content = fs.readFileSync(outFile, "utf8");
      expect(content).to.contain("listen 8888;");
    });
  });

  describe("3. CLI Usage - Proxy Support", function () {
    const proxies = ["nginx", "haproxy", "traefik", "envoy"];

    proxies.forEach((proxy) => {
      it(`should generate configuration for ${proxy} via CLI`, function () {
        const outFile = path.join(OUTPUT_DIR, `cli-${proxy}.conf`);
        const cmd = `node index.js config ${proxy} -o "${outFile}" --oas "${OAS_PATH}" --sla "${SLA_PATH}"`;
        execSync(cmd, { cwd: path.join(__dirname, "../..") });
        expect(fs.existsSync(outFile)).to.be.true;
      });
    });
  });

  describe("4. CLI Usage - Options Support", function () {
    it("should respect authLocation and authName options (CLI)", function () {
      const outFile = path.join(OUTPUT_DIR, "cli-options.conf");
      const cmd = `node index.js config nginx -o "${outFile}" --oas "${OAS_PATH}" --sla "${SLA_PATH}" --authLocation query --authName myToken`;
      execSync(cmd, { cwd: path.join(__dirname, "../..") });
      expect(fs.existsSync(outFile)).to.be.true;
      const content = fs.readFileSync(outFile, "utf8");
      expect(content).to.contain("$arg_myToken");
    });

    it("should respect proxyPort option (CLI)", function () {
      const outFile = path.join(OUTPUT_DIR, "cli-port.conf");
      const cmd = `node index.js config nginx -o "${outFile}" --oas "${OAS_PATH}" --sla "${SLA_PATH}" --proxyPort 9999`;
      execSync(cmd, { cwd: path.join(__dirname, "../..") });
      expect(fs.existsSync(outFile)).to.be.true;
      const content = fs.readFileSync(outFile, "utf8");
      expect(content).to.contain("listen 9999;");
    });
  });

  describe("5. Core Methods Exposure", function () {
    it('should expose the "runTest" method', function () {
      expect(slaWizard.runTest).to.be.a("function");
    });
  });

  describe("6. Legacy Entry Point Compatibility", function () {
    it("should still support running via src/index.js", function () {
      const outFile = path.join(OUTPUT_DIR, "legacy-config.conf");
      const cmd = `node src/index.js config nginx -o "${outFile}" --oas "${OAS_PATH}" --sla "${SLA_PATH}"`;
      execSync(cmd, { cwd: path.join(__dirname, "../..") });
      expect(fs.existsSync(outFile)).to.be.true;
    });
  });
});
