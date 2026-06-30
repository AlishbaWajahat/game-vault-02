import { Router } from "express";
import { listContentTypes, listContentByType, getContentBySlug, downloadContent } from "../controllers/publicContent";
import { listPlatforms, getPlatform } from "../controllers/publicPlatforms";
import { listCategories } from "../controllers/publicCategories";
import { listArticles, getArticle } from "../controllers/publicArticles";
import { search } from "../controllers/publicSearch";
import { submitContentRequest, submitContact } from "../controllers/publicForms";
import { getPublicSettings } from "../controllers/publicSettings";
import { validate } from "../middleware/validate";
import { contentQuerySchema } from "../schemas/content";
import { contactSchema, contentRequestSchema } from "../schemas/contact";
import { formLimiter, downloadLimiter } from "../middleware/rateLimiter";
import { siteMiddleware } from "../middleware/site";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const h = asyncHandler;

// Apply site middleware to all public routes
router.use(siteMiddleware);

// Content Types
router.get("/content-types", h(listContentTypes));

// Content by type
router.get("/content/by-type/:typeSlug", validate(contentQuerySchema, "query"), h(listContentByType));

// Content by slug
router.get("/content/:slug", h(getContentBySlug));
router.get("/content/:slug/download", downloadLimiter, h(downloadContent));

// Platforms
router.get("/platforms", h(listPlatforms));
router.get("/platforms/:slug", h(getPlatform));

// Categories
router.get("/categories", h(listCategories));

// Articles
router.get("/articles", h(listArticles));
router.get("/articles/:slug", h(getArticle));

// Settings
router.get("/settings", h(getPublicSettings));

// Search
router.get("/search", h(search));

// Forms
router.post("/requests", formLimiter, validate(contentRequestSchema), h(submitContentRequest));
router.post("/contact", formLimiter, validate(contactSchema), h(submitContact));

export default router;
