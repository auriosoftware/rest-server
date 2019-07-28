import * as t from 'io-ts';

export const appConfigValidator = t.type({
    httpServer: t.type({
        port: t.number,
        host: t.string,
        basePath: t.string
    }, 'httpServer'),
    logging: t.type({
        level: t.string
    }, 'logging')
}, 'config');

export type AppConfig = t.TypeOf<typeof appConfigValidator>;
