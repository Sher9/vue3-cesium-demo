import type { VideoProjection } from '@/types/map'

export const videos: VideoProjection[] = [
  {
    id: 'video1',
    name: '监控视频1',
    url: '/videos/test1.mp4', // 替换为实际的视频URL
    position: {
      longitude: 116.29,
      latitude: 39.91,
      height: 50
    },
    rotation: {
      heading: 45,
      pitch: -15,
      roll: 0
    },
    dimensions: {
      width: 100,
      height: 60
    }
  }
] 