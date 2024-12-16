import * as Cesium from 'cesium'
import type { SituationPoint, SituationLine, SituationPolygon } from '@/types/map'

export class SituationManager {
  private viewer: Cesium.Viewer
  private points: Map<string, Cesium.Entity>
  private lines: Map<string, Cesium.Entity>
  private polygons: Map<string, Cesium.Entity>

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.points = new Map()
    this.lines = new Map()
    this.polygons = new Map()
  }

  // 添加态势点位
  addPoint(point: SituationPoint) {
    const entity = this.viewer.entities.add({
      id: point.id,
      name: point.name,
      position: Cesium.Cartesian3.fromDegrees(
        point.position.longitude,
        point.position.latitude,
        point.position.height || 0
      ),
      billboard: {
        image: this.getPointImage(point.type),
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        scale: 0.8,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      },
      label: {
        text: point.name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      },
      properties: point.properties
    })

    this.points.set(point.id, entity)
  }

  // 添加态势线
  addLine(line: SituationLine) {
    const positions = line.points.map(point =>
      Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height || 0)
    )

    const entity = this.viewer.entities.add({
      id: line.id,
      name: line.name,
      polyline: {
        positions: positions,
        width: 5,
        material: this.getLineMaterial(line.type),
        clampToGround: true,
        arcType: Cesium.ArcType.GEODESIC,
        classificationType: Cesium.ClassificationType.BOTH
      },
      label: {
        text: line.name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 50000),
        position: new Cesium.CallbackProperty(() => {
          const midIndex = Math.floor(positions.length / 2)
          return positions[midIndex]
        }, false)
      },
      properties: line.properties
    })

    this.lines.set(line.id, entity)
  }

  // 添加态势区域
  addPolygon(polygon: SituationPolygon) {
    const positions = polygon.points.map(point =>
      Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height || 0)
    )

    const entity = this.viewer.entities.add({
      id: polygon.id,
      name: polygon.name,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        material: this.getPolygonMaterial(polygon.type),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      },
      properties: polygon.properties
    })

    this.polygons.set(polygon.id, entity)
  }

  // 获取点位图标
  private getPointImage(type: string): string {
    switch (type) {
      case 'friend':
        return '/images/situation/friend.png'
      case 'enemy':
        return '/images/situation/enemy.png'
      case 'neutral':
        return '/images/situation/neutral.png'
      default:
        return '/images/situation/default.png'
    }
  }

  // 获取线条材质
  private getLineMaterial(type: string): Cesium.MaterialProperty {
    switch (type) {
      case 'attack':
        return Cesium.Color.RED.withAlpha(0.8)
      case 'defense':
        return new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.BLUE.withAlpha(0.8),
          dashLength: 20.0,
          dashPattern: 255
        })
      case 'move':
        return new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Cesium.Color.GREEN.withAlpha(0.8)
        })
      default:
        return new Cesium.PolylineOutlineMaterialProperty({
          color: Cesium.Color.WHITE.withAlpha(0.8),
          outlineWidth: 2,
          outlineColor: Cesium.Color.BLACK
        })
    }
  }

  // 获取区域材质
  private getPolygonMaterial(type: string): Cesium.MaterialProperty {
    switch (type) {
      case 'area':
        return Cesium.Color.RED.withAlpha(0.3)
      case 'region':
        return Cesium.Color.BLUE.withAlpha(0.3)
      default:
        return Cesium.Color.WHITE.withAlpha(0.3)
    }
  }

  // 移除态势点位
  removePoint(id: string) {
    const entity = this.points.get(id)
    if (entity) {
      this.viewer.entities.remove(entity)
      this.points.delete(id)
    }
  }

  // 移除态势线
  removeLine(id: string) {
    const entity = this.lines.get(id)
    if (entity) {
      this.viewer.entities.remove(entity)
      this.lines.delete(id)
    }
  }

  // 移除态势区域
  removePolygon(id: string) {
    const entity = this.polygons.get(id)
    if (entity) {
      this.viewer.entities.remove(entity)
      this.polygons.delete(id)
    }
  }

  // 清除所有态势
  clear() {
    this.points.forEach((entity) => this.viewer.entities.remove(entity))
    this.lines.forEach((entity) => this.viewer.entities.remove(entity))
    this.polygons.forEach((entity) => this.viewer.entities.remove(entity))
    this.points.clear()
    this.lines.clear()
    this.polygons.clear()
  }

  // 销毁
  destroy() {
    this.clear()
  }
} 