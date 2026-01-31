// client.ts
import type {
  CheckSettings,
  Report,
  PatchResult,
  ReleaseResult,
  PersonaReview,
} from '../types';

// API Base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API KEY（Vite env）
const API_KEY: string | undefined = import.meta.env.VITE_API_KEY;
// 送信ヘッダ名（必要なら env で差し替え可能）
const API_KEY_HEADER: string =
  import.meta.env.VITE_API_KEY_HEADER || 'X-API-Key';

// API設定
interface ApiConfig {
  signal?: AbortSignal;
  apiKey?: string; // リクエスト単位で差し替えたい場合に使用
}

// APIエラークラス
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public detail: { message: string; code?: string }
  ) {
    super(detail.message);
    this.name = 'ApiError';
  }
}

// 共通のfetchラッパー
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  config?: ApiConfig
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const apiKey = config?.apiKey ?? API_KEY;
  if (!apiKey) {
    throw new ApiError(401, {
      message: 'API key is missing. Set VITE_API_KEY.',
      code: 'MISSING_API_KEY',
    });
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // API KEY を付与
      [API_KEY_HEADER]: apiKey,
      ...options.headers,
    },
    signal: config?.signal,
  });

  if (!response.ok) {
    let detail = { message: 'Unknown error occurred' };

    try {
      const errorData = await response.json();
      detail = errorData.detail || {
        message: errorData.message || 'Request failed',
      };
    } catch {
      switch (response.status) {
        case 401:
          detail = { message: 'Unauthorized', code: 'UNAUTHORIZED' };
          break;
        case 403:
          detail = { message: 'Forbidden', code: 'FORBIDDEN' };
          break;
        case 404:
          detail = { message: 'Resource not found', code: 'NOT_FOUND' };
          break;
        case 409:
          detail = { message: 'Release conditions not met', code: 'CONFLICT' };
          break;
        case 500:
          detail = { message: 'Internal server error', code: 'SERVER_ERROR' };
          break;
        case 502:
          detail = { message: 'Service unavailable', code: 'BAD_GATEWAY' };
          break;
        default:
          detail = { message: `Request failed with status ${response.status}` };
      }
    }

    throw new ApiError(response.status, detail);
  }

  return response.json();
}

// チェック作成
export async function createCheck(
  text: string,
  settings: CheckSettings,
  config?: ApiConfig
): Promise<{ checkId: string; report: Report }> {
  return apiFetch(
    '/v1/checks',
    {
      method: 'POST',
      body: JSON.stringify({ text, settings }),
    },
    config
  );
}

// 再チェック
export async function recheck(
  checkId: string,
  text: string,
  settings: CheckSettings,
  config?: ApiConfig
): Promise<{ report: Report }> {
  return apiFetch(
    `/v1/checks/${checkId}/recheck`,
    {
      method: 'POST',
      body: JSON.stringify({ text, settings }),
    },
    config
  );
}

// パッチ作成（修正提案の適用）
export async function createPatch(
  checkId: string,
  findingId: string,
  text: string,
  config?: ApiConfig
): Promise<PatchResult> {
  return apiFetch(
    '/v1/patches',
    {
      method: 'POST',
      body: JSON.stringify({ checkId, findingId, text }),
    },
    config
  );
}

// リリース（最終版の取得）
export async function release(
  checkId: string,
  text: string,
  settings: CheckSettings,
  config?: ApiConfig
): Promise<ReleaseResult> {
  return apiFetch(
    '/v1/release',
    {
      method: 'POST',
      body: JSON.stringify({ checkId, text, settings }),
    },
    config
  );
}

// ペルソナレビュー
export async function personaReview(
  text: string,
  settings: CheckSettings,
  config?: ApiConfig
): Promise<PersonaReview> {
  return apiFetch(
    '/v1/persona-review',
    {
      method: 'POST',
      body: JSON.stringify({ text, settings }),
    },
    config
  );
}

