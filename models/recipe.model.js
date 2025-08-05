import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema(
  {
    // Original user input
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    ingredientsInput: {
      type: [String],
      required: true,
    },

    servings: {
      type: Number,
      default: 1,
    },

    // ✅ Entire AI response stored as JSON object
    aiResponse: {
      type: Object,
      required: true,
    },

    // Flag if user saved this recipe
    isSaved: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Recipe = mongoose.model("Recipe", recipeSchema);
export default Recipe;
