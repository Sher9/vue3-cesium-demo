<template>
  <div v-if="visible && data" class="point-popup" :style="popupStyle">
    <div class="popup-header">
      <span>{{ data.name }}</span>
      <span class="close-btn" @click="$emit('close')">×</span>
    </div>
    <div class="popup-content">
      <p>类型：{{ typeText }}</p>
      <p>位置：{{ data.longitude.toFixed(4) }}, {{ data.latitude.toFixed(4) }}</p>
      <p>描述：{{ data.description }}</p>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'PointPopup'
}
</script>

<script lang="ts" setup>
import type { PointData, Position } from '@/types/map'
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  data: PointData | null
  position: Position
}>()

defineEmits<{
  (e: 'close'): void
}>()

const typeText = computed(() => {
  if (!props.data) return '未知类型'
  
  switch (props.data.type) {
    case 'camera':
      return '监控摄像头'
    case 'sensor':
      return '环境监测站'
    case 'station':
      return '充电桩'
    default:
      return '未知类型'
  }
})

const popupStyle = computed(() => {
  if (!props.position) return {}
  
  return {
    left: `${props.position.x + 10}px`,
    top: `${props.position.y - 10}px`
  }
})
</script>

<style scoped>
.point-popup {
  position: fixed;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 0;
  min-width: 200px;
  z-index: 1000;
  transform: translate(-50%, -120%);
  pointer-events: auto;
  transition: all 0.1s ease-out;
}

.popup-header {
  background: #409eff;
  color: white;
  padding: 8px 12px;
  border-radius: 4px 4px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  cursor: pointer;
  font-size: 20px;
}

.popup-content {
  padding: 12px;
}

.popup-content p {
  margin: 8px 0;
}
</style> 