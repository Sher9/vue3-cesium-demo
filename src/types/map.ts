export interface PointData {
  id: string
  name: string
  type: 'camera' | 'sensor' | 'station'
  longitude: number
  latitude: number
  height?: number
  description?: string
}

export interface Position {
  x: number
  y: number
}

export interface PopupInfo {
  show: boolean
  position: Position
  data: PointData | null
}

export interface HeatMapPoint {
  longitude: number
  latitude: number
  value: number
}

export interface HeatMapData {
  points: HeatMapPoint[]
  min?: number
  max?: number
}

export interface RoutePoint {
  longitude: number
  latitude: number
  height?: number
}

export interface RouteData {
  id: string
  name: string
  points: RoutePoint[]
  color?: string
}

export interface VideoProjection {
  id: string
  name: string
  url: string
  position: {
    longitude: number
    latitude: number
    height: number
  }
  rotation?: {
    heading?: number
    pitch?: number
    roll?: number
  }
  dimensions: {
    width: number
    height: number
  }
}

export interface ClusterPoint {
  id: string
  position: {
    longitude: number
    latitude: number
    height?: number
  }
  type: string
  properties?: Record<string, any>
}

export interface ClusterOptions {
  enabled: boolean
  pixelRange: number
  minimumClusterSize: number
  style?: {
    color?: string
    size?: number
    outlineColor?: string
    outlineWidth?: number
  }
}

export interface SituationPoint {
  id: string
  name: string
  type: 'friend' | 'enemy' | 'neutral'
  position: {
    longitude: number
    latitude: number
    height?: number
  }
  properties?: {
    speed?: number
    direction?: number
    status?: string
    [key: string]: any
  }
}

export interface SituationLine {
  id: string
  name: string
  type: 'attack' | 'defense' | 'move'
  points: {
    longitude: number
    latitude: number
    height?: number
  }[]
  properties?: Record<string, any>
}

export interface SituationPolygon {
  id: string
  name: string
  type: 'area' | 'region'
  points: {
    longitude: number
    latitude: number
    height?: number
  }[]
  properties?: Record<string, any>
} 