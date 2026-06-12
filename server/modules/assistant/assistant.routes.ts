import { Router } from 'express';
import { AssistantController } from './assistant.controller';

export function createAssistantRouter(storeDatabase: any, supabase: any): Router {
  const router = Router();

  // POST /api/assistant/chat
  router.post('/chat', async (req, res) => {
    await AssistantController.handleChat(req, res, storeDatabase, supabase);
  });

  // POST /api/assistant/feedback
  router.post('/feedback', async (req, res) => {
    await AssistantController.handleFeedback(req, res, supabase);
  });

  // GET /api/assistant/history
  router.get('/history', async (req, res) => {
    await AssistantController.handleGetHistory(req, res, supabase);
  });

  // GET /api/assistant/context
  router.get('/context', async (req, res) => {
    await AssistantController.handleGetContext(req, res, storeDatabase, supabase);
  });

  return router;
}
