const express = require("express");
const router = express.Router();
const { Media } = require("../models");
const isBase64 = require("is-base64");
const imgbase64 = require("base64-img");
const fs = require("fs");
router.get("/", async (req, res) => {
  const media = await Media.findAll({
    attributes: ["id", "image"],
  });
  const mappedMedia = media.map((m) => {
    m.image = `${req.get("host")}/${m.image}`;
    return m;
  });
  return res.json({
    status: "success",
    data: mappedMedia,
  });
});
router.post("/", async (req, res) => {
  try {
    const image = req.body.image;
    if (!isBase64(image, { mimeRequired: true })) {
      return res
        .status(400)
        .json({ status: "error", massage: "invalid base64" });
    }

    imgbase64.img(
      image,
      "./public/images",
      Date.now(),
      async (err, filepath) => {
        if (err) {
          return res
            .status(400)
            .json({ status: "error", message: err.message });
        }

        const filename = filepath.split("/").pop();
        console.log("filename", filename);
        const media = await Media.create({ image: `images/${filename}` });

        return res.json({
          status: "success",
          data: {
            id: media.id,
            image: `${req.get("host")}/images/${filename}`,
          },
        });
      }
    );
  } catch (error) {
    console.log(error);
  }
});
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const media = await Media.findByPk(id);
  if (!media) {
    return res
      .status(404)
      .json({ status: "error", massage: "media not found" });
  }
  fs.unlink(`./public/${media.image}`, async (err) => {
    if (err) {
      return res.status(400).json({ status: "error", massage: err });
    }
    await media.destroy();
    return res.json({ status: "succes", massage: "image deleted" });
  });
});
module.exports = router;
