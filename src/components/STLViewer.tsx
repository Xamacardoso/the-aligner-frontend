"use client"

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, Center } from "@react-three/drei";
// @ts-expect-error - STLLoader types are not always correctly resolved in the examples folder
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { Lightbulb } from "lucide-react";

interface STLViewerProps {
    url: string;
}

function Model({ url }: { url: string }) {
    const geom = useLoader(STLLoader, url);

    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: "#cbd5e1",
        roughness: 0.4,
        metalness: 0.6
    }), []);

    return (
        <Center>
            <mesh geometry={geom} material={material} castShadow receiveShadow />
        </Center>
    );
}

export default function STLViewer({ url }: STLViewerProps) {
    return (
        <div className="absolute inset-0 bg-slate-900 overflow-hidden">
            <Canvas shadows camera={{ position: [0, 0, 150], fov: 45 }} gl={{ antialias: true }}>
                <color attach="background" args={["#0f172a"]} />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow />
                <pointLight position={[-10, -10, -10]} />

                <Suspense fallback={null}>
                    <Stage adjustCamera intensity={0.5} environment="city" shadows={{ type: 'contact', opacity: 0.6, blur: 2 }}>
                        <Model url={url} />
                    </Stage>
                </Suspense>

                <OrbitControls makeDefault rotateSpeed={0.5} />
            </Canvas>

            <div className="absolute bottom-6 left-6 flex items-start gap-3 p-4 bg-slate-950/80 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-700 z-50">
                <div className="bg-amber-400/20 p-2 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                    <p className="text-xs font-bold text-white mb-1">Dica de Interação</p>
                    <div className="grid grid-cols-1 gap-1">
                        <p className="text-[10px] text-slate-400 font-medium">🖱️ <span className="text-slate-200">Botão Esquerdo:</span> Rotacionar</p>
                        <p className="text-[10px] text-slate-400 font-medium">🖐️ <span className="text-slate-200">Botão Direito:</span> Mover Câmera</p>
                        <p className="text-[10px] text-slate-400 font-medium">🔍 <span className="text-slate-200">Scroll:</span> Controle de Zoom</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
