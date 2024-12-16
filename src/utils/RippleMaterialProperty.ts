import * as Cesium from 'cesium'

class RippleMaterialProperty implements Cesium.MaterialProperty {
  private _color: Cesium.Color
  private _duration: number
  private _count: number
  private _gradient: number
  private _definitionChanged: Cesium.Event

  constructor(options: { color?: Cesium.Color; duration?: number; count?: number; gradient?: number }) {
    this._color = options.color || Cesium.Color.CYAN
    this._duration = options.duration || 3000
    this._count = options.count || 3
    this._gradient = options.gradient || 0.9
    this._definitionChanged = new Cesium.Event()

    // 定义自定义材质
    if (!Object.prototype.hasOwnProperty.call(Cesium.Material, '_RippleType')) {
      // @ts-ignore
      Cesium.Material._materialCache.addMaterial('RippleType', {
        fabric: {
          type: 'RippleType',
          uniforms: {
            color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
            time: 0,
            count: 1,
            gradient: 0.9,
            rippleSpeed: 1.0
          },
          source: `
            uniform vec4 color;
            uniform float time;
            uniform float count;
            uniform float gradient;
            uniform float rippleSpeed;

            czm_material czm_getMaterial(czm_materialInput materialInput) {
              czm_material material = czm_getDefaultMaterial(materialInput);
              
              // 计算到中心点的距离，考虑地形倾斜
              vec2 center = vec2(0.5, 0.5);
              float dist = distance(materialInput.st, center);
              
              // 创建圆形遮罩
              float ring = 1.0 - step(0.5, dist);
              
              // 考虑地形法线影响波纹效果
              vec3 normalEC = normalize(czm_normal3D * materialInput.normalEC);
              float normalFactor = dot(normalEC, vec3(0.0, 0.0, 1.0));
              
              float t = fract(time * rippleSpeed);
              
              // 创建水波纹效果
              float wave = 0.0;
              for(int i = 0; i < 3; i++) {
                float progress = fract(t + float(i) / count);
                float waveFront = progress * 0.5;
                
                // 使用正弦函数创建波浪效果，考虑地形坡度
                float waveEffect = sin(dist * 20.0 - time * 5.0) * 0.03 * normalFactor;
                
                // 创建波纹渐变，考虑地形高度
                float str = 1.0 - smoothstep(0.0, gradient, abs(dist - waveFront));
                
                // 添加波动效果
                str *= 1.0 + waveEffect;
                
                // 添加距离衰减和地形影响
                wave += str * pow(1.0 - progress, 1.5) * smoothstep(0.0, 0.2, progress) * normalFactor;
              }
              
              // 设置材质属性
              material.diffuse = color.rgb;
              
              // 添加波纹透明度变化，考虑地形坡度
              float alpha = wave * ring * color.a;
              alpha *= smoothstep(0.5, 0.0, dist) * normalFactor;
              material.alpha = alpha;
              
              // 添加环境光照影响
              material.diffuse *= mix(0.5, 1.0, normalFactor);
              
              return material;
            }
          `
        },
        translucent: () => true
      })
    }
  }

  getType(): string {
    return 'RippleType'
  }

  getValue(time: Cesium.JulianDate, result: any): any {
    if (!result) {
      result = {}
    }

    result.color = this._color
    result.time = (performance.now() % this._duration) / this._duration
    result.count = this._count
    result.gradient = this._gradient
    result.rippleSpeed = 0.2

    return result
  }

  equals(other: RippleMaterialProperty | undefined): boolean {
    return (
      this === other ||
      (other instanceof RippleMaterialProperty &&
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

export default RippleMaterialProperty 