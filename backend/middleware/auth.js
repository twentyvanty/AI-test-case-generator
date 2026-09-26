import { jwtVerify, createRemoteJWKSet } from "jose";

const keycloakUrl = process.env.KEYCLOAK_URL ?? "http://localhost:8080";
const realm = process.env.KEYCLOAK_REALM ?? "ai-test-case-generator";

const issuer = `${keycloakUrl}/realms/${realm}`;

const JWKS = createRemoteJWKSet(
  new URL(`${issuer}/protocol/openid-connect/certs`)
);

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Missing Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Missing access token",
      });
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
    });

    req.user = payload;

    next();
  } catch (error) {
    console.error("Token verification failed:", error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}