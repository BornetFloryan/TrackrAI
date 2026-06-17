const express = require('express');
const router = express.Router();

const moduleController = require('../controllers/module.controller');
const measureController = require('../controllers/measure.controller');
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');
const sessionController = require('../controllers/session.controller');
const aiController = require('../controllers/ai.controller');

const asyncRoute = (ctrl) => (req, res, next) =>
  Promise.resolve(ctrl(req, res, next)).catch(next);

router.get('/health', (req, res) => res.status(200).send({
  error: 0,
  status: 200,
  data: { ok: true, uptimeSeconds: Math.round(process.uptime()) },
}));

router.post('/measure/create', asyncRoute(authController.verifyServiceSecret), asyncRoute(measureController.create));
router.patch('/measure/update', asyncRoute(authController.verifyToken), asyncRoute(authController.onlyAdmin), asyncRoute(measureController.update));
router.get('/measure/get', asyncRoute(authController.verifyToken), asyncRoute(measureController.getMeasures));

router.post('/module/register', asyncRoute(authController.verifyServiceSecret), asyncRoute(moduleController.register));
router.post('/module/connection', asyncRoute(authController.verifyServiceSecret), asyncRoute(moduleController.connection))
router.post('/module/create', asyncRoute(authController.verifyToken), asyncRoute(authController.onlyAdmin), asyncRoute(moduleController.create));
router.patch('/module/update', asyncRoute(authController.verifyToken), asyncRoute(authController.onlyAdmin), asyncRoute(moduleController.update));
router.get('/module/get', asyncRoute(authController.verifyToken), asyncRoute(moduleController.getModules));

router.post('/user/create', asyncRoute(authController.verifyToken), asyncRoute(authController.onlyAdmin), asyncRoute(userController.create));
router.patch('/user/update', asyncRoute(authController.verifyToken), asyncRoute(authController.onlyAdmin), asyncRoute(userController.update));
router.get('/user/getusers', asyncRoute(authController.verifyToken), asyncRoute(authController.onlyAdminOrCoach), asyncRoute(userController.getUsers));

router.post('/auth/signin', asyncRoute(authController.signIn));
router.post('/auth/refresh', asyncRoute(authController.refresh));
router.post('/auth/logout', asyncRoute(authController.verifyToken), asyncRoute(authController.logout));
router.get('/auth/me', asyncRoute(authController.verifyToken), asyncRoute(authController.me));

router.post('/session/start', asyncRoute(authController.verifyToken), asyncRoute(sessionController.start));
router.post('/session/stop', asyncRoute(authController.verifyToken), asyncRoute(sessionController.stop));
router.post('/session/active', asyncRoute(authController.verifyServiceSecret), asyncRoute(sessionController.active));
router.post('/session/active-for-module', asyncRoute(authController.verifyToken), asyncRoute(sessionController.activeForModule));
router.get('/session/history', asyncRoute(authController.verifyToken), asyncRoute(sessionController.history));

router.get('/analysis', asyncRoute(authController.verifyToken), asyncRoute(measureController.getAnalyses));
router.get('/analysis/:analysisId', asyncRoute(authController.verifyToken), asyncRoute(measureController.getAnalysisById));

router.post('/ai/train', asyncRoute(authController.verifyToken), asyncRoute(authController.onlyAdmin), asyncRoute(aiController.trainModel))
router.get('/ai/predict/:sessionId', asyncRoute(authController.verifyToken), asyncRoute(aiController.predictForSession))
router.get('/ai/insights/:sessionId', asyncRoute(authController.verifyToken), asyncRoute(aiController.getSessionInsights))

// Backwards-compatible aliases used by the existing frontend.
router.post('/train', asyncRoute(authController.verifyToken), asyncRoute(authController.onlyAdmin), asyncRoute(aiController.trainModel))
router.get('/predict/:sessionId', asyncRoute(authController.verifyToken), asyncRoute(aiController.predictForSession))

module.exports = router;
