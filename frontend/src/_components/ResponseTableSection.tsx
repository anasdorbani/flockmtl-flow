import React from 'react';
import { Table, Card, Typography, Space, Button, Input } from 'antd';
import { PiBroomBold } from 'react-icons/pi';
import { RiLoopLeftFill } from "react-icons/ri";
import { LuSearchCode } from "react-icons/lu";
import { FaPlay } from "react-icons/fa";
import axios from 'axios';
import SQLEditor from './SQLEditor';

import { Column, Line, Pie } from "@ant-design/charts";

interface ResponseTableSectionProps {
    promptData: {
        prompt: string;
        query: string;
        table: any[];
        execution_time: number;
    };
    regenerateResponseTable: (prompt: string, query: string) => void;
    generateQueryPlan: (query: string) => void;
    setPromptData: React.Dispatch<React.SetStateAction<any>>;
    isRegeneratingResponseTable: boolean;
    isGeneratingQueryPlan: boolean;
}

export default function ResponseTableSection({ promptData, setPromptData, regenerateResponseTable, isRegeneratingResponseTable, isGeneratingQueryPlan, generateQueryPlan }: ResponseTableSectionProps) {
    // Extract columns dynamically from table data
    const columns = promptData.table.length > 0
        ? Object.keys(promptData.table[0]).map(key => ({
            title: key,
            dataIndex: key,
            key,
            render: (value: any) => (typeof value === "object" ? JSON.stringify(value) : value),
            ellipsis: true,
        }))
        : [];

    const [inputQuery, setInputQuery] = React.useState(promptData.query);
    const [isRunningQuery, setIsRunningQuery] = React.useState(false);

    const handleQueryChange = (value: string) => {
        setInputQuery(value);
    }

    const runInputQuery = () => {
        setIsRunningQuery(true);
        axios.post('/api/generate-input-query-response-table', { query: inputQuery })
            .then((response) => {
                setPromptData({
                    ...promptData,
                    query: inputQuery,
                    table: response.data.table,
                    execution_time: response.data.execution_time
                })
                setIsRunningQuery(false);
            })
            .catch(() => {
                setIsRunningQuery(false);
            }
            )
    }

    const [chartConfig, setChartConfig] = React.useState(null);
    const generateVisualization = async () => {
        axios.post('/api/generate-plot-config', { query: promptData.query, table: promptData.table })
            .then((response) => {
                response.data.data = promptData.table;
                console.log(response.data);
                setChartConfig(response.data);
            }
            )
    };


    return (
        <div className="relative w-full h-full">

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card className='border-2 border-[#f0f0f0] rounded-[40px] max-w-screen-md'>
                    <div className='absolute flex gap-2 justify-end w-full px-10'>
                        <Button
                            icon={<PiBroomBold />}
                            onClick={() => window.location.reload()}
                            className='rounded-[40px]'
                        />
                        <Button className="rounded-full" loading={isRegeneratingResponseTable} icon={<RiLoopLeftFill />} onClick={() => regenerateResponseTable(promptData.prompt, promptData.query)} />
                        <Button color='primary' variant='outlined' className="rounded-full" loading={isGeneratingQueryPlan} icon={<LuSearchCode />} onClick={() => generateQueryPlan(promptData.query)} >Inspect</Button>
                    </div>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Typography.Title level={3}>Query Details</Typography.Title>
                        <Typography.Paragraph className='text-left'>
                            <p><span className='font-bold'>Prompt:</span> {promptData.prompt}</p>
                            <p><span className='font-bold'>Execution Time:</span> {promptData.execution_time} s</p>
                            <div className='relative'>
                                <Button
                                    icon={<FaPlay />}
                                    variant='outlined'
                                    size='small'
                                    color='green'
                                    className='rounded-[40px] absolute top-3 right-3 p-2 z-10 text-xs'
                                    loading={isRunningQuery}
                                    onClick={runInputQuery}
                                >
                                    Run
                                </Button>
                                <SQLEditor value={inputQuery} onChange={handleQueryChange} /></div>
                        </Typography.Paragraph>
                        {/* <Button onClick={generateVisualization} >Generate Chart</Button>
                        {chartConfig && (
                            <div style={{ marginTop: 20 }}>
                                {chartConfig.type === "column" && <Column {...chartConfig} />}
                                {chartConfig.type === "line" && <Line {...chartConfig} />}
                                {chartConfig.type === "pie" && <Pie {...chartConfig} />}
                            </div>
                        )} */}
                        <Typography.Title level={3}>Query Results</Typography.Title>
                        <Table dataSource={promptData.table} columns={columns} scroll={{ x: "auto" }} className='border-[1px] rounded-[20px] p-2' pagination={{ pageSize: 5 }} />
                    </Space>
                </Card>
            </div>
        </div>
    );
}
