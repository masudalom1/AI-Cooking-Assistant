import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },

    // ✅ User's saved recipes
    savedRecipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe", // Reference to Recipe model
      },
    ],

    // ✅ Recipe history (could include metadata like date, ingredients used, etc.)
    recipeHistory: [
      {
        recipe: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Recipe",
        },
        generatedAt: {
          type: Date,
          default: Date.now,
        },
        ingredientsInput: [String], // original ingredients user gave
        servings: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
