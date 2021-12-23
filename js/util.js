import * as THREE from "../node_modules/three/build/three.module.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import Stats from "./stats.module.js";
// 初始化场景
export const initScene = () => {
  return new THREE.Scene();
};

// 初始化相机
export const initCamera = (z = 100) => {
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    100000
  );
  camera.position.z = z;
  camera.position.y = z;
  return camera;
};

// 初始化渲染器
export const initRender = () => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true, // 抗锯齿
  });
  renderer.setPixelRatio(window.devicePixelRatio); // 设置分辨率
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
};

// 初始化控制器
export const initOrbitControls = (camera, renderer) => {
  return new OrbitControls(camera, renderer.domElement);
};

// 初始化性能监视器
export const initStats = () => {
  const stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";
  document.body.appendChild(stats.domElement);
  return stats;
};

// 窗口改变
export const windowReSize = (renderer, camera) => () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

// 添加环境光
export const addAmbientLight = (scene) => {
  scene.add(new THREE.AmbientLight(0xffffff, 1));
};

// 添加平行光
export const addDirectionalLight = (scene) => {
  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.x = -100;
  light.position.y = 100;
  light.position.z = 100;
  light.castShadow = true;
  scene.add(light);
};

// 添加坐标系
export const addAxisHelper = (scene, long = 50) => {
  scene.add(new THREE.AxesHelper(long));
};
