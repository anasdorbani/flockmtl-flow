import React, { useCallback, useEffect, useState } from 'react';
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
import { FaPlay } from "react-icons/fa6";
import type { Pipeline } from '@/../types/pipeline';
import { BuildNodesAndEdges } from './BuildNodesAndEdges';
import axios from 'axios';
import { PiBroomBold } from "react-icons/pi";
import { Operator } from '@/../types/pipeline';

interface NodesViewProps {
    pipeline: Pipeline;
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    setPipeline: React.Dispatch<React.SetStateAction<Pipeline>>;
    handleClearPipeline: () => void;
}

export default function NodesView({ pipeline, query, setQuery, setPipeline, handleClearPipeline }: NodesViewProps) {

    const handleInputChange = (operatorId: number, field: string, value: any, type: string = '') => {
        const parsedValue = type === "number" ? Number(value) : value;

        setPipeline((prevPipeline) => {
            const updateOperator = (operator: Operator): Operator => {
                if (operator.id === operatorId) {
                    return {
                        ...operator,
                        params: {
                            ...operator.params,
                            [field]: parsedValue,
                        },
                    };
                }
                if (operator.children) {
                    return { ...operator, children: operator.children.map(updateOperator) };
                }
                return operator;
            };
            return updateOperator(prevPipeline);
        });
    };

    const { Nodes, Edges } = BuildNodesAndEdges(pipeline, handleInputChange);
    const [nodes, setNodes, onNodesChange] = useNodesState(Nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(Edges);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const onConnect = useCallback(
        (params: any) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const handlePipelineRunning = () => {
        setIsRegenerating(true);
        axios.post('/api/pipeline-running', { pipeline: pipeline.children[0], query: query })
            .then((response) => {
                console.log(response.data);
                setQuery(response.data.query);
                setPipeline(response.data.pipeline);
                const { Nodes, Edges } = BuildNodesAndEdges(response.data.pipeline, handleInputChange);
                setNodes(Nodes);
                setEdges(Edges);
                setIsRegenerating(false);
            }).catch(() => {
                setIsRegenerating(false);
            });
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
                    icon={<PiBroomBold />}
                    onClick={handleClearPipeline}
                    className='rounded-[40px]'
                />
                <Button
                    icon={<FaPlay />}
                    iconPosition='end'
                    onClick={handlePipelineRunning}
                    className='rounded-[40px] text-green-400 font-bold'
                    loading={isRegenerating}
                >
                    Run
                </Button>
            </Panel>
            <Controls />
            <Background gap={12} size={1} />
        </ReactFlow>
    );
}
