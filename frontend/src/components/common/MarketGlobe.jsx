import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Globe2 } from "lucide-react";

export function MarketGlobe() {
  const stageRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    let renderer;
    let frameId;
    let earthTexture;
    let controls;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0, 4.55);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      stage.appendChild(renderer.domElement);

      const earthGroup = new THREE.Group();
      scene.add(earthGroup);

      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0xd4e7ff,
        shininess: 12,
        specular: new THREE.Color(0x29435e),
      });
      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1.32, 96, 96),
        earthMaterial,
      );
      earth.rotation.y = -0.72;
      earthGroup.add(earth);

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.355, 64, 64),
        new THREE.MeshBasicMaterial({
          color: 0x54baff,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.18,
        }),
      );
      earthGroup.add(atmosphere);

      scene.add(new THREE.AmbientLight(0x93a8c0, 1.4));
      const sunlight = new THREE.DirectionalLight(0xffffff, 3.1);
      sunlight.position.set(-3, 2, 4);
      scene.add(sunlight);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        "/earth_atmos_2048.jpg",
        (texture) => {
          earthTexture = texture;
          texture.colorSpace = THREE.SRGBColorSpace;
          earthMaterial.map = texture;
          earthMaterial.needsUpdate = true;
        },
      );

      const markets = [
        { latitude: 40.7, longitude: -74, color: 0xff5964 },
        { latitude: 51.5, longitude: -0.1, color: 0xffc857 },
        { latitude: 19.1, longitude: 72.9, color: 0x66e2a0 },
        { latitude: 35.7, longitude: 139.7, color: 0xffc857 },
      ];
      const markerGeometry = new THREE.SphereGeometry(0.028, 16, 16);
      for (const market of markets) {
        const phi = THREE.MathUtils.degToRad(90 - market.latitude);
        const theta = THREE.MathUtils.degToRad(market.longitude + 180);
        const normal = new THREE.Vector3(
          -Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        );
        const marker = new THREE.Mesh(
          markerGeometry,
          new THREE.MeshBasicMaterial({ color: market.color }),
        );
        marker.position.copy(normal).multiplyScalar(1.345);
        earthGroup.add(marker);

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.052, 0.003, 5, 32),
          new THREE.MeshBasicMaterial({ color: market.color, transparent: true, opacity: 0.72 }),
        );
        ring.position.copy(normal).multiplyScalar(1.347);
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        earthGroup.add(ring);
      }

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      controls.autoRotateSpeed = 0.45;

      const resizeObserver = new ResizeObserver(() => {
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        const narrowAspect = Math.min(camera.aspect, 1);
        camera.position.z = Math.max(
          4.55,
          2.85 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * narrowAspect),
        );
        camera.updateProjectionMatrix();
      });
      resizeObserver.observe(stage);

      const animate = () => {
        frameId = window.requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        window.cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        controls.dispose();
        earthTexture?.dispose();
        earth.geometry.dispose();
        earthMaterial.dispose();
        atmosphere.geometry.dispose();
        atmosphere.material.dispose();
        markerGeometry.dispose();
        scene.traverse((object) => {
          if (object.geometry && object !== earth && object !== atmosphere) object.geometry.dispose();
          if (object.material && object !== earth && object !== atmosphere) object.material.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    } catch {
      stage.classList.add("earth-globe-unavailable");
    }

    return undefined;
  }, []);

  return (
    <section className="globe-panel">
      <div className="globe-heading">
        <div>
          <span className="eyebrow">GLOBAL MARKET RADAR</span>
          <h2>World Market Pulse</h2>
        </div>
        <Globe2 size={22} />
      </div>

      <div className="earth-globe-stage" ref={stageRef} aria-label="Interactive 3D globe showing major world markets">
        <div className="earth-globe-glow" />
        <span className="earth-orbit earth-orbit-one" />
        <span className="earth-orbit earth-orbit-two" />
        <div className="earth-globe-fallback"><Globe2 size={58} /></div>
        <span className="earth-globe-caption">EARTH · GLOBAL EXCHANGES</span>
      </div>

      <div className="globe-footer">
        <span><i />NEW YORK</span>
        <span><i />LONDON</span>
        <span><i />MUMBAI</span>
        <span><i />TOKYO</span>
      </div>
    </section>
  );
}