export interface Movement {
  id: string;
  num: string;
  cjk: string;
  pinyin: string;
  en: string;
  tone: 'paper' | 'ink';
  cycle: number;
  breath: number;
  cue: string;
  steps: string[];
  benefit: string;
  startSeconds: number;
  endSeconds: number;
}
