const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");


router.get("/images", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:marketplace-listings AND resource_type:image")
      .sort_by("created_at", "desc")
      .max_results(30)
      .execute();

    const images = result.resources.map((img) => ({
      url: img.secure_url,
      public_id: img.public_id,
    }));

    res.json(images);
  } catch (err) {
    console.error("CLOUDINARY LIST ERROR:", err);
    res.status(500).json({ error: "Failed to fetch images from Cloudinary" });
  }
});

module.exports = router;
