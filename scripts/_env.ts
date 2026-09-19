/** Carrega .env.local para os scripts de manutenção, fora do bootstrap do Next.js. */
import { existsSync } from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
