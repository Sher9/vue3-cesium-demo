import * as Cesium from 'cesium'
import type { ClusterPoint, ClusterOptions } from '@/types/map'

export class ClusterManager {
  private viewer: Cesium.Viewer
  private points: ClusterPoint[]
  private options: ClusterOptions
  private billboardCollection: Cesium.BillboardCollection
  private labelCollection: Cesium.LabelCollection
  private clusteredPoints: Map<string, ClusterPoint[]>
  private defaultStyle: Required<NonNullable<ClusterOptions['style']>>

  constructor(viewer: Cesium.Viewer, options: ClusterOptions) {
    this.viewer = viewer
    this.points = []
    this.options = options
    this.clusteredPoints = new Map()
    this.defaultStyle = {
      color: '#409EFF',
      size: 24,
      outlineColor: '#FFFFFF',
      outlineWidth: 2
    }

    // 创建billboard和label集合
    this.billboardCollection = new Cesium.BillboardCollection({
      scene: this.viewer.scene
    })
    this.labelCollection = new Cesium.LabelCollection({
      scene: this.viewer.scene
    })

    // 添加到场景
    this.viewer.scene.primitives.add(this.billboardCollection)
    this.viewer.scene.primitives.add(this.labelCollection)

    // 监听相机变化
    this.viewer.camera.changed.addEventListener(this.updateClusters.bind(this))
  }

  // 添加点位
  addPoints(points: ClusterPoint[]) {
    this.points = this.points.concat(points)
    this.updateClusters()
  }

  // 清除所有点位
  clear() {
    this.points = []
    this.clusteredPoints.clear()
    this.billboardCollection.removeAll()
    this.labelCollection.removeAll()
  }

  // 更新聚合
  private updateClusters() {
    if (!this.options.enabled) {
      this.renderPoints()
      return
    }

    this.billboardCollection.removeAll()
    this.labelCollection.removeAll()
    this.clusteredPoints.clear()

    // 计算聚合
    const clusters = this.calculateClusters()
    
    // 渲染聚合
    clusters.forEach((points, centroid) => {
      if (points.length >= this.options.minimumClusterSize) {
        this.renderCluster(centroid, points)
      } else {
        points.forEach(point => this.renderSinglePoint(point))
      }
    })
  }

  // 计算聚合
  private calculateClusters(): Map<string, ClusterPoint[]> {
    const clusters = new Map<string, ClusterPoint[]>()
    
    this.points.forEach(point => {
      const cartesian = Cesium.Cartesian3.fromDegrees(
        point.position.longitude,
        point.position.latitude,
        point.position.height || 0
      )
      
      const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
        this.viewer.scene,
        cartesian
      )

      if (!screenPosition) return

      let foundCluster = false
      clusters.forEach((clusterPoints, centroid) => {
        const [x, y] = centroid.split(',').map(Number)
        const distance = Math.sqrt(
          Math.pow(screenPosition.x - x, 2) + Math.pow(screenPosition.y - y, 2)
        )

        if (distance <= this.options.pixelRange) {
          clusterPoints.push(point)
          foundCluster = true
        }
      })

      if (!foundCluster) {
        clusters.set(`${screenPosition.x},${screenPosition.y}`, [point])
      }
    })

    return clusters
  }

  // 渲染单个点位
  private renderSinglePoint(point: ClusterPoint) {
    const position = Cesium.Cartesian3.fromDegrees(
      point.position.longitude,
      point.position.latitude,
      point.position.height || 0
    )

    // 添加图标
    this.billboardCollection.add({
      position: position,
      image: this.createPointCanvas(1),
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      scale: 1,
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    })
  }

  // 渲染聚合点
  private renderCluster(centroid: string, points: ClusterPoint[]) {
    const [x, y] = centroid.split(',').map(Number)
    const position = this.viewer.scene.camera.pickEllipsoid(
      new Cesium.Cartesian2(x, y),
      this.viewer.scene.globe.ellipsoid
    )

    if (!position) return

    // 添加聚合图标
    this.billboardCollection.add({
      position: position,
      image: this.createPointCanvas(points.length),
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      scale: 1,
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    })

    // 添加数量标签
    this.labelCollection.add({
      position: position,
      text: points.length.toString(),
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, 0),
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    })
  }

  // 创建点位canvas
  private createPointCanvas(count: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const size = this.options.style?.size || this.defaultStyle.size
    canvas.width = size * 2
    canvas.height = size * 2

    const context = canvas.getContext('2d')!
    const radius = size - 2

    // 绘制外圈
    context.beginPath()
    context.arc(size, size, radius, 0, 2 * Math.PI)
    context.fillStyle = this.options.style?.color || this.defaultStyle.color
    context.fill()

    // 绘制边框
    context.strokeStyle = this.options.style?.outlineColor || this.defaultStyle.outlineColor
    context.lineWidth = this.options.style?.outlineWidth || this.defaultStyle.outlineWidth
    context.stroke()

    return canvas
  }

  // 销毁
  destroy() {
    this.viewer.scene.primitives.remove(this.billboardCollection)
    this.viewer.scene.primitives.remove(this.labelCollection)
    this.viewer.camera.changed.removeEventListener(this.updateClusters.bind(this))
  }

  // 添加渲染单个点位的方法
  private renderPoints() {
    this.billboardCollection.removeAll()
    this.labelCollection.removeAll()
    
    this.points.forEach(point => {
      this.renderSinglePoint(point)
    })
  }
} 