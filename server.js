import express from 'express';
import startServer from './libs/boot';
import injectRoutes from './routes';
import injectMiddlewares from './libs/middlewares';

const server = express();

// Inject middlewares
injectMiddlewares(server);

// Inject routes
injectRoutes(server);

// Start the server
startServer(server);

export default server;
