import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // 🔐 Forgot Password Fields
    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },
    // 📚 Study Partner Matching Fields
    skills: {
      type: [String],
      default: [],
    },

    interests: {
      type: [String],
      default: [],
    },

    learningGoals: {
      type: [String],
      default: [],
    },

    availability: {
      type: String,
      default: "",
    },

    learningStyle: {
      type: String,
      default: "",
    },

    preferredLanguage: {
      type: String,
      default: "English",
    },

    timezone: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);