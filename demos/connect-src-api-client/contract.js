import { demo } from '../common/demos.js';

export const apiPort = demo('connect-src-api-client').providerPort;

export const apiOrigins = [`http://127.0.0.1:${apiPort}`];
