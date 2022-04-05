#!/usr/bin/env node

var generate = require('./generate');
var utils = require('./utils');
var commander = require('commander');
var program = new commander.Command();

// General details
program
  .name('sla4oai-tools')
  .usage('<arguments> <options>');

// CLI arguments
program
  .addArgument(new commander.Argument('<file>', 'Path to a OAS v3 file'))
  .addArgument(new commander.Argument('<proxy>', 'Proxy for which the configuration should be generated.')
    .choices(['nginx','haproxy','traefik','envoy']));

// CLI options
program
  .requiredOption('-o, --outFile <configFile>',
                  'Config output file.')
  .option('--customTemplate <customTemplate>',
                  'Custom proxy configuration template.');

// Program action
program
  .action(function(file, proxy, options) {
    file, proxy, options = utils.validateParamsCLI(file, proxy, options);
    generate.generateConfigHandle(file, proxy, options.outFile, options.customTemplate);
  })

// Program parse
program
  .parse(process.argv);
