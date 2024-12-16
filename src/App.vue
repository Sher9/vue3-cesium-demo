<template>
  <div class="app">
    <CesiumMap />
    <div class="overlay">
      <h1>智慧城市平台</h1>
      <div class="controls">
        <button 
          class="control-btn"
          @click="toggleHeatmap"
        >
          {{ isHeatmapVisible ? '隐藏热力图' : '显示热力图' }}
        </button>
        <button 
          class="control-btn"
          @click="toggleVideoProjection"
        >
          {{ isVideoVisible ? '关闭视频投射' : '开启视频投射' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CesiumMap } from '@/components'
import { useMapStore } from '@/stores/mapStore'
import { ref } from 'vue'
import { videos } from '@/data/videos'

const mapStore = useMapStore()
const isHeatmapVisible = ref(false)
const isVideoVisible = ref(false)

const toggleHeatmap = () => {
  isHeatmapVisible.value = !isHeatmapVisible.value
  if (isHeatmapVisible.value) {
    mapStore.showHeatmap()
  } else {
    mapStore.hideHeatmap()
  }
}

const toggleVideoProjection = () => {
  isVideoVisible.value = !isVideoVisible.value
  if (isVideoVisible.value) {
    videos.forEach(video => {
      mapStore.addVideoProjection(video)
    })
  } else {
    videos.forEach(video => {
      mapStore.removeVideoProjection(video.id)
    })
  }
}
</script>

<style>
.app {
  position: relative;
}

.overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 20px;
  border-radius: 8px;
}

.controls {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.control-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn:hover {
  background: #66b1ff;
}
</style> 