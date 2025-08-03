import {inngest} from "../client.js"
import Ticket from "../../models/ticket-model.js"
import User from "../../models/user-model.js"
import { NonRetriableError } from "inngest"
import analyzeTicket from "../../utils/taking-ticket-to-aiagent.js"
import { sendMail } from "../../utils/nodemailer.js"


export const onTicketCreated = inngest.createFunction(
    {id:"on-ticket-created",retries: 2},
    {event: "ticket/created"},
    async ({event,step}) =>{
       try{ 
        const {ticketId} = event.data

        //step to fetch ticket from DB
        const ticket = await step.run("fetch-ticket",async () =>{
            const ticketObject = await Ticket.findById(ticketId);
            if(!ticketObject){
                throw new NonRetriableError("Ticket not found!")
            }
            return ticketObject
        })
        
        //step to update the status of ticket to TODO as we are going to operate the ticket
        await step.run("update-ticket-status",async() =>{
            await Ticket.findByIdAndUpdate(ticket._id,{status:"TODO"})
        })

        //calling the agent and passing the data of the ticket, to pass it to llm ans the response is received here
        const aiResponse = await analyzeTicket(ticket)
        //may have the response, if else have null(done like this)
        

        //would takes the response from ai and adds it to the database in place of the ticket details
        //done in a way, it would return the  related skills: the skills that is required to solve the ticket.
        const relatedSkills = await step.run("ai-processing", async () =>{
            let skills = [] // to store the skills received from the ai
            if(aiResponse){
                await Ticket.findByIdAndUpdate(ticket._id,{
                    //if anyway, the airesponse not properly includes the priority, make it medium, else the priority
                    priority: !["low","medium","high"].includes(aiResponse.priority) ? "medium" : aiResponse.priority,
                    helpfulNotes: aiResponse.helpfulNotes,
                    status: "IN_PROGRESS", //setting the status of ticket
                    relatedSkills: aiResponse.relatedSkills
                })
                skills = aiResponse.relatedSkills // to return the skills needed to solve the ticket
            }
            return skills
        })

        //Very Imp, understand 
        const moderator = await step.run("assign-moderator",async ()=>{
            let user = await User.findOne({
                role: "moderator",
                skills: { //here we uses advanced mongodb, to find the elements which match the skills provided
                    $elemMatch: { //we use regex here and provide the skills combined
                        $regex: relatedSkills.join("|"),
                        $options: "i", //its classic regex syntax to include case insensitivity
                    },
                },
            })
            //if no modertor with the skill set is present, assign it to admin
            if(!user){
                user = await User.findOne({ role: "admin"})
            }
             await Ticket.findByIdAndUpdate(ticket._id,{
                assignedTo: user?._id || null
             })
             return user
        })

        //sending email notification to the moderator to who the task is assigned
        await step.run("send-email-notification",async () =>{
            if(moderator){
                const finalTicket = await Ticket.findById(ticket._id)
                await sendMail(
                    moderator.email,
                    "Ticket Assigned",
                    `A new ticket is assigned to you \n 
                    ${finalTicket.title}\n
                    description: ${finalTicket.description}\n
                    deadline: ${finalTicket.deadline}` //can add more information here as needed
                )
            }
        }) 

        return {success: true}

       } catch(err){
          console.error("Error running the step",err.message)
          return {success:false}
       }
    }
)