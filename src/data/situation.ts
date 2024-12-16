import type { SituationPoint, SituationLine, SituationPolygon } from '@/types/map'

// 态势点位数据
export const situationPoints: SituationPoint[] = [
  {
    id: 'friend1',
    name: '友方单位1',
    type: 'friend',
    position: {
      longitude: 116.28,
      latitude: 39.92,
      height: 100
    },
    properties: {
      speed: 30,
      direction: 45,
      status: 'normal'
    }
  },
  {
    id: 'enemy1',
    name: '敌方单位1',
    type: 'enemy',
    position: {
      longitude: 116.32,
      latitude: 39.90,
      height: 100
    },
    properties: {
      speed: 20,
      direction: 180,
      status: 'active'
    }
  }
]

// 态势线数据
export const situationLines: SituationLine[] = [
  {
    id: 'attack1',
    name: '攻击路线1',
    type: 'attack',
    points: [
      { longitude: 116.28, latitude: 39.92 },
      { longitude: 116.30, latitude: 39.91 },
      { longitude: 116.32, latitude: 39.90 }
    ]
  },
  {
    id: 'move1',
    name: '移动路线1',
    type: 'move',
    points: [
      { longitude: 116.33, latitude: 39.89 },
      { longitude: 116.34, latitude: 39.88 },
      { longitude: 116.35, latitude: 39.87 }
    ]
  },
  {
    id: 'defense1',
    name: '防御路线1',
    type: 'defense',
    points: [
      { longitude: 116.29, latitude: 39.93 },
      { longitude: 116.31, latitude: 39.92 },
      { longitude: 116.33, latitude: 39.93 }
    ]
  }
]

// 态势区域数据
export const situationPolygons: SituationPolygon[] = [
  {
    id: 'area1',
    name: '防御区域1',
    type: 'area',
    points: [
      { longitude: 116.28, latitude: 39.93 },
      { longitude: 116.30, latitude: 39.93 },
      { longitude: 116.30, latitude: 39.91 },
      { longitude: 116.28, latitude: 39.91 }
    ]
  }
] 