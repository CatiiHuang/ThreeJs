import * as THREE from "../node_modules/three/build/three.module.js";
/**
 * 通过path构建墙体
 * option =>
 * params height path material expand(是否需要扩展路径)
 * **/
export const creatWallByPath = ({
  height = 10,
  path = [],
  material,
  expand = true,
}) => {
  let verticesByTwo = null;
  // 1.处理路径数据  每两个顶点为为一组
  if (expand) {
    // 1.1向y方向拉伸顶点
    verticesByTwo = path.reduce((arr, [x, y, z]) => {
      return arr.concat([
        [
          [x, y, z],
          [x, y + height, z],
        ],
      ]);
    }, []);
  } else {
    // 1.2 已经处理好路径数据
    verticesByTwo = path;
  }
  // 2.解析需要渲染的四边形 每4个顶点为一组
  const verticesByFour = verticesByTwo.reduce((arr, item, i) => {
    if (i === verticesByTwo.length - 1) return arr;
    return arr.concat([[item, verticesByTwo[i + 1]]]);
  }, []);
  // 3.将四边形面转换为需要渲染的三顶点面
  const verticesByThree = verticesByFour.reduce((arr, item) => {
    const [[point1, point2], [point3, point4]] = item;
    return arr.concat(
      ...point2,
      ...point1,
      ...point4,
      ...point1,
      ...point3,
      ...point4
    );
  }, []);
  const geometry = new THREE.BufferGeometry();
  // 4. 设置position
  const vertices = new Float32Array(verticesByThree);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  // 5. 设置uv 6个点为一个周期 [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1]

  // 5.1 以18个顶点为单位分组
  const pointsGroupBy18 = new Array(verticesByThree.length / 3 / 6)
    .fill(0)
    .map((item, i) => {
      return verticesByThree.slice(i * 3 * 6, (i + 1) * 3 * 6);
    });
  // 5.2 按uv周期分组
  const pointsGroupBy63 = pointsGroupBy18.map((item, i) => {
    return new Array(item.length / 3)
      .fill(0)
      .map((it, i) => item.slice(i * 3, (i + 1) * 3));
  });
  // 5.3根据BoundingBox确定uv平铺范围
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const rangeX = max.x - min.x;
  const uvs = [].concat(
    ...pointsGroupBy63.map((item) => {
      const point0 = item[0];
      const point5 = item[5];
      const distance =
        new THREE.Vector3(...point0).distanceTo(new THREE.Vector3(...point5)) /
        (rangeX / 10);
      return [0, 1, 0, 0, distance, 1, 0, 0, distance, 0, distance, 1];
    })
  );
  geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(uvs), 2)
  );
  const meshMat =
    material ||
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
    });
  return new THREE.Mesh(geometry, meshMat);
};

/**
 * 通过path构造路径线
 *
 * **/
export const createLineByPath = ({ path = [], material }) => {
  const lineMat =
    material ||
    new THREE.LineBasicMaterial({
      color: 0xff0000,
    });
  const geometry = new THREE.Geometry();
  geometry.vertices.push(...path.map(({ x, y }) => new THREE.Vector3(x, 0, y)));
  return new THREE.Line(geometry, lineMat);
};

/**
 * 创建透明流动墙体材质
 * option =>
 * params height color opacity
 * **/
export const createOpacityWallMat = ({
  height = 10,
  color = "#00ffff",
  opacity = 0.5,
  speed = 1,
}) => {
  // 顶点着色器
  const vertexShader = `
    uniform vec3 u_color;

    uniform float time;
    uniform float u_height;
    varying float v_opacity;

    void main() {
        vec3 vPosition = position;
        v_opacity = mix(1.0, 0.0, position.y / u_height * 1.0) * (1.0 + sin(time) * 0.5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1);
    }
 `;
  // 片元着色器
  const fragmentShader = `
    uniform vec3 u_color;
    uniform float u_opacity;
    varying float v_opacity;
    void main() {
        gl_FragColor = vec4(u_color, v_opacity * u_opacity);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      u_height: {
        value: height,
      },
      u_opacity: {
        value: opacity,
      },
      u_color: {
        value: new THREE.Color(color),
      },
      time: {
        value: 0,
      },
      speed: {
        value: speed,
      },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });
};

/**
 * 创建流体墙体材质
 * option =>
 * params bgUrl flowUrl
 * **/
export const createFlowWallMat = ({ bgUrl, flowUrl }) => {
  // 顶点着色器
  const vertexShader = `
      varying vec2 vUv;
      varying vec3 fNormal;
      varying vec3 vPosition;
      void main(){
              vUv = uv;
              vPosition = position;
              vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
              gl_Position = projectionMatrix * mvPosition;
      }
  `;
  // 片元着色器
  const fragmentShader = `
      uniform float time;
      varying vec2 vUv;
      uniform sampler2D flowTexture;
      uniform sampler2D bgTexture;
      void main( void ) {
          vec2 position = vUv;
          vec4 colora = texture2D( flowTexture, vec2( vUv.x, fract(vUv.y - time )));
          vec4 colorb = texture2D( bgTexture , position.xy);
          gl_FragColor = colorb + colorb * colora;
      }
  `;
  const bgTexture = new THREE.TextureLoader().load(
    bgUrl || "../img/opacityWall.png"
  );
  const flowTexture = new THREE.TextureLoader().load(
    flowUrl ||
      "https://model.3dmomoda.com/models/da5e99c0be934db7a42208d5d466fd33/0/gltf/F3E2E977BDB335778301D9A1FA4A4415.png"
    // "https://model.3dmomoda.com/models/47007127aaf1489fb54fa816a15551cd/0/gltf/116802027AC38C3EFC940622BC1632BA.jpg"
  );
  // 允许平铺
  flowTexture.wrapS = THREE.RepeatWrapping;
  return new THREE.ShaderMaterial({
    uniforms: {
      time: {
        value: 0,
      },
      flowTexture: {
        value: flowTexture,
      },
      bgTexture: {
        value: bgTexture,
      },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });
};
