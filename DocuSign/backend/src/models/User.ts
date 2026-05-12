import mongoose, { Schema, Model } from "mongoose";
import { UserRole } from "../types/index.js";

export interface IUser {
  global_user_id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  global_user_id: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  role: { type: String, enum: Object.values(UserRole), required: true },
  createdAt: { type: Date, default: () => new Date() }
});

const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default UserModel;
