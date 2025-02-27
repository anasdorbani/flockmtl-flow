"use client";
import { useState } from "react";
import { Layout } from 'antd';
const { Header, Content, Footer } = Layout;
import Image from 'next/image';
import NodesView from "@/_components/NodesView";
import AskBar from "@/_components/AskBar";
import axios from "axios";
import { Pipeline } from "../../types/pipeline";
import LoadingAnimation from "@/_components/LoadingAnimation";
import HeroSection from "@/_components/HeroSection";

export default function Home() {
  const [pipelineData, setPipelineData] = useState<Pipeline>({
    prompt: "",
    prompt_expansion: [],
    data_filtering: { prompt: "", query: "" },
    insights_extraction: { prompt: "", query: "" },
    final_results: { data: {}, summary: "" },
  });
  const [isPipelineReady, setIsPipelineReady] = useState(false);

  const [isGeneratingPipeline, setIsGeneratingPipeline] = useState(false);

  const handlePipelineConstruction = async (prompt: string) => {
    setIsGeneratingPipeline(true);
    setIsPipelineReady(false);
    return axios.post('/api/generate-pipeline', { prompt })
      .then((response) => {
        setPipelineData(response.data);
        setIsPipelineReady(true);
        setIsGeneratingPipeline(false);
      })
      .catch(() => {
        setIsGeneratingPipeline(false);
      })
  };

  const handleClearPipeline = () => {
    setIsPipelineReady(false);
  };

  return (
    <Layout
      className="max-w-screen-2xl mx-auto"
    >
      <Header style={{
        height: '120px',
        backgroundColor: '#ffffff',
      }}
        className="flex justify-between items-center px-16"
      >
        <div className="font-bold text-xl flex gap-2 items-center cursor-pointer" onClick={handleClearPipeline}>
          <Image src="/flockmtl-square-logo.svg" alt="FlockMTL" width={32} height={32} />
          FlockMTL Flow
        </div>
      </Header>
      <Content className="px-16 pt-8 flex items-center justify-center" style={{
        height: 'calc(100vh - 120px - 192px)',
        overflow: 'auto',
        backgroundColor: '#ffffff',
      }}>
        {isPipelineReady ? (
          <NodesView initialPipeline={pipelineData} handleClearPipeline={handleClearPipeline} />
        ) : (

          isGeneratingPipeline ? (
            <LoadingAnimation />
          ) : (
            <HeroSection />
          )
        )}
      </Content>
      <Footer className="flex items-end justify-center" style={{
        height: '192px',
        backgroundColor: '#ffffff',
      }}>
        <div className="md:w-1/2 w-full p-4">
          <AskBar onSend={handlePipelineConstruction} loading={isGeneratingPipeline} />
        </div>
      </Footer>
    </Layout>
  );
}
