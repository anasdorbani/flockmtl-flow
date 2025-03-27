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
import { Button, Spin } from 'antd';
import { FaPlay } from "react-icons/fa6";
import type { Pipeline } from '@/../types/pipeline';
import { BuildNodesAndEdges } from './BuildNodesAndEdges';
import axios from 'axios';
import { Operator } from '@/../types/pipeline';
import { IoIosArrowBack } from "react-icons/io";
import { VscDebugRerun } from "react-icons/vsc";

interface NodesViewProps {
    pipeline: Pipeline;
    promptData: {
        prompt: string;
        query: string;
        table: any[];
        execution_time: number;
    }
    setPromptData: React.Dispatch<React.SetStateAction<any>>;
    setPipeline: React.Dispatch<React.SetStateAction<Pipeline>>;
    setShowPlan: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function NodesView({ pipeline, promptData, setPromptData, setPipeline, setShowPlan }: NodesViewProps) {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [flowKey, setFlowKey] = useState(0);
    const [showApplyEdits, setShowApplyEdits] = useState(false);

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

        setShowApplyEdits(true);
    };

    const { Nodes, Edges } = BuildNodesAndEdges(promptData, pipeline, handleInputChange);
    const [nodes, setNodes, onNodesChange] = useNodesState(Nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(Edges);

    const onConnect = useCallback(
        (params: any) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const handlePipelineRunning = () => {
        setIsRegenerating(true);
        axios.post('/api/run-query-with-refinement', { pipeline: pipeline, query: promptData.query })
            .then((response) => {
                setPromptData({
                    ...promptData,
                    table: response.data.table,
                    execution_time: response.data.execution_time,
                    query: response.data.query
                });
                setPipeline(response.data.pipeline);
                console.log(response.data.pipeline);
                console.log(response.data);
                const { Nodes, Edges } = BuildNodesAndEdges(response.data, response.data.pipeline, handleInputChange);
                setNodes(Nodes);
                setEdges(Edges);
                setFlowKey(prevKey => prevKey + 1); // Force ReactFlow to re-render
                setShowApplyEdits(false);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setIsRegenerating(false);
            });
    };

    return (
        <div className="relative w-full h-full">
            {/* Loading Overlay */}
            {isRegenerating && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
                    <Spin size="large" />
                </div>
            )}

            <ReactFlow
                key={flowKey} // Forces re-render
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                className='border-2 border-[#f0f0f0] rounded-[40px]'
                fitView
            >
                <Panel position="top-left" className='flex gap-2'>
                    <Button
                        icon={<IoIosArrowBack />}
                        onClick={() => setShowPlan(false)}
                        className='rounded-[40px]'
                    >
                        Back
                    </Button>
                </Panel>
                <Panel position="top-right" className='flex gap-2'>
                    {/* run pipeline button */}
                    <Button
                        icon={<VscDebugRerun />}
                        onClick={handlePipelineRunning}
                        variant='outlined'
                        color='green'
                        className='rounded-[40px]'
                        iconPosition='end'
                    >Rerun</Button>
                </Panel>
                <Controls />
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}
