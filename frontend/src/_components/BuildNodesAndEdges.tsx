
import UserPrompt from './UserPrompt';
import PromptExpansion from './PromptExpansion';
import DataFiltering from './DataFiltering';
import InsightsExtraction from './InsightsExtraction';
import FinalResults from './FinalResults';
import { Position } from '@xyflow/react';
import { Pipeline } from '../../types/pipeline';

export function BuildNodesAndEdges(pipeline: Pipeline, setPipeline: any) {

  const Nodes = [
    {
      id: "1",
      position: { x: 0, y: 0 },
      data: {
        label: <UserPrompt prompt={pipeline.prompt} setPrompt={(prompt: string) => setPipeline({ ...pipeline, prompt })} />,
      },
      type: "input",
      sourcePosition: Position.Right,
    },
    {
      id: "2",
      position: { x: 250, y: 0 },
      data: {
        label: (
          <PromptExpansion
            prompts={pipeline.prompt_expansion}
            setPrompts={(prompts: string[]) => setPipeline({ ...pipeline, prompt_expansion: prompts })}
          />
        ),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "3",
      position: { x: 500, y: 0 },
      data: {
        label: (
          <DataFiltering
            prompt={pipeline.data_filtering.prompt}
            query={pipeline.data_filtering.query}
            setFilteringData={(prompt: string, query: string) => setPipeline({ ...pipeline, data_filtering: { prompt, query } })}
          />
        ),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "4",
      position: { x: 750, y: 0 },
      data: {
        label: (
          <InsightsExtraction
            prompt={pipeline.insights_extraction.prompt}
            query={pipeline.insights_extraction.query}
            setInsightsExtractionData={(prompt: string, query: string) => setPipeline({ ...pipeline, insights_extraction: { prompt, query } })}
          />
        ),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "5",
      position: { x: 1000, y: 0 },
      data: {
        label: <FinalResults results={pipeline.final_results} />,
      },
      targetPosition: Position.Left,
      type: "output",
    },
  ];
  const Edges = [
    { id: "e1-2", source: "1", target: "2", animated: true },
    { id: "e2-3", source: "2", target: "3", animated: true },
    { id: "e3-4", source: "3", target: "4", animated: true },
    { id: "e4-5", source: "4", target: "5", animated: true },
  ];
  return { Nodes, Edges };

}
