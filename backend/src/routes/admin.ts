import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { siteMiddleware } from "../middleware/site";
import { asyncHandler } from "../utils/asyncHandler";

// Controllers
import * as contentTypes from "../controllers/adminContentTypes";
import * as sites from "../controllers/adminSites";
import * as content from "../controllers/adminContent";
import * as files from "../controllers/adminFiles";
import * as platforms from "../controllers/adminPlatforms";
import * as categories from "../controllers/adminCategories";
import * as articles from "../controllers/adminArticles";
import * as users from "../controllers/adminUsers";
import * as settings from "../controllers/adminSettings";
import * as requests from "../controllers/adminRequests";
import * as messages from "../controllers/adminMessages";
import * as dashboard from "../controllers/adminDashboard";
import * as auditLog from "../controllers/adminAuditLog";
import * as downloads from "../controllers/adminDownloads";
import * as upload from "../controllers/adminUpload";

// Schemas
import { createContentTypeSchema, updateContentTypeSchema, createFieldSchema, updateFieldSchema } from "../schemas/contentType";
import { createContentSchema, updateContentSchema } from "../schemas/content";
import { createSiteSchema, updateSiteSchema } from "../schemas/site";
import { createPlatformSchema, updatePlatformSchema } from "../schemas/platform";
import { createCategorySchema, updateCategorySchema } from "../schemas/category";
import { createArticleSchema, updateArticleSchema } from "../schemas/article";
import { createUserSchema, updateUserSchema } from "../schemas/user";
import { bulkSettingsSchema } from "../schemas/settings";

const router = Router();
const h = asyncHandler;

// All admin routes require auth + site context
router.use(requireAuth);
router.use(siteMiddleware);

// Dashboard
router.get("/dashboard", h(dashboard.getDashboard));

// Content Types (read: Game Manager+, write: Super Admin only)
router.get("/content-types", requireRole(Role.GAME_MANAGER), h(contentTypes.listContentTypes));
router.get("/content-types/:id", requireRole(Role.GAME_MANAGER), h(contentTypes.getContentType));
router.post("/content-types", requireRole(Role.SUPER_ADMIN), validate(createContentTypeSchema), h(contentTypes.createContentType));
router.put("/content-types/:id", requireRole(Role.SUPER_ADMIN), validate(updateContentTypeSchema), h(contentTypes.updateContentType));
router.delete("/content-types/:id", requireRole(Role.SUPER_ADMIN), h(contentTypes.deleteContentType));

// Content Type Fields (read: Game Manager+, write: Super Admin only)
router.get("/content-types/:id/fields", requireRole(Role.GAME_MANAGER), h(contentTypes.listFields));
router.post("/content-types/:id/fields", requireRole(Role.SUPER_ADMIN), validate(createFieldSchema), h(contentTypes.createField));
router.put("/content-types/:id/fields/:fieldId", requireRole(Role.SUPER_ADMIN), validate(updateFieldSchema), h(contentTypes.updateField));
router.delete("/content-types/:id/fields/:fieldId", requireRole(Role.SUPER_ADMIN), h(contentTypes.deleteField));
router.put("/content-types/:id/fields-order", requireRole(Role.SUPER_ADMIN), h(contentTypes.reorderFields));

// Sites (Super Admin only)
router.get("/sites", requireRole(Role.SUPER_ADMIN), h(sites.listSites));
router.get("/sites/:id", requireRole(Role.SUPER_ADMIN), h(sites.getSite));
router.post("/sites", requireRole(Role.SUPER_ADMIN), validate(createSiteSchema), h(sites.createSite));
router.put("/sites/:id", requireRole(Role.SUPER_ADMIN), validate(updateSiteSchema), h(sites.updateSite));
router.delete("/sites/:id", requireRole(Role.SUPER_ADMIN), h(sites.deleteSite));

// Content (Game Manager+)
router.get("/content/shared", requireRole(Role.GAME_MANAGER), h(content.listSharedContent));
router.get("/content", requireRole(Role.GAME_MANAGER), h(content.listContent));
router.get("/content/:id", requireRole(Role.GAME_MANAGER), h(content.getContent));
router.post("/content", requireRole(Role.GAME_MANAGER), validate(createContentSchema), h(content.createContent));
router.post("/content/:id/assign", requireRole(Role.GAME_MANAGER), h(content.assignContentToSite));
router.delete("/content/:id/unassign", requireRole(Role.GAME_MANAGER), h(content.unassignContentFromSite));
router.put("/content/:id", requireRole(Role.GAME_MANAGER), validate(updateContentSchema), h(content.updateContent));
router.delete("/content/:id", requireRole(Role.GAME_MANAGER), h(content.deleteContent));

// Content Files (Game Manager+)
router.get("/content/:id/files", requireRole(Role.GAME_MANAGER), h(files.listFiles));
router.post("/content/:id/files/initiate", requireRole(Role.GAME_MANAGER), h(files.initiateUpload));
router.post("/content/:id/files/complete", requireRole(Role.GAME_MANAGER), h(files.completeUpload));
router.post("/content/:id/files/reuse", requireRole(Role.GAME_MANAGER), h(files.reuseFile));
router.delete("/content/:id/files/:fileId", requireRole(Role.GAME_MANAGER), h(files.deleteFile));

// Platforms (Super Admin only for write, Game Manager+ for read)
router.get("/platforms/shared", requireRole(Role.GAME_MANAGER), h(platforms.listSharedPlatforms));
router.get("/platforms", requireRole(Role.GAME_MANAGER), h(platforms.listPlatforms));
router.post("/platforms", requireRole(Role.SUPER_ADMIN), validate(createPlatformSchema), h(platforms.createPlatform));
router.post("/platforms/:id/assign", requireRole(Role.GAME_MANAGER), h(platforms.assignPlatformToSite));
router.delete("/platforms/:id/unassign", requireRole(Role.GAME_MANAGER), h(platforms.unassignPlatformFromSite));
router.put("/platforms/:id", requireRole(Role.SUPER_ADMIN), validate(updatePlatformSchema), h(platforms.updatePlatform));
router.delete("/platforms/:id", requireRole(Role.SUPER_ADMIN), h(platforms.deletePlatform));

// Categories (Super Admin only for write, Game Manager+ for read)
router.get("/categories/shared", requireRole(Role.GAME_MANAGER), h(categories.listSharedCategories));
router.get("/categories", requireRole(Role.GAME_MANAGER), h(categories.listCategories));
router.post("/categories", requireRole(Role.SUPER_ADMIN), validate(createCategorySchema), h(categories.createCategory));
router.post("/categories/:id/assign", requireRole(Role.GAME_MANAGER), h(categories.assignCategoryToSite));
router.delete("/categories/:id/unassign", requireRole(Role.GAME_MANAGER), h(categories.unassignCategoryFromSite));
router.put("/categories/:id", requireRole(Role.SUPER_ADMIN), validate(updateCategorySchema), h(categories.updateCategory));
router.delete("/categories/:id", requireRole(Role.SUPER_ADMIN), h(categories.deleteCategory));

// Articles (Content Manager+)
router.get("/articles", requireRole(Role.CONTENT_MANAGER), h(articles.listArticles));
router.get("/articles/:id", requireRole(Role.CONTENT_MANAGER), h(articles.getArticle));
router.post("/articles", requireRole(Role.CONTENT_MANAGER), validate(createArticleSchema), h(articles.createArticle));
router.put("/articles/:id", requireRole(Role.CONTENT_MANAGER), validate(updateArticleSchema), h(articles.updateArticle));
router.delete("/articles/:id", requireRole(Role.CONTENT_MANAGER), h(articles.deleteArticle));

// Settings (Content Manager+ for content, Super Admin for all)
router.get("/settings", requireRole(Role.CONTENT_MANAGER), h(settings.listSettings));
router.put("/settings/:key", requireRole(Role.CONTENT_MANAGER), h(settings.updateSetting));
router.post("/settings/bulk", requireRole(Role.CONTENT_MANAGER), validate(bulkSettingsSchema), h(settings.bulkUpdateSettings));

// Requests (Game Manager+)
router.get("/requests", requireRole(Role.GAME_MANAGER), h(requests.listRequests));
router.put("/requests/:id", requireRole(Role.GAME_MANAGER), h(requests.updateRequestStatus));

// Messages (Content Manager+)
router.get("/messages", requireRole(Role.CONTENT_MANAGER), h(messages.listMessages));
router.get("/messages/:id", requireRole(Role.CONTENT_MANAGER), h(messages.getMessage));
router.put("/messages/:id", requireRole(Role.CONTENT_MANAGER), h(messages.updateMessageStatus));
router.delete("/messages/:id", requireRole(Role.CONTENT_MANAGER), h(messages.deleteMessage));

// Downloads (Game Manager+)
router.get("/downloads/stats", requireRole(Role.GAME_MANAGER), h(downloads.getDownloadStats));
router.get("/downloads/logs", requireRole(Role.GAME_MANAGER), h(downloads.listDownloadLogs));

// Users (Super Admin only)
router.get("/users", requireRole(Role.SUPER_ADMIN), h(users.listUsers));
router.get("/users/:id", requireRole(Role.SUPER_ADMIN), h(users.getUser));
router.post("/users", requireRole(Role.SUPER_ADMIN), validate(createUserSchema), h(users.createUser));
router.put("/users/:id", requireRole(Role.SUPER_ADMIN), validate(updateUserSchema), h(users.updateUser));
router.delete("/users/:id", requireRole(Role.SUPER_ADMIN), h(users.deleteUser));

// Image Upload (Game Manager+)
router.post("/upload-image", requireRole(Role.GAME_MANAGER), h(upload.uploadImage));

// Audit Log (all roles — non-admin see only own activity)
router.get("/audit-logs", h(auditLog.listAuditLogs));

export default router;
