import { app } from 'electron'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import os from 'os'

interface GA4Event {
  name: string
  params: Record<string, any>
}

interface GA4Config {
  measurementId: string
  apiSecret: string
  clientId: string
  debug?: boolean
}

class GA4Service {
  private config: GA4Config | null = null
  private clientId: string = ''
  private readonly clientIdPath: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.clientIdPath = path.join(userDataPath, 'ga-client-id.txt')
    this.loadOrCreateClientId()
  }

  private loadOrCreateClientId(): void {
    try {
      if (fs.existsSync(this.clientIdPath)) {
        this.clientId = fs.readFileSync(this.clientIdPath, 'utf8').trim()
      } else {
        this.clientId = randomUUID()
        fs.mkdirSync(path.dirname(this.clientIdPath), { recursive: true })
        fs.writeFileSync(this.clientIdPath, this.clientId)
      }
    } catch (error) {
      console.warn('Failed to load/create GA client ID:', error)
      this.clientId = randomUUID()
    }
  }

  public initialize(measurementId: string, apiSecret: string, debug: boolean = false): void {
    this.config = {
      measurementId,
      apiSecret,
      clientId: this.clientId,
      debug
    }
  }

  private async sendEvents(events: GA4Event[]): Promise<void> {
    if (!this.config) {
      console.warn('GA4Service not initialized')
      return
    }

    const host = 'www.google-analytics.com'
    const path = this.config.debug ? '/debug/mp/collect' : '/mp/collect'
    const url = `https://${host}${path}?measurement_id=${this.config.measurementId}&api_secret=${this.config.apiSecret}`

    const body = {
      client_id: this.config.clientId,
      events: events.map(event => ({
        ...event,
        params: {
          engagement_time_msec: 1,
          ...event.params,
          ...(this.config?.debug && { debug_mode: true })
        }
      }))
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (this.config.debug) {
        const result = await response.json()
        if (result.validationMessages?.length) {
          console.warn('GA4 validation messages:', JSON.stringify(result, null, 2))
        } else {
          console.log('GA4 event sent successfully (debug mode)')
        }
      } else if (response.status !== 204) {
        console.warn('GA4 unexpected status:', response.status)
      }
    } catch (error) {
      console.error('GA4 send error:', error)
    }
  }

  public async trackEvent(name: string, params: Record<string, any> = {}): Promise<void> {
    await this.sendEvents([{ name, params }])
  }

  public async trackAppStart(): Promise<void> {
    const events: GA4Event[] = [
      {
        name: 'app_start',
        params: {
          app_version: app.getVersion(),
          os_name: os.platform(),
          os_version: os.release(),
          arch: os.arch(),
          node_version: process.version
        }
      }
    ]
    
    await this.sendEvents(events)
  }

  public async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    const params: Record<string, any> = {
      screen_name: screenName
    }
    
    if (screenClass) {
      params.screen_class = screenClass
    }

    await this.trackEvent('screen_view', params)
  }

  public async trackError(error: Error | string, fatal: boolean = false): Promise<void> {
    const description = typeof error === 'string' ? error : error.message
    
    await this.trackEvent('exception', {
      description,
      fatal
    })
  }

  public async trackUserAction(action: string, category?: string, label?: string, value?: number): Promise<void> {
    const params: Record<string, any> = {
      action
    }
    
    if (category) params.category = category
    if (label) params.label = label
    if (typeof value === 'number') params.value = value

    await this.trackEvent('user_action', params)
  }
}

export const ga4Service = new GA4Service()