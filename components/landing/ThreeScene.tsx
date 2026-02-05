"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Stars, Environment, ContactShadows, Float } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";
import { motion } from "framer-motion-3d";

// DashboardPlane component removed as per user request for abstract background

function Rig() {
    const { camera, pointer } = useThree()
    useFrame(() => {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.5, 0.05)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.5, 0.05)
        camera.lookAt(0, 0, 0)
    })
    return null
}

// Interactive Crystal Component
function CrystalCore() {
    const group = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!group.current) return;

        // Continuous slow rotation
        group.current.rotation.y += delta * 0.1;

        // Interactive Tilt based on mouse
        const { x, y } = state.pointer;
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, y * 0.2, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -x * 0.2, 0.1);
    });

    return (
        <group ref={group} position={[0, 1, -15]} rotation={[0.2, 0, 0]}>
            {/* Inner Glowing Core */}
            <mesh rotation={[0, 0, 0]}>
                <octahedronGeometry args={[3, 0]} />
                <meshStandardMaterial
                    color="#0ea5e9"
                    emissive="#0ea5e9"
                    emissiveIntensity={3}
                    toneMapped={false}
                />
            </mesh>

            {/* Outer Glass Shell */}
            <mesh rotation={[0.5, 0.5, 0]}>
                <icosahedronGeometry args={[6, 0]} />
                <meshPhysicalMaterial
                    roughness={0.1}
                    transmission={0.98}
                    thickness={2}
                    color="#ffffff"
                    ior={1.2}
                    reflectivity={0.5}
                    metalness={0.1}
                    clearcoat={1}
                    transparent={true}
                    opacity={0.5}
                />
            </mesh>

            {/* Orbiting Rings */}
            <mesh rotation={[Math.PI / 2.5, 0, 0]}>
                <torusGeometry args={[9, 0.05, 32, 100]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
        </group>
    );
}

// Moving Grid Component
function MovingGrid() {
    const gridRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (gridRef.current) {
            gridRef.current.position.z += delta * 2;
            if (gridRef.current.position.z > 10) {
                gridRef.current.position.z = 0;
            }
        }
    });
    return (
        <group ref={gridRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <gridHelper args={[60, 60, 0x0ea5e9, 0x0ea5e9]} position={[0, 0, 0]} />
            <gridHelper args={[60, 60, 0x0ea5e9, 0x0ea5e9]} position={[0, -10, 0]} />
        </group>
    );
}

export default function ThreeScene() {
    return (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
            <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={1} />

                {/* Fog for depth fading */}
                <fog attach="fog" args={['#000000', 5, 30]} />

                <Suspense fallback={null}>
                    {/* Moving Grid Floor */}
                    <MovingGrid />

                    {/* Central Crystal Core */}
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.2}>
                        <CrystalCore />
                    </Float>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <Environment preset="city" />
                    <ContactShadows position={[0, -5, 0]} opacity={0.4} scale={20} blur={2.5} far={4.5} />
                </Suspense>

                <Rig />
            </Canvas>

            {/* Overlay Gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background z-10 pointer-events-auto"></div>
        </div>
    );
}
