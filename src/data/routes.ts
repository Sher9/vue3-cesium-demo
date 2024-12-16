import type { RouteData } from '@/types/map'

export const routes: RouteData[] = [
  {
    id: 'route1',
    name: '路线1',
    color: '#ff0000',
    points: [
      { longitude: 116.28, latitude: 39.9, height: 100 },
      { longitude: 116.29, latitude: 39.91, height: 200 },
      { longitude: 116.31, latitude: 39.92, height: 300 },
      { longitude: 116.33, latitude: 39.91, height: 200 }
    ]
  },
  {
    id: 'route2',
    name: '路线2',
    color: '#00ff00',
    points: [
      { longitude: 116.32, latitude: 39.89, height: 150 },
      { longitude: 116.34, latitude: 39.88, height: 250 },
      { longitude: 116.35, latitude: 39.89, height: 350 },
      { longitude: 116.33, latitude: 39.91, height: 200 }
    ]
  }
] 