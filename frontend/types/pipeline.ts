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

export interface Pipeline {
  prompt: string;
  prompt_expansion: string[];
  data_filtering: DataFiltering;
  insights_extraction: InsightsExtraction;
  final_results: FinalResults;
}
