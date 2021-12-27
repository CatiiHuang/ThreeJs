import * as THREE from "../node_modules/three/build/three.module.js";
/**
 * 通过path构建墙体
 * option =>
 * params height path material
 * **/
export const creatWallByPath = ({ height = 10, path = [], material }) => {
  // 1.向y方向拉伸顶点
  const pathsV2 = path.reduce((arr, [x, y, z]) => {
    arr.push([
      [x, y, z],
      [x, y + height, z],
    ]);
    return arr;
  }, []);
  // 2.解析需要渲染的四边形 每4个顶点为一组
  const verticesByFour = pathsV2.reduce((arr, item, i) => {
    if (i === pathsV2.length - 1) return arr;
    arr.push([item, pathsV2[i + 1]]);
    return arr;
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
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const rangeX = min.x - max.x;
  // 分组
  const pointsGroupBy18 = new Array(verticesByThree.length / 3 / 6)
    .fill(0)
    .map((item, i) => {
      return verticesByThree.slice(i * 3 * 6, (i + 1) * 3 * 6);
    });
  console.log(pointsGroupBy18);
  const pointsGroupBy63 = pointsGroupBy18.map((item, i) => {
    return new Array(item.length / 3)
      .fill(0)
      .map((it, i) => item.slice(i * 3, (i + 1) * 3));
  });
  const uvs = [].concat(
    ...pointsGroupBy63.map((item) => {
      const point0 = item[0];
      const point5 = item[5];
      const distance =
        new THREE.Vector3(...point0).distanceTo(new THREE.Vector3(...point5)) /
        10;
      return [0, 1, 0, 0, distance, 1, 0, 0, distance, 0, distance, 1];
    })
  );
  const uv = new Float32Array(uvs);
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
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
 * 创建透明墙体材质
 * option =>
 * params height color opacity
 * **/
export const createOpacityWallMat = ({
  height = 10,
  color = "#00ffff",
  opacity = 0.5,
  order = 5,
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
