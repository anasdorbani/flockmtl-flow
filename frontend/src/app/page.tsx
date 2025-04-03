"use client";
import { useState } from "react";
import { Layout, Button } from 'antd';
const { Header, Content, Footer } = Layout;
import Image from 'next/image';
import NodesView from "@/_components/NodesView";
import AskBar from "@/_components/AskBar";
import axios from "axios";
import { Pipeline } from "@/../types/pipeline";
import LoadingAnimation from "@/_components/LoadingAnimation";
import HeroSection from "@/_components/HeroSection";
import { FaGithub } from "react-icons/fa";
import { SiGoogledocs } from "react-icons/si";
import ResponseTableSection from "@/_components/ResponseTableSection";

export default function Home() {
  const [pipelineData, setPipelineData] = useState<Pipeline>({
    id: 0,
    name: "",
    description: "",
    is_function: false,
    params: {},
    children: [],
  });
  const [isResponseTableReady, setIsResponseTableReady] = useState(false);
  const [promptData, setPromptData] = useState({
    prompt: "",
    query: "",
    table: [],
    execution_time: 0,
  })

  const [isGeneratingResponseTable, setIsGeneratingResponseTable] = useState(false);
  const [isRegeneratingResponseTable, setIsRegeneratingResponseTable] = useState(false);
  const [isGeneratingQueryPlan, setIsGeneratingQueryPlan] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  const generateResponseTable = async (prompt: string) => {
    setIsGeneratingResponseTable(true);
    setIsResponseTableReady(false);
    return axios.post('/api/generate-response-table', { prompt })
      .then((response) => {
        setPromptData(response.data);
        setIsGeneratingResponseTable(false);
        setIsResponseTableReady(true);
      })
      .catch(() => {
        setIsGeneratingResponseTable(false);
      })
  };

  const regenerateResponseTable = async (prompt: string, query: string) => {
    setIsRegeneratingResponseTable(true);
    return axios.post('/api/regenerate-response-table', { prompt, generated_query: query })
      .then((response) => {
        setPromptData(response.data);
        setIsRegeneratingResponseTable(false);
      })
      .catch(() => {
        setIsRegeneratingResponseTable(false);
      }
      )
  };

  const generateQueryPlan = async (query: string) => {
    setIsGeneratingQueryPlan(true);
    return axios.post('/api/generate-query-plan', { query })
      .then((response) => {
        setPipelineData(response.data.pipeline);
        setIsGeneratingQueryPlan(false);
        setShowPlan(true);

        console.log(response.data.pipeline);
      })
      .catch(() => {
        setIsGeneratingQueryPlan(false);
      })
  }

  const handleClearPipeline = () => {
    window.location.reload();
  };

  return (
    <Layout
      className="max-w-screen-2xl mx-auto h-screen"
    >
      <Header style={{
        height: '120px',
        backgroundColor: '#ffffff',
      }}
        className="flex justify-between items-center px-16"
      >
        <div className="font-bold text-xl flex gap-2 items-center cursor-pointer" onClick={handleClearPipeline}>
          <Image src="/flockmtl-square-logo.svg" alt="FlockMTL" width={32} height={32} />
          FlockMTL
        </div>
        <div className="flex gap-2">
          <Button className="rounded-full text-xl" href="#" icon={<FaGithub />} target="_blank" />
          <Button className="rounded-full font-bold" href="#" icon={<SiGoogledocs />} target="_blank">
            Docs
          </Button>
        </div>
      </Header>
      <Content className="px-16 pb-8 pt-8 flex items-center justify-center" style={{
        height: isResponseTableReady || showPlan ? `calc(100vh - 120px)` : `calc(100vh - 120px - 192px)`,
        overflow: 'auto',
        backgroundColor: '#ffffff',
      }}>
        {showPlan ? (
          <NodesView pipeline={pipelineData} setShowPlan={setShowPlan} promptData={promptData} setPromptData={setPromptData} setPipeline={setPipelineData} />
        ) : (
          isResponseTableReady ? (
            <ResponseTableSection promptData={promptData} setPromptData={setPromptData} isGeneratingQueryPlan={isGeneratingQueryPlan} isRegeneratingResponseTable={isRegeneratingResponseTable} generateQueryPlan={generateQueryPlan} regenerateResponseTable={regenerateResponseTable} />
          ) : (
            isGeneratingResponseTable ? (
              <LoadingAnimation />
            ) : (
              <HeroSection />
            ))
        )}
      </Content>
      {!isResponseTableReady && (
        <Footer className="flex items-end justify-center" style={{
          height: '192px',
          backgroundColor: '#ffffff',
        }}>

          <div className="md:w-1/2 w-full p-4">
            <AskBar onSend={generateResponseTable} loading={isGeneratingResponseTable} />
          </div>
        </Footer>
      )}
    </Layout>
  );
}
