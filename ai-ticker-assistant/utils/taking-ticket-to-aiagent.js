//this is an agent which would be taking our ticket and provide to the llm model with the details and prompt etc

//createAgent is used to create the ai agent and gemini is the llm to which it would interact with the ticket we provided
import { createAgent, gemini } from "@inngest/agent-kit";

//code is present in the agentkit by inngest website

const analyzeTicket = async (ticket) => {
  //provides ticket to llm model via this agent
  const supportAgent = createAgent({
    //creating an agent which provides the ticket we raised to the llm model gemini here
    model: gemini({
      model: "gemini-1.5-flash-8b",
      apiKey: process.env.GEMINI_API_KEY,
    }),
    name: "AI Ticket Triage Assistant", //name of the agent
    //very very Important. this is a prompt used to setting up the llm model. ie, we usually do like providing prompt as 'consider you are tech enthusiast'
    //hence this would be the setting up like the role provided to the llm to do.
    system: `You are an expert AI assistant that processes technical support tickets. 

Your job is to:
1. Summarize the issue.
2. Estimate its priority.
3. Provide helpful notes and resource links for human moderators.
4. List relevant technical skills required.

Always respond with properly formatted JSON wrapped in markdown code fences.`,
  });

  //in here inside run, we provide our balance prompt, like i need to learn web dev etc... really what to do by the llm
  const response =
    await supportAgent.run(`Analyze the following support ticket and provide a JSON response:

{
  "summary": "Short summary of the ticket",
  "priority": "low|medium|high", 
  "helpfulNotes": "Detailed technical explanation with resources",
  "relatedSkills": ["Skill1", "Skill2"]
}

Ticket information:
- Title: ${ticket.title}
- Description: ${ticket.description}`);

  //there may be multiple resonses, so select the first one
  const raw_response = response.output[0].content;
  console.log("LLM raw response was:\n", raw_response);

  // the response would be like this here as we gave it should be json:
  /*
```json
{
 .......real content
}
 ``````
*/
  //   //so we need to remove that unwanted parts, done below in tryL
  //   try {
  //     //checking if the output provided matches like the structure provided above
  //     const match = raw_response.match(/```json([\s\S]*?)```/);
  //     /*we may get both way, sometimes may get as normal json, so we looked if the response matches the structure as above,
  //     if so take the 2nd one(our real content),else would be proper json repsonse , if so just trim it*/
  //     const jsonString = match ? match[1] : raw_response.trim();
  //     return JSON.parse(jsonString);
  //   } catch (e) {
  //     try {
  //       // Fallback: Try parsing the raw string directly
  //       return JSON.parse(raw_response);
  //     } catch (err2) {
  //       console.error("Final fallback parsing failed: ", err2.message);
  //       return null; // watch out for this. means if any error, provide null, ie no value for the request to llm hence, provide empty
  //     }
  //   }
  // };

  try {
    // Improved JSON extraction
    let jsonString = raw_response.trim();

    // Remove markdown code fences if present
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }

    // Clean up any trailing characters or incomplete JSON
    const braceStart = jsonString.indexOf("{");
    const braceEnd = jsonString.lastIndexOf("}");

    if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
      jsonString = jsonString.substring(braceStart, braceEnd + 1);
    }

    const parsed = JSON.parse(jsonString);

    // Validate the response structure
    if (
      !parsed.summary ||
      !parsed.priority ||
      !parsed.helpfulNotes ||
      !Array.isArray(parsed.relatedSkills)
    ) {
      console.error("Invalid AI response structure:", parsed);
      return null;
    }

    return parsed;
  } catch (e) {
    console.error("JSON parsing failed:", e.message);
    console.error("Raw response:", raw_response);
    return null;
  }
};

export default analyzeTicket;
