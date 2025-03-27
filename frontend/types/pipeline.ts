interface DataFiltering {
  prompt: string;
  query: string;
}

interface InsightsExtraction {
  prompt: string;
  query: string;
}

interface FinalResults {
  data: object;
  summary: string;
}

export interface Operator {
  id: number
  name: string;
  description: string;
  metrics?: {
    execution_time: number;
  };
  is_function: boolean;
  params?: {
    model_name: string;
    prompt: string;
    input_columns: string[];
    batch_size?: number;
    tuple_format?: string;
  } | {};
  children: Operator[];
  data?: object;
}

export type Pipeline = Operator;
