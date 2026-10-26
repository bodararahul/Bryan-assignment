import { Router, Request, Response, NextFunction } from 'express';
import {
  createLeadValidation,
  updateStatusValidation,
  updateLeadValidation,
  deleteLeadValidation,
  getLeadsValidation,
} from '../validators/leadValidators';
import { handleValidationErrors } from '../middleware/errorHandler';
import * as LeadModel from '../models/leadModel';
import type { CreateLeadDTO, UpdateLeadDTO, LeadStatus, LeadQueryParams } from '../types/lead';

const router = Router();

// Helper to resolve the authenticated customer tenant ID
const getTenantId = (req: Request): string => {
  return req.tenantId || req.user?.tenantId || 'tenant_default';
};

// ─── GET /api/leads ───────────────────────────────────────────────────────────
router.get(
  '/',
  getLeadsValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const params: LeadQueryParams = {
        search: req.query.search as string | undefined,
        status: req.query.status as LeadStatus | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      };
      const result = await LeadModel.getLeads(params, tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/leads/:id ───────────────────────────────────────────────────────
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const lead = await LeadModel.getLeadById(req.params.id, tenantId);
      if (!lead) {
        res.status(404).json({ error: 'Lead not found' });
        return;
      }
      res.json({ data: lead });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/leads ──────────────────────────────────────────────────────────
router.post(
  '/',
  createLeadValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const dto: CreateLeadDTO = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        notes: req.body.notes,
        tenant_id: tenantId,
      };
      const lead = await LeadModel.createLead(dto, tenantId);
      res.status(201).json({ data: lead, message: 'Lead created successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/leads/:id/status ─────────────────────────────────────────────
router.patch(
  '/:id/status',
  updateStatusValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const lead = await LeadModel.updateLeadStatus(
        req.params.id,
        req.body.status as LeadStatus,
        tenantId
      );
      if (!lead) {
        res.status(404).json({ error: 'Lead not found' });
        return;
      }
      res.json({ data: lead, message: 'Lead status updated' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/leads/:id ────────────────────────────────────────────────────────
router.put(
  '/:id',
  updateLeadValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const dto: UpdateLeadDTO = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        notes: req.body.notes,
        status: req.body.status,
      };
      const lead = await LeadModel.updateLead(req.params.id, dto, tenantId);
      if (!lead) {
        res.status(404).json({ error: 'Lead not found' });
        return;
      }
      res.json({ data: lead, message: 'Lead updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/leads/:id ────────────────────────────────────────────────────
router.delete(
  '/:id',
  deleteLeadValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const deleted = await LeadModel.deleteLead(req.params.id, tenantId);
      if (!deleted) {
        res.status(404).json({ error: 'Lead not found' });
        return;
      }
      res.json({ message: 'Lead deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
