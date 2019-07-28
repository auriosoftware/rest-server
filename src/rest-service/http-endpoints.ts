import {getLogger} from '../lib/logger';
import {RequestContext} from './request-context';
import {HttpEndpoint, HttpMethod} from '../lib/express-api/http-endpoint';

export const demoEndpoints: Array<HttpEndpoint<RequestContext>> = [
    {
        route: '/ping',
        method: HttpMethod.POST,
        handler: (req, res, context) => {
            res.status(200).send('pong!');
        }
    }
];

export const logger = getLogger('uploadFile');
