#!/usr/bin/env node

var slaWizardInternal = require("./src/index.js");

/**
 * Main function for sla-wizard.
 * Calling slaWizard(proxy, options) is equivalent to slaWizardInternal.config(proxy, options).
 */
// Attach all exported methods to slaWizard (config, runTest, configNginxConfd, etc.)
// We use a Proxy to ensure that dynamically added plugins (via .use()) are also available
// on the main function object without needing explicit re-assignment.
var slaWizard = new Proxy(function () {
    return slaWizardInternal.config.apply(null, arguments);
}, {
    get: function (target, prop) {
        if (Object.prototype.hasOwnProperty.call(target, prop)) {
            return target[prop];
        }
        return slaWizardInternal[prop];
    },
    has: function (target, prop) {
        return (prop in target) || (prop in slaWizardInternal);
    },
    ownKeys: function (target) {
        var keys = Object.keys(target).concat(Object.keys(slaWizardInternal));
        return Array.from(new Set(keys));
    },
    getOwnPropertyDescriptor: function (target, prop) {
        var desc = Object.getOwnPropertyDescriptor(target, prop);
        if (desc) return desc;
        return Object.getOwnPropertyDescriptor(slaWizardInternal, prop);
    }
});



// Enable CLI execution when run directly
if (require.main === module) {
    slaWizardInternal.runCLI();
}

module.exports = slaWizard;
