import fs from "node:fs";
import * as cheerio from "cheerio";

const pages = [];
const seen = {};

const links = [];
for (let i = 0; i < 20; i++) {
  const pageLinks = await linksForPage(
    i,
    "https://www.maisonvictoire.com/en/results",
    "envente"
  );
  if (pageLinks) {
    links.push(...pageLinks);
  } else {
    break;
  }
}
for (let i = 0; i < 20; i++) {
  const pageLinks = await linksForPage(
    i,
    "https://www.maisonvictoire.com/en/biens-vendus",
    "vendu"
  );
  if (pageLinks) {
    console.log(`Found ${pageLinks.length} sold properties on page ${i}`);
    links.push(...pageLinks);
  } else {
    break;
  }
}

console.log(`Total property links found: ${links.length}`);

for (const pageUrl of links) {
  console.log(`Fetching page: ${pageUrl}`);
  const res = await fetch(pageUrl);
  const text = await res.text();
  const $ = cheerio.load(text);

  const location = $(".main-title-detail .chiffre").first().text().trim();
  const zip = location.match(/\b\d{5}\b/)?.at(0).trim();
  const city = location.match(/[A-Z-'\s]+/)?.at(0).trim();
  const locationFormatted = city && zip ? `${zip} ${city}` : location;

  const body = $("div.description p")
    .map(function () {
      return $(this).text().trim();
    })
    .toArray()
    .join("\n\n");
  const summary = $(".main-title-detail .titre").first().text().trim();
  const images = $(".swipebox.pic")
    .map((i, el) => $(el).attr("href"))
    .toArray();
  const floorplans = $(".planContainer img")
    .map((i, el) => $(el).attr("src"))
    .toArray();
  const videos = $(".videoContainer iframe")
    .map((i, el) => $(el).attr("src"))
    .toArray();
  const price =
    $(".main-price-detail .chiffre")
      .first()
      .text()
      .trim()
      .replace(/[^\d]/g, "") * 1;
  const rooms =
    $('.details .label:contains("Number of bedrooms")')
      .first()
      .next()
      .text()
      .trim()
      .replace(/[^\d]/g, "") * 1;
  const baths =
    $('.details .label:contains("Bathroom(s)")')
      .first()
      .next()
      .text()
      .trim()
      .replace(/[^\d]/g, "") * 1;
  const swimming_pool =
    $('.details .label:contains("Swimming pool")')
      .first()
      .next()
      .text()
      .trim() == "Yes"
      ? true
      : false;
  const living_area =
    $('.details .label:contains("Living space")')
      .first()
      .next()
      .text()
      .trim()
      .replace(/[^\d]/g, "") * 1;
  const land_area =
    $('.details .label:contains("Land")')
      .first()
      .next()
      .text()
      .trim()
      .replace(/[^\d]/g, "") * 1;
  const property_tax =
    $('.details .label:contains("Property tax")')
      .first()
      .next()
      .text()
      .trim()
      .replace(/[^\d]/g, "") * 1;
  const reference = $(".details .chiffre").first().text().trim();
  const draft = false;

  let status = "available";
  const priceString = $(".main-price-detail .chiffre").first().text().trim();
  console.log(`Price string for status check: "${priceString}" - Reference: ${reference}`);
  switch (priceString.toLowerCase()) {
    case "sold":
      status = "sold";
      break;
    case "price on request":
      status = "confidential";
      break;
    case "under offer":
      status = "pending";
      break;
    default:
      status = "available";
  }

  const title = `${reference} ${city}`.trim();

  pages.push({
    title,
    reference,
    draft,
    status,
    city,
    zip,
    price,
    rooms,
    baths,
    swimming_pool,
    living_area,
    land_area,
    property_tax,
    body,
    summary,
    images,
    floorplans,
    videos,
    meta: { originalUrl: pageUrl, fetchedAt: new Date().toISOString() },
  });

  console.info(`Parsed ${title} - ${rooms} rooms - ${price} EUR`);
}

console.info("Total Properties:", pages.length);
if (pages.length)
  fs.writeFileSync(
    "./scripts/properties.json",
    JSON.stringify(pages, null, 2)
  );

async function linksForPage(
  i,
  baseUrl,
  etat
) {
  let res = await fetch(baseUrl, {
    body: `numpage=${i}&tri=&lang=en&op=results&typop=1&etat=${etat}`,
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language":
        "en-US,en;q=0.9,sv-SE;q=0.8,sv;q=0.7,fr-FR;q=0.6,fr;q=0.5",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded",
      pragma: "no-cache",
      "sec-ch-ua":
        '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
    referrer: baseUrl,
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
  const text = await res.text();
  const $ = cheerio.load(text);
  const links = $("a.linkPic")
    .map((i, el) =>
      $(el).attr("href") != "#"
        ? `https://www.maisonvictoire.com/en/${$(el).attr("href")}`
        : `https://www.maisonvictoire.com/en/achat,confidential,${$(el).data(
            "code"
          )}`
    )
    .toArray();
  return links.length ? links : null;
}
