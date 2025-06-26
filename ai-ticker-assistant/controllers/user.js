import jwt from "jsonwebtoken";
import User from "../models/user-model.js";
import { inngest } from "../inngest";
import { doHash, doHashValidation } from "../utils/hashing.js";
import {
  signupSchema,
  loginSchema,
  updateUserSchema,
} from "../utils/validations/userValidation.js";

export const signup = async (req, res) => {
  const {
    email,
    password,
    skills: [],
  } = req.body;

  try {
    const { error } = signupSchema.validate({email,password,skills:[]});
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const hashedPassword = doHash(password, 10);
    const user = await User.create({ email, password: hashedPassword, skills });

    //fire the inngest event
    /* we can do fire the inngest events as per our requirement. we can fire it an make it run at the same time go with other operations
       or can do as wair for the event to be executed and after its execution, make other operations execute(await), all depends on the usecase*/

    await inngest.send({
      //calling the inngest event named user/signup (in the on-signup.js) and pass the data used there
      name: "user/signup",
      data: {
        email,
      },
    });
    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "signup failed", details: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {

    const { error } = loginSchema.validate({email,password});
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

    res.json({ token });
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
    const { error } = updateUserSchema.validate({email,role,skills});
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
