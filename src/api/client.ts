export interface ApiError extends Error {
  status: number;
  details?: unknown;
}

interface RequestOptions extends RequestInit {
  parseJson?: boolean;
}

async function request<T>(input: RequestInfo | URL, options: RequestOptions = {}): Promise<T> {
  const { parseJson, ...rest } = options;

  const init: RequestInit = {
    credentials: rest.credentials ?? 'include',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(rest.headers ?? {})
    }
  };

  const response = await fetch(input, init);
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    const errorBody = isJson ? await response.json().catch(() => undefined) : await response.text().catch(() => undefined);
    const error: ApiError = Object.assign(new Error('Request failed'), {
      status: response.status,
      details: errorBody
    });
    throw error;
  }

  if (parseJson === false || response.status === 204) {
    return undefined as T;
  }

  const data = isJson ? await response.json() : await response.text();
  return data as T;
}

export default request;
