import { setLogLevel } from '../src/lib/logger';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.should();

setLogLevel(process.env.DEBUG === 'rest_server' ? 'debug' : 'error');
