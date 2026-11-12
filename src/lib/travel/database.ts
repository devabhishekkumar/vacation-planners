import { db } from '../auth/database';
/** Schema is installed by npm run db:migrate before deployment. */
export function travelDatabase() {
  return db();
}
