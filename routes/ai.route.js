import express from "express";
import axios from "axios";
import Recipe from "../models/recipe.model.js";
import { protectRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { ingredients, servings, diet, cuisine } = req.body;

    const prompt = buildPrompt({ ingredients, servings, diet, cuisine });

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }
    );

    const rawText =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return res.status(400).json({ error: "No response from AI" });

    const cleanedJSON = rawText
      .replace(/```json/g, "") // remove ```json
      .replace(/```/g, "") // remove ```
      .trim();

    const recipeJSON = JSON.parse(cleanedJSON);

    const newRecipe = new Recipe({
      userId: req.user, // must be set by middleware
      ingredientsInput: ingredients,
      servings,
      aiResponse: recipeJSON,
      imageUrl: recipeJSON.imageUrl || null,
      isSaved: false,
    });

    await newRecipe.save();

    return res.status(200).json({
      success: true,
      recipe: recipeJSON,
      imageUrl: recipeJSON.imageUrl || null,
    });
  } catch (err) {
    console.error("Recipe Generation Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Toggle isSaved status for a recipe
router.patch("/save/:id", protectRoute, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user._id;

    console.log("Trying to find recipe", recipeId, "for user", userId);

    const recipe = await Recipe.findOne({ _id: recipeId, userId });

    if (!recipe) {
      return res
        .status(404)
        .json({ success: false, message: "Recipe not found" });
    }

    // Toggle isSaved
    recipe.isSaved = !recipe.isSaved;
    await recipe.save();

    return res.status(200).json({
      success: true,
      message: recipe.isSaved ? "Recipe saved" : "Recipe unsaved",
      isSaved: recipe.isSaved,
    });
  } catch (err) {
    console.error("Save toggle error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get all saved recipes for the logged-in user
router.get("/saved", protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;

    const savedRecipes = await Recipe.find({
      userId,
      isSaved: true,
    }).sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      success: true,
      count: savedRecipes.length,
      recipes: savedRecipes,
    });
  } catch (err) {
    console.error("Fetch saved recipes error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// get recent
router.get("/recent", protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch recipes created by the user, sorted by most recent
    const recentRecipes = await Recipe.find({ userId })
      .sort({ createdAt: -1 }) // Descending order (most recent first)
      .limit(10); // Optional: limit to latest 10

    res.status(200).json({
      success: true,
      count: recentRecipes.length,
      recipes: recentRecipes,
    });
  } catch (err) {
    console.error("Fetch recent recipes error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;

function buildPrompt({ ingredients, servings, diet, cuisine }) {
  return `
You are an AI chef assistant.

Based on the following input:
- Ingredients: ${ingredients.join(", ")}
- Servings: ${servings}
- Diet: ${diet}
- Cuisine Style: ${cuisine}

Generate a beginner-friendly recipe in JSON format with these fields:

{
  "recipeName": "string",
  "preparationChecklist": ["array of steps before cooking"],
  "utensils": ["list of required tools"],
  "ingredientsUsed": ["full list of used ingredients"],
  "preparationTime": "in minutes",
  "cookingTime": "in minutes",
  "totalTime": "in minutes",
  "servings": number,
  "steps": ["step-by-step instructions with time"],
  "tips": ["optional tips or warnings"],
  "imageUrl": "a representative dish image URL from Unsplash, Pexels, or Pixabay"
}

Only respond with valid JSON.
  `;
}
