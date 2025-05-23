import React from 'react';
import { Table, Card, Typography, Space, Button, Input } from 'antd';
import { PiBroomBold } from 'react-icons/pi';
import { RiLoopLeftFill } from "react-icons/ri";
import { LuSearchCode } from "react-icons/lu";
import { FaPlay } from "react-icons/fa";
import axios from 'axios';
import SQLEditor from './SQLEditor';
import { Tooltip } from 'antd';

import { TfiClose } from "react-icons/tfi";
import { Column, Line, Pie } from "@ant-design/charts";
import { IoCopy } from "react-icons/io5";

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

    const copyQueryToClipboard = () => {
        navigator.clipboard.writeText(inputQuery)
            .then(() => {
                console.log('Query copied to clipboard');
            }
            )
            .catch((error) => {
                console.error('Error copying query to clipboard:', error);
            }
            );
    };


    return (
        <div className="relative w-full h-full">

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card className='border-2 border-[#f0f0f0] rounded-[40px] max-w-screen-md'>
                    <div className='flex gap-2 justify-between w-full mb-2'>
                        <Tooltip title="Close current and start new query" color='#888888' className='font-bold'>
                            <Button
                                icon={<TfiClose />}
                                onClick={() => window.location.reload()}
                                className='rounded-[40px]'
                            />
                        </Tooltip>
                        <div className='flex gap-2'>
                            <Tooltip title="Regenerate query" color='#888888' className='font-bold'>
                                <Button className="rounded-full" loading={isRegeneratingResponseTable} icon={<RiLoopLeftFill />} onClick={() => regenerateResponseTable(promptData.prompt, promptData.query)} />
                            </Tooltip>
                            <Tooltip title="Inspect query plan" color='#888888' className='font-bold'>
                                <Button color='primary' variant='outlined' className="rounded-full" loading={isGeneratingQueryPlan} icon={<LuSearchCode />} onClick={() => generateQueryPlan(promptData.query)} >Inspect</Button>
                            </Tooltip>
                        </div>
                    </div>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Typography.Title level={3}>Query Details</Typography.Title>
                        <Typography.Paragraph className='text-left'>
                            <p><span className='font-bold'>Prompt:</span> {promptData.prompt}</p>
                            <p><span className='font-bold'>Execution Time:</span> {promptData.execution_time} s</p>
                            <div className='relative'>
                                <div className='absolute top-3 right-3 p-2 z-10 flex gap-2 '>
                                    <Tooltip title="Run query" color='#888888' className='font-bold'>
                                        <Button
                                            icon={<FaPlay />}
                                            variant='outlined'
                                            color='green'
                                            className='rounded-[40px] text-xs'
                                            loading={isRunningQuery}
                                            onClick={runInputQuery}
                                        >
                                            Run
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Copy query" color='#888888' className='font-bold'>
                                        <Button
                                        icon={<IoCopy />}
                                        className='rounded-full text-xs'
                                        onClick={copyQueryToClipboard}
                                    />
                                    </Tooltip>
                                </div>
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
