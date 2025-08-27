"use client";
import { useState } from "react";
import { Layout, Button, Modal } from 'antd';
const { Header, Content, Footer } = Layout;
import Image from 'next/image';
import NodesView from "@/_components/NodesView";
import AskBar from "@/_components/AskBar";
import DataManager from "@/_components/DataManager";
import TableSelector from "@/_components/TableSelector";
import axios from "axios";
import { Pipeline } from "@/../types/pipeline";
import LoadingAnimation from "@/_components/LoadingAnimation";
import HeroSection from "@/_components/HeroSection";
import { FaGithub } from "react-icons/fa";
import { SiGoogledocs } from "react-icons/si";
import { DatabaseOutlined, ExclamationCircleOutlined, ReloadOutlined } from "@ant-design/icons";
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
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [showDataManager, setShowDataManager] = useState(false);
  const [tableRefreshTrigger, setTableRefreshTrigger] = useState(0);

  const [isGeneratingResponseTable, setIsGeneratingResponseTable] = useState(false);
  const [isRegeneratingResponseTable, setIsRegeneratingResponseTable] = useState(false);
  const [isGeneratingQueryPlan, setIsGeneratingQueryPlan] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [regenerationError, setRegenerationError] = useState<string | null>(null);
  const [initialGenerationError, setInitialGenerationError] = useState<string | null>(null);

  const generateResponseTable = async (prompt: string, selectedTables?: string[]) => {
    setIsGeneratingResponseTable(true);
    setIsResponseTableReady(false);
    setInitialGenerationError(null);
    return axios.post('/api/generate-response-table', { prompt, selected_tables: selectedTables || [] })
      .then((response) => {
        setPromptData(response.data);
        setIsGeneratingResponseTable(false);
        setIsResponseTableReady(true);
      })
      .catch((error) => {
        setIsGeneratingResponseTable(false);
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to generate response table';
        setInitialGenerationError(errorMessage);
        console.error('Generate response table error:', error);
      })
  };

  const regenerateResponseTable = async (prompt: string, query: string) => {
    setIsRegeneratingResponseTable(true);
    setRegenerationError(null);
    return axios.post('/api/regenerate-response-table', { prompt, generated_query: query, selected_tables: selectedTables })
      .then((response) => {
        setPromptData(response.data);
        setIsRegeneratingResponseTable(false);
      })
      .catch((error) => {
        setIsRegeneratingResponseTable(false);
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to regenerate response table';
        setRegenerationError(errorMessage);
        console.error('Regenerate response table error:', error);
        throw error; // Re-throw so ResponseTableSection can handle it
      })
  };

  const generateQueryPlan = async (query: string) => {
    setIsGeneratingQueryPlan(true);
    return axios.post('/api/generate-query-plan', { query })
      .then((response) => {
        setPipelineData(response.data.pipeline);
        setIsGeneratingQueryPlan(false);
        setShowPlan(true);
      })
      .catch((error) => {
        setIsGeneratingQueryPlan(false);
        console.error('Generate query plan error:', error);
        // You could add a query plan error state here if needed
      })
  }

  const handleClearPipeline = () => {
    window.location.reload();
  };

  const handleTablesUpdate = () => {
    setTableRefreshTrigger(prev => prev + 1);
  };

  const focusTableSelector = () => {
    const el = document.getElementById('table-selector');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#FF9129]', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-[#FF9129]', 'ring-offset-2'), 1200);
    }
  };

  return (
    <Layout
      className="max-w-screen-2xl mx-auto h-screen animate-fadeIn"
      style={{ backgroundColor: '#ffffff' }}
    >
      <Header
        className="flex justify-between items-center px-4 md:px-8 lg:px-16 animate-slideInRight"
        style={{
          height: 'auto',
          minHeight: '80px',
          padding: '12px',
          backgroundColor: '#ffffff'
        }}
      >
        <div className="font-bold text-lg md:text-xl flex gap-2 items-center cursor-pointer transition-all duration-300 hover:scale-105" onClick={handleClearPipeline}>
          <Image src="/flockmtl-square-logo.svg" alt="FlockMTL" width={32} height={32} />
          <span className="hidden sm:inline">FlockMTL</span>
        </div>
        <div className="flex gap-2">
          <Button
            className="header-button font-bold"
            onClick={() => setShowDataManager(true)}
            icon={<DatabaseOutlined />}
            size="large"
            style={{ borderRadius: 'var(--border-radius-xl)' }}
          >
            <span className="hidden sm:inline">Manage Data</span>
          </Button>
          <Button
            className="header-button font-bold"
            href="https://dais-polymtl.github.io/flockmtl/docs/what-is-flockmtl"
            icon={<SiGoogledocs />}
            target="_blank"
            size="large"
            style={{ borderRadius: 'var(--border-radius-xl)' }}
          >
            <span className="hidden sm:inline">Docs</span>
          </Button>
          <Button
            className="header-button text-xl"
            href="https://github.com/dais-polymtl/flockmtl"
            icon={<FaGithub />}
            target="_blank"
            size="large"
            style={{ borderRadius: 'var(--border-radius-xl)' }}
          />
        </div>
      </Header>

      <Content
        className="flex-1 overflow-hidden"
        style={{
          backgroundColor: '#ffffff',
          padding: 0,
        }}
      >
        <div className="h-full flex flex-col">
          {showPlan ? (
            <div className="flex-1 p-4 md:p-8 animate-fadeInUp">
              <NodesView
                pipeline={pipelineData}
                setShowPlan={setShowPlan}
                promptData={promptData}
                setPromptData={setPromptData}
                setPipeline={setPipelineData}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 p-4 md:p-8 overflow-auto">
                {isResponseTableReady ? (
                  <div className="animate-fadeInUp">
                    <ResponseTableSection
                      promptData={promptData}
                      setPromptData={setPromptData}
                      isGeneratingQueryPlan={isGeneratingQueryPlan}
                      isRegeneratingResponseTable={isRegeneratingResponseTable}
                      generateQueryPlan={generateQueryPlan}
                      regenerateResponseTable={regenerateResponseTable}
                      regenerationError={regenerationError}
                    />
                  </div>
                ) : isGeneratingResponseTable ? (
                  <div className="flex justify-center items-center h-full">
                    <LoadingAnimation />
                  </div>
                ) : initialGenerationError ? (
                  <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto animate-fadeInUp">
                    <div className="w-full max-w-2xl space-y-6">
                      <HeroSection />
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-100 rounded-xl">
                            <ExclamationCircleOutlined className="text-red-600 text-lg" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-800 mb-2">
                              Query Generation Failed
                            </h3>
                            <p className="text-red-700 mb-4">
                              {initialGenerationError}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                  setInitialGenerationError(null);
                                }}
                                className="rounded-xl"
                                style={{
                                  background: 'linear-gradient(135deg, #FF9129 0%, #CC5500 100%)',
                                  borderColor: 'transparent'
                                }}
                              >
                                Try Again
                              </Button>
                              <Button
                                onClick={() => setInitialGenerationError(null)}
                                className="rounded-xl"
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto animate-fadeInUp">
                    <div className="flex-1 flex items-center justify-center w-full">
                      <HeroSection />
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky footer for AskBar */}
              <div
                className="animate-slideInRight"
                style={{
                  padding: '16px',
                  animationDelay: '0.5s',
                  backgroundColor: '#ffffff',
                }}
              >
                <div className="max-w-4xl mx-auto">
                  <AskBar
                    onSend={generateResponseTable}
                    loading={isGeneratingResponseTable}
                    disabled={selectedTables.length === 0}
                    placeholder={selectedTables.length
                      ? `Ask questions about your ${selectedTables.length} selected table${selectedTables.length > 1 ? 's' : ''}...`
                      : 'Select tables and ask a question…'}
                    selectedTables={selectedTables}
                    onTablesChange={setSelectedTables}
                    tableRefreshTrigger={tableRefreshTrigger}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Content>

      <Modal
        title={<span className="text-lg font-semibold">Data Management</span>}
        open={showDataManager}
        onCancel={() => setShowDataManager(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: '1000px' }}
        destroyOnClose
        className="animate-fadeIn flock-modal"
        styles={{
          header: {
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '16px'
          },
          body: { padding: '24px' }
        }}
      >
        <DataManager onTablesUpdate={handleTablesUpdate} />
      </Modal>
    </Layout>
  );
}
