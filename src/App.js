import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry";
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import Stats from 'stats.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';

const ThreeApp = (cameraView) => {
  const mount = useRef(null);

  // Get cameraView prop
  // const { cameraView } = props;

  let axesScene, axesCamera, axesRenderer, mesh;
  let geometry, material, texture;

  // Create an AxesHelper and add it to the axesScene
  const axesHelper = new THREE.AxesHelper(5);

  // Get a reference to the label
  const coordsLabel = document.getElementById('coords-label');
  // Get a reference to the camera label
  const cameraLabel = document.getElementById('camera-label');
  // Get a reference to the camera angles label
  const cameraAnglesLabel = document.getElementById('camera-angles-label');
  // Get a reference to the JS heap label
  const jsHeapLabel = document.getElementById('jsheap-label');

  // Create a Stats instance
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  const fontloader = new FontLoader();

  useEffect(() => {
    let scene, camera, renderer, points, controls;

    const init = () => {
      // Main Scene
      scene = new THREE.Scene();
      // scene.background = new THREE.Color(0x000000);
      // Skybox bg - HDRI
      const rgbeLoader = new RGBELoader();
      rgbeLoader.load('/media/hdri/neon_photostudio_4k.hdr', (texture) => {
        // texture is a DataTexture with the HDRI data
        const pmremGenerator = new PMREMGenerator(renderer);
        const cubeTexture = pmremGenerator.fromEquirectangular(texture).texture;
        scene.background = cubeTexture;
      });

      // Camera
      // get cameraView prop and set camera accordingly
      switch (cameraView) {
        case 'perspective':
          console.log('perspective camera');
          camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
          );
          camera.position.z = 5;
          camera.position.y = 5;
          camera.position.x = 0;
          break;
        case 'orthographic':
          console.log('orthographic camera');
          camera = new THREE.OrthographicCamera(
            window.innerWidth / -2,
            window.innerWidth / 2,
            window.innerHeight / 2,
            window.innerHeight / -2,
            1,
            1000
          );
          camera.position.z = 5;
          camera.position.y = 5;
          camera.position.x = 0;
          break;
        case 'cube':
          console.log('cube camera');
          camera = new THREE.CubeCamera(1, 1000, 128);
          camera.position.z = 5;
          camera.position.y = 5;
          camera.position.x = 0;
          break;
        default:
          console.log('default camera');
          camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
          );
          camera.position.z = 5;
          camera.position.y = 5;
          camera.position.x = 0;
          break;
      }

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      mount.current.appendChild(renderer.domElement);

      // Orbit Controls
      controls = new OrbitControls(camera, renderer.domElement);

      // Cylinder
      // geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
      // material = new THREE.MeshBasicMaterial({ color: 0xffa500 });
      // mesh = new THREE.Mesh(geometry, material);
      // scene.add(mesh);

      // Create a new OBJLoader instance
      const modelLoader = new OBJLoader();

      // Load the OBJ file
      modelLoader.load('/media/models/male_body/Male.OBJ', function (object) {
        // The loaded object is a group containing the model's meshes
        // You can directly add it to the scene
        scene.add(object);

        // Create a custom material
        const customMaterial = new THREE.MeshStandardMaterial({
          color: 0xfffffff,
          roughness: 0.5,
          metalness: 0.5
        });

        // If you want to apply a material to all child meshes, you can do so here
        object.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = customMaterial; // new THREE.MeshBasicMaterial({ color: 0xfffffff });
          }
        });

        // Create a directional light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1); // position the light to shine from top-right-front
        scene.add(light);

        // add light to the top-left-back
        const light2 = new THREE.DirectionalLight(0xffffff, 1);
        light2.position.set(-1, -1, -1); // position the light to shine from top-left-back
        scene.add(light2);

        // Create an ambient light
        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        scene.add(ambientLight);

        // Calculate the bounding box of the entire group
        const boundingBox = new THREE.Box3().setFromObject(object);

        // Adjust the position of the mesh so that its bottom is at Y:0
        object.position.y = -boundingBox.min.y;

        // If you need to keep a reference to the mesh, you can do so here
        mesh = object;
      }, function (xhr) {
        // This function is called as the model is being loaded
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      }, function (error) {
        // This function is called if an error occurs while loading the model
        // console.error('An error happened', error);
        console.log('An error happened', error);
      });

      // Create a floor geometry
      const floorGeometry = new THREE.PlaneGeometry(10, 10);
      const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);

      // Rotate and position the floor
      floor.rotation.x = -Math.PI / 2; // rotate it to lie flat
      floor.position.y = 0; // position it at Y:0

      scene.add(floor); // add it to the scene

      // Points (as Decals)
      points = new THREE.Group();
      scene.add(points);

      // AxesHelper Scene
      axesScene = new THREE.Scene();

      // Create an AxesHelper instance of size 1
      // const axesHelper = new THREE.AxesHelper(1);

      // Position it in the corner of the scene
      axesHelper.position.set(-camera.aspect + 0.1, -1 + 0.1, 0);

      axesScene.add(axesHelper);
      // scene.add(axesHelper);

      // Create a loader for the font
      // const fontloader = new THREE.FontLoader();

      // Load a font
      fontloader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        // Create a geometry for each label
        const xGeometry = new TextGeometry('X', { font: font, size: 0.4, height: 0.02 });
        const yGeometry = new TextGeometry('Y', { font: font, size: 0.4, height: 0.02 });
        const zGeometry = new TextGeometry('Z', { font: font, size: 0.4, height: 0.02 });

        // Create a material for the labels
        const materialX = new THREE.MeshBasicMaterial({ color: 0xFF0000 }); // RED
        const materialY = new THREE.MeshBasicMaterial({ color: 0x00FF00 }); // GREEN
        const materialZ = new THREE.MeshBasicMaterial({ color: 0x0000FF }); // BLUE

        // Create a mesh for each label
        const xLabel = new THREE.Mesh(xGeometry, material);
        const yLabel = new THREE.Mesh(yGeometry, material);
        const zLabel = new THREE.Mesh(zGeometry, material);

        // Position the labels
        xLabel.position.set(1.1, 0, 0);
        yLabel.position.set(0, 1.1, 0);
        zLabel.position.set(0, 0, 1.1);

        // Add the labels to the scene
        scene.add(xLabel);
        scene.add(yLabel);
        scene.add(zLabel);
        // axesScene.add(xLabel);
        // axesScene.add(yLabel);
        // axesScene.add(zLabel);
      });

      // Create a separate camera for the AxesHelper
      axesCamera = new THREE.PerspectiveCamera(50, 1, 1, 10);
      axesCamera.position.z = 10;

      // Create a separate renderer for the AxesHelper
      axesRenderer = new THREE.WebGLRenderer({ alpha: true });
      axesRenderer.setSize(200, 200);

      // Position the axesRenderer's DOM element in the top left corner using CSS
      axesRenderer.domElement.style.position = "fixed";
      axesRenderer.domElement.style.top = "10px";
      axesRenderer.domElement.style.right = "10px";

      // Append the axesRenderer's DOM element to your mount point
      mount.current.appendChild(axesRenderer.domElement);

      // Event listeners
      window.addEventListener("resize", handleWindowResize);
      mount.current.addEventListener("dblclick", handleCanvasClick);
      // Add a mousemove event listener to the canvas
      mount.current.addEventListener('mousemove', handleMouseMove);

      // Animation
      animate();
    };

    // Define the mousemove event handler
    function handleMouseMove(event) {
      // Calculate mouse position in normalized device coordinates
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

      // Create a Vector3 with the mouse x, y, and z position
      const vector = new THREE.Vector3(mouseX, mouseY, 0.5);

      // Unproject the vector
      vector.unproject(camera);

      // Update the label with the vector's x, y, z coordinates
      coordsLabel.textContent = `Coords: x: ${vector.x.toFixed(2)}, y: ${vector.y.toFixed(2)}, z: ${vector.z.toFixed(2)}`;
    }

    const handleWindowResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
    };

    const handleCanvasClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

      // create a Raycaster object
      const raycaster = new THREE.Raycaster();
      // Create a vector to hold the mouse coordinates
      const mouse = new THREE.Vector2(mouseX, mouseY);

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(scene.children);
      console.log("intersects: ", intersects); // debug

      // Handle the intersections
      if (intersects.length > 0) {
        // Load circular texture
        const textureLoader = new THREE.TextureLoader();
        const circularTexture = textureLoader.load('/media/marker.png');

        let meshPosition = intersects[0].point;
        // move the decal a bit towards the camera
        meshPosition.z += 0.1;
        let decalSize = new THREE.Vector3(0.05, 0.05, 0.05);
        let decalOrientation = new THREE.Euler(0, 1, 0);

        // Create a point as a decal
        console.log("mesh obj: ", mesh); // debug
        console.log("intersacts #of items: ", intersects.length); // debug
        console.log("intersacts point/position (vctr): ", intersects[0].point); // debug
        console.log("decal size (vctr): ", decalSize); // debug

        // Create decal geometry
        const decalGeometry = new DecalGeometry(
          intersects[0].object,
          meshPosition,
          decalOrientation,
          decalSize
        );
        const decalMaterial = new THREE.MeshBasicMaterial({
          // color: 0xffffff,
          map: circularTexture,
          transparent: true,
          opacity: 0.7,
        });
        const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
        points.add(decalMesh);
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);

      // Update controls
      controls.update();

      // Update stats
      stats.update();

      // Update camera label
      cameraLabel.textContent = `Camera: x: ${camera.position.x.toFixed(2)}, y: ${camera.position.y.toFixed(2)}, z: ${camera.position.z.toFixed(2)}`;

      // Update camera angles label
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion);
      cameraAnglesLabel.textContent = `pitch: ${euler.x.toFixed(2)}, yaw: ${euler.y.toFixed(2)}, roll: ${euler.z.toFixed(2)}`;

      // The usedJSHeapSize property measures the amount of memory used by JavaScript objects in the heap. It represents the total size of memory allocated for JavaScript objects, including both live and dead objects. The unit of measurement for usedJSHeapSize is bytes.
      jsHeapLabel.textContent = `Estimated memory usage: ${performance.memory.usedJSHeapSize} bytes | ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)} MB | ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 / 1024)} GB`;

      // Update axes helper position
      axesHelper.rotation.setFromQuaternion(camera.quaternion);
      // rotate the axes labels as well
      // axesScene.rotation.setFromQuaternion(camera.quaternion);

      // axesHelper.position.copy(camera.position);
      // axesHelper.position.sub(controls.target); // this makes the helper always face towards the camera

      // Render main scene
      renderer.render(scene, camera);

      // Render axes scene
      axesRenderer.render(axesScene, axesCamera);
    };

    init();

    return () => {
      // Cleanup
      window.removeEventListener("resize", handleWindowResize);
      mount.current.removeEventListener("click", handleCanvasClick);
      controls.dispose();
      // You might want to clean up any additional resources here
      // such as Mesh objects, etc.
      // geometry.dispose();
      // material.dispose();
      // texture.dispose();	
      // renderer.dispose();
      // while (scene.children.length > 0) {
      //   const object = scene.children[0];
      //   object.geometry.dispose();
      //   object.material.dispose();
      //   scene.remove(object);
      // }
    };
  }, []);

  return <div ref={mount} />;
};

function App() {
  const [cameraView, setCameraView] = useState('perspective');

  const handleCameraViewChange = (event) => {
    setCameraView(event.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <select value={cameraView} onChange={handleCameraViewChange} className="camera-view">
          <option value="perspective">Perspective</option>
          <option value="orthographic">Orthographic</option>
          <option value="cube">Cube</option>
        </select>
        <ThreeApp cameraView={cameraView} />
      </header>
    </div>
  );
}

export default App;
