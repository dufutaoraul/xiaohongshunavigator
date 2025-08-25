'use client'

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

class HttpClient {
  private baseURL: string

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
  }

  private getStoredCookie(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('xhs_cookie')
  }

  private buildURL(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.baseURL || window.location.origin)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }
    
    return url.toString()
  }

  private async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, headers = {}, ...fetchOptions } = options
    const url = this.buildURL(endpoint, params)
    
    // 自动附带 Cookie
    const cookie = this.getStoredCookie()
    if (cookie) {
      (headers as any)['X-XHS-Cookie'] = cookie
    }

    // 设置默认 Content-Type
    if (!(headers as any)['Content-Type'] && (fetchOptions.method === 'POST' || fetchOptions.method === 'PUT')) {
      (headers as any)['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers
    })

    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // 如果是 401 错误，可能是 Cookie 失效
      if (response.status === 401) {
        // 触发 Cookie 重新配置
        window.dispatchEvent(new CustomEvent('cookie-invalid'))
      }
      
      throw {
        status: response.status,
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        data: errorData
      }
    }

    return response.json()
  }

  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// 创建默认实例
export const httpClient = new HttpClient()

// 导出类以便创建自定义实例
export { HttpClient }