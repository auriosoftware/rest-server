import { getLogger } from '../lib/logger';
import { demoEndpoints } from '../rest-service/http-endpoints';
import { StateTracker } from '../lib/state-tracker';
import { Express } from 'express';
import { RequestContext } from '../rest-service/request-context';
import { ServiceNotAvailableError } from '../lib/errors';
import {
    HttpRequestContextFactory,
    registerEndpointsOnExpressServer
} from '../lib/express-api/express-register-endpoints';

export enum ServiceState {
    STOPPED = 'STOPPED',
    INITIALIZING = 'INITIALIZING',
    RUNNING = 'RUNNING',
    STOPPING = 'STOPPING'
}

const logger = getLogger('RestService');

export interface DependencyInjector {
    basePath: string;
    getExpress(): Promise<Express>;
}

export class RestService {
    private state: StateTracker<ServiceState> = new StateTracker(ServiceState.STOPPED, logger);
    private httpServer: Express | null = null;
    private requestContextFactory: HttpRequestContextFactory<RequestContext> | null = null;

    public async start(injector: DependencyInjector): Promise<void> {
        this.state.assert(ServiceState.STOPPED, `Cannot start the service while service state is ${this.state.get()}`);

        this.requestContextFactory = this.createRequestContextFactory(injector);

        try {
            await this.state.set(ServiceState.INITIALIZING);

            this.httpServer = await injector.getExpress();

            registerEndpointsOnExpressServer<RequestContext>(this.httpServer, {
                endpoints: demoEndpoints,
                contextFactory: this.createRequestContextFactory(injector),
                apiVersion: 1,
                basePath: injector.basePath,
            });

            this.state.set(ServiceState.RUNNING);
        } catch (err) {
            await this.stop(`Fatal error during initialization (${err.message})`);
            throw err;
        }
    }

    public async stop(reason: string) {
        logger.info(`Service shutdown requested (reason: ${reason}).`);
        await this.state.set(ServiceState.STOPPING);

        await this.state.set(ServiceState.STOPPED);
    }

    private createRequestContextFactory(injector: DependencyInjector): HttpRequestContextFactory<RequestContext> {
        return async () => {
            if (this.state.get() !== ServiceState.RUNNING) {
                logger.debug('Ignoring request while service is not running');
                throw new ServiceNotAvailableError('Service currently not available, sorry!');
            }

            return {
            };
        };
    }
}
