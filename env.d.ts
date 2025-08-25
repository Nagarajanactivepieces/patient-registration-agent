/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY?: string;
  }
}
