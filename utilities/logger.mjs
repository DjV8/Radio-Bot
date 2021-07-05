import winston from 'winston';

const { format: _FORMAT, createLogger, transports: _TRANSPORTS } = winston;
const LOGFORMAT = _FORMAT.printf(({ level, timestamp, message }) => {
	return `${level}: ${timestamp}: ${message}`;
});
const logger = createLogger({
	level: 'info',
	format: _FORMAT.combine(_FORMAT.timestamp(), LOGFORMAT),
	transports: [
		new _TRANSPORTS.File({ filename: 'error.log', level: 'error' }),
		new _TRANSPORTS.File({ filename: 'bot.log' }),
		new _TRANSPORTS.Console(),
	],
	exceptionHandlers: [new _TRANSPORTS.File({ filename: 'exceptions.log' })],
});

export default logger;
