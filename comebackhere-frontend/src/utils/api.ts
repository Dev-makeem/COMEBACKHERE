const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:3000"

export interface ApiErrorDetail {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly details: ApiErrorDetail[]

  constructor(message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    })
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0)
  }

  const body = (await res.json().catch(() => null)) as
    | (T & { error?: string; details?: ApiErrorDetail[] })
    | null

  if (!res.ok) {
    throw new ApiError(
      body?.error || `Request failed with status ${res.status}`,
      res.status,
      Array.isArray(body?.details) ? body.details : []
    )
  }
  return body as T
}

export interface CreateInvoiceRequest {
  merchant_address: string
  customer_address: string
  token: string
  /** Amount in the token's smallest unit */
  amount: number
  /** Unix timestamp (seconds) */
  due_date: number
}

export interface CreateInvoiceResponse {
  invoice_id: string
  status: string
}

export function createInvoice(body: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
  return request<CreateInvoiceResponse>("/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  })
}
