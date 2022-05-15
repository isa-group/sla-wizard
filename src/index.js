#!/usr/bin/env node

var generate = require('./generate');
var utils = require('./utils');
var tests = require('../tests/basic');
var commander = require('commander');
var program = new commander.Command();

// General details
program
  .name('sla-wizard')
  .usage('<arguments> <options>');

// Config (main) command
program.command('config')
  .addArgument(new commander.Argument('<proxy>', 'Proxy for which the configuration should be generated.').choices(['nginx','haproxy','traefik','envoy']))
  .requiredOption('-o, --outFile <configFile>','Config output file.')
  .option('--oas <pathToOAS>','Path to an OAS v3 file.', './specs/oas.yaml') // TODO: default value?
  .option('--customTemplate <customTemplate>','Custom proxy configuration template.')
  .option('--authLocation <authLocation>','Where to look for the authentication parameter.','header') // TODO: choices(['header','query','url'])
  .option('--authName <authName>','Name of the authentication parameter, such as "token" or "apikey".','apikey')
  .action(function(proxy, options) {
    proxy, options = utils.validateParamsCLI(proxy, options);
    generate.generateConfigHandle(options.oas, proxy, options.outFile, options.customTemplate);
  })

// Test command
program.command('runTest')
  .description('Run test with APIPecker.')
  .requiredOption('--specs', 'Path to a test config file.')
  .option('--oas', 'Path to a OAS v3 file.','specs/oas.yaml')
  .action((options) => {
    tests.runTest(options.oas, options.specs);
  });

// Program parse
program
  .parse(process.argv);
