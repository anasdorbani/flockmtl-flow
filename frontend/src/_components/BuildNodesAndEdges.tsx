import { Position } from '@xyflow/react';
import { Operator, Pipeline } from '@/../types/pipeline';
import ScalarFunctionNode from './ScalarFunctionNode';
import OperatorNode from './OperatorNode';
import ResultsNode from './ResultsNode';

export function BuildNodesAndEdges(pipeline: Pipeline, handleInputChange: (operatorId: number, field: string, value: any, type?: string) => void) {
  const nodes: any[] = [];
  const edges: any[] = [];
  const positionX = 250;
  const positionY = 0;

  const createNode = (operator: Operator, positionX: number, positionY: number) => {
    return {
      id: `${operator.id + 1}`,
      position: { x: positionX, y: positionY },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        label: operator.is_function ?
          (
            <ScalarFunctionNode operator={operator} handlePipelineInputChange={handleInputChange} />
          ) : operator.data ?
            (
              <ResultsNode operator={operator} />
            ) :
            (
              <OperatorNode operator={operator} />
            ),
      },
    }
  };

  const processPipeline = (currentOperator: Operator, positionX: number, positionY: number) => {
    nodes.push(createNode(currentOperator, positionX, positionY));

    if (currentOperator.children && currentOperator.children.length > 0) {
      const numberOfChildren = currentOperator.children.length;
      let tanslationIndex = (numberOfChildren - 1) / 2;
      const translationConstant = 250;

      let childX = positionX + 250;
      let childY = positionY + tanslationIndex * translationConstant;
      currentOperator.children.forEach((child: Operator) => {
        edges.push({
          id: `e${currentOperator.id + 1}-${child.id + 1}`,
          source: `${currentOperator.id + 1}`,
          target: `${child.id + 1}`,
          animated: true
        });
        processPipeline(child, childX, childY);
        childY -= translationConstant;
      });
    }
  };

  processPipeline(pipeline, positionX, positionY);

  return { Nodes: nodes, Edges: edges };
}
