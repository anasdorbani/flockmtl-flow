import { LuDatabaseZap as HeroIcon } from "react-icons/lu";
import { Table, Tabs, Button, Spin } from "antd";
import { OutputData } from "./data";
import React from "react";

interface HeroSectionProps {
    showResults: boolean;
    setShowPlan: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HeroSection({ showResults, setShowPlan }: HeroSectionProps) {
    
    const [loading, setLoading] = React.useState(false);

    const handleOnClick = () => {
        setLoading(true);
        setTimeout(() => {
            setShowPlan(true);
            setLoading(false);
        }, 3000);
    }

    // Sample data for executed query and results table (replace this with your actual query result data)
    const executedQueryData = OutputData;

    // Dynamically generate table columns from executed query data keys
    const executedColumns = executedQueryData.length > 0
        ? Object.keys(executedQueryData[0]).map((key) => ({
            title: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize column headers
            dataIndex: key,
            key,
            render: (value: any) => (typeof value === "object" ? JSON.stringify(value) : value), // Handle nested objects
            ...(key === "review" && {
                width: 300, // Adjust this width as per your content's needs
                ellipsis: true, // Ensures long content gets truncated
            }),
        }))
        : [];

    return (
        <div className="w-full h-full flex flex-col gap-4 text-center">
            {/* <span className="block h-52" /> */}
            <h1 className="text-2xl font-bold">Bank Review Analysis with Natural Language Query</h1>
            <h2 className="text-gray-500">Analyze bank reviews with ease using natural language queries!</h2>
            <h3 className="text-xl font-bold">Data Preview</h3>
            { showResults && (<>
                <h2 className="text-xl font-bold">Query Results</h2>
                <Button color="primary" variant="outlined"
                        loading={loading}
                        onClick={handleOnClick}
                        className="w-[140px] mx-auto rounded-full" icon={<HeroIcon />} size="large">
                    Inspect Plan
                </Button>
                <Tabs defaultActiveKey="1" className="w-full text-left">
                    {/* Tab for the current table */}
                    <Tabs.TabPane tab="Tabular Results" key="1">
                        <Table
                            dataSource={executedQueryData}
                            columns={executedColumns}
                            bordered
                            size="small"
                            pagination={{ pageSize: 4, hideOnSinglePage: true }}
                        />
                    </Tabs.TabPane>

                    {/* Tab for executed queries and results */}
                    <Tabs.TabPane tab="FlockMTL Query" key="2">
                        <pre
                            style={{
                                backgroundColor: "#f4f4f4",
                                padding: "10px",
                                borderRadius: "5px",
                                whiteSpace: "pre-wrap",
                                wordWrap: "break-word",
                                fontSize: "14px",
                                color: "#333",
                                overflowX: "auto", // Ensures horizontal scrolling if needed
                            }}
                        >
                            <code>
                                {`SELECT 
    Author, 
    Bank, 
    Date, 
    Review, 
    llm_complete_json(
        {'model_name': 'gpt-4o-mini'}, 
        {'prompt': 'Give a severity score for each technical issue'}, 
        {'Review': Review}
    ) AS Severity_score 
FROM reviews 
WHERE llm_filter(
    {'model_name': 'gpt-4o-mini'}, 
    {'prompt': 'List reviews mentioning technical issues'}, 
    {'Review': Review}
);`}
                            </code>
                        </pre>

                    </Tabs.TabPane>
                </Tabs>
            </>
            )}
        </div>
    );
}
