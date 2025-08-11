import pg from 'pg';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export async function updateBuildSuccess(buildId: string, manifestUrl: string, logsUrl: string) {
  await pool.query(
    'update builds set status=$1, artifact_manifest_url=$2, logs_url=$3, finished_at=now() where id=$4',
    ['succeeded', manifestUrl, logsUrl, buildId]
  );
}
export async function updateBuildFailure(buildId: string, message: string, logsUrl: string) {
  await pool.query(
    'update builds set status=$1, error_message=$2, logs_url=$3, finished_at=now() where id=$4',
    ['failed', message.substring(0, 1000), logsUrl, buildId]
  );
}
