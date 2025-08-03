import jwt from "jsonwebtoken";
import User from "../models/user-model.js";
import { inngest } from "../inngest/client.js";
import { doHash, doHashValidation } from "../utils/hashing.js";
import {
  signupSchema,
  loginSchema,
  updateUserSchema,
} from "../validators/validator.js";

export const signup = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "Request body is missing" });
  }

  console.log("REQ.BODY ===>", req.body);
  const { email, password, skills = [] } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    console.log("Hashing password...");
    const hashedPassword = await doHash(password, 10);

    console.log("Creating user...");
    console.log("Before creating user:", {
      email,
      password: hashedPassword,
      skills,
    });

    const user = await User.create({
      email,
      password: hashedPassword,
      skills,
    });

    console.log("User created successfully");

    // Fire the inngest event
    try {
      await inngest.send({
        name: "user/signup",
        data: {
          email,
        },
      });
      console.log("Inngest event sent successfully");
    } catch (inngestError) {
      console.error("Inngest event failed:", inngestError);
      // Don't fail the signup if inngest fails
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id, //made it as id from _id
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "14d" }
    );

    console.log("Token generated successfully");

    // Prepare user object for response
    const userObj = {
      id: user._id,
      email: user.email,
      skills: user.skills,
      role: user.role,
    };

    // Send success response
    res.status(201).json({
      message: "User created successfully",
      token,
      user: userObj,
    });
  } catch (error) {
    console.error("Error during user creation:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Generic error response
    res.status(500).json({
      error: "Internal server error",
      message: "Signup failed. Please try again later.",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ success: false, error: "User not found" });

    const isMatch = doHashValidation(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET
    );

    // Prepare user object for response
    const userObj = {
      id: user._id,
      email: user.email,
      skills: user.skills,
      role: user.role,
    };

    res.json({ token, user: userObj });
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err) => {
      if (err) return res.status(401).json({ error: "Unauthorized" });
      res.json({ message: "Logout successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: "Logout failed", details: error.message });
  }
};

export const updateUser = async (req, res) => {
  //here updating the user details, adding the skills,changing roles etc
  //now done in a way such that only the admin can change these, can also allow moderator to do this if neeeded
  const { skills = [], role, email } = req.body;

  try {
    const { error } = updateUserSchema.validate({ email, role, skills });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User Not found" });

    //VIMP
    //here, we can do update the skills as per our requirement, extract the skills arrray and spread it etc, as we need
    await User.updateOne(
      { email },
      { skills: skills.length ? skills : user.skills, role }
    );

    return res.json({ success: true, message: "User Updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};

//admin, to get the users information
export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const users = await User.find();
    return res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};
