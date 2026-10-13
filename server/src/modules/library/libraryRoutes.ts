import { Router } from 'express';
import { getCategories, getLibrary, adoptHobbyTemplate } from './libraryController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

// Categories
router.get('/categories', getCategories);

// Templates list with category & search filtering
router.get('/hobbies/templates', getLibrary);
router.get('/library', getLibrary);

// Adopt template
router.post('/hobbies/templates/:id/adopt', authenticate, adoptHobbyTemplate);
router.post('/library/adopt/:id', authenticate, adoptHobbyTemplate);

export default router;
