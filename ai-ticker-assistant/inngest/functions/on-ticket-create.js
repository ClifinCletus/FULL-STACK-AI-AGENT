// import { inngest } from "../client.js";
// import Ticket from "../../models/ticket-model.js";
// import User from "../../models/user-model.js";
// import { NonRetriableError } from "inngest";
// import analyzeTicket from "../../utils/taking-ticket-to-aiagent.js";
// import { sendMail } from "../../utils/nodemailer.js";

// export const onTicketCreated = inngest.createFunction(
//   { id: "on-ticket-created", retries: 2 },
//   { event: "ticket/created" },
//   async ({ event, step }) => {
//     try {
//       const { ticketId } = event.data;

//       // Validate required data
//       if (!ticketId) {
//         throw new NonRetriableError("Ticket ID is required");
//       }

//       //step to fetch ticket from DB
//       const ticket = await step.run("fetch-ticket", async () => {
//         try {
//           const ticketObject = await Ticket.findById(ticketId);
//           if (!ticketObject) {
//             throw new NonRetriableError("Ticket not found!");
//           }
//           return ticketObject;
//         } catch (error) {
//           if (error.name === "CastError") {
//             throw new NonRetriableError("Invalid ticket ID format");
//           }
//           throw error;
//         }
//       });

//       //step to update the status of ticket to TODO as we are going to operate the ticket
//       await step.run("update-ticket-status", async () => {
//         await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
//       });

//       //   //calling the agent and passing the data of the ticket, to pass it to llm ans the response is received here
//       //   const aiResponse = await analyzeTicket(ticket);
//       //   //may have the response, if else have null(done like this)

//       // Get AI response
//       const aiResponse = await step.run("analyze-ticket", async () => {
//         console.log("Calling AI agent for ticket:", ticket._id);
//         const response = await analyzeTicket(ticket);
//         console.log("AI Response received:", response);
//         return response;
//       });
//       //would takes the response from ai and adds it to the database in place of the ticket details
//       //done in a way, it would return the  related skills: the skills that is required to solve the ticket.
//       //   const relatedSkills = await step.run("ai-processing", async () => {
//       //     let skills = []; // to store the skills received from the ai
//       //     if (aiResponse) {
//       //       await Ticket.findByIdAndUpdate(ticket._id, {
//       //         //if anyway, the airesponse not properly includes the priority, make it medium, else the priority
//       //         priority: ["low", "medium", "high"].includes(
//       //           aiResponse?.priority?.toLowerCase()
//       //         )
//       //           ? aiResponse.priority.toLowerCase()
//       //           : "medium",
//       //         helpfulNotes:
//       //           aiResponse?.helpfulNotes || "No helpful notes provided by AI.",
//       //         relatedSkills: Array.isArray(aiResponse?.relatedSkills)
//       //           ? aiResponse.relatedSkills
//       //           : [],
//       //         status: "IN_PROGRESS", //setting the status of ticket
//       //       });
//       //       skills = aiResponse.relatedSkills; // to return the skills needed to solve the ticket
//       //     }
//       //     return skills;
//       //   });

//       // Process AI response and update ticket
//       const relatedSkills = await step.run("ai-processing", async () => {
//         if (!aiResponse) {
//           console.log("No AI response received, using defaults");
//           await Ticket.findByIdAndUpdate(ticket._id, {
//             priority: "medium",
//             helpfulNotes: "No AI analysis available",
//             relatedSkills: [],
//             status: "IN_PROGRESS",
//           });
//           return [];
//         }

//         // Validate and clean the AI response
//         const priority = ["low", "medium", "high"].includes(
//           aiResponse?.priority?.toLowerCase()
//         )
//           ? aiResponse.priority.toLowerCase()
//           : "medium";

//         const helpfulNotes =
//           aiResponse?.helpfulNotes || "No helpful notes provided by AI.";

//         const skills = Array.isArray(aiResponse?.relatedSkills)
//           ? aiResponse.relatedSkills.filter(
//               (skill) => skill && typeof skill === "string"
//             )
//           : [];

//         console.log("Updating ticket with:", {
//           priority,
//           helpfulNotes,
//           skills,
//         });

//         await Ticket.findByIdAndUpdate(ticket._id, {
//           priority,
//           helpfulNotes,
//           relatedSkills: skills,
//           status: "IN_PROGRESS",
//         });

//         return skills;
//       });

//       //Very Imp, understand
//       //   const moderator = await step.run("assign-moderator", async () => {
//       //     let user = await User.findOne({
//       //       role: "moderator",
//       //       skills: {
//       //         //here we uses advanced mongodb, to find the elements which match the skills provided
//       //         $elemMatch: {
//       //           //we use regex here and provide the skills combined
//       //           $regex: relatedSkills.join("|"),
//       //           $options: "i", //its classic regex syntax to include case insensitivity
//       //         },
//       //       },
//       //     });
//       //     //if no modertor with the skill set is present, assign it to admin
//       //     if (!user) {
//       //       user = await User.findOne({ role: "admin" });
//       //     }
//       //     await Ticket.findByIdAndUpdate(ticket._id, {
//       //       assignedTo: user?._id || null,
//       //     });
//       //     return user;
//       //   });

//       // Assign moderator
//       const moderator = await step.run("assign-moderator", async () => {
//         let user = null;

//         if (relatedSkills.length > 0) {
//           user = await User.findOne({
//             role: "moderator",
//             skills: {
//               $elemMatch: {
//                 $regex: relatedSkills.join("|"),
//                 $options: "i",
//               },
//             },
//           });
//         }

//         if (!user) {
//           user = await User.findOne({ role: "admin" });
//         }

//         if (user) {
//           await Ticket.findByIdAndUpdate(ticket._id, {
//             assignedTo: user._id,
//           });
//         }

//         return user;
//       });

//       // Send email notification
//       await step.run("send-email-notification", async () => {
//         if (moderator) {
//           const finalTicket = await Ticket.findById(ticket._id);
//           await sendMail(
//             moderator.email,
//             "Ticket Assigned",
//             `A new ticket is assigned to you

// Title: ${finalTicket.title}
// Description: ${finalTicket.description}
// Priority: ${finalTicket.priority}
// Helpful Notes: ${finalTicket.helpfulNotes}
// Required Skills: ${finalTicket.relatedSkills.join(", ")}
// Deadline: ${finalTicket.deadline || "Not specified"}`
//           );
//         }
//       });

//       return { success: true };
//     } catch (err) {
//       console.error("Error in ticket processing:", err.message);
//       return { success: false, error: err.message };
//     }
//   }
// );

// Fixed onTicketCreated.js
import { inngest } from "../client.js";
import Ticket from "../../models/ticket-model.js";
import User from "../../models/user-model.js";
import { NonRetriableError } from "inngest";
import analyzeTicket from "../../utils/taking-ticket-to-aiagent.js";
import { sendMail } from "../../utils/nodemailer.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 1, concurrency: { limit: 1 } }, //prevent concurrency of same ticket
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      if (!ticketId) {
        throw new NonRetriableError("Ticket ID is required");
      }

      const ticket = await step.run("fetch-ticket", async () => {
        try {
          const ticketObject = await Ticket.findById(ticketId);
          if (!ticketObject) {
            throw new NonRetriableError("Ticket not found!");
          }
          return ticketObject;
        } catch (error) {
          if (error.name === "CastError") {
            throw new NonRetriableError("Invalid ticket ID format");
          }
          throw error;
        }
      });

      // Check if ticket is already being processed to prevent duplicate processing
      const currentTicket = await step.run("check-ticket-status", async () => {
        const ticketData = await Ticket.findById(ticket._id);
        if (
          ticketData.status === "IN_PROGRESS" ||
          ticketData.status === "COMPLETED"
        ) {
          throw new NonRetriableError(
            `Ticket ${ticket._id} is already being processed or completed`
          );
        }
        return ticketData;
      });

      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
      });

      // Get AI response (called outside of step.run to avoid nesting)
      console.log("Calling AI agent for ticket:", ticket._id);
      let aiResponse = null;
      try {
        aiResponse = await analyzeTicket(ticket);
        console.log("AI Response received:", aiResponse);
      } catch (error) {
        console.error("AI analysis failed:", error.message);
        // Continue with null response - will use defaults
      }

      // Process AI response and update ticket
      const relatedSkills = await step.run("ai-processing", async () => {
        if (!aiResponse) {
          console.log("No AI response received, using defaults");
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: "medium",
            helpfulNotes: "No AI analysis available",
            relatedSkills: [],
            status: "IN_PROGRESS",
          });
          return [];
        }

        // Validate and clean the AI response
        const priority = ["low", "medium", "high"].includes(
          aiResponse?.priority?.toLowerCase()
        )
          ? aiResponse.priority.toLowerCase()
          : "medium";

        const helpfulNotes =
          aiResponse?.helpfulNotes || "No helpful notes provided by AI.";

        const skills = Array.isArray(aiResponse?.relatedSkills)
          ? aiResponse.relatedSkills.filter(
              (skill) => skill && typeof skill === "string"
            )
          : [];

        console.log("Updating ticket with:", {
          priority,
          helpfulNotes,
          skills,
        });

        await Ticket.findByIdAndUpdate(ticket._id, {
          priority,
          helpfulNotes,
          relatedSkills: skills,
          status: "IN_PROGRESS",
        });

        return skills;
      });

      // Assign moderator
      const moderator = await step.run("assign-moderator", async () => {
        let user = null;

        if (relatedSkills.length > 0) {
          user = await User.findOne({
            role: "moderator",
            skills: {
              $elemMatch: {
                $regex: relatedSkills.join("|"),
                $options: "i",
              },
            },
          });
        }

        if (!user) {
          user = await User.findOne({ role: "admin" });
        }

        if (user) {
          await Ticket.findByIdAndUpdate(ticket._id, {
            assignedTo: user._id,
          });
        }

        return user;
      });

      // Send email notification
      await step.run("send-email-notification", async () => {
        if (moderator) {
          const finalTicket = await Ticket.findById(ticket._id);
          await sendMail(
            moderator.email,
            "Ticket Assigned",
            `A new ticket is assigned to you

Title: ${finalTicket.title}
Description: ${finalTicket.description}
Priority: ${finalTicket.priority}
Helpful Notes: ${finalTicket.helpfulNotes}
Required Skills: ${finalTicket.relatedSkills.join(", ")}
Deadline: ${finalTicket.deadline || "Not specified"}`
          );
        }
      });

      return { success: true };
    } catch (err) {
      console.error("Error in ticket processing:", err.message);
      return { success: false, error: err.message };
    }
  }
);
