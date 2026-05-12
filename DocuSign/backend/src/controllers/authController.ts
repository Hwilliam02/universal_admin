import { Request, Response } from "express";
import UserModel from "../models/User.js";
import { AppError, IRequestWithUser } from "../types/index.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  res.status(410).json({ error: "Auth moved to Universal SSO" });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  res.status(410).json({ error: "Auth moved to Universal SSO" });
};

/** GET /auth/me — return the current user from the JWT token */
export const getMe = async (req: IRequestWithUser, res: Response): Promise<void> => {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const user = await UserModel.findOne({ global_user_id: req.user.global_user_id }).exec();
  if (!user) throw new AppError("User not found", 404);

  res.json({
    id: user._id.toString(),
    global_user_id: user.global_user_id,
    email: user.email,
    full_name: user.name,
    first_name: user.name.split(" ")[0] || user.name,
    last_name: user.name.split(" ").slice(1).join(" ") || "",
    role: req.user.role,
  });
};
