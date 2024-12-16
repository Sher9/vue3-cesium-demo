import { defineStore } from 'pinia'
import * as Cesium from 'cesium'
import type { PointData, PopupInfo, HeatMapData, RouteData, VideoProjection } from '@/types/map'
import RippleMaterialProperty from '@/utils/RippleMaterialProperty'
import FlylineMaterialProperty from '@/utils/FlylineMaterialProperty'
import { ClusterManager } from '@/utils/ClusterManager'
import { SituationManager } from '@/utils/SituationManager'
import type { SituationPoint, SituationLine, SituationPolygon } from '@/types/map'

interface EntityProperties extends PointData {
    cartesian: Cesium.Cartesian3
}

interface MapState {
    viewer: Cesium.Viewer | null
    isLoading: boolean
    popupInfo: PopupInfo
    selectedEntity: Cesium.Entity | null
    handler: Cesium.ScreenSpaceEventHandler | null
    heatmapLayer: any
    routes: Map<string, Cesium.Entity[]>
    isHeatmapVisible: boolean
    videoEntities: Map<string, Cesium.Entity>
    clusterManager: ClusterManager | null
    situationManager: SituationManager | null
}

export const useMapStore = defineStore('map', {
    state: (): MapState => ({
        viewer: null,
        isLoading: false,
        popupInfo: {
            show: false,
            position: { x: 0, y: 0 },
            data: null
        },
        selectedEntity: null,
        handler: null,
        heatmapLayer: null,
        routes: new Map(),
        isHeatmapVisible: false,
        videoEntities: new Map(),
        clusterManager: null,
        situationManager: null
    }),

    actions: {
        async initViewer(container: string) {
            // 设置 Cesium ion 访问令牌
            Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ACCESS_TOKEN

            // 创建地形提供器
            const terrainProvider = await Cesium.createWorldTerrainAsync({
                requestWaterMask: true,
                requestVertexNormals: true
            })

            // 创建高德影像图层
            const gaodeSatelliteProvider = new Cesium.UrlTemplateImageryProvider({
                url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
                minimumLevel: 1,
                maximumLevel: 18,
                credit: '高德地图',
                tilingScheme: new Cesium.WebMercatorTilingScheme()
            })

            // 创建高德注记图层
            const gaodeAnnoProvider = new Cesium.UrlTemplateImageryProvider({
                url: 'https://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8',
                minimumLevel: 1,
                maximumLevel: 18,
                credit: '高德地图',
                tilingScheme: new Cesium.WebMercatorTilingScheme()
            })

            // 创建查看器
            this.viewer = new Cesium.Viewer(container, {
                terrainProvider,
                baseLayerPicker: false,
                animation: false,
                fullscreenButton: false,
                geocoder: false,
                homeButton: false,
                navigationHelpButton: false,
                sceneModePicker: false,
                timeline: false,
                infoBox: false,
                selectionIndicator: false,
                sceneMode: Cesium.SceneMode.SCENE3D
            })

            // 移除默认的影像图层
            this.viewer.imageryLayers.removeAll()

            // 添加高德卫星图层
            this.viewer.imageryLayers.addImageryProvider(gaodeSatelliteProvider)

            // 添加高德注记图层
            const annoLayer = this.viewer.imageryLayers.addImageryProvider(gaodeAnnoProvider)
            annoLayer.alpha = 0.8

            // 配置场景
            const scene = this.viewer.scene

            // 启用地形深度检测
            scene.globe.depthTestAgainstTerrain = true

            // 启用大气效果
            scene.skyAtmosphere.show = true
            scene.globe.enableLighting = true
            scene.globe.showGroundAtmosphere = true

            // 设置默认视角
            this.viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(116.3, 39.9, 5000),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-45),
                    roll: 0
                }
            })

            // 设置相机限制
            scene.screenSpaceCameraController.enableCollisionDetection = true
            scene.screenSpaceCameraController.minimumZoomDistance = 500
            scene.screenSpaceCameraController.maximumZoomDistance = 50000

            // 优化性能
            scene.fog.enabled = true
            scene.fog.density = 0.0001
            scene.fog.screenSpaceErrorFactor = 2.0

            // 设置地形质量
            scene.globe.maximumScreenSpaceError = 2
        },

        flyToLocation(longitude: number, latitude: number, height: number = 1000) {
            if (!this.viewer) return

            this.viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
            })
        },

        addPoints(points: PointData[]) {
            if (!this.viewer) return

            // 初始化聚合管理器
            this.initClusterManager()

            // 转换点位数据格式
            const clusterPoints = points.map(point => ({
                id: point.id,
                position: {
                    longitude: point.longitude,
                    latitude: point.latitude,
                    height: point.height || 0
                },
                type: point.type,
                properties: point
            }))

            // 添加到聚合管理器
            this.clusterManager?.addPoints(clusterPoints)

            // 如果存在旧的handler，先销毁
            if (this.handler) {
                this.handler.destroy()
            }

            // 创建新的事件处理器
            this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)

            points.forEach(point => {
                const height = point.height || 0
                // 创建点位实体
                const entity = this.viewer!.entities.add({
                    id: point.id,
                    position: Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, height),
                    billboard: {
                        image: this.getPointImage(point.type),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        scale: 0.6,
                        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        pixelOffset: new Cesium.Cartesian2(0, -8),
                        eyeOffset: new Cesium.Cartesian3(0, 0, -10),
                        scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 500000, 0.4)
                    },
                    ellipse: {
                        height: height,
                        semiMinorAxis: 150.0,
                        semiMajorAxis: 150.0,
                        material: new RippleMaterialProperty({
                            color: this.getPointColor(point.type),
                            duration: 3000,
                            count: 2,
                            gradient: 0.4
                        }),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        classificationType: Cesium.ClassificationType.TERRAIN,
                        outline: false
                    },
                    properties: {
                        ...point,
                        cartesian: Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, height)
                    }
                })
            })

            // 添加点击事件
            this.handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
                if (!this.viewer) return

                const pickedObject = this.viewer.scene.pick(movement.position)
                if (Cesium.defined(pickedObject) && pickedObject.id) {
                    const entity = pickedObject.id
                    const pointData = entity.properties?.getValue()
                    if (pointData) {
                        this.selectedEntity = entity
                        this.updatePopupPosition(pointData)
                    }
                } else {
                    this.closePopup()
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

            // 添加相机移动事件监听
            if (this.viewer) {
                this.viewer.scene.postRender.addEventListener(this.onCameraChange.bind(this))
            }
        },

        onCameraChange() {
            if (this.selectedEntity && this.popupInfo.show && this.viewer) {
                const pointData = this.selectedEntity.properties?.getValue() as EntityProperties
                if (!pointData) return

                const cartesian = pointData.cartesian
                const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
                    this.viewer.scene,
                    cartesian
                )

                if (screenPosition) {
                    // 检查点位是否在视野内
                    const canvasHeight = this.viewer.canvas.height
                    const canvasWidth = this.viewer.canvas.width

                    if (screenPosition.x >= 0 &&
                        screenPosition.x <= canvasWidth &&
                        screenPosition.y >= 0 &&
                        screenPosition.y <= canvasHeight) {
                        this.popupInfo = {
                            ...this.popupInfo,
                            position: {
                                x: screenPosition.x,
                                y: screenPosition.y
                            }
                        }
                    } else {
                        // 如果点位不在视野内，弹窗
                        this.popupInfo.show = false
                    }
                }
            }
        },

        updatePopupPosition(pointData: EntityProperties) {
            if (!this.viewer) return

            const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
                this.viewer.scene,
                pointData.cartesian
            )

            if (screenPosition) {
                this.popupInfo = {
                    show: true,
                    position: {
                        x: screenPosition.x,
                        y: screenPosition.y
                    },
                    data: pointData
                }
            }
        },

        getPointImage(type: string): string {
            switch (type) {
                case 'camera':
                    return '/images/camera.png'
                case 'sensor':
                    return '/images/sensor.png'
                case 'station':
                    return '/images/station.png'
                default:
                    return '/images/default.png'
            }
        },

        closePopup() {
            this.popupInfo = {
                ...this.popupInfo,
                show: false,
                data: null
            }
            this.selectedEntity = null
        },

        getPointColor(type: string): Cesium.Color {
            switch (type) {
                case 'camera':
                    return Cesium.Color.fromCssColorString('#00ffff').withAlpha(0.6)
                case 'sensor':
                    return Cesium.Color.fromCssColorString('#00ff00').withAlpha(0.6)
                case 'station':
                    return Cesium.Color.fromCssColorString('#ff00ff').withAlpha(0.6)
                default:
                    return Cesium.Color.fromCssColorString('#ffffff').withAlpha(0.6)
            }
        },

        // 添加热力图
        addHeatmap(data: HeatMapData) {
            if (!this.viewer) return

            // 移除已有的热力图层
            this.removeHeatmap()

            const heatmapPoints = data.points.map(point => ({
                x: point.longitude,
                y: point.latitude,
                value: point.value
            }))

            const bounds = {
                west: Math.min(...data.points.map(p => p.longitude)) - 0.01,
                south: Math.min(...data.points.map(p => p.latitude)) - 0.01,
                east: Math.max(...data.points.map(p => p.longitude)) + 0.01,
                north: Math.max(...data.points.map(p => p.latitude)) + 0.01
            }

            const canvas = this.generateHeatmapCanvas(heatmapPoints, data.max || 100, data.min || 0)

            // 创建热力图实体
            this.heatmapLayer = this.viewer.entities.add({
                rectangle: {
                    coordinates: Cesium.Rectangle.fromDegrees(
                        bounds.west,
                        bounds.south,
                        bounds.east,
                        bounds.north
                    ),
                    material: new Cesium.ImageMaterialProperty({
                        image: canvas,
                        transparent: true
                    }),
                    classificationType: Cesium.ClassificationType.BOTH,
                    height: 10,
                    stRotation: 0
                }
            })
        },

        // 生成热力图 Canvas
        generateHeatmapCanvas(points: any[], max: number, min: number) {
            const width = 1024 // 增加分辨率
            const height = 1024
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')!

            // 清空画布
            ctx.clearRect(0, 0, width, height)

            // 计算坐标范围
            const bounds = {
                minX: Math.min(...points.map(p => p.x)),
                maxX: Math.max(...points.map(p => p.x)),
                minY: Math.min(...points.map(p => p.y)),
                maxY: Math.max(...points.map(p => p.y))
            }

            // 设置混合模式
            ctx.globalCompositeOperation = 'screen'

            // 绘制热力点
            points.forEach(point => {
                const x = ((point.x - bounds.minX) / (bounds.maxX - bounds.minX)) * width
                const y = height - ((point.y - bounds.minY) / (bounds.maxY - bounds.minY)) * height

                const value = (point.value - min) / (max - min)
                const radius = 60 * value + 30 // 增大热力点半径

                // 创建径向渐变
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
                gradient.addColorStop(0, `rgba(255, 0, 0, ${value * 0.8})`)
                gradient.addColorStop(0.2, `rgba(255, 165, 0, ${value * 0.6})`)
                gradient.addColorStop(0.4, `rgba(255, 255, 0, ${value * 0.4})`)
                gradient.addColorStop(1, 'rgba(0, 0, 255, 0)')

                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(x, y, radius, 0, Math.PI * 2)
                ctx.fill()
            })

            // 应用高斯模糊
            ctx.filter = 'blur(20px)'
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = width
            tempCanvas.height = height
            const tempCtx = tempCanvas.getContext('2d')!
            tempCtx.drawImage(canvas, 0, 0)
            ctx.clearRect(0, 0, width, height)
            ctx.drawImage(tempCanvas, 0, 0)

            return canvas
        },

        // 移除热力图
        removeHeatmap() {
            if (this.viewer && this.heatmapLayer) {
                this.viewer.entities.remove(this.heatmapLayer)
                this.heatmapLayer = null
            }
        },

        // 添加路线
        addRoute(route: RouteData) {
            if (!this.viewer) return

            const entities: Cesium.Entity[] = []
            const positions = route.points.map(point =>
                Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height || 0)
            )

            // 添加路线底层
            entities.push(this.viewer.entities.add({
                polyline: {
                    positions: positions,
                    width: 2,
                    material: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.fromCssColorString(route.color || '#ffffff').withAlpha(0.2),
                        outlineWidth: 0,
                        outlineColor: Cesium.Color.BLACK
                    }),
                    clampToGround: false
                }
            }))

            // 添加飞线效果
            entities.push(this.viewer.entities.add({
                polyline: {
                    positions: positions,
                    width: 3,
                    material: new FlylineMaterialProperty({
                        color: Cesium.Color.fromCssColorString(route.color || '#ffffff').withAlpha(0.8),
                        duration: 1500
                    }),
                    clampToGround: false
                }
            }))

            // 添加路线点
            route.points.forEach((point, index) => {
                entities.push(this.viewer!.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(
                        point.longitude,
                        point.latitude,
                        point.height || 0
                    ),
                    point: {
                        pixelSize: 6,
                        color: Cesium.Color.fromCssColorString(route.color || '#ffffff'),
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 1,
                        heightReference: Cesium.HeightReference.NONE
                    },
                    label: {
                        text: `${route.name}-${index + 1}`,
                        font: '12px sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -8),
                        heightReference: Cesium.HeightReference.NONE,
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 50000),
                        scale: 0.8
                    }
                }))
            })

            // 保存路线实体
            this.routes.set(route.id, entities)
        },

        // 添加视频投射
        addVideoProjection(video: VideoProjection) {
            if (!this.viewer) return

            // 创建视频元素
            const videoElement = document.createElement('video')
            videoElement.id = `video-${video.id}`
            videoElement.src = video.url
            videoElement.loop = true
            videoElement.crossOrigin = 'anonymous'
            videoElement.muted = true
            videoElement.autoplay = true
            videoElement.style.display = 'none'
            document.body.appendChild(videoElement)
            videoElement.play()

            // 计算投射平面的四个点
            const positions = this.calculateProjectionPositions(video)

            // 创建视频材质
            const videoMaterial = new Cesium.ImageMaterialProperty({
                image: videoElement,
                transparent: true
            })

            // 创建视频投射实体
            const entity = this.viewer.entities.add({
                id: video.id,
                name: video.name,
                position: Cesium.Cartesian3.fromDegrees(
                    video.position.longitude,
                    video.position.latitude,
                    video.position.height
                ),
                polygon: {
                    hierarchy: new Cesium.PolygonHierarchy(positions),
                    material: videoMaterial,
                    perPositionHeight: true,
                    classificationType: Cesium.ClassificationType.BOTH
                }
            })

            // 保存实体引用
            this.videoEntities.set(video.id, entity)

            // 添加视频控制UI
            this.addVideoControls(video.id, videoElement)
        },

        // 计算投射平面的位置
        calculateProjectionPositions(video: VideoProjection): Cesium.Cartesian3[] {
            const { longitude, latitude, height } = video.position
            const { width, height: projHeight } = video.dimensions
            const heading = Cesium.Math.toRadians(video.rotation?.heading || 0)
            const pitch = Cesium.Math.toRadians(video.rotation?.pitch || 0)

            // 创建变换矩阵
            const transform = Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
            )

            // 应用旋转
            const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(
                Cesium.Matrix3.fromHeadingPitchRoll(
                    new Cesium.HeadingPitchRoll(heading, pitch, 0)
                )
            )

            Cesium.Matrix4.multiply(transform, rotationMatrix, transform)

            // 计算四个角点
            const corners = [
                [-width / 2, -projHeight / 2, 0],
                [width / 2, -projHeight / 2, 0],
                [width / 2, projHeight / 2, 0],
                [-width / 2, projHeight / 2, 0]
            ]

            return corners.map(corner => {
                return Cesium.Matrix4.multiplyByPoint(
                    transform,
                    new Cesium.Cartesian3(corner[0], corner[1], corner[2]),
                    new Cesium.Cartesian3()
                )
            })
        },

        // 添加视频控制UI
        addVideoControls(videoId: string, videoElement: HTMLVideoElement) {
            const controlsId = `video-controls-${videoId}`;
            let controlsContainer = document.getElementById(controlsId);

            // 如果已存在控制器，先移除
            if (controlsContainer) {
                controlsContainer.remove();
            }

            // 创建新的控制器
            controlsContainer = document.createElement('div');
            controlsContainer.id = controlsId;
            controlsContainer.className = 'video-controls';
            controlsContainer.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 4px;
        z-index: 1000;
        display: flex;
        gap: 10px;
      `;

            // 添加播放/暂停按钮
            const playButton = document.createElement('button');
            playButton.textContent = videoElement.paused ? '播放' : '暂停';
            playButton.style.cssText = `
        background: #409eff;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
      `;
            playButton.onclick = () => {
                if (videoElement.paused) {
                    videoElement.play();
                    playButton.textContent = '暂停';
                } else {
                    videoElement.pause();
                    playButton.textContent = '播放';
                }
            };

            controlsContainer.appendChild(playButton);
            controlsContainer = document.createElement('div')
            controlsContainer.id = controlsId
        },

        // 移除视频投射
        removeVideoProjection(videoId: string) {
            if (!this.viewer) return

            // 移除视频实体
            const entity = this.videoEntities.get(videoId)
            if (entity) {
                this.viewer.entities.remove(entity)
                this.videoEntities.delete(videoId)
            }

            // 移除视频控制UI
            const controlsId = `video-controls-${videoId}`
            const controlsContainer = document.getElementById(controlsId)
            if (controlsContainer) {
                controlsContainer.remove()
            }

            // 清理视频元素
            const videoElement = document.getElementById(`video-${videoId}`) as HTMLVideoElement
            if (videoElement) {
                videoElement.pause()
                videoElement.remove()
            }
        },

        // 初始化聚合管理器
        initClusterManager() {
            if (!this.viewer || this.clusterManager) return

            this.clusterManager = new ClusterManager(this.viewer, {
                enabled: true,
                pixelRange: 50,
                minimumClusterSize: 2,
                style: {
                    color: '#409EFF',
                    size: 24,
                    outlineColor: '#FFFFFF',
                    outlineWidth: 2
                }
            })
        },

        // 初始化态势图管理器
        initSituationManager() {
            if (!this.viewer || this.situationManager) return
            this.situationManager = new SituationManager(this.viewer)
        },

        // 添加态势点位
        addSituationPoint(point: SituationPoint) {
            this.situationManager?.addPoint(point)
        },

        // 添加态势线
        addSituationLine(line: SituationLine) {
            this.situationManager?.addLine(line)
        },

        // 添加态势区域
        addSituationPolygon(polygon: SituationPolygon) {
            this.situationManager?.addPolygon(polygon)
        },

        // 清除态势图
        clearSituation() {
            this.situationManager?.clear()
        },

        // 修改销毁方法
        destroy() {
            // 清理态势图
            if (this.situationManager) {
                this.situationManager.destroy()
                this.situationManager = null
            }

            // 清理聚合管理器
            if (this.clusterManager) {
                this.clusterManager.destroy()
                this.clusterManager = null
            }

            // 清理所有路线
            this.routes.forEach((entities, routeId) => {
                if (this.viewer) {
                    entities.forEach(entity => {
                        this.viewer!.entities.remove(entity)
                    })
                }
            })
            this.routes.clear()

            // 移除热力图
            this.removeHeatmap()

            if (this.handler) {
                this.handler.destroy()
                this.handler = null
            }
            if (this.viewer) {
                // @ts-ignore
                if (this.viewer._pointClickHandler) {
                    // @ts-ignore
                    this.viewer._pointClickHandler.destroy()
                    // @ts-ignore
                    this.viewer._pointClickHandler = null
                }
                this.viewer.destroy()
                this.viewer = null
            }
        },

        // 显示热力图
        showHeatmap() {
            if (!this.viewer || this.isHeatmapVisible) return
            
            this.isHeatmapVisible = true

            // 获取所有点位的位置信息并生成热力数据
            const points: HeatMapPoint[] = []
            this.viewer.entities.values.forEach(entity => {
                if (entity.billboard) { // 判断是否是点位实体
                    const position = entity.position?.getValue(Cesium.JulianDate.now())
                    if (position) {
                        const cartographic = Cesium.Cartographic.fromCartesian(position)
                        // 为每个点生成随机热力值
                        points.push({
                            longitude: Cesium.Math.toDegrees(cartographic.longitude),
                            latitude: Cesium.Math.toDegrees(cartographic.latitude),
                            value: Math.random() * 100 // 随机生成0-100的热力值
                        })

                        // 在点位周围生成额外的热力点
                        const radius = 0.02 // 约2公里
                        const extraPoints = 15 // 每个点位周围生成的额外点数
                        for (let i = 0; i < extraPoints; i++) {
                            const angle = Math.random() * Math.PI * 2
                            const r = Math.random() * radius
                            const extraLon = Cesium.Math.toDegrees(cartographic.longitude) + r * Math.cos(angle)
                            const extraLat = Cesium.Math.toDegrees(cartographic.latitude) + r * Math.sin(angle)
                            points.push({
                                longitude: extraLon,
                                latitude: extraLat,
                                value: Math.random() * 60 // 周围点的热力值较小
                            })
                        }
                    }
                }
            })

            // 创建热力图数据
            const heatmapData: HeatMapData = {
                points,
                max: 100,
                min: 0
            }

            // 添加热力图
            this.addHeatmap(heatmapData)
        },

        // 隐藏热力图
        hideHeatmap() {
            if (!this.isHeatmapVisible) return
            
            this.isHeatmapVisible = false
            this.removeHeatmap()
        }
    }
}) 