import type { HeatMapData } from '@/types/map'

// 生成随机热力图数据
function generateRandomHeatMapData(
  centerLon: number,
  centerLat: number,
  radius: number,
  count: number
): HeatMapData {
  const points = []
  let maxValue = 0
  let minValue = Infinity

  for (let i = 0; i < count; i++) {
    // 生成以中心点为圆心的随机点
    const angle = Math.random() * Math.PI * 2
    const r = Math.random() * radius
    const longitude = centerLon + (r * Math.cos(angle)) / 111 // 经度
    const latitude = centerLat + (r * Math.sin(angle)) / 111 // 纬度
    
    // 生成热力值，距离中心点越近值越大
    const distanceFromCenter = Math.sqrt(
      Math.pow(longitude - centerLon, 2) + Math.pow(latitude - centerLat, 2)
    )
    const value = Math.round((1 - distanceFromCenter / (radius / 111)) * 100)
    
    maxValue = Math.max(maxValue, value)
    minValue = Math.min(minValue, value)

    points.push({
      longitude,
      latitude,
      value
    })
  }

  return {
    points,
    max: maxValue,
    min: minValue
  }
}

// 生成测试数据
export const heatmapData: HeatMapData = generateRandomHeatMapData(
  116.3, // 中心点经度
  39.9,  // 中心点纬度
  2,     // 半径（公里）
  1000   // 点数量
) 