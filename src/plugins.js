// src/plugins.js
const path = require("path");
const fs = require("fs");

let plugins = [];

/**
 * Register a plugin in memory
 * @param {Object|Function} pluginModule - Plugin module
 * @param {Object} config - Optional configuration
 * @param {number} priority - Load priority
 */
function use(pluginModule, config = {}, priority = 0) {
  plugins.push({ pluginModule, config, priority });
  plugins.sort((a, b) => a.priority - b.priority);
}

/**
 * Load the configuration file for sla-wizard
 * @returns {Object} Parsed configuration object or empty object if not found or invalid
 */
function loadConfigFile() {
  const configPath = path.join(process.cwd(), "sla-wizard.config.json");
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (err) {
      console.error("Error reading sla-wizard.config.json:", err.message);
    }
  }
  return {};
}

/**
 * Load and register plugins from local directory and configuration file.
 *
 * 1. Loads local plugins from the `plugins` directory.
 * 2. Loads npm plugins declared in `sla-wizard.config.json`.
 * 3. Executes all registered plugins with the given program and context.
 *
 * @param {Object} program - Main CLI program instance
 * @param {Object} ctx - Execution context shared with plugins
 */
function loadPlugins(program, ctx) {
  const configFile = loadConfigFile();
  const pluginsConfig = configFile.plugins || [];

  // === 1. Local plugins ===
  const pluginsDir = path.join(process.cwd(), "plugins");
  if (fs.existsSync(pluginsDir)) {
    fs.readdirSync(pluginsDir).forEach((name) => {
      const pluginPath = path.join(pluginsDir, name);
      const isDir = fs.lstatSync(pluginPath).isDirectory();
      
      if (name.endsWith(".js") || isDir) {
        try {
          const plugin = require(pluginPath);
          const pluginName = name.replace(".js", "");
          const conf = pluginsConfig.find((p) => p.name === pluginName);
          use(plugin, conf?.config || {});
        } catch (err) {
          console.error(`Error loading local plugin ${name}: ${err.message}`);
        }
      }
    });
  }

  // === 2. NPM plugins specified in sla-wizard.config.json ===
  pluginsConfig.forEach((p) => {
    try {
      const plugin = require(p.name);
      use(plugin, p.config || {});
    } catch (err) {
      console.error(`There was an error loading ${p.name} plugin: ${err.message}`);
    }
  });

  // === 3. Run registered plugins ===
  for (const { pluginModule, config } of plugins) {
    try {
      if (typeof pluginModule.apply === "function") {
        pluginModule.apply(program, ctx, config);
      } else if (typeof pluginModule === "function") {
        pluginModule(program, ctx, config);
      }
    } catch (err) {
      console.error(`Error loading plugin: ${err.message}`);
    }
  }
  return plugins;
}

module.exports = { use, loadPlugins };
