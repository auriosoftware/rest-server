import {setLogLevel} from './lib/logger';
import {AppConfig, appConfigValidator} from './app-config';
import {ExpressHttpServer} from './lib/express-api/express-http-server';
import {getErrorDetails} from './lib/errors';
import {parse} from './utils/parse-utils';
import * as path from 'path';
import {RestService} from "./rest-service/rest-service";

main().catch((err) => {
    console.error('Error during initialization\n', err);
    process.exit(1);
});

async function main() {

    const configFile = path.resolve(`config/${process.env.NODE_ENV}.js`);
    console.info(`Using configuration ${configFile}`);
    const config: AppConfig = parse(require(configFile), appConfigValidator);

    const restService = new RestService();
    const httpServer = new ExpressHttpServer(config.httpServer);

    try {
        setLogLevel(config.logging.level);
        setupSignalHandlers();

        await restService.start({
            basePath: config.httpServer.basePath,
            getExpress: async () => httpServer.getExpress(),
        });

        httpServer.listen();
    } catch (error) {
        uncaughtErrorHandler(error);
    }

    function setupSignalHandlers() {
        process.on('SIGINT', async function () {
            console.info('< INTERRUPT SIGNAL RECEIVED >');
            await gracefulShutdown('SIGINT');
        });

        process.on('SIGTERM', async function () {
            console.info('< TERMINATE SIGNAL RECEIVED >');
            await gracefulShutdown('SIGTERM');
        });
    }

    async function gracefulShutdown(reason: string) {
        try {
            await restService.stop(reason);
            process.exit(0);
        } catch (error) {
            console.error(`Graceful shutdown failed (${getErrorDetails(error)})`);
            process.exit(1);
        }
    }

    function uncaughtErrorHandler(error: any) {
        console.error(`Exiting due to unhandled error:`, error);
        gracefulShutdown('unhandled error')
            .catch((shutdownError) => {
                console.error(`Graceful shutdown failed (${getErrorDetails(shutdownError)})`);
            })
            .finally(() => process.exit(1));
    }

}
