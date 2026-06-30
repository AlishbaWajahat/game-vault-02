import { Response } from "express";

export function success(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function paginated(
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function error(res: Response, message: string, status = 400) {
  return res.status(status).json({ success: false, error: message });
}
