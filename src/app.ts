import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import dedupeRoute from '@/routes/dedupe.route';
import { Routes } from '@/interfaces/routes.interface';
import { logger } from '@/utils/logger';

class App {
  public app: Application;

  constructor(routes: Routes[]) {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  private initializeMiddlewares() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use('/', route.router);
    });

    this.app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', service: 'attribution-service' });
    });
  }

  private initializeErrorHandling() {
    this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      logger.error({ err }, 'Unhandled error');
      res.status(err.status || 500).json({ status: err.status || 500, success: false, message: err.message || 'Internal Server Error' });
    });
  }
}

export default new App([dedupeRoute]).app;
