// run with node --experimental-modules

import fs from "node:fs";
import yaml from "yaml";
import properties from "./properties.json" assert { type: "json" };
import dotenv from "dotenv";
import { Client } from "@googlemaps/google-maps-services-js";
import sharp from "sharp";

dotenv.config();

const client = new Client({}); // Create your client


await makePropertiesMD(properties);


async function makePropertiesMD(properties) {
  fs.mkdirSync("./src/content/properties/", { recursive: true });
  for (const _p of properties) {
    (async (_p) => {
      let p = _p;
      let slug = slugify(p.title);
      let path = `./src/content/properties/${slug}.md`;
      let body = p.body;
      delete p.body;
      
      p.price = parseInt(p.price) === 0 ? 1000000000 : parseInt(p.price);

      p.images = await Promise.all(
        p.images
          .map(async (p_img, i) => 
              "../../media/" +
              (await existOrDownload(
                p_img,
                "./src/media/",
                slugify(`image-${p.reference}-${p.city}-${i}`)
              ))
          )
      );

            p.floorplans = await Promise.all(
        p.floorplans
          .map(async (p_img, i) => 
              "../../media/" +
              (await existOrDownload(
                p_img,
                "./src/media/",
                slugify(`floorplan-${p.reference}-${p.city}-${i}`)
              ))
          )
      );
      let fm = yaml.stringify(p);

      try {
        fs.writeFileSync(path, `---\n${fm}\n---\n\n${body}`);
      } catch (e) {
        console.error(e);
      }
    })(_p);
  }
}

/////////////////////////////////////////////////////


async function existOrDownload(url, folder, slug) {
  let _url = new URL(url);
  let originalFilename = decodeURIComponent(
    _url.pathname.split("/").pop()
  ).replace(/[^a-zA-Z0-9.]+/g, "-");
  let ext = originalFilename.split(".").pop();
  let isImage = false;
  let filename, local;

  // We'll check the content type after fetching
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  // Download if not present
  if (slug) {
    filename = slug; // We'll add extension after content-type check
  } else {
    filename = originalFilename.replace(/\.[^/.]+$/, "");
  }

  // We'll check if either .webp or original extension exists
  let webpLocal = `${folder}/${filename}.webp`;
  let origLocal = `${folder}/${filename}.${ext}`;

  if (fs.existsSync(webpLocal)) {
    console.log("Already exists", webpLocal);
    return `${filename}.webp`;
  }
  if (fs.existsSync(origLocal)) {
    console.log("Already exists", origLocal);
    return origLocal;
  }

  console.log("Downloading", url);
  try {
    let res = await fetch(_url);
    let contentType = res.headers.get("content-type") || "";
    let blob = await res.blob();
    let buffer = Buffer.from(await blob.arrayBuffer());

    if (contentType.includes("image/")) {
      // Save as webp
      local = webpLocal;
      await sharp(buffer)
        .resize(1600, 1600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(local);
      console.log("Saved as", local);
      return `${filename}.webp`;
    } else {
      // Save with original extension
      local = origLocal;
      fs.writeFileSync(local, buffer);
      console.log("Saved as", local);
      return local;
    }
  } catch (e) {
    console.log("Can't write", local, e);
  }
}
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

async function getCoordinates(place) {
  try {
    const response = await client.geocode({
      params: {
        address: place,
        key: process.env.GOOGLE_API_KEY,
      },
    });

    if (response.data.status === "OK") {
      return response.data.results[0];
    } else {
      console.error("Geocoding failed:", response.data.status);
    }
  } catch (error) {
    //console.error("Error:", error);
  }
}