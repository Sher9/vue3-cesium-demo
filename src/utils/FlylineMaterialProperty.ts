import * as Cesium from 'cesium'

class FlylineMaterialProperty implements Cesium.MaterialProperty {
  private _color: Cesium.Color
  private _duration: number
  private _definitionChanged: Cesium.Event

  constructor(options: { color?: Cesium.Color; duration?: number }) {
    this._color = options.color || Cesium.Color.CYAN
    this._duration = options.duration || 2000
    this._definitionChanged = new Cesium.Event()

    if (!Object.prototype.hasOwnProperty.call(Cesium.Material, '_FlylineType')) {
      // @ts-ignore
      Cesium.Material._materialCache.addMaterial('FlylineType', {
        fabric: {
          type: 'FlylineType',
          uniforms: {
            color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
            time: 0
          },
          source: `
            uniform vec4 color;
            uniform float time;

            czm_material czm_getMaterial(czm_materialInput materialInput) {
              czm_material material = czm_getDefaultMaterial(materialInput);
              
              vec2 st = materialInput.st;
              float t = fract(time);
              
              // 创建更细的飞线效果
              float trail = smoothstep(t - 0.2, t, st.s) * smoothstep(t + 0.2, t, st.s);
              trail *= 0.8; // 调整基础透明度
              
              // 添加头部亮光效果
              float head = smoothstep(t - 0.05, t, st.s) * smoothstep(t + 0.05, t, st.s);
              head *= 2.0; // 增强头部亮度
              
              // 添加尾部渐变效果
              float tail = smoothstep(t - 0.3, t - 0.2, st.s);
              tail *= 0.3; // 调整尾部透明度
              
              // 组合效果
              float alpha = trail + head + tail;
              
              // 添加垂直方向的渐变，使线条更细
              float verticalGradient = 1.0 - abs(st.t - 0.5) * 2.0;
              verticalGradient = pow(verticalGradient, 3.0); // 使边缘更锐利
              alpha *= verticalGradient;
              
              // 设置发光效果
              float glow = pow(alpha, 2.0) * 1.5;
              
              material.diffuse = color.rgb;
              material.alpha = alpha;
              material.emission = color.rgb * glow;
              
              return material;
            }
          `
        },
        translucent: () => true
      })
    }
  }

  getType(): string {
    return 'FlylineType'
  }

  getValue(time: Cesium.JulianDate, result: any): any {
    if (!result) {
      result = {}
    }

    result.color = this._color
    result.time = (performance.now() % this._duration) / this._duration

    return result
  }

  equals(other: FlylineMaterialProperty | undefined): boolean {
    return (
      this === other ||
      (other instanceof FlylineMaterialProperty &&
        Cesium.Color.equals(this._color, other._color) &&
        this._duration === other._duration)
    )
  }

  get isConstant(): boolean {
    return false
  }

  get definitionChanged(): Cesium.Event {
    return this._definitionChanged
  }
}

export default FlylineMaterialProperty 