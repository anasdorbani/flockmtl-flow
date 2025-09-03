import { Position } from '@xyflow/react';
import { Operator, Pipeline } from '@/../types/pipeline';
import ScalarFunctionNode from './ScalarFunctionNode';
import OperatorNode from './OperatorNode';
import ResultsNode from './ResultsNode';
import PromptNode from './PromptNode';
import QueryNode from './QueryNode';

export function BuildNodesAndEdges(promptData: { prompt: string, query: string, table: any[], execution_time: number }, pipeline: Pipeline, handleInputChange: (operatorId: number, field: string, value: any, type?: string) => void) {
  const nodes: any[] = [];
  const edges: any[] = [];
  const positionX = 300;
  const positionY = 0;
  let idLastChild = 0;
  let lastPositionX = 0;

  const createNode = (operator: Operator, positionX: number, positionY: number) => {
    return {
      id: `${operator.id}`,
      position: { x: positionX, y: positionY },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      className: 'w-auto h-auto min-w-[200px] max-w-[400px]',
      data: {
        label: operator.is_function ?
          (
            <ScalarFunctionNode operator={operator} handlePipelineInputChange={handleInputChange} />
          ) : operator.data ?
            (
              <ResultsNode operator={operator} />
            ) :
            operator.name === "User Prompt" ?
              (
                <PromptNode operator={operator} />
              ) :
              operator.name === "Query" ?
                (
                  <QueryNode operator={operator} />
                )
                :
                (
                  <OperatorNode operator={operator} />
                ),
      },
    }
  };

  const processPipeline = (currentOperator: Operator, positionX: number, positionY: number) => {
    if (idLastChild < currentOperator.id) idLastChild = currentOperator.id;
    nodes.push(createNode(currentOperator, positionX, positionY));

    if (currentOperator.children && currentOperator.children.length > 0) {
      const numberOfChildren = currentOperator.children.length;
      let tanslationIndex = (numberOfChildren - 1) / 2;
      const translationConstant = 300;

      let childX = positionX + 300;
      if (lastPositionX < childX) lastPositionX = childX;
      let childY = positionY + tanslationIndex * translationConstant;
      currentOperator.children.forEach((child: Operator) => {
        edges.push({
          id: `e${currentOperator.id}-${child.id}`,
          source: `${currentOperator.id}`,
          target: `${child.id}`,
          animated: true
        });
        processPipeline(child, childX, childY);
        childY -= translationConstant;
      });
    }
  };

  const initialOperator: Operator = {
    id: -1,
    name: "User Prompt",
    description: promptData.prompt || "", // Ensure we have a fallback
    is_function: false,
    params: {},
    children: [
      {
        id: 0,
        name: "Query",
        description: promptData.query || "", // Ensure we have a fallback
        is_function: false,
        params: {},
        children: [pipeline],
      },
    ],
  };

  processPipeline(initialOperator, positionX, positionY);
  edges.push({
    id: `e${idLastChild}-${idLastChild + 1}`,
    source: `${idLastChild}`,
    target: `${idLastChild + 1}`,
    animated: true
  });

  const resultsNode: Operator = {
    id: idLastChild + 1,
    name: "Results",
    description: "",
    is_function: false,
    params: {},
    metrics: {
      execution_time: promptData.execution_time,
    },
    children: [],
    data: promptData.table,
  };

  nodes.push(createNode(resultsNode, lastPositionX + 300, positionY));

  return { Nodes: nodes, Edges: edges };
}
