#!/usr/bin/env node

var program = require('commander');
var generate = require('./generate');

program
  .name('proxy-manager')
  .usage('<OAS v3 file in JSON or YAML> <options>')
  .arguments('<file>')
  .requiredOption('-t, --type <proxyType>',
                  'Proxy for which the configuration should be generated.') //.choices(['nginx']) // TODO: how to achieve: enum + mandatory?
  .requiredOption('-o, --outFile <configFile>',
                  'Config output file')
  .action(function(file, cmd) {
    generate.generateConfigHandle(file, cmd.type, cmd.outFile);
  })
  .parse(process.argv);

if (process.argv.length < 3) {
  program.help();
}
