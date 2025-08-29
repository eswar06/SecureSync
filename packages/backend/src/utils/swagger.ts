import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application  } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SecureSync Pro API',
      version: '1.0.0',
      description: 'The world\'s first adaptive collaboration platform with breakthrough security features',
      contact: {
        name: 'Nexus Technologies',
        url: 'https://securesync.pro',
        email: 'api@securesync.pro'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SecureSync Pro API Documentation'
  }));
};
