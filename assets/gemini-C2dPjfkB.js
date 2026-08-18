import{g as e}from"./index-BsdkXtBY.js";var t=`AIzaSyDQgkV9ZHmLWHVJz8viIjBrvCfhW_mhs3Y`,n=`https://generativelanguage.googleapis.com/v1beta/models`;function r(e,t){return`Você é um assistente de atendimento ao cliente via WhatsApp.

PERSONALIDADE: ${e.personality}

INSTRUÇÕES: ${e.instructions}

CONTEXTO DA EMPRESA: ${e.context}

BASE DE CONHECIMENTO:
${t}

REGRAS:
1. Responda sempre em português brasileiro.
2. Seja objetivo e profissional.
3. Se não souber a resposta, indique que vai transferir para um atendente humano.
4. Classifique o sentimento da mensagem (positivo, neutro, negativo).
5. Identifique a intenção principal (dúvida, reclamação, compra, suporte, etc).
6. Retorne sua resposta no formato JSON: { "reply": "...", "sentiment": "...", "intent": "...", "confidence": 0.0-1.0, "shouldTransfer": false, "suggestedDepartment": "" }`}async function i(e,r,i,a,o){let s=[{role:`user`,parts:[{text:r}]},...i.map(e=>({role:e.role===`assistant`?`model`:`user`,parts:[{text:e.text}]}))],c=await fetch(`${n}/${e}:generateContent?key=${t}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:s,generationConfig:{temperature:a,maxOutputTokens:o,responseMimeType:`application/json`}})});if(!c.ok){let e=await c.text();throw console.error(`Gemini API error:`,e),Error(`Gemini API error: ${c.status}`)}let l=(await c.json()).candidates?.[0]?.content?.parts?.[0]?.text??`{}`;try{let e=JSON.parse(l);return{reply:e.reply??``,sentiment:e.sentiment,intent:e.intent,confidence:e.confidence,shouldTransfer:e.shouldTransfer??!1,suggestedDepartment:e.suggestedDepartment}}catch{return{reply:l,sentiment:`neutro`,confidence:.5}}}async function a(t){let{data:n}=await e().from(`ai_configs`).select(`*`).eq(`company_id`,t).single();return n}async function o(t,n){let{data:r,error:i}=await e().from(`ai_configs`).upsert({company_id:t,...n},{onConflict:`company_id`}).select().single();if(i)throw i;return r}async function s(t){let{data:n,error:r}=await e().from(`ai_knowledge_base`).select(`*`).eq(`company_id`,t).eq(`active`,!0).order(`category`);if(r)throw r;return n??[]}async function c(t,n){let r=e(),i={company_id:t,...n},{data:a,error:o}=n.id?await r.from(`ai_knowledge_base`).update(i).eq(`id`,n.id).select().single():await r.from(`ai_knowledge_base`).insert(i).select().single();if(o)throw o;return a}async function l(t){let{error:n}=await e().from(`ai_knowledge_base`).update({active:!1}).eq(`id`,t);if(n)throw n}async function u(t,n=50){let{data:r,error:i}=await e().from(`ai_usage_logs`).select(`*`).eq(`company_id`,t).order(`created_at`,{ascending:!1}).limit(n);if(i)throw i;return r??[]}async function d(t){let{data:n,error:r}=await e().from(`ai_usage_logs`).select(`action, input_tokens, output_tokens`).eq(`company_id`,t);if(r)throw r;let i=n??[],a=i.reduce((e,t)=>e+(t.input_tokens??0)+(t.output_tokens??0),0),o={};for(let e of i)o[e.action]=(o[e.action]??0)+1;return{totalInteractions:i.length,totalTokens:a,byAction:o}}async function f(t,n,r,i,a,o){await e().from(`ai_usage_logs`).insert({company_id:t,conversation_id:r,action:n,input_tokens:i,output_tokens:a,model:o})}async function p(e,t,n){let o=await a(e);if(!o?.enabled)throw Error(`IA não habilitada para esta empresa`);let c=r(o,(await s(e)).map(e=>`[${e.category}] ${e.title}: ${e.content}`).join(`
`)),l=await i(o.model,c,n,o.temperature,o.max_tokens);return await f(e,`suggestion`,t,n.length*50,l.reply.length,o.model),l}export{s as a,c,d as i,a as n,p as o,u as r,o as s,l as t};