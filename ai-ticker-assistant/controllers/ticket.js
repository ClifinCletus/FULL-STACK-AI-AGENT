import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket-model.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.bod;
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: " Title and description are required",
      });
    }

    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
    });

    //trigger the inngest fn, await or not based on requirement
    await inngest.send({
      name: "/ticket/created",
      data: {
        ticketId: newTicket._id.toString(),
        title,
        description,
        createdBy: req.user._id.toString(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created and processing started",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating Ticket: ", error.message);
    return res.status({ success: false, message: "Internal Server Error" });
  }
};

//to get all tickets by admin and moderator
export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];
    if (user.role !== "user") {
      // Populate assignedTo field with user email and ID for display purposes
      tickets = tickets
        .find({})
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdAt: -1 });
    } else {
      //to get all the tickets creates by user itself
      tickets = await Ticket.find({ createdBy: user._id })
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching Tickets: ", error.message);
    return res.status({ success: false, message: "Internal Server Error" });
  }
};

//to get single ticket

export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;

    //if not a user can grab, any ticket
    if (user.role !== "user") {
      ticket = Ticket.findById(req.params.id).populate("assignedTo", [
        "email",
        "_id",
      ]);
    } else {
      //if user,can only grab my ticket
      ticket = Ticket.findOne({
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
    return res.status({ success: false, message: "Internal Server Error" });
  }
};

//can update the ticket if needed
