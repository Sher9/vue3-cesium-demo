<template>
  <div class="map-container" id="cesiumContainer" ref="mapContainer">
    <PointPopup
      :visible="mapStore.popupInfo.show"
      :data="mapStore.popupInfo.data"
      :position="mapStore.popupInfo.position"
      @close="mapStore.closePopup()"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { points } from '@/data/points'
import { PointPopup } from '@/components'
import * as Cesium from 'cesium'
import { routes } from '@/data/routes'
import { situationPoints, situationLines, situationPolygons } from '@/data/situation'

const mapContainer = ref<HTMLDivElement>()
const mapStore = useMapStore()

onMounted(async () => {
  if (mapContainer.value) {
    await mapStore.initViewer('cesiumContainer')
    // 设置初始视角
    mapStore.viewer?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.3, 39.9, 15000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      },
      duration: 2
    })
    
    // 初始化态势图管理器
    mapStore.initSituationManager()

    // 添加态势图
    situationPoints.forEach(point => {
      mapStore.addSituationPoint(point)
    })
    situationLines.forEach(line => {
      mapStore.addSituationLine(line)
    })
    situationPolygons.forEach(polygon => {
      mapStore.addSituationPolygon(polygon)
    })

    // 添加点位
    mapStore.addPoints(points)
    
    // 添加路线
    routes.forEach(route => {
      mapStore.addRoute(route)
    })
  }
})

// 添加组件销毁时的清理
onBeforeUnmount(() => {
  mapStore.destroy()
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

/* 添加地图加载时的过渡效果 */
.map-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: -1;
}
</style> 