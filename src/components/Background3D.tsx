import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Background3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL not supported or context lost:', e);
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03140e, 0.015);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 18);

    // Ambient & Directional Lights for metallic gold and emerald sheen
    const ambientLight = new THREE.AmbientLight(0x064e3b, 1.2);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0xd4af37, 2.5, 45);
    goldLight.position.set(10, 12, 10);
    scene.add(goldLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 2.8, 50);
    emeraldLight.position.set(-12, -10, 8);
    scene.add(emeraldLight);

    const topCyanLight = new THREE.DirectionalLight(0x34d399, 1.0);
    topCyanLight.position.set(0, 20, 10);
    scene.add(topCyanLight);

    // Group for objects that react to mouse and scroll
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // ==========================================
    // 1. FLOATING JAPANESE TRIANGLES / PRISMS
    // ==========================================
    const triangleMeshes: THREE.Group[] = [];
    const triangleGeometries: THREE.BufferGeometry[] = [];
    const triangleMaterials: THREE.Material[] = [];

    // Create 3D Triangular Prisms & Japanese Chart Triangles
    const createPrismGeometry = (radius: number, depth: number) => {
      const shape = new THREE.Shape();
      const numSides = 3;
      for (let i = 0; i < numSides; i++) {
        const angle = (i * 2 * Math.PI) / numSides - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();

      const extrudeSettings = {
        depth,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: radius * 0.08,
        bevelThickness: radius * 0.08,
      };
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    };

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22,
      transparent: true,
      opacity: 0.65,
      wireframe: false,
    });
    triangleMaterials.push(goldMaterial);

    const goldWireMaterial = new THREE.LineBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.85,
    });
    triangleMaterials.push(goldWireMaterial);

    const emeraldMaterial = new THREE.MeshStandardMaterial({
      color: 0x059669,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.55,
    });
    triangleMaterials.push(emeraldMaterial);

    const emeraldWireMaterial = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.8,
    });
    triangleMaterials.push(emeraldWireMaterial);

    const prismCount = 18;
    for (let i = 0; i < prismCount; i++) {
      const isGold = i % 2 === 0;
      const radius = 0.7 + Math.random() * 1.4;
      const depth = 0.15 + Math.random() * 0.4;
      const geom = createPrismGeometry(radius, depth);
      geom.center();
      triangleGeometries.push(geom);

      const prismGroup = new THREE.Group();

      const faceMat = isGold ? goldMaterial : emeraldMaterial;
      const mesh = new THREE.Mesh(geom, faceMat);
      prismGroup.add(mesh);

      // Add glowing edges
      const edges = new THREE.EdgesGeometry(geom);
      triangleGeometries.push(edges);
      const edgeLine = new THREE.LineSegments(
        edges,
        isGold ? goldWireMaterial : emeraldWireMaterial
      );
      prismGroup.add(edgeLine);

      // Position in 3D volume around camera view
      const spreadX = 26;
      const spreadY = 22;
      const spreadZ = 24;
      prismGroup.position.set(
        (Math.random() - 0.5) * spreadX,
        (Math.random() - 0.5) * spreadY,
        (Math.random() - 0.5) * spreadZ - 2
      );

      // Random rotation
      prismGroup.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Custom drift velocities
      (prismGroup as any).rotSpeedX = (Math.random() - 0.5) * 0.008;
      (prismGroup as any).rotSpeedY = (Math.random() - 0.5) * 0.008;
      (prismGroup as any).floatBaseY = prismGroup.position.y;
      (prismGroup as any).floatSpeed = 0.5 + Math.random() * 0.8;
      (prismGroup as any).floatAmp = 0.4 + Math.random() * 0.6;

      triangleMeshes.push(prismGroup);
      mainGroup.add(prismGroup);
    }

    // ==========================================
    // 2. LUMINOUS 3D TREND LINES (BULLISH WAVES)
    // ==========================================
    const trendGroup = new THREE.Group();
    mainGroup.add(trendGroup);

    const createTrendLine = (pointsArr: THREE.Vector3[], color: number, opacity: number) => {
      const curve = new THREE.CatmullRomCurve3(pointsArr, false, 'centripetal', 0.5);
      const points = curve.getPoints(120);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      triangleGeometries.push(lineGeom);

      const lineMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        linewidth: 2,
      });
      triangleMaterials.push(lineMat);

      return new THREE.Line(lineGeom, lineMat);
    };

    // Upward financial trend 1 (Emerald institutional trend)
    const trendPoints1 = [
      new THREE.Vector3(-18, -9, -6),
      new THREE.Vector3(-12, -7, -4),
      new THREE.Vector3(-6, -4, -5),
      new THREE.Vector3(-1, -6, -3), // pullback
      new THREE.Vector3(4, -1, -2),  // breakout
      new THREE.Vector3(8, -2, -4),  // retest
      new THREE.Vector3(14, 5, -3),  // expansion
      new THREE.Vector3(20, 8, -5),
    ];
    const trendLine1 = createTrendLine(trendPoints1, 0x10b981, 0.7);
    trendGroup.add(trendLine1);

    // Gold secondary impulse trend
    const trendPoints2 = [
      new THREE.Vector3(-16, -11, -2),
      new THREE.Vector3(-10, -8, -1),
      new THREE.Vector3(-4, -6, -2),
      new THREE.Vector3(1, -2, 0),
      new THREE.Vector3(6, 1, -1),
      new THREE.Vector3(12, 4, 1),
      new THREE.Vector3(18, 10, -1),
    ];
    const trendLine2 = createTrendLine(trendPoints2, 0xd4af37, 0.85);
    trendGroup.add(trendLine2);

    // Deep background support wave
    const trendPoints3 = [
      new THREE.Vector3(-22, -14, -10),
      new THREE.Vector3(-10, -12, -8),
      new THREE.Vector3(2, -8, -12),
      new THREE.Vector3(12, -3, -9),
      new THREE.Vector3(24, 4, -11),
    ];
    const trendLine3 = createTrendLine(trendPoints3, 0x059669, 0.4);
    trendGroup.add(trendLine3);

    // ==========================================
    // 3. SOFT GLOWING PARTICLES (MARKET DUST)
    // ==========================================
    const particleCount = 850;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const cEmerald = new THREE.Color(0x10b981);
    const cGold = new THREE.Color(0xd4af37);
    const cLightGold = new THREE.Color(0xfde68a);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 40;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 36;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 30 - 2;

      // Color distribution: 50% gold tones, 50% emerald
      const randColor = Math.random();
      const chosenColor = randColor < 0.4 ? cGold : randColor < 0.7 ? cEmerald : cLightGold;
      particleColors[i3] = chosenColor.r;
      particleColors[i3 + 1] = chosenColor.g;
      particleColors[i3 + 2] = chosenColor.b;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    triangleGeometries.push(particleGeom);

    // Soft round point texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(212, 175, 55, 0.8)');
      grad.addColorStop(0.7, 'rgba(16, 185, 129, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.32,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    triangleMaterials.push(particleMat);

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    mainGroup.add(particleSystem);

    // ==========================================
    // 4. MOUSE & SCROLL REACTIVITY
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let scrollY = window.scrollY;
    let targetScrollOffset = 0;

    const handleMouseMove = (event: MouseEvent) => {
      // Normalized between -1 and 1
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      targetRotY = mouseX * 0.22;
      targetRotX = -mouseY * 0.16;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1000);
      const scrollPercent = scrollY / maxScroll;
      // Gently translate scene vertically with scroll
      targetScrollOffset = scrollPercent * 8;
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // ==========================================
    // 5. ANIMATION LOOP
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp mouse parallax & scroll reaction
      mainGroup.rotation.y += (targetRotY - mainGroup.rotation.y) * 0.04;
      mainGroup.rotation.x += (targetRotX - mainGroup.rotation.x) * 0.04;

      // Scroll vertical drift
      camera.position.y += (-targetScrollOffset - camera.position.y) * 0.035;

      // Animate Japanese triangles (rotation + gentle float)
      triangleMeshes.forEach((mesh, index) => {
        mesh.rotation.x += (mesh as any).rotSpeedX;
        mesh.rotation.y += (mesh as any).rotSpeedY;

        const floatBaseY = (mesh as any).floatBaseY;
        const floatSpeed = (mesh as any).floatSpeed;
        const floatAmp = (mesh as any).floatAmp;
        mesh.position.y = floatBaseY + Math.sin(elapsedTime * floatSpeed + index) * floatAmp;
      });

      // Animate trendlines (gentle pulsating motion)
      trendGroup.rotation.z = Math.sin(elapsedTime * 0.25) * 0.04;
      trendGroup.position.y = Math.cos(elapsedTime * 0.35) * 0.3;

      // Animate particles (gentle drift)
      particleSystem.rotation.y = elapsedTime * 0.02;
      particleSystem.rotation.x = Math.sin(elapsedTime * 0.015) * 0.05;

      // Pulse lights subtly
      goldLight.intensity = 2.2 + Math.sin(elapsedTime * 1.5) * 0.6;
      emeraldLight.intensity = 2.4 + Math.cos(elapsedTime * 1.8) * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    // ==========================================
    // 6. RESOURCE DISPOSAL ON UNMOUNT
    // ==========================================
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      triangleGeometries.forEach((g) => g.dispose());
      triangleMaterials.forEach((m) => m.dispose());
      particleTexture.dispose();
      renderer.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="canvas-3d-background"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
};
