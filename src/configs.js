var winston = require('winston');

/**
 * Create a Winston logger.
 */
function createNewLogger() {
  var customFormat = winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  );

  /**
   * Configure here your custom levels.
   */
  var customLevels = {
    levels: {
      error: 7,
      warn: 8,
      custom: 9,
      info: 10,
      debug: 11,
    },
    colors: {
      error: "red",
      warn: "yellow",
      custom: "magenta",
      info: "green", // "white",
      debug: "blue",
    },
  };

  winston.addColors(customLevels.colors);
  const transports = [
    new winston.transports.Console({
      level: process.env.LOGGER_LEVEL || 'debug',
      handleExceptions: true,
      json: false,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.splat(),
        customFormat
      ),
    }),
  ];
  return winston.createLogger({
    levels: customLevels.levels,
    transports,
    exitOnError: false,
  });
}

module.exports = {
  logger: createNewLogger() // Create logger
};
