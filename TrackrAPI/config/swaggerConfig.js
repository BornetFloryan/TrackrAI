const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const apiBaseUrl = process.env.SWAGGER_SERVER_URL || 'http://localhost:4567/trackrapi';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrackrAI API',
      description: 'Documentation API du POC TrackrAI : authentification JWT, refresh token, sessions sportives, mesures ESP32, analyse vidéo et IA.',
      version: '1.0.0',
    },
    servers: [
      { url: apiBaseUrl, description: 'API TrackrAI' },
      { url: 'http://localhost:4567/trackrapi', description: 'Développement local API' },
      { url: 'http://localhost:5173/trackrapi', description: 'Développement via proxy Vite' },
      { url: 'http://localhost:8080/trackrapi', description: 'Production locale via Nginx' },
    ],
    components: {
      securitySchemes: {
        jwt: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token retourné par POST /auth/signin dans data.token.',
        },
        refreshToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-refresh-token',
          description: 'Refresh token opaque. Peut aussi être envoyé dans le body de POST /auth/refresh.',
        },
        serviceSecret: {
          type: 'apiKey',
          in: 'header',
          name: 'x-service-secret',
          description: 'Secret interne utilisé par le serveur central Java et les routes techniques.',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            error: { type: 'integer', example: 0 },
            status: { type: 'integer', example: 200 },
            data: { nullable: true },
          },
        },
        AuthPayload: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            login: { type: 'string', example: 'thomas' },
            rights: { type: 'array', items: { type: 'string' }, example: ['basic'] },
            coach: { nullable: true, type: 'object' },
            token: { type: 'string', description: 'Access token JWT' },
            expiresAt: { type: 'string', format: 'date-time' },
            refreshToken: { type: 'string' },
            refreshExpiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ jwt: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Vérifier que l API répond',
          security: [],
          responses: { 200: { description: 'API active' } },
        },
      },
      '/auth/signin': {
        post: {
          tags: ['Auth'],
          summary: 'Connexion utilisateur : retourne JWT et refresh token',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['login', 'password'],
                  properties: {
                    login: { type: 'string', example: 'thomas' },
                    password: { type: 'string', example: 'thomas' },
                  },
                },
                examples: {
                  sportif: { value: { login: 'thomas', password: 'thomas' } },
                  coach: { value: { login: 'coach', password: 'coach' } },
                  admin: { value: { login: 'admin', password: 'admin' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Connexion réussie' } },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Renouveler le JWT avec le refresh token',
          security: [{ refreshToken: [] }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Nouveaux jetons' }, 401: { description: 'Refresh token invalide' } },
        },
      },
      '/auth/me': {
        get: { tags: ['Auth'], summary: 'Utilisateur courant', responses: { 200: { description: 'Session valide' }, 401: { description: 'JWT invalide' } } },
      },
      '/auth/logout': {
        post: { tags: ['Auth'], summary: 'Déconnexion et révocation serveur', responses: { 200: { description: 'Session fermée' } } },
      },
      '/user/getusers': {
        get: { tags: ['Users'], summary: 'Lister les utilisateurs visibles', responses: { 200: { description: 'Liste utilisateurs' } } },
      },
      '/user/create': {
        post: {
          tags: ['Users'],
          summary: 'Créer un utilisateur (admin)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['login', 'password', 'email', 'rights'], properties: { login: { type: 'string' }, password: { type: 'string' }, email: { type: 'string' }, rights: { type: 'array', items: { type: 'string', enum: ['admin', 'coach', 'basic'] } }, coach: { type: 'string' } } } } },
          },
          responses: { 201: { description: 'Utilisateur créé' }, 403: { description: 'Droits insuffisants' } },
        },
      },
      '/user/update': {
        patch: { tags: ['Users'], summary: 'Modifier un utilisateur / affecter un coach (admin)', responses: { 200: { description: 'Utilisateur modifié' } } },
      },
      '/module/get': {
        get: { tags: ['Modules'], summary: 'Lister les modules', responses: { 200: { description: 'Modules' } } },
      },
      '/module/create': {
        post: { tags: ['Modules'], summary: 'Créer un module (admin)', responses: { 201: { description: 'Module créé' } } },
      },
      '/module/update': {
        patch: { tags: ['Modules'], summary: 'Modifier un module (admin)', responses: { 200: { description: 'Module modifié' } } },
      },
      '/module/register': {
        post: {
          tags: ['Modules'],
          summary: 'Auto-enregistrement ESP32 (interne)',
          security: [{ serviceSecret: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['uc', 'chipsets'], properties: { uc: { type: 'string', example: 'esp32' }, chipsets: { type: 'array', items: { type: 'string' }, example: ['heart_rate', 'gps', 'imu'] } } } } } },
          responses: { 201: { description: 'Module enregistré' } },
        },
      },
      '/module/connection': {
        post: { tags: ['Modules'], summary: 'Etat connecté module (interne)', security: [{ serviceSecret: [] }], responses: { 200: { description: 'Etat mis à jour' } } },
      },
      '/measure/get': {
        get: {
          tags: ['Measures'],
          summary: 'Lire les mesures visibles',
          parameters: [
            { in: 'query', name: 'key', schema: { type: 'string' }, description: 'Clé module' },
            { in: 'query', name: 'type', schema: { type: 'string' }, description: 'heart_rate, acc_x, gps_lat...' },
            { in: 'query', name: 'after', schema: { type: 'string' } },
            { in: 'query', name: 'until', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Mesures' } },
        },
      },
      '/measure/create': {
        post: { tags: ['Measures'], summary: 'Créer une mesure depuis le serveur central (interne)', security: [{ serviceSecret: [] }], responses: { 201: { description: 'Mesure créée' } } },
      },
      '/session/start': {
        post: {
          tags: ['Sessions'],
          summary: 'Démarrer ou récupérer une séance active',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['moduleKey'], properties: { moduleKey: { type: 'string' } } } } } },
          responses: { 201: { description: 'Séance démarrée' }, 200: { description: 'Séance déjà active récupérée' } },
        },
      },
      '/session/stop': {
        post: { tags: ['Sessions'], summary: 'Arrêter une séance', responses: { 200: { description: 'Séance arrêtée' } } },
      },
      '/session/active-for-module': {
        post: { tags: ['Sessions'], summary: 'Récupérer la séance active d un module', responses: { 200: { description: 'Etat actif' } } },
      },
      '/session/history': {
        get: { tags: ['Sessions'], summary: 'Historique séances filtré par rôle', responses: { 200: { description: 'Séances' } } },
      },
      '/analysis': {
        get: { tags: ['Video analysis'], summary: 'Historique des analyses vidéo visibles', responses: { 200: { description: 'Analyses' } } },
        post: { tags: ['Video analysis'], summary: 'Sauvegarder une analyse vidéo', responses: { 201: { description: 'Analyse stockée' } } },
      },
      '/analysis/{analysisId}': {
        get: { tags: ['Video analysis'], summary: 'Lire une analyse vidéo', parameters: [{ in: 'path', name: 'analysisId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Analyse' }, 404: { description: 'Non visible ou absente' } } },
      },
      '/ai/train': {
        post: { tags: ['AI'], summary: 'Réentraîner le modèle IA (admin)', responses: { 200: { description: 'Modèle entraîné' } } },
      },
      '/ai/predict/{sessionId}': {
        get: { tags: ['AI'], summary: 'Prédiction IA pour une séance', parameters: [{ in: 'path', name: 'sessionId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Prédiction' } } },
      },
      '/ai/insights/{sessionId}': {
        get: { tags: ['AI'], summary: 'Conseils IA/récupération', parameters: [{ in: 'path', name: 'sessionId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Conseils' } } },
      },
    },
  },
  apis: [path.join(__dirname, '../routes/*.js')],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

module.exports = swaggerDocs;