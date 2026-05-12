import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IRequestWithUser, UserRole, AppError } from "../types/index.js";
import { getConfig } from "../config/index.js";

const config = getConfig();

type VisaClaim = { product: string; role: string; status: string };
type AppTokenPayload = JwtPayload & {
  global_user_id: string;
  global_company_id?: string;
  email?: string;
  username?: string;
  visas?: VisaClaim[];
};

type ProductKeyMeta = {
  product_id: string;
  name: string;
  app_public_key: string;
  fetchedAt: number;
};

const PRODUCT_CACHE_TTL_MS = 10 * 60 * 1000;
let productKeyCache: ProductKeyMeta | null = null;
let productKeyPromise: Promise<ProductKeyMeta> | null = null;

const fetchProductKey = async (): Promise<ProductKeyMeta> => {
  if (!config.PRODUCT_ID) throw new AppError("Missing PRODUCT_ID", 500);
  if (!config.UNIVERSAL_BACKEND_URL) throw new AppError("Missing UNIVERSAL_BACKEND_URL", 500);

  const baseUrl = config.UNIVERSAL_BACKEND_URL.replace(/\/+$/, "");
  const url = `${baseUrl}/server1/api/v1/products/by-product-id/${encodeURIComponent(config.PRODUCT_ID)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError("Unable to load product public key", 502);
  }

  const data = (await response.json()) as { product_id?: string; name?: string; app_public_key?: string };
  if (!data?.app_public_key || !data?.name || !data?.product_id) {
    throw new AppError("Invalid product key response", 502);
  }

  return {
    product_id: data.product_id,
    name: data.name,
    app_public_key: data.app_public_key,
    fetchedAt: Date.now()
  };
};

const getProductKey = async (): Promise<ProductKeyMeta> => {
  const now = Date.now();
  if (productKeyCache && now - productKeyCache.fetchedAt < PRODUCT_CACHE_TTL_MS) {
    return productKeyCache;
  }

  if (!productKeyPromise) {
    productKeyPromise = (async () => {
      const meta = await fetchProductKey();
      productKeyCache = meta;
      return meta;
    })();
    productKeyPromise.finally(() => {
      productKeyPromise = null;
    });
  }

  return productKeyPromise;
};

const mapRoleFromVisas = (visas: VisaClaim[] | undefined, productName: string): UserRole => {
  const match = visas?.find(visa => visa.product === productName && visa.status === "Active");
  if (match?.role && match.role.toLowerCase() === "admin") return UserRole.ADMIN;
  return UserRole.SIGNER;
};

export const requireAuth = async (req: IRequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next(new AppError("Unauthorized", 401));
    }

    const token = header.split(" ")[1];
    const { name, app_public_key } = await getProductKey();
    const payload = jwt.verify(token, app_public_key, {
      algorithms: ["RS256"],
      issuer: "Universal-Master",
      audience: name
    }) as AppTokenPayload;

    if (!payload.global_user_id) {
      return next(new AppError("Invalid token", 401));
    }

    req.user = {
      global_user_id: payload.global_user_id,
      role: mapRoleFromVisas(payload.visas, name),
      email: payload.email,
      username: payload.username,
      visas: payload.visas
    };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError("Invalid token", 401));
  }
};

export const requireRole = (role: UserRole) => (req: IRequestWithUser, res: Response, next: NextFunction): void => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  if (req.user.role !== role) return next(new AppError("Forbidden", 403));
  next();
};
