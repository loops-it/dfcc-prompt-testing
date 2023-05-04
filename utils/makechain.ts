import { OpenAIChat } from 'langchain/llms';
import { Configuration, OpenAIApi } from "openai";
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from 'langchain/chains';
import { PineconeStore } from 'langchain/vectorstores';
import { PromptTemplate } from 'langchain/prompts';
import { CallbackManager } from 'langchain/callbacks';
import { BaseMemory, BufferMemory } from 'langchain/dist/memory';
import { ConversationChain } from 'langchain/dist/chains/llm_chain';
// import { BaseMemory } from 'langchain/dist/memory';

// const { BufferMemory } = require("langchain/memory");



// You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided.
// You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.

// If you can't find the answer in the context below, just say "Hmm, I'm not sure." Do NOT try to make up an answer.
// If the question is a polite greeting politely respond with suitable greeting OR If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.


// Chat History:
// {chat_history}
const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following follow up question. 

Follow Up Input: {question}
Standalone question:`);


// const QA_PROMPT = PromptTemplate.fromTemplate(
//   `You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided.
//   You should only use hyperlinks as references that are explicitly listed as a source in the context below. Do NOT make up a hyperlink that is not listed below.

//   If you can not find the answer in the context below, just say "Hmm, I'm not sure." Do NOT try to make up an answer.
//   If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the DFCC bank.

// Question: {question}
// =========
// {context}
// =========
// Answer in Markdown:`,
// );

const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an Friendly assistant providing helpful response. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided.
  You should only use hyperlinks as references that are explicitly listed as a source in the context below. Do NOT make up a hyperlink that is not listed below.

  If the question contain greeting reply with matching greeting even if middle or end of the conversation.
  If you can not find the answer in the context below, just say "Hmm, I'm not sure." Do NOT try to make up an answer.
  If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the DFCC bank.

Question: {question}
=========
{context}
=========
Answer in Markdown:`,
);



export const makeChain = (
  vectorstore: PineconeStore,
  onTokenStream?: (token: string) => void,
) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
    // memory: BaseMemory,
  });
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
      verbose: true,
      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
            async handleLLMNewToken(token) {
              onTokenStream(token);
              console.log(token);
            },
          })
        : undefined,
    }),
    { prompt: QA_PROMPT },
  );

  console.log(QA_PROMPT)
  const chatVectorDBQAChain = new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 2, //number of source documents to return
  });

  return chatVectorDBQAChain
};













































// const greetingChain = new RuleBasedChain({
//   name: "greetingChain",
//   rules: [
//     {
//       pattern: /hello|hi|hey/i,
//       response: "Hello, how can I assist you today?",
//     },
//     {
//       pattern: /how are you|how are things/i,
//       response: "I'm doing well, thank you for asking. How can I help you?",
//     },
//     {
//       pattern: /what's up|what's new/i,
//       response: "Not much, just here to help you with your questions.",
//     },
//   ],
// });


// const CONDENSE_PROMPT =
//   PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

// Chat History:
// {chat_history}
// Follow Up Input: {question}
// Standalone question:`);

// const QA_PROMPT = PromptTemplate.fromTemplate(
//   `You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided.
//   You should only use hyperlinks as references that are explicitly listed as a source in the context below. Do NOT make up a hyperlink that is not listed below.

//   If you can't find the answer in the context below, just say "Hmm, I'm not sure." Don't try to make up an answer.
//   If the question is not related to the context provided, politely inform them that you are tuned to only answer questions that are related to DFCC bank.

// Question: {question}
// =========
// {context}
// =========
// Answer in Markdown:`,
// );



// export const makeChain = (
//   vectorstore: PineconeStore,
//   onTokenStream?: (token: string) => void,
// ) => {
//   const questionGenerator = new LLMChain({
//     llm: new OpenAIChat({ temperature: 0 }),
//     prompt: CONDENSE_PROMPT,
//   });
//   const docChain = loadQAChain(
//     new OpenAIChat({
//       temperature: 0,
//       modelName: 'gpt-3.5-turbo',
//       streaming: Boolean(onTokenStream),
//       callbackManager: onTokenStream
//         ? CallbackManager.fromHandlers({
//             async handleLLMNewToken(token) {
//               onTokenStream(token);
//               console.log(token);
//             },
//           })
//         : undefined,
//     }),
//     { prompt: QA_PROMPT },
//   );

//   const chatVectorDBQAChain = new ChatVectorDBQAChain({
//     vectorstore,
//     combineDocumentsChain: docChain,
//     questionGeneratorChain: questionGenerator,
//     returnSourceDocuments: true,
//     k: 2,
//   }, any );

//   return chatVectorDBQAChain
// };