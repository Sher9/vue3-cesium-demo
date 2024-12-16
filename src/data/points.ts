import type { PointData } from '@/types/map'

export const points: PointData[] = [
  {
    id: '1',
    name: '监控点位1',
    type: 'camera',
    longitude: 116.3,
    latitude: 39.9,
    description: '重点区域监控摄像头'
  },
  {
    id: '2',
    name: '环境监测站1',
    type: 'sensor',
    longitude: 116.31,
    latitude: 39.91,
    description: 'PM2.5、温湿度监测站'
  },
  {
    id: '3',
    name: '充电桩1',
    type: 'station',
    longitude: 116.32,
    latitude: 39.89,
    description: '新能源汽车充电站'
  }
] 