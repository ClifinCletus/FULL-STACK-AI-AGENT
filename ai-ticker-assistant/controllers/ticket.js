import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket-model.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: " Title and description are required",
      });
    }

    // Safe check for user authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Safe access to user ID - handle both _id and id
    const userId = req.user._id || req.user.id;

    if (!userId) {
      console.error("User ID not found in req.user:", req.user);
      return res.status(401).json({
        success: false,
        message: "User ID not found",
      });
    }

    console.log("Using user ID:", userId);

    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: userId, //make it to .toString()
    });

    console.log("Ticket created:", newTicket);

    // Trigger the inngest function with safe user ID access
    try {
      await inngest.send({
        name: "/ticket/created",
        data: {
          ticketId: newTicket._id.toString(),
          title,
          description,
          createdBy: userId.toString(),
        },
      });
      console.log("Inngest event sent successfully");
    } catch (inngestError) {
      console.error("Inngest error:", inngestError);
      // Don't fail ticket creation if inngest fails
    }

    return res.status(201).json({
      success: true,
      message: "Ticket created and processing started",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating Ticket: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//to get all tickets by admin and moderator
export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    const userId = req.user._id || req.user.id;

    let tickets = [];
    if (user.role !== "user") {
      // Populate assignedTo field with user email and ID for display purposes
      tickets = await Ticket.find({})
        .populate("assignedTo", ["email", "_id"]) //commented this
        .sort({ createdAt: -1 });
    } else {
      //to get all the tickets creates by user itself
      tickets = await Ticket.find({ createdBy: userId })
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }

    console.log("tickets: " + tickets);

    return res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error("Error fetching Tickets: ", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

//to get single ticket

export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;

    //if not a user can grab, any ticket
    if (user.role !== "user") {
      ticket = await Ticket.findById(req.params.id).populate("assignedTo", [
        "email",
        "_id",
      ]);
    } else {
      //if user,can only grab my ticket
      ticket = await Ticket.findOne({
        //grab the ticket created by that user and the id of the ticket
        createdBy: user._id,
        _id: req.params.is,
      }).select("title description status createdAt");
    }

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket Not Found" });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Error fetching Ticket: ", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

//can update the ticket if needed
