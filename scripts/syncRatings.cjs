const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const Food = require('../backend/models/Food');
const { computeAndUpdateFoodRatings } = require('../backend/utils/ratingUtils');

async function sync() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Set defaults for any doc missing rating / ratingCount
    await Food.updateMany(
        { rating: { $exists: false } },
        { $set: { rating: 5.0, ratingCount: 0 } }
    );
    await Food.updateMany(
        { ratingCount: { $exists: false } },
        { $set: { ratingCount: 0 } }
    );

    // Compute and update all ratings based on feedback rating session reviews
    const ratingsMap = await computeAndUpdateFoodRatings();
    console.log(`Ratings computed for ${ratingsMap.size} foods.`);

    const foods = await Food.find().sort({ ratingCount: -1 }).lean();
    console.log("\n========================================================");
    console.log("  FOOD RATINGS IN MONGODB (AFTER FEEDBACK CALCULATION)  ");
    console.log("========================================================");
    for (const f of foods) {
        const stars = "★ " + Number(f.rating).toFixed(1);
        const count = "(" + f.ratingCount + " reviews)";
        console.log(`${f.name.padEnd(25)} | ${stars.padEnd(8)} | ${count}`);
    }

    await mongoose.disconnect();
}

sync().catch(console.error);

