//this is an agent which would be taking our ticket and provide to the llm model with the details and prompt etc

//createAgent is used to create the ai agent and gemini is the llm to which it would interact with the ticket we provided
import { createAgent,gemini } from "@inngest/agent-kit";

//code is present in the agentkit by inngest website 

const analyzeTicket = async(ticket)=>{ //provides ticket to llm model via this agent
    const supportAgent = createAgent({ //creating an agent which provides the ticket we raised to the llm model gemini here
        model: gemini({
            model: "gemini-1.5-flash-8b",
            apiKey: process.env.GEMINI_API_KEY,
        }),
        name:"AI Ticket Triage Assistant", //name of the agent 
        //very very Important. this is a prompt used to setting up the llm model. ie, we usually do like providing prompt as 'consider you are tech enthusiast' 
        //hence this would be the setting up like the role provided to the llm to do.
        system:`You are an expert AI assistant that processes technical support tickets. 

Your job is to:
1. Summarize the issue.
2. Estimate its priority.
3. Provide helpful notes and resource links for human moderators.
4. List relevant technical skills required.

IMPORTANT:
- Respond with *only* valid raw JSON.
- Do NOT include markdown, code fences, comments, or any extra formatting.
- The format must be a raw JSON object.

Repeat: Do not wrap your output in markdown or code fences.`
    })

    //in here inside run, we provide our balance prompt, like i need to learn web dev etc... really what to do by the llm
    const response = await supportAgent.run(`You are a ticket triage agent. Only return a strict JSON object with no extra text, headers, or markdown.
        
Analyze the following support ticket and provide a JSON object with:

- summary: A short 1-2 sentence summary of the issue.
- priority: One of "low", "medium", or "high".
- helpfulNotes: A detailed technical explanation that a moderator can use to solve this issue. Include useful external links or resources if possible.
- relatedSkills: An array of relevant skills required to solve the issue (e.g., ["React", "MongoDB"]).

Respond ONLY in this JSON format and do not include any other text or markdown in the answer:

{
"summary": "Short summary of the ticket",
"priority": "high",
"helpfulNotes": "Here are useful tips...",
"relatedSkills": ["React", "Node.js"]
}

---

Ticket information:

- Title: ${ticket.title}
- Description: ${ticket.description}`)

//there may be multiple resonses, so select the first one
const raw_response = response.output[0].context

// the response would be like this here as we gave it should be json:
/*
```json
{
 .......real content
}
 ``````
*/
//so we need to remove that unwanted parts, done below in tryL
try {

    //checking if the output provided matches like the structure provided above
    const match = raw_response.match(/```json\s*([\s\S]*?)\s*```/i);
    /*we may get both way, sometimes may get as normal json, so we looked if the response matches the structure as above, 
    if so take the 2nd one(our real content),else would be proper json repsonse , if so just trim it*/
    const jsonString = match ? match[1] : raw_response.trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.log("Failed to parse JSON from AI response" + e.message);
    return null; // watch out for this. means if any error, provide null, ie no value for the request to llm hence, provide empty
  }

}

export default analyzeTicket