import React, { useCallback, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { Button } from 'antd';
import { TfiReload } from "react-icons/tfi";
import type { Pipeline } from '../../types/pipeline';
import { BuildNodesAndEdges } from './BuildNodesAndEdges';
import axios from 'axios';
import { PiBroomBold } from "react-icons/pi";

interface NodesViewProps {
    initialPipeline: Pipeline;
    handleClearPipeline: () => void;
}

export default function NodesView({ initialPipeline, handleClearPipeline }: NodesViewProps) {
    const [pipeline, setPipeline] = useState(initialPipeline);
    const { Nodes, Edges } = BuildNodesAndEdges(pipeline, setPipeline);
    const [nodes, setNodes, onNodesChange] = useNodesState(Nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(Edges);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const onConnect = useCallback(
        (params: any) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const handleRegenerate = () => {
        setIsRegenerating(true);
        axios.post('/api/generate-pipeline', { pipeline: pipeline })
            .then((response) => {
                setPipeline(response.data);
                setIsRegenerating(false);
            }).catch(() => setIsRegenerating(false));
    };

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            className='border-2 border-[#f0f0f0] rounded-[40px]'
            fitView
        >
            <Panel position="top-right" className='flex gap-2'>
                <Button
                    icon={<TfiReload />}
                    onClick={handleRegenerate}
                    className='rounded-[40px]'
                    loading={isRegenerating}
                >
                    Regenerate
                </Button>
                <Button
                    icon={<PiBroomBold />}
                    onClick={handleClearPipeline}
                    className='rounded-[40px]'
                />
            </Panel>
            <Controls />
            <Background gap={12} size={1} />
        </ReactFlow>
    );
}
