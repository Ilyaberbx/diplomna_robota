// The public photo stream (`GET /reports/:id/photo`) is rendered by anonymous
// browsers as a plain <img src>, so it does not go through the JSON transport
// (ADR 0004). It needs the API origin; this mirrors app/api-client.ts.
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function reportPhotoUrl(reportId: string): string {
  return `${apiBaseUrl}/reports/${reportId}/photo`;
}
